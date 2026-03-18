export const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "msclkid",
  "gad_source",
  "mc_cid",
  "mc_eid",
]);

export const PAGE_TYPES = [
  "homepage",
  "about",
  "service",
  "parts",
  "financing",
  "specials",
  "contact",
  "inventory_listing",
  "vehicle_detail",
  "model_landing",
  "trade_in",
  "scheduler_flow",
  "legal",
  "utility",
  "unknown",
] as const;

export type PageType = (typeof PAGE_TYPES)[number];

export interface DiscoveryPageCandidate {
  url: string;
  normalizedUrl: string;
  depth: number;
  source: string;
  anchorText?: string;
}

export interface DiscoveryPageRecord {
  url: string;
  normalizedUrl: string;
  source: string;
  title?: string;
  h1?: string;
  summary?: string;
  pageType: PageType;
  confidence: number;
  recommended: boolean;
  reason: string;
  anchorText?: string;
}

const EXCLUDED_EXTENSIONS = /\.(?:jpg|jpeg|png|gif|svg|webp|pdf|xml|json|zip|rar|7z|mp4|avi|mov|css|js|txt)$/i;

export function ensureAbsoluteUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("URL is required");
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function normalizeUrl(input: string): string {
  const absolute = ensureAbsoluteUrl(input);
  const url = new URL(absolute);

  url.hash = "";

  [...url.searchParams.keys()].forEach((key) => {
    if (TRACKING_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  });

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  }

  const normalized = url.toString();
  return normalized.endsWith("/") && url.pathname === "/" ? normalized : normalized;
}

export function isSameDomain(candidate: string, rootUrl: string): boolean {
  try {
    const candidateUrl = new URL(candidate);
    const root = new URL(rootUrl);
    return candidateUrl.hostname === root.hostname;
  } catch {
    return false;
  }
}

export function shouldSkipUrl(candidate: string): boolean {
  if (EXCLUDED_EXTENSIONS.test(candidate)) {
    return true;
  }

  return /[#?](?:.*(?:sort=|view=|filter=|page=))/i.test(candidate);
}

export function extractSummary(markdown: string, limit = 280): string {
  return markdown
    .replace(/^#+\s+/gm, "")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limit);
}

export function extractHeading(markdown: string): string | undefined {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

export function extractLinksFromMarkdown(markdown: string, rootUrl: string): DiscoveryPageCandidate[] {
  const matches = [...markdown.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];

  return matches
    .map((match) => {
      const anchorText = match[1]?.trim();
      const href = match[2]?.trim();
      if (!href) {
        return null;
      }

      try {
        const resolved = new URL(href, rootUrl).toString();
        return {
          url: resolved,
          normalizedUrl: normalizeUrl(resolved),
          depth: 1,
          source: "markdown",
          anchorText,
        };
      } catch {
        return null;
      }
    })
    .filter((candidate): candidate is DiscoveryPageCandidate => Boolean(candidate));
}

export function parseSitemapXml(xml: string): string[] {
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/gi)];
  return matches.map((match) => match[1].trim()).filter(Boolean);
}

export function classifyPageHeuristically(page: {
  url: string;
  title?: string;
  h1?: string;
  summary?: string;
  anchorText?: string;
}): Pick<DiscoveryPageRecord, "pageType" | "confidence" | "recommended" | "reason"> {
  const haystack = [page.url, page.title, page.h1, page.summary, page.anchorText]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const pathname = new URL(page.url).pathname.toLowerCase();

  const has = (...terms: string[]) => terms.some((term) => haystack.includes(term));
  const pathHas = (...terms: string[]) => terms.some((term) => pathname.includes(term));

  if (pathname === "/" || has("home")) {
    return { pageType: "homepage", confidence: 0.98, recommended: true, reason: "Homepage detected from root path." };
  }

  if (has("privacy", "cookie policy", "terms of use", "legal")) {
    return { pageType: "legal", confidence: 0.95, recommended: false, reason: "Legal/compliance page excluded by default." };
  }

  if (has("login", "account", "staff", "career", "employment", "vendor")) {
    return { pageType: "utility", confidence: 0.82, recommended: false, reason: "Utility or low-priority page excluded from MVP." };
  }

  if (has("schedule service", "service scheduler", "appointment", "service appointment")) {
    return { pageType: "scheduler_flow", confidence: 0.87, recommended: true, reason: "Service appointment or scheduler landing page." };
  }

  if (has("trade in", "appraisal", "sell us your car", "value your trade")) {
    return { pageType: "trade_in", confidence: 0.9, recommended: true, reason: "Trade-in or appraisal page." };
  }

  if (has("specials", "offers", "coupon", "incentive")) {
    return { pageType: "specials", confidence: 0.88, recommended: true, reason: "Promotional offers page." };
  }

  if (has("finance", "financing", "credit", "payment center")) {
    return { pageType: "financing", confidence: 0.9, recommended: true, reason: "Finance/payment center page." };
  }

  if (has("service", "maintenance", "oil change", "repair")) {
    return { pageType: "service", confidence: 0.9, recommended: true, reason: "Service/maintenance page." };
  }

  if (has("parts", "order parts", "parts center")) {
    return { pageType: "parts", confidence: 0.89, recommended: true, reason: "Parts page." };
  }

  if (has("about", "our story", "why buy", "why choose", "dealership")) {
    return { pageType: "about", confidence: 0.84, recommended: true, reason: "About/dealership trust page." };
  }

  if (has("contact", "hours", "directions", "location")) {
    return { pageType: "contact", confidence: 0.88, recommended: true, reason: "Contact/hours/location page." };
  }

  if (pathHas("/new-", "/used-", "/inventory") || has("new vehicles", "used vehicles", "inventory")) {
    const looksLikeVehicleDetail =
      /\/(new|used|certified)\//.test(pathname) && /\d{4}/.test(pathname) ||
      has("vin", "stock #", "stock number", "mileage", "mpg");

    if (looksLikeVehicleDetail) {
      return {
        pageType: "vehicle_detail",
        confidence: 0.86,
        recommended: false,
        reason: "Vehicle detail page excluded from MVP by default.",
      };
    }

    return {
      pageType: "inventory_listing",
      confidence: 0.82,
      recommended: true,
      reason: "Inventory listing or search results landing page.",
    };
  }

  if (has("model", "trim", "features", "overview") && /\b(?:civic|accord|cr-v|pilot|outlander|cx-5|cx-50|mdx|rdx|f-150|silverado)\b/i.test(haystack)) {
    return {
      pageType: "model_landing",
      confidence: 0.78,
      recommended: true,
      reason: "Model-specific landing page.",
    };
  }

  return {
    pageType: "unknown",
    confidence: 0.45,
    recommended: false,
    reason: "Low-confidence page type; review before including.",
  };
}

export async function classifyWithLlm(
  pages: Array<{
    url: string;
    title?: string;
    h1?: string;
    summary?: string;
    anchorText?: string;
    heuristic: ReturnType<typeof classifyPageHeuristically>;
  }>,
): Promise<Array<Pick<DiscoveryPageRecord, "pageType" | "confidence" | "recommended" | "reason">> | null> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || pages.length === 0) {
    return null;
  }

  const system = `Classify dealership website pages for migration. Return JSON only.
Use one of these page types: ${PAGE_TYPES.join(", ")}.
Recommend only pages useful for a dealership website migration MVP.
Exclude legal, utility, vehicle_detail, and transaction-flow pages by default.
Respond as a JSON array with objects: { "pageType": string, "confidence": number, "recommended": boolean, "reason": string }.`;

  const user = JSON.stringify(
    pages.map((page) => ({
      url: page.url,
      title: page.title,
      h1: page.h1,
      summary: page.summary,
      anchorText: page.anchorText,
      heuristic: page.heuristic,
    })),
  );

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Classify these dealership pages. Return JSON as {"pages":[...]}.\n${user}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed.pages) ? parsed.pages : null;
  } catch {
    return null;
  }
}

export function summarizeDiscovery(records: DiscoveryPageRecord[]) {
  const excludedByReason: Record<string, number> = {};

  for (const page of records) {
    if (!page.recommended) {
      excludedByReason[page.reason] = (excludedByReason[page.reason] || 0) + 1;
    }
  }

  return {
    totalDiscovered: records.length,
    recommendedCount: records.filter((page) => page.recommended).length,
    excludedByReason,
  };
}
