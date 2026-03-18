import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  classifyPageHeuristically,
  classifyWithLlm,
  ensureAbsoluteUrl,
  extractHeading,
  extractLinksFromMarkdown,
  extractSummary,
  isSameDomain,
  normalizeUrl,
  parseSitemapXml,
  shouldSkipUrl,
  summarizeDiscovery,
  type DiscoveryPageCandidate,
  type DiscoveryPageRecord,
} from "../_shared/dealer-discovery.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_DISCOVERED_PAGES = 100;
const MAX_INSPECTED_PAGES = 24;
const DEFAULT_DEPTH = 2;

type FirecrawlScrapePayload = {
  success?: boolean;
  data?: {
    markdown?: string;
    metadata?: Record<string, unknown>;
    links?: Array<string | { url?: string; href?: string; text?: string }>;
  };
  error?: string;
};

function getSupabaseAdmin() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

async function firecrawlScrape(url: string, formats = ["markdown", "links"], onlyMainContent = false) {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY not configured");
  }

  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats,
      onlyMainContent,
    }),
  });

  const data = (await response.json()) as FirecrawlScrapePayload;
  if (!response.ok || data.success === false) {
    throw new Error(data.error || `Firecrawl scrape failed for ${url}`);
  }

  return data;
}

async function fetchSitemapUrls(rootUrl: string): Promise<string[]> {
  const root = new URL(rootUrl);
  const sitemapUrl = `${root.origin}/sitemap.xml`;

  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        "User-Agent": "DealerForgeDiscoveryBot/1.0",
      },
    });

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    const urls = parseSitemapXml(xml);
    return urls.filter((url) => isSameDomain(url, rootUrl));
  } catch {
    return [];
  }
}

function toCandidateMap(candidates: DiscoveryPageCandidate[]) {
  const map = new Map<string, DiscoveryPageCandidate>();

  for (const candidate of candidates) {
    if (shouldSkipUrl(candidate.url)) {
      continue;
    }

    if (!map.has(candidate.normalizedUrl)) {
      map.set(candidate.normalizedUrl, candidate);
      continue;
    }

    const existing = map.get(candidate.normalizedUrl)!;
    if (candidate.depth < existing.depth) {
      map.set(candidate.normalizedUrl, candidate);
    }
  }

  return map;
}

function scoreCandidate(candidate: DiscoveryPageCandidate, rootUrl: string): number {
  const pathname = new URL(candidate.url).pathname.toLowerCase();
  let score = pathname === "/" ? 100 : 0;

  const scoreMap: Array<[RegExp, number]> = [
    [/(about|why-buy|our-story|dealership)/, 25],
    [/(service|maintenance|repair|oil-change)/, 28],
    [/(parts|order-parts)/, 24],
    [/(finance|financing|credit|payment)/, 28],
    [/(specials|offers|coupon|incentive)/, 24],
    [/(contact|hours|directions|location)/, 25],
    [/(new|used|inventory)/, 14],
    [/(trade|appraisal|sell)/, 20],
    [/(schedule|appointment)/, 18],
    [/(privacy|terms|cookie)/, -30],
    [/(login|account|staff|careers|employment)/, -18],
  ];

  for (const [pattern, delta] of scoreMap) {
    if (pattern.test(pathname)) {
      score += delta;
    }
  }

  if (!isSameDomain(candidate.url, rootUrl)) {
    score -= 100;
  }

  if (candidate.source === "sitemap") {
    score += 5;
  }

  if (candidate.anchorText) {
    const text = candidate.anchorText.toLowerCase();
    if (/(about|service|finance|specials|contact|parts)/.test(text)) {
      score += 8;
    }
  }

  return score;
}

async function inspectCandidate(candidate: DiscoveryPageCandidate) {
  try {
    const scraped = await firecrawlScrape(candidate.url, ["markdown"], true);
    const markdown = scraped.data?.markdown || "";
    const metadata = scraped.data?.metadata || {};

    return {
      url: candidate.url,
      normalizedUrl: candidate.normalizedUrl,
      source: candidate.source,
      anchorText: candidate.anchorText,
      title: typeof metadata.title === "string" ? metadata.title : undefined,
      h1: extractHeading(markdown),
      summary: extractSummary(markdown),
    };
  } catch {
    return {
      url: candidate.url,
      normalizedUrl: candidate.normalizedUrl,
      source: candidate.source,
      anchorText: candidate.anchorText,
      title: undefined,
      h1: undefined,
      summary: undefined,
    };
  }
}

async function persistDiscoveryRun(input: {
  mode: "seed_discovery";
  brandKey: string;
  seedUrl: string;
  siteDomain: string;
  siteTitle?: string;
  inputUrls: string[];
  summary: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  pages: DiscoveryPageRecord[];
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return null;
  }

  const runInsert = await supabase
    .from("dealer_migration_runs")
    .insert({
      mode: input.mode,
      brand_key: input.brandKey,
      seed_url: input.seedUrl,
      site_domain: input.siteDomain,
      site_title: input.siteTitle,
      status: "discovered",
      input_urls: input.inputUrls,
      summary: input.summary,
      metadata: input.metadata || {},
    })
    .select("id")
    .single();

  if (runInsert.error || !runInsert.data) {
    console.error("Failed to persist discovery run:", runInsert.error);
    return null;
  }

  const runId = runInsert.data.id;

  const pageRows = input.pages.map((page) => ({
    run_id: runId,
    url: page.url,
    normalized_url: page.normalizedUrl,
    source: page.source,
    title: page.title,
    h1: page.h1,
    summary: page.summary,
    page_type: page.pageType,
    confidence: page.confidence,
    recommended: page.recommended,
    recommendation_reason: page.reason,
    selected: page.recommended,
    status: "discovered",
  }));

  const pageInsert = await supabase.from("dealer_migration_pages").insert(pageRows);
  if (pageInsert.error) {
    console.error("Failed to persist discovery pages:", pageInsert.error);
  }

  return runId;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { seedUrl, brandKey, crawlConfig } = await req.json();
    if (!seedUrl || !brandKey) {
      return new Response(JSON.stringify({ error: "seedUrl and brandKey are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const rootUrl = normalizeUrl(ensureAbsoluteUrl(seedUrl));
    const root = new URL(rootUrl);
    const maxPages = Math.min(Number(crawlConfig?.maxPages) || MAX_DISCOVERED_PAGES, MAX_DISCOVERED_PAGES);
    const maxDepth = Math.min(Number(crawlConfig?.maxDepth) || DEFAULT_DEPTH, DEFAULT_DEPTH);

    const homepageScrape = await firecrawlScrape(rootUrl, ["markdown", "links"], false);
    const homepageMarkdown = homepageScrape.data?.markdown || "";
    const homepageMetadata = homepageScrape.data?.metadata || {};
    const homepageLinks = homepageScrape.data?.links || [];

    const homepageCandidates: DiscoveryPageCandidate[] = [
      {
        url: rootUrl,
        normalizedUrl: rootUrl,
        depth: 0,
        source: "seed",
        anchorText: "home",
      },
    ];

    for (const link of homepageLinks) {
      const href = typeof link === "string" ? link : link.url || link.href;
      if (!href) continue;

      try {
        const resolved = new URL(href, rootUrl).toString();
        if (!isSameDomain(resolved, rootUrl)) continue;
        homepageCandidates.push({
          url: resolved,
          normalizedUrl: normalizeUrl(resolved),
          depth: 1,
          source: "firecrawl_links",
          anchorText: typeof link === "string" ? undefined : link.text,
        });
      } catch {
        continue;
      }
    }

    const markdownCandidates = extractLinksFromMarkdown(homepageMarkdown, rootUrl)
      .filter((candidate) => isSameDomain(candidate.url, rootUrl))
      .map((candidate) => ({ ...candidate, source: "markdown" }));

    const sitemapUrls = await fetchSitemapUrls(rootUrl);
    const sitemapCandidates = sitemapUrls.map((url) => ({
      url,
      normalizedUrl: normalizeUrl(url),
      depth: 1,
      source: "sitemap",
    }));

    const candidateMap = toCandidateMap([
      ...homepageCandidates,
      ...markdownCandidates,
      ...sitemapCandidates,
    ]);

    const candidates = [...candidateMap.values()]
      .filter((candidate) => candidate.depth <= maxDepth)
      .sort((a, b) => scoreCandidate(b, rootUrl) - scoreCandidate(a, rootUrl))
      .slice(0, maxPages);

    const inspectable = candidates.slice(0, MAX_INSPECTED_PAGES);
    const overflow = candidates.slice(MAX_INSPECTED_PAGES);
    const inspected = [];

    for (let i = 0; i < inspectable.length; i += 4) {
      const chunk = inspectable.slice(i, i + 4);
      const results = await Promise.all(chunk.map((candidate) => inspectCandidate(candidate)));
      inspected.push(...results);
    }

    const heuristicPages = inspected.map((page) => ({
      ...page,
      heuristic: classifyPageHeuristically(page),
    }));

    const overflowPages = overflow.map((candidate) => {
      const heuristic = classifyPageHeuristically({
        url: candidate.url,
        anchorText: candidate.anchorText,
      });

      return {
        url: candidate.url,
        normalizedUrl: candidate.normalizedUrl,
        source: candidate.source,
        anchorText: candidate.anchorText,
        title: undefined,
        h1: undefined,
        summary: undefined,
        heuristic,
      };
    });

    const llmClassifications = await classifyWithLlm(heuristicPages);

    const inspectedRecords: DiscoveryPageRecord[] = heuristicPages.map((page, index) => {
      const llm = llmClassifications?.[index];
      const fallback = page.heuristic;
      return {
        url: page.url,
        normalizedUrl: page.normalizedUrl,
        source: page.source,
        title: page.title,
        h1: page.h1,
        summary: page.summary,
        anchorText: page.anchorText,
        pageType: (llm?.pageType || fallback.pageType) as DiscoveryPageRecord["pageType"],
        confidence: Number(llm?.confidence ?? fallback.confidence),
        recommended: Boolean(llm?.recommended ?? fallback.recommended),
        reason: llm?.reason || fallback.reason,
      };
    });

    const overflowRecords: DiscoveryPageRecord[] = overflowPages.map((page) => ({
      url: page.url,
      normalizedUrl: page.normalizedUrl,
      source: page.source,
      title: page.title,
      h1: page.h1,
      summary: page.summary,
      anchorText: page.anchorText,
      pageType: page.heuristic.pageType,
      confidence: Number(page.heuristic.confidence),
      recommended: Boolean(page.heuristic.recommended),
      reason: `${page.heuristic.reason} Classified heuristically due to crawl budget.`,
    }));

    const records: DiscoveryPageRecord[] = [...inspectedRecords, ...overflowRecords];

    const summary = summarizeDiscovery(records);
    const runId = await persistDiscoveryRun({
      mode: "seed_discovery",
      brandKey,
      seedUrl: rootUrl,
      siteDomain: root.hostname,
      siteTitle: typeof homepageMetadata.title === "string" ? homepageMetadata.title : undefined,
      inputUrls: [rootUrl],
      summary,
      metadata: {
        crawlConfig: { maxPages, maxDepth },
        sitemapCount: sitemapCandidates.length,
        homepageTitle: homepageMetadata.title,
      },
      pages: records,
    });

    return new Response(
      JSON.stringify({
        runId,
        site: {
          rootDomain: root.hostname,
          homepageTitle: homepageMetadata.title || root.hostname,
          seedUrl: rootUrl,
        },
        pages: records,
        summary,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Discovery error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to discover site" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
