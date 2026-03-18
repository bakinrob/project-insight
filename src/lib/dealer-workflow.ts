export type InputMode = "manual_urls" | "seed_discovery";

export type DiscoveryPageType =
  | "homepage"
  | "about"
  | "service"
  | "parts"
  | "financing"
  | "specials"
  | "contact"
  | "inventory_listing"
  | "vehicle_detail"
  | "model_landing"
  | "trade_in"
  | "scheduler_flow"
  | "legal"
  | "utility"
  | "unknown";

export interface DiscoveredPage {
  url: string;
  normalizedUrl: string;
  source: string;
  title?: string;
  h1?: string;
  summary?: string;
  pageType: DiscoveryPageType;
  confidence: number;
  recommended: boolean;
  reason: string;
  anchorText?: string;
}

export interface DiscoverySummary {
  totalDiscovered: number;
  recommendedCount: number;
  excludedByReason: Record<string, number>;
}

export interface DiscoverySite {
  rootDomain: string;
  homepageTitle?: string;
  seedUrl: string;
}

export interface DiscoveryResult {
  runId?: string | null;
  site: DiscoverySite;
  pages: DiscoveredPage[];
  summary: DiscoverySummary;
}

export interface StructuredPageData {
  pageType?: DiscoveryPageType;
  seo?: {
    title?: string;
    description?: string;
  };
  headings?: {
    h1?: string;
    h2?: string[];
  };
  sections?: Array<{
    heading?: string;
    content?: string;
  }>;
  keyImages?: Array<{
    url?: string;
    alt?: string;
  }>;
  callToAction?: string;
  summary?: string;
  notes?: string[];
}

export interface GeneratedPageResult {
  generatedCode: string;
}

export interface RunSummary {
  totalDiscovered?: number;
  approvedCount?: number;
  completedCount?: number;
  failedCount?: number;
  brandKey?: string;
}
