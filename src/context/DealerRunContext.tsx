import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { dealerWorkflowApi } from "@/lib/api/dealer-workflow";
import { brands, getBrandPageSchema } from "@/lib/brands";
import { mapStoredPagesToJobs, validateGeneratedPage } from "@/lib/generated-pages";
import type {
  DealerRunListItem,
  DealerWorkspaceState,
  DiscoveredPage,
  DiscoveryResult,
  InputMode,
  PageJob,
  RunSummary,
  StructuredPageData,
} from "@/lib/dealer-workflow";

const STORAGE_KEY = "dealerforge-workspace";
const MAX_PARALLEL_GENERATIONS = 3;

type SubmitPayload = {
  mode: InputMode;
  urls?: string[];
  seedUrl?: string;
  brandKey: string;
};

type DealerRunContextValue = DealerWorkspaceState & {
  recentRuns: DealerRunListItem[];
  isLoadingRuns: boolean;
  hasGeneratedPages: boolean;
  hasDiscovery: boolean;
  selectedCount: number;
  recommendedSelectionApplied: boolean;
  currentActiveJob?: PageJob;
  completedCount: number;
  failedCount: number;
  submitInput: (payload: SubmitPayload) => Promise<void>;
  toggleDiscoveredUrl: (normalizedUrl: string) => void;
  acceptRecommended: () => void;
  selectStaticPages: () => void;
  excludeInventory: () => void;
  startGeneration: () => Promise<void>;
  refreshRuns: () => Promise<void>;
  loadRun: (runId: string) => Promise<void>;
  resetWorkspace: () => void;
};

const initialState: DealerWorkspaceState = {
  jobs: [],
  discovery: null,
  selectedDiscoveredUrls: [],
  activeBrandKey: "",
  isProcessing: false,
  activeRunId: null,
};

const DealerRunContext = createContext<DealerRunContextValue | null>(null);

function loadPersistedState(): DealerWorkspaceState {
  if (typeof window === "undefined") {
    return initialState;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return initialState;
    }

    const parsed = JSON.parse(raw) as Partial<DealerWorkspaceState>;
    return {
      ...initialState,
      ...parsed,
    };
  } catch {
    return initialState;
  }
}

function mapStoredRunToDiscovery(
  run: Record<string, unknown>,
  pages: Array<Record<string, unknown>>,
): DiscoveryResult | null {
  const mode = run.mode as InputMode | undefined;
  if (mode !== "seed_discovery") {
    return null;
  }

  return {
    runId: String(run.id),
    site: {
      rootDomain: String(run.site_domain || ""),
      homepageTitle: run.site_title ? String(run.site_title) : undefined,
      seedUrl: run.seed_url ? String(run.seed_url) : "",
    },
    pages: pages.map((page) => ({
      url: String(page.url || ""),
      normalizedUrl: String(page.normalized_url || page.url || ""),
      source: page.source ? String(page.source) : "",
      title: page.title ? String(page.title) : undefined,
      h1: page.h1 ? String(page.h1) : undefined,
      summary: page.summary ? String(page.summary) : undefined,
      pageType: (page.page_type as DiscoveredPage["pageType"]) || "unknown",
      confidence: Number(page.confidence || 0),
      recommended: Boolean(page.recommended),
      reason: page.recommendation_reason ? String(page.recommendation_reason) : "",
    })),
    summary: {
      totalDiscovered: Array.isArray(pages) ? pages.length : 0,
      recommendedCount: pages.filter((page) => Boolean(page.recommended)).length,
      excludedByReason: {},
    },
  };
}

export function DealerRunProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DealerWorkspaceState>(() => loadPersistedState());
  const [recentRuns, setRecentRuns] = useState<DealerRunListItem[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const refreshRuns = useCallback(async () => {
    setIsLoadingRuns(true);
    try {
      const data = await dealerWorkflowApi.listRuns(24);
      setRecentRuns(data.runs || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingRuns(false);
    }
  }, []);

  useEffect(() => {
    void refreshRuns();
  }, [refreshRuns]);

  const loadRun = useCallback(async (runId: string) => {
    const data = await dealerWorkflowApi.getRun(runId);
    const run = data.run;
    const pages = data.pages || [];

    const brandKey = run.brand_key ? String(run.brand_key) : "";
    const discovery = mapStoredRunToDiscovery(run, pages);
    const jobs = mapStoredPagesToJobs(pages);
    const selectedDiscoveredUrls = pages
      .filter((page) => Boolean(page.selected))
      .map((page) => String(page.normalized_url || page.url || ""));

    setState({
      jobs,
      discovery,
      selectedDiscoveredUrls,
      activeBrandKey: brandKey,
      isProcessing: false,
      activeRunId: String(run.id),
    });
  }, []);

  const updateJob = useCallback((jobKey: string, updates: Partial<PageJob>) => {
    setState((prev) => ({
      ...prev,
      jobs: prev.jobs.map((job) =>
        (job.normalizedUrl || job.url) === jobKey ? { ...job, ...updates } : job,
      ),
    }));
  }, []);

  const finalizeRun = useCallback(async (runId: string | null | undefined, summary: RunSummary, hasFailures: boolean) => {
    if (!runId) return;
    const runStatus = hasFailures ? "failed" : "completed";
    await dealerWorkflowApi.updateRun(runId, runStatus, summary).catch((error) => {
      console.error(error);
    });
    await refreshRuns();
  }, [refreshRuns]);

  const processPage = useCallback(async (
    page: DiscoveredPage,
    brandKey: string,
    runId?: string | null,
    totalPages = 0,
    totalDiscovered = 0,
  ) => {
    const brand = brands[brandKey];
    if (!brand) {
      throw new Error(`Unknown brand key: ${brandKey}`);
    }

    const pageKey = page.normalizedUrl;
    updateJob(pageKey, { status: "scraping" });
    await dealerWorkflowApi.updatePageStatus({
      runId,
      pageUrl: pageKey,
      pageStatus: "scraping",
      runStatus: "processing",
      pageType: page.pageType,
      confidence: page.confidence,
      recommended: true,
    });

    const scrapeResult = await firecrawlApi.scrape(page.url);
    if (!scrapeResult.success) {
      throw new Error(scrapeResult.error || "Scraping failed");
    }

    const markdown = scrapeResult.data?.markdown || scrapeResult.data?.data?.markdown || "";
    const metadata = scrapeResult.data?.metadata || scrapeResult.data?.data?.metadata || {};

    updateJob(pageKey, {
      status: "scraped",
      scrapedContent: markdown,
      scrapedMeta: {
        title: metadata.title as string | undefined,
        description: metadata.description as string | undefined,
      },
    });

    await dealerWorkflowApi.updatePageStatus({
      runId,
      pageUrl: pageKey,
      pageStatus: "scraped",
      scrapedMeta: {
        title: metadata.title,
        description: metadata.description,
        sourceUrl: page.url,
      },
    });

    updateJob(pageKey, { status: "structuring" });
    const { structuredData } = await dealerWorkflowApi.structurePage({
      scrapedContent: markdown,
      metadata: {
        title: metadata.title,
        description: metadata.description,
        sourceUrl: page.url,
      },
      brand: brand as unknown as Record<string, unknown>,
      pageTypeHint: page.pageType,
    });

    const structuredPageType = structuredData.pageType || page.pageType;
    updateJob(pageKey, {
      status: "structured",
      structuredData: structuredData as Record<string, unknown>,
      pageType: structuredPageType,
    });

    await dealerWorkflowApi.updatePageStatus({
      runId,
      pageUrl: pageKey,
      pageStatus: "structured",
      structuredData,
      pageType: structuredPageType,
    });

    updateJob(pageKey, { status: "generating" });
    const { generatedCode } = await dealerWorkflowApi.generatePage({
      scrapedContent: markdown,
      metadata: {
        title: metadata.title,
        description: metadata.description,
        sourceUrl: page.url,
      },
      brand,
      structuredPage: structuredData as StructuredPageData,
      pageTypeHint: structuredPageType,
    });

    const pageSchema = getBrandPageSchema(brand, structuredPageType);
    const verification = validateGeneratedPage({
      generatedCode,
      pageType: structuredPageType,
      brand,
      pageSchema,
    });

    if (!verification.valid) {
      throw new Error(`Verification failed: ${verification.errors.join(" ")}`);
    }

    updateJob(pageKey, {
      status: "done",
      generatedCode,
      pageType: structuredPageType,
    });

    await dealerWorkflowApi.updatePageStatus({
      runId,
      pageUrl: pageKey,
      pageStatus: "completed",
      generatedCode,
      generatedNotes: {
        completedAt: new Date().toISOString(),
        totalPages,
        totalDiscovered,
        verification,
      },
    });
  }, [updateJob]);

  const processApprovedPages = useCallback(
    async (pages: DiscoveredPage[], brandKey: string, runId?: string | null) => {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        activeRunId: runId ?? prev.activeRunId ?? null,
        jobs: pages.map((page) => ({
          url: page.url,
          normalizedUrl: page.normalizedUrl,
          status: "approved",
          pageType: page.pageType,
          scrapedMeta: { title: page.title },
        })),
      }));

      const totalDiscovered = state.discovery?.summary.totalDiscovered || pages.length;
      let completedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < pages.length; i += MAX_PARALLEL_GENERATIONS) {
        const chunk = pages.slice(i, i + MAX_PARALLEL_GENERATIONS);
        const results = await Promise.allSettled(
          chunk.map((page) => processPage(page, brandKey, runId, pages.length, totalDiscovered)),
        );

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            completedCount += 1;
            return;
          }

          const page = chunk[index];
          const message = result.reason instanceof Error ? result.reason.message : "Unknown error";
          failedCount += 1;
          updateJob(page.normalizedUrl, { status: "error", error: message });
          toast.error(`Failed: ${page.url}`);
          void dealerWorkflowApi.updatePageStatus({
            runId,
            pageUrl: page.normalizedUrl,
            pageStatus: "failed",
            error: message,
          }).catch((trackingError) => {
            console.error(trackingError);
          });
        });

        if (runId) {
          void dealerWorkflowApi.updateRun(runId, "processing", {
            brandKey,
            completedCount,
            failedCount,
            approvedCount: pages.length,
            totalDiscovered,
          }).catch((error) => {
            console.error(error);
          });
        }
      }

      setState((prev) => ({ ...prev, isProcessing: false }));
      await finalizeRun(
        runId,
        {
          brandKey,
          completedCount,
          failedCount,
          approvedCount: pages.length,
          totalDiscovered,
        },
        failedCount > 0,
      );

      toast.success(
        `Processed ${completedCount} page${completedCount !== 1 ? "s" : ""}${failedCount ? `, ${failedCount} failed` : ""}`,
      );
    },
    [finalizeRun, processPage, state.discovery?.summary.totalDiscovered, updateJob],
  );

  const submitInput = useCallback(async ({ mode, urls, seedUrl, brandKey }: SubmitPayload) => {
    setState((prev) => ({
      ...prev,
      activeBrandKey: brandKey,
      discovery: null,
      selectedDiscoveredUrls: [],
      activeRunId: null,
    }));

    if (mode === "manual_urls" && urls?.length) {
      try {
        const normalizedPages = urls.map((url) => ({
          url,
          normalizedUrl: url,
          source: "manual",
          title: undefined,
          h1: undefined,
          summary: undefined,
          pageType: "unknown" as const,
          confidence: 1,
          recommended: true,
          reason: "Manually approved by operator.",
        }));

        const manualRun = await dealerWorkflowApi.createManualRun(urls, brandKey, {
          totalDiscovered: urls.length,
          approvedCount: urls.length,
        });

        setState((prev) => ({
          ...prev,
          activeRunId: manualRun.runId || null,
        }));

        await processApprovedPages(normalizedPages, brandKey, manualRun.runId);
      } catch (error) {
        setState((prev) => ({ ...prev, isProcessing: false }));
        toast.error(error instanceof Error ? error.message : "Failed to start manual run");
      }
      return;
    }

    if (mode === "seed_discovery" && seedUrl) {
      try {
        setState((prev) => ({
          ...prev,
          isProcessing: true,
          jobs: [{ url: seedUrl, normalizedUrl: seedUrl, status: "discovering" }],
        }));

        const result = await dealerWorkflowApi.discover(seedUrl, brandKey);
        const recommended = result.pages.filter((page) => page.recommended).map((page) => page.normalizedUrl);

        setState((prev) => ({
          ...prev,
          activeRunId: result.runId || null,
          discovery: result,
          selectedDiscoveredUrls: recommended,
          jobs: result.pages.map((page) => ({
            url: page.url,
            normalizedUrl: page.normalizedUrl,
            status: page.recommended ? "discovered" : "pending",
            pageType: page.pageType,
            scrapedMeta: {
              title: page.title,
              description: page.summary,
            },
          })),
        }));

        toast.success(`Discovered ${result.summary.totalDiscovered} pages for review`);
        await refreshRuns();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to discover site");
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    }
  }, [processApprovedPages, refreshRuns]);

  const toggleDiscoveredUrl = useCallback((normalizedUrl: string) => {
    setState((prev) => ({
      ...prev,
      selectedDiscoveredUrls: prev.selectedDiscoveredUrls.includes(normalizedUrl)
        ? prev.selectedDiscoveredUrls.filter((url) => url !== normalizedUrl)
        : [...prev.selectedDiscoveredUrls, normalizedUrl],
    }));
  }, []);

  const acceptRecommended = useCallback(() => {
    setState((prev) => {
      if (!prev.discovery) return prev;
      const recommended = prev.discovery.pages.filter((page) => page.recommended).map((page) => page.normalizedUrl);
      toast.success(`Selected ${recommended.length} recommended pages`);
      return { ...prev, selectedDiscoveredUrls: recommended };
    });
  }, []);

  const selectStaticPages = useCallback(() => {
    setState((prev) => {
      if (!prev.discovery) return prev;
      const selected = prev.discovery.pages
        .filter((page) =>
          ["homepage", "about", "service", "parts", "financing", "specials", "contact", "model_landing", "trade_in", "scheduler_flow"].includes(page.pageType),
        )
        .map((page) => page.normalizedUrl);
      toast.success(`Selected ${selected.length} static pages`);
      return { ...prev, selectedDiscoveredUrls: selected };
    });
  }, []);

  const excludeInventory = useCallback(() => {
    setState((prev) => {
      if (!prev.discovery) return prev;
      const selected = prev.selectedDiscoveredUrls.filter((url) => {
        const page = prev.discovery?.pages.find((entry) => entry.normalizedUrl === url);
        return page?.pageType !== "inventory_listing" && page?.pageType !== "vehicle_detail";
      });
      toast.success("Inventory-related pages removed from selection");
      return { ...prev, selectedDiscoveredUrls: selected };
    });
  }, []);

  const startGeneration = useCallback(async () => {
    if (!state.discovery || !state.activeBrandKey) return;
    const pageMap = new Map(state.discovery.pages.map((page) => [page.normalizedUrl, page]));
    const approvedPages = state.selectedDiscoveredUrls
      .map((url) => pageMap.get(url))
      .filter((page): page is DiscoveredPage => Boolean(page));
    if (approvedPages.length === 0) {
      toast.error("Select at least one page to process");
      return;
    }
    try {
      if (state.discovery.runId) {
        await dealerWorkflowApi.approvePages(state.discovery.runId, state.selectedDiscoveredUrls);
      }
      await processApprovedPages(approvedPages, state.activeBrandKey, state.discovery.runId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start generation");
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  }, [processApprovedPages, state.activeBrandKey, state.discovery, state.selectedDiscoveredUrls]);

  const resetWorkspace = useCallback(() => {
    setState(initialState);
  }, []);

  const value = useMemo<DealerRunContextValue>(() => {
    const hasGeneratedPages = state.jobs.some((job) => job.status === "done" && job.generatedCode);
    const recommendedUrls = state.discovery?.pages.filter((page) => page.recommended).map((page) => page.normalizedUrl) || [];
    const selectedSet = new Set(state.selectedDiscoveredUrls);
    const recommendedSelectionApplied =
      recommendedUrls.length > 0 &&
      recommendedUrls.length === state.selectedDiscoveredUrls.length &&
      recommendedUrls.every((url) => selectedSet.has(url));
    const currentActiveJob = state.jobs.find((job) =>
      ["discovering", "scraping", "structuring", "generating"].includes(job.status),
    );

    return {
      ...state,
      recentRuns,
      isLoadingRuns,
      hasGeneratedPages,
      hasDiscovery: Boolean(state.discovery),
      selectedCount: state.selectedDiscoveredUrls.length,
      recommendedSelectionApplied,
      currentActiveJob,
      completedCount: state.jobs.filter((job) => job.status === "done").length,
      failedCount: state.jobs.filter((job) => job.status === "error").length,
      submitInput,
      toggleDiscoveredUrl,
      acceptRecommended,
      selectStaticPages,
      excludeInventory,
      startGeneration,
      refreshRuns,
      loadRun,
      resetWorkspace,
    };
  }, [
    acceptRecommended,
    excludeInventory,
    isLoadingRuns,
    loadRun,
    recentRuns,
    refreshRuns,
    resetWorkspace,
    selectStaticPages,
    startGeneration,
    state,
    submitInput,
    toggleDiscoveredUrl,
  ]);

  return <DealerRunContext.Provider value={value}>{children}</DealerRunContext.Provider>;
}

export function useDealerRun() {
  const context = useContext(DealerRunContext);
  if (!context) {
    throw new Error("useDealerRun must be used within DealerRunProvider");
  }
  return context;
}
