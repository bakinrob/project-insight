import type { BrandConfig, OemPageSchema } from "@/lib/brands";
import type { DiscoveryPageType, PageJob } from "@/lib/dealer-workflow";

type GeneratedPageValidationInput = {
  generatedCode: string;
  pageType?: string;
  brand?: BrandConfig;
  pageSchema?: OemPageSchema;
};

export function toPageKey(value: string) {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function fromPageKey(pageKey: string) {
  const normalized = pageKey.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function getJobPageIdentity(job: Pick<PageJob, "normalizedUrl" | "url">) {
  return job.normalizedUrl || job.url;
}

export function getJobPageKey(job: Pick<PageJob, "normalizedUrl" | "url">) {
  return toPageKey(getJobPageIdentity(job));
}

export function getJobTitle(job: Pick<PageJob, "scrapedMeta" | "url">) {
  try {
    const pathname = new URL(job.url).pathname.replace(/\/$/, "");
    return job.scrapedMeta?.title || pathname || "Generated Page";
  } catch {
    return job.scrapedMeta?.title || job.url || "Generated Page";
  }
}

export function buildPreviewDocument(code: string, options?: { title?: string }) {
  const title = options?.title || "DealerForge Preview";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      color-scheme: light;
    }
    html, body {
      margin: 0;
      min-height: 100%;
      background: #f7f7f8;
      color: #111827;
      font-family: "Inter", sans-serif;
    }
    body {
      overflow-x: hidden;
    }
  </style>
</head>
<body>${code}</body>
</html>`;
}

export function mapStoredPagesToJobs(pages: Array<Record<string, unknown>>): PageJob[] {
  return pages.map((page) => ({
    url: String(page.url || ""),
    normalizedUrl: String(page.normalized_url || page.url || ""),
    status:
      page.status === "completed"
        ? "done"
        : (page.status as PageJob["status"]) || "pending",
    scrapedMeta: page.scraped_meta as { title?: string; description?: string } | undefined,
    pageType: page.page_type ? String(page.page_type) : undefined,
    structuredData: (page.structured_data as Record<string, unknown>) || undefined,
    generatedCode: page.generated_code ? String(page.generated_code) : undefined,
    error: page.error ? String(page.error) : undefined,
  }));
}

export function validateGeneratedPage({
  generatedCode,
  pageType,
  brand,
  pageSchema,
}: GeneratedPageValidationInput) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const normalizedPageType = (pageType || "unknown") as DiscoveryPageType;
  const plainText = stripHtml(generatedCode).toLowerCase();

  if (!generatedCode.trim()) {
    errors.push("Generated HTML is empty.");
  }

  if (/```/i.test(generatedCode)) {
    errors.push("Generated HTML still contains markdown fences.");
  }

  if (!/<(?:main|div|section)\b[^>]*data-brand=/i.test(generatedCode)) {
    errors.push("Root wrapper is missing the required data-brand attribute.");
  }

  if (!/<(?:main|div|section)\b[^>]*data-page-type=/i.test(generatedCode)) {
    errors.push("Root wrapper is missing the required data-page-type attribute.");
  }

  if (!/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(generatedCode)) {
    errors.push("Generated HTML is missing a top-level heading.");
  }

  if (!hasVisibleCta(generatedCode)) {
    errors.push("Generated page is missing a visible CTA button or link.");
  }

  if (/(lorem ipsum|placeholder text|coming soon|your dealership|insert copy here)/i.test(plainText)) {
    errors.push("Generated page still contains placeholder content.");
  }

  const expectedKeywords = getExpectedKeywords(normalizedPageType, pageSchema);
  if (expectedKeywords.length > 0 && !expectedKeywords.some((keyword) => plainText.includes(keyword.toLowerCase()))) {
    errors.push(`Generated page does not read like a ${normalizedPageType.replace(/_/g, " ")} page.`);
  }

  if (brand?.name === "Toyota") {
    if (!generatedCode.includes(brand.primary) && !/--brand-primary\s*:\s*#?eb0a1e/i.test(generatedCode)) {
      errors.push("Toyota page is missing Toyota brand token usage.");
    }

    if (/(glassmorphism|saas|dashboard|api|platform)/i.test(plainText)) {
      errors.push("Toyota page drifted into generic SaaS language or composition.");
    }

    if (normalizedPageType === "specials") {
      if (!/(special|offer|coupon|rebate|save)/i.test(plainText)) {
        errors.push("Toyota specials page is missing clear offer language.");
      }
      if (!/(service|appointment|schedule)/i.test(plainText)) {
        errors.push("Toyota specials page is missing a service-retention CTA path.");
      }
    }

    if (normalizedPageType === "service" && !/(service|maintenance|repair|appointment|schedule)/i.test(plainText)) {
      errors.push("Toyota service page lacks dealership service language.");
    }

    if (normalizedPageType === "financing" && !/(finance|payment|credit|loan|lease|trade)/i.test(plainText)) {
      errors.push("Toyota finance page lacks finance-specific content.");
    }
  }

  if (!generatedCode.includes("<") || plainText.length < 180) {
    warnings.push("Generated HTML is very short and may be underdeveloped.");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasVisibleCta(html: string) {
  const matches = html.match(/<(a|button)\b[^>]*>[\s\S]*?<\/\1>/gi) || [];
  return matches.some((match) =>
    /(get|shop|schedule|check|view|book|call|contact|apply|offer|service|explore|price|availability)/i.test(
      stripHtml(match),
    ),
  );
}

function getExpectedKeywords(pageType: DiscoveryPageType, pageSchema?: OemPageSchema) {
  const schemaKeywords = pageSchema?.requiredKeywords || [];
  if (schemaKeywords.length > 0) {
    return schemaKeywords;
  }

  switch (pageType) {
    case "homepage":
      return ["inventory", "service", "specials", "reviews"];
    case "service":
      return ["service", "maintenance", "appointment"];
    case "specials":
      return ["special", "offer", "coupon"];
    case "financing":
      return ["finance", "payment", "credit"];
    case "contact":
      return ["contact", "hours", "directions"];
    case "about":
      return ["about", "team", "dealership"];
    default:
      return [];
  }
}
