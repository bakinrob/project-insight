import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Code, Database, Eye, ExternalLink, Loader2 } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dealerWorkflowApi } from "@/lib/api/dealer-workflow";
import {
  buildPreviewDocument,
  fromPageKey,
  getJobPageIdentity,
  getJobTitle,
  mapStoredPagesToJobs,
} from "@/lib/generated-pages";
import type { PageJob } from "@/lib/dealer-workflow";
import { useDealerRun } from "@/context/DealerRunContext";

type ViewMode = "preview" | "code" | "data";

function isViewMode(value: string | null): value is ViewMode {
  return value === "preview" || value === "code" || value === "data";
}

export default function GeneratedPageRoute() {
  const { runId, pageKey } = useParams();
  const { activeRunId, jobs } = useDealerRun();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadedJobs, setLoadedJobs] = useState<PageJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedView: ViewMode = isViewMode(searchParams.get("view")) ? searchParams.get("view") : "preview";
  const decodedPageKey = useMemo(() => {
    if (!pageKey) return null;
    try {
      return fromPageKey(pageKey);
    } catch {
      return null;
    }
  }, [pageKey]);

  useEffect(() => {
    if (!runId) {
      setLoadError("Missing run id.");
      return;
    }

    if (activeRunId === runId && jobs.length > 0) {
      setLoadedJobs(jobs);
      setLoadError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    void dealerWorkflowApi
      .getRun(runId)
      .then((data) => {
        if (cancelled) return;
        setLoadedJobs(mapStoredPagesToJobs(data.pages || []));
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load generated page.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeRunId, jobs, runId]);

  const current = useMemo(() => {
    if (!decodedPageKey) return null;
    return loadedJobs.find((job) => getJobPageIdentity(job) === decodedPageKey) || null;
  }, [decodedPageKey, loadedJobs]);

  if (!runId || !pageKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">Generated page not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This preview route is missing the run or page identity.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/generated">
              <ArrowLeft className="w-4 h-4" />
              Back to Generated Workspace
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading generated page...
        </div>
      </div>
    );
  }

  if (loadError || !current || current.status !== "done" || !current.generatedCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-lg rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">Generated page is not ready</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {loadError || "This page could not be found in the selected run or has not finished generating yet."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/generated">
                <ArrowLeft className="w-4 h-4" />
                Workspace
              </Link>
            </Button>
            <Button asChild>
              <Link to="/">Back to Discovery</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/generated">
                  <ArrowLeft className="w-4 h-4" />
                  Workspace
                </Link>
              </Button>
              <Badge variant="secondary">Standalone Preview</Badge>
              {current.pageType ? (
                <Badge variant="outline">{current.pageType.replace(/_/g, " ")}</Badge>
              ) : null}
            </div>
            <h1 className="text-xl font-semibold text-foreground">{getJobTitle(current)}</h1>
            <p className="break-all font-mono text-xs text-muted-foreground">{current.url}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={`/generated?page=${pageKey}`}>
                <ExternalLink className="w-4 h-4" />
                Open in Workspace
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <Tabs
          value={selectedView}
          onValueChange={(value) => {
            const next = new URLSearchParams(searchParams);
            next.set("view", value);
            setSearchParams(next, { replace: true });
          }}
        >
          <TabsList className="bg-secondary">
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Preview
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-1.5">
              <Code className="w-3.5 h-3.5" /> Code
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-1.5">
              <Database className="w-3.5 h-3.5" /> Data
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {selectedView === "preview" ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-white">
            <iframe
              srcDoc={buildPreviewDocument(current.generatedCode, { title: getJobTitle(current) })}
              className="h-[calc(100vh-180px)] min-h-[900px] w-full"
              title="Standalone Generated Preview"
              sandbox="allow-scripts"
            />
          </div>
        ) : null}

        {selectedView === "code" ? (
          <pre className="mt-4 min-h-[900px] overflow-auto rounded-2xl border border-border bg-card p-5 text-xs font-mono leading-relaxed text-foreground">
            {current.generatedCode}
          </pre>
        ) : null}

        {selectedView === "data" ? (
          <pre className="mt-4 min-h-[900px] overflow-auto rounded-2xl border border-border bg-card p-5 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap break-words">
            {JSON.stringify(
              {
                url: current.url,
                pageType: current.pageType,
                seo: current.scrapedMeta,
                structuredData: current.structuredData,
              },
              null,
              2,
            )}
          </pre>
        ) : null}
      </main>
    </div>
  );
}
