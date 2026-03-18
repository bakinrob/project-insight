import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Code, Copy, Check, Database } from "lucide-react";
import type { PageJob } from "./ScrapeProgress";
import { toast } from "sonner";

interface PagePreviewProps {
  jobs: PageJob[];
}

const PagePreview = ({ jobs }: PagePreviewProps) => {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const completedJobs = useMemo(
    () => jobs.filter((j) => j.status === "done" && j.generatedCode),
    [jobs],
  );
  if (completedJobs.length === 0) return null;

  const current = completedJobs[selectedIdx] || completedJobs[0];

  const handleCopy = async () => {
    if (!current.generatedCode) return;
    await navigator.clipboard.writeText(current.generatedCode);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Generated Pages ({completedJobs.length})
        </h3>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy Code"}
        </Button>
      </div>

      {completedJobs.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {completedJobs.map((job, i) => (
            <Button
              key={job.url}
              variant={i === selectedIdx ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedIdx(i)}
              className="text-xs"
            >
              {job.scrapedMeta?.title || new URL(job.url).pathname || "Page"}
            </Button>
          ))}
        </div>
      )}

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

        <TabsContent value="preview" className="mt-3">
          <div className="rounded-lg border border-border bg-white overflow-hidden">
            <iframe
              srcDoc={`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>body{font-family:'Inter',sans-serif;margin:0}</style>
</head>
<body>${current.generatedCode || ""}</body>
</html>`}
              className="w-full h-[500px]"
              title="Page Preview"
              sandbox="allow-scripts"
            />
          </div>
        </TabsContent>

        <TabsContent value="code" className="mt-3">
          <pre className="rounded-lg bg-card border border-border p-4 overflow-auto max-h-[500px] text-xs font-mono text-foreground leading-relaxed">
            {current.generatedCode}
          </pre>
        </TabsContent>

        <TabsContent value="data" className="mt-3">
          <pre className="rounded-lg bg-card border border-border p-4 overflow-auto max-h-[500px] text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap break-words">
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
    </div>
  );
};

export default PagePreview;
