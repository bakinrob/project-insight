import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Car, Compass, MapPinned, Sparkles } from "lucide-react";
import UrlInput from "@/components/UrlInput";
import ScrapeProgress from "@/components/ScrapeProgress";
import DiscoveredPagesReview from "@/components/DiscoveredPagesReview";
import RunHistoryPanel from "@/components/RunHistoryPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDealerRun } from "@/context/DealerRunContext";

export default function Index() {
  const navigate = useNavigate();
  const {
    jobs,
    discovery,
    selectedDiscoveredUrls,
    isProcessing,
    hasGeneratedPages,
    selectedCount,
    recommendedSelectionApplied,
    currentActiveJob,
    completedCount,
    failedCount,
    activeRunId,
    recentRuns,
    isLoadingRuns,
    submitInput,
    toggleDiscoveredUrl,
    acceptRecommended,
    selectStaticPages,
    excludeInventory,
    startGeneration,
    loadRun,
  } = useDealerRun();

  const openGeneratedWorkspace = () => {
    navigate("/generated");
  };

  const heroStats = useMemo(
    () => [
      { label: "Pages discovered", value: discovery?.summary.totalDiscovered ?? 0 },
      { label: "Selected now", value: selectedCount },
      { label: "Generated", value: completedCount },
    ],
    [completedCount, discovery?.summary.totalDiscovered, selectedCount],
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <Car className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">DealerForge</h1>
              <p className="text-sm text-muted-foreground">AI-Powered Dealership Website Migration</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasGeneratedPages ? <Badge variant="secondary">Generated workspace ready</Badge> : null}
            <Button variant="outline" onClick={openGeneratedWorkspace} disabled={!hasGeneratedPages && !currentActiveJob}>
              Open Generated Pages
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-start gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Compass className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Discovery-first workflow</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Start with one dealership homepage, review the sitemap, and move generated
                    pages into their own workspace instead of crowding this screen.
                  </p>
                </div>
              </div>

              <UrlInput onSubmit={submitInput} isProcessing={isProcessing} />
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Run Overview</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Compact summary of discovery, selection, and generation progress.
                  </p>
                </div>
                {failedCount > 0 ? <Badge variant="destructive">{failedCount} failed</Badge> : null}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {heroStats.map((item) => (
                  <div key={item.label} className="rounded-xl border border-border bg-secondary/20 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              {discovery ? (
                <div className="mt-4 rounded-xl border border-border bg-secondary/10 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MapPinned className="h-4 w-4 text-primary" />
                    {discovery.site.rootDomain}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {discovery.site.homepageTitle || discovery.site.seedUrl}
                  </p>
                </div>
              ) : null}
            </div>

            {jobs.length > 0 ? (
              <div className="rounded-2xl border border-border bg-card p-5">
                <ScrapeProgress
                  jobs={jobs}
                  onOpenWorkspace={openGeneratedWorkspace}
                  hasGeneratedPages={hasGeneratedPages}
                />
              </div>
            ) : null}

            <RunHistoryPanel
              runs={recentRuns}
              activeRunId={activeRunId}
              isLoading={isLoadingRuns}
              onOpenRun={(runId) => {
                void loadRun(runId);
              }}
            />
          </div>

          <div className="space-y-4">
            {discovery ? (
              <DiscoveredPagesReview
                discovery={discovery}
                selectedUrls={selectedDiscoveredUrls}
                isProcessing={isProcessing}
                recommendedSelectionApplied={recommendedSelectionApplied}
                hasGeneratedPages={hasGeneratedPages}
                onToggleUrl={toggleDiscoveredUrl}
                onAcceptRecommended={acceptRecommended}
                onSelectStaticPages={selectStaticPages}
                onExcludeInventory={excludeInventory}
                onStartGeneration={startGeneration}
                onOpenWorkspace={openGeneratedWorkspace}
              />
            ) : (
              <div className="flex min-h-[620px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10">
                <div className="max-w-lg text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground">A cleaner migration flow</h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      Discovery and review stay here. Generated pages move into a dedicated
                      workspace where they’re easier to browse, preview, and inspect.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Badge variant="secondary">Seed URL first</Badge>
                    <Badge variant="secondary">Review before generation</Badge>
                    <Badge variant="secondary">Separate generated workspace</Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
