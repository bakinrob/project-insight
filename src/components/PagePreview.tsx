import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Code, Copy, Database, Eye, ExternalLink } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PageJob } from "@/lib/dealer-workflow";
import { toast } from "sonner";

interface PagePreviewProps {
  jobs: PageJob[];
}

function buildPreviewDocument(code: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body{font-family:'Inter',sans-serif;margin:0}</style>
</head>
<body>${code}</body>
</html>`;
}

export default function PagePreview({ jobs }: PagePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const completedJobs = useMemo(
    () => jobs.filter((job) => job.status === "done" && job.generatedCode),
    [jobs],
  );

  const selectedKey = searchParams.get("page");
  const current = useMemo(() => {
    return (
      completedJobs.find((job) => (job.normalizedUrl || job.url) === selectedKey) ||
      completedJobs[0] ||
      null
    );
  }, [completedJobs, selectedKey]);

  useEffect(() => {
    if (!current) return;

    const currentKey = current.normalizedUrl || current.url;
    if (selectedKey !== currentKey) {
      const next = new URLSearchParams(searchParams);
      next.set("page", currentKey);
      setSearchParams(next, { replace: true });
    }
  }, [current, searchParams, selectedKey, setSearchParams]);

  if (completedJobs.length === 0 || !current) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold text-foreground">Generated Pages Workspace</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Generated pages will appear here as soon as at least one page completes.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/">
            <ArrowLeft className="w-4 h-4" />
            Back to Discovery
          </Link>
        </Button>
      </div>
    );
  }

  const handleCopy = async () => {
    if (!current.generatedCode) return;
    await navigator.clipboard.writeText(current.generatedCode);
    setCopied(true);
    toast.success("Code copied to clipboard");
    window.setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenStandalone = () => {
    if (!current.generatedCode) return;
    const previewWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!previewWindow) {
      toast.error("Popup blocked. Allow popups to open the standalone preview.");
      return;
    }

    previewWindow.document.write(buildPreviewDocument(current.generatedCode));
    previewWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Link>
              </Button>
              <Badge variant="secondary">Generated Workspace</Badge>
            </div>
            <h1 className="text-xl font-semibold text-foreground">Generated Pages</h1>
            <p className="text-sm text-muted-foreground">
              Browse previews, inspect structured data, and copy generated code.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy Code"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleOpenStandalone}>
              <ExternalLink className="w-4 h-4" />
              Open Preview
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-4 py-4">
            <p className="text-sm font-medium text-foreground">Generated Pages ({completedJobs.length})</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Select a page to view its preview, code, and extracted data.
            </p>
          </div>

          <ScrollArea className="h-[calc(100vh-220px)] min-h-[420px]">
            <div className="space-y-1 p-2">
              {completedJobs.map((job) => {
                const jobKey = job.normalizedUrl || job.url;
                const isActive = (current.normalizedUrl || current.url) === jobKey;
                return (
                  <button
                    key={jobKey}
                    type="button"
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      next.set("page", jobKey);
                      setSearchParams(next);
                    }}
                    className={cn(
                      "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                      isActive
                        ? "border-primary/50 bg-primary/10"
                        : "border-transparent bg-secondary/20 hover:border-border hover:bg-secondary/40",
                    )}
                  >
                    <p className="truncate text-sm font-medium text-foreground">
                      {job.scrapedMeta?.title || new URL(job.url).pathname || "Generated Page"}
                    </p>
                    <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                      {job.url}
                    </p>
                    {job.pageType ? (
                      <Badge variant="outline" className="mt-2 text-[10px]">
                        {job.pageType.replace(/_/g, " ")}
                      </Badge>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                {current.scrapedMeta?.title || current.url}
              </h2>
              <p className="font-mono text-xs text-muted-foreground break-all">{current.url}</p>
            </div>
            {current.pageType ? (
              <Badge variant="secondary">{current.pageType.replace(/_/g, " ")}</Badge>
            ) : null}
          </div>

          <Tabs defaultValue="preview">
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

            <TabsContent value="preview" className="mt-4">
              <div className="overflow-hidden rounded-xl border border-border bg-white">
                <iframe
                  srcDoc={buildPreviewDocument(current.generatedCode || "")}
                  className="h-[calc(100vh-260px)] min-h-[720px] w-full"
                  title="Page Preview"
                  sandbox="allow-scripts"
                />
              </div>
            </TabsContent>

            <TabsContent value="code" className="mt-4">
              <pre className="max-h-[calc(100vh-260px)] min-h-[720px] overflow-auto rounded-xl border border-border bg-background p-4 text-xs font-mono leading-relaxed text-foreground">
                {current.generatedCode}
              </pre>
            </TabsContent>

            <TabsContent value="data" className="mt-4">
              <pre className="max-h-[calc(100vh-260px)] min-h-[720px] overflow-auto rounded-xl border border-border bg-background p-4 text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap break-words">
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
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
