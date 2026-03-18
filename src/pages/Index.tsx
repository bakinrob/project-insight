import { useCallback, useMemo, useState } from "react";
import UrlInput from "@/components/UrlInput";
import ScrapeProgress, { type PageJob } from "@/components/ScrapeProgress";
import PagePreview from "@/components/PagePreview";
import DiscoveredPagesReview from "@/components/DiscoveredPagesReview";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { dealerWorkflowApi } from "@/lib/api/dealer-workflow";
import { brands } from "@/lib/brands";
import type { DiscoveredPage, DiscoveryResult, InputMode, RunSummary, StructuredPageData } from "@/lib/dealer-workflow";
import { toast } from "sonner";
import { Car, Compass, MapPinned } from "lucide-react";

type SubmitPayload = {
  mode: InputMode;
  urls?: string[];
  seedUrl?: string;
  brandKey: string;
};

const Index = () => {
  const [jobs, setJobs] = useState<PageJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);
  const [selectedDiscoveredUrls, setSelectedDiscoveredUrls] = useState<string[]>([]);
  const [activeBrandKey, setActiveBrandKey] = useState<string>("");

  const updateJob = useCallback((jobKey: string, updates: Partial<PageJob>) => {
    setJobs((prev) =>
      prev.map((job) =>
        (job.normalizedUrl || job.url) === jobKey
          ? { ...job, ...updates }
          : job,
      ),
    );
  }, []);

  const setApprovedJobs = useCallback((pages: DiscoveredPage[]) => {
    setJobs(
      pages.map((page) => ({
        url: page.url,
        normalizedUrl: page.normalizedUrl,
        status: "approved",
        pageType: page.pageType,
        scrapedMeta: {
          title: page.title,
        },
      })),
    );
  }, []);

  const finalizeRun = useCallback(async (runId: string | null | undefined, summary: RunSummary, hasFailures: boolean) => {
    if (!runId) return;

    const runStatus = hasFailures ? "failed" : "completed";
    await dealerWorkflowApi.updateRun(runId, runStatus, summary).catch((error) => {
      console.error(error);
    });
  }, []);

  const processApprovedPages = useCallback(
    async (pages: DiscoveredPage[], brandKey: string, runId?: string | null) => {
      const brand = brands[brandKey];
      if (!brand) return;

      setIsProcessing(true);
      setApprovedJobs(pages);

      let completedCount = 0;
      let failedCount = 0;

      for (const page of pages) {
        const pageKey = page.normalizedUrl;

        try {
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
          const metadata =
            scrapeResult.data?.metadata || scrapeResult.data?.data?.metadata || {};

          updateJob(pageKey, {
            status: "scraped",
            scrapedContent: markdown,
            scrapedMeta: {
              title: metadata.title,
              description: metadata.description,
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
            brand: brand as Record<string, unknown>,
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

          updateJob(pageKey, {
            status: "done",
            generatedCode,
            pageType: structuredPageType,
          });

          completedCount += 1;
          await dealerWorkflowApi.updatePageStatus({
            runId,
            pageUrl: pageKey,
            pageStatus: "completed",
            generatedCode,
            generatedNotes: {
              completedAt: new Date().toISOString(),
            },
            summary: {
              brandKey,
              completedCount,
              failedCount,
              approvedCount: pages.length,
              totalDiscovered: discovery?.summary.totalDiscovered || pages.length,
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          failedCount += 1;
          updateJob(pageKey, { status: "error", error: message });
          toast.error(`Failed: ${page.url}`);
          await dealerWorkflowApi.updatePageStatus({
            runId,
            pageUrl: pageKey,
            pageStatus: "failed",
            error: message,
            summary: {
              brandKey,
              completedCount,
              failedCount,
              approvedCount: pages.length,
              totalDiscovered: discovery?.summary.totalDiscovered || pages.length,
            },
          }).catch((trackingError) => {
            console.error(trackingError);
          });
        }
      }

      setIsProcessing(false);
      await finalizeRun(
        runId,
        {
          brandKey,
          completedCount,
          failedCount,
          approvedCount: pages.length,
          totalDiscovered: discovery?.summary.totalDiscovered || pages.length,
        },
        failedCount > 0,
      );

      toast.success(
        `Processed ${completedCount} page${completedCount !== 1 ? "s" : ""}${failedCount ? `, ${failedCount} failed` : ""}`,
      );
    },
    [discovery?.summary.totalDiscovered, finalizeRun, setApprovedJobs, updateJob],
  );

  const handleSubmit = async ({ mode, urls, seedUrl, brandKey }: SubmitPayload) => {
    setActiveBrandKey(brandKey);
    setDiscovery(null);
    setSelectedDiscoveredUrls([]);

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

        await processApprovedPages(normalizedPages, brandKey, manualRun.runId);
      } catch (error) {
        setIsProcessing(false);
        toast.error(error instanceof Error ? error.message : "Failed to start manual run");
      }
      return;
    }

    if (mode === "seed_discovery" && seedUrl) {
      try {
        setIsProcessing(true);
        setJobs([
          {
            url: seedUrl,
            normalizedUrl: seedUrl,
            status: "discovering",
          },
        ]);

        const result = await dealerWorkflowApi.discover(seedUrl, brandKey);
        const recommended = result.pages
          .filter((page) => page.recommended)
          .map((page) => page.normalizedUrl);

        setDiscovery(result);
        setSelectedDiscoveredUrls(recommended);
        setJobs(
          result.pages.map((page) => ({
            url: page.url,
            normalizedUrl: page.normalizedUrl,
            status: page.recommended ? "discovered" : "pending",
            pageType: page.pageType,
            scrapedMeta: {
              title: page.title,
              description: page.summary,
            },
          })),
        );

        toast.success(`Discovered ${result.summary.totalDiscovered} pages for review`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to discover site");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const discoveredPageMap = useMemo(() => {
    const pages = discovery?.pages || [];
    return new Map(pages.map((page) => [page.normalizedUrl, page]));
  }, [discovery]);

  const toggleDiscoveredUrl = (normalizedUrl: string) => {
    setSelectedDiscoveredUrls((prev) =>
      prev.includes(normalizedUrl)
        ? prev.filter((url) => url !== normalizedUrl)
        : [...prev, normalizedUrl],
    );
  };

  const handleAcceptRecommended = () => {
    if (!discovery) return;
    setSelectedDiscoveredUrls(
      discovery.pages.filter((page) => page.recommended).map((page) => page.normalizedUrl),
    );
  };

  const handleSelectStaticPages = () => {
    if (!discovery) return;
    setSelectedDiscoveredUrls(
      discovery.pages
        .filter((page) =>
          [
            "homepage",
            "about",
            "service",
            "parts",
            "financing",
            "specials",
            "contact",
            "model_landing",
            "trade_in",
            "scheduler_flow",
          ].includes(page.pageType),
        )
        .map((page) => page.normalizedUrl),
    );
  };

  const handleExcludeInventory = () => {
    setSelectedDiscoveredUrls((prev) =>
      prev.filter((url) => {
        const page = discoveredPageMap.get(url);
        return page?.pageType !== "inventory_listing" && page?.pageType !== "vehicle_detail";
      }),
    );
  };

  const handleStartGeneration = async () => {
    if (!discovery || !activeBrandKey) return;

    const approvedPages = selectedDiscoveredUrls
      .map((url) => discoveredPageMap.get(url))
      .filter((page): page is DiscoveredPage => Boolean(page));

    if (approvedPages.length === 0) {
      toast.error("Select at least one page to process");
      return;
    }

    try {
      if (discovery.runId) {
        await dealerWorkflowApi.approvePages(discovery.runId, selectedDiscoveredUrls);
      }

      await processApprovedPages(approvedPages, activeBrandKey, discovery.runId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to start generation");
      setIsProcessing(false);
    }
  };

  const hasResults = jobs.some((job) => job.status === "done");
  const selectedCount = selectedDiscoveredUrls.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">
              DealerForge
            </h1>
            <p className="text-xs text-muted-foreground">
              AI-Powered Dealership Website Migration
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[420px_1fr] gap-8">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold text-foreground mb-4">
                Migration Input
              </h2>
              <UrlInput onSubmit={handleSubmit} isProcessing={isProcessing} />
            </div>

            {jobs.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6">
                <ScrapeProgress jobs={jobs} />
              </div>
            )}

            {discovery && (
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Discovery Summary</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-muted-foreground">Discovered</p>
                    <p className="text-xl font-semibold text-foreground">
                      {discovery.summary.totalDiscovered}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-muted-foreground">Selected</p>
                    <p className="text-xl font-semibold text-foreground">{selectedCount}</p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p className="flex items-center gap-2">
                    <MapPinned className="w-4 h-4" />
                    {discovery.site.rootDomain}
                  </p>
                  <p>{discovery.site.homepageTitle || discovery.site.seedUrl}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {discovery ? (
              <DiscoveredPagesReview
                discovery={discovery}
                selectedUrls={selectedDiscoveredUrls}
                isProcessing={isProcessing}
                onToggleUrl={toggleDiscoveredUrl}
                onAcceptRecommended={handleAcceptRecommended}
                onSelectStaticPages={handleSelectStaticPages}
                onExcludeInventory={handleExcludeInventory}
                onStartGeneration={handleStartGeneration}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/50 min-h-[320px] flex items-center justify-center p-10">
                <div className="max-w-md text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                    <Compass className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">
                    Discover, review, then generate
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Start with manual URLs for a controlled run, or use one homepage URL to
                    let DealerForge map likely migration pages before the AI pipeline begins.
                  </p>
                </div>
              </div>
            )}

            {hasResults && (
              <div className="rounded-xl border border-border bg-card p-6">
                <PagePreview jobs={jobs} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
