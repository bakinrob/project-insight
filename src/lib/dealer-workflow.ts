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

export type PageStatus =
  | "pending"
  | "discovering"
  | "discovered"
  | "approved"
  | "scraping"
  | "scraped"
  | "structuring"
  | "structured"
  | "generating"
  | "done"
  | "error";

export interface PageJob {
  url: string;
  normalizedUrl?: string;
  status: PageStatus;
  scrapedContent?: string;
  scrapedMeta?: { title?: string; description?: string };
  pageType?: string;
  structuredData?: Record<string, unknown>;
  generatedCode?: string;
  error?: string;
}

export interface DealerWorkspaceState {
  jobs: PageJob[];
  discovery: DiscoveryResult | null;
  selectedDiscoveredUrls: string[];
  activeBrandKey: string;
  isProcessing: boolean;
  activeRunId?: string | null;
}

export interface DealerRunListItem {
  id: string;
  mode: InputMode;
  brand_key: string;
  seed_url?: string | null;
  site_domain?: string | null;
  site_title?: string | null;
  status: string;
  approved_urls?: string[];
  summary?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  counts: {
    total: number;
    completed: number;
    failed: number;
  };
}
