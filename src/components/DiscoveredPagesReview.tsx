import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { DiscoveredPage, DiscoveryResult } from "@/lib/dealer-workflow";
import { CheckCheck, Filter, Play, Sparkles } from "lucide-react";

interface DiscoveredPagesReviewProps {
  discovery: DiscoveryResult;
  selectedUrls: string[];
  isProcessing: boolean;
  onToggleUrl: (url: string) => void;
  onAcceptRecommended: () => void;
  onSelectStaticPages: () => void;
  onExcludeInventory: () => void;
  onStartGeneration: () => void;
}

const TYPE_TONE: Record<DiscoveredPage["pageType"], string> = {
  homepage: "bg-primary/10 text-primary",
  about: "bg-blue-500/10 text-blue-600",
  service: "bg-emerald-500/10 text-emerald-600",
  parts: "bg-teal-500/10 text-teal-600",
  financing: "bg-violet-500/10 text-violet-600",
  specials: "bg-amber-500/10 text-amber-700",
  contact: "bg-cyan-500/10 text-cyan-700",
  inventory_listing: "bg-orange-500/10 text-orange-700",
  vehicle_detail: "bg-zinc-500/10 text-zinc-700",
  model_landing: "bg-fuchsia-500/10 text-fuchsia-700",
  trade_in: "bg-lime-500/10 text-lime-700",
  scheduler_flow: "bg-sky-500/10 text-sky-700",
  legal: "bg-zinc-500/10 text-zinc-700",
  utility: "bg-zinc-500/10 text-zinc-700",
  unknown: "bg-muted text-muted-foreground",
};

const STATIC_TYPES = new Set([
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
]);

export default function DiscoveredPagesReview({
  discovery,
  selectedUrls,
  isProcessing,
  onToggleUrl,
  onAcceptRecommended,
  onSelectStaticPages,
  onExcludeInventory,
  onStartGeneration,
}: DiscoveredPagesReviewProps) {
  const selectedSet = useMemo(() => new Set(selectedUrls), [selectedUrls]);
  const selectedCount = selectedUrls.length;

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-foreground">Review Discovered Pages</h3>
            <Badge variant="secondary">{discovery.site.rootDomain}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {discovery.summary.totalDiscovered} pages discovered,{" "}
            {discovery.summary.recommendedCount} recommended. Review the sitemap before
            scraping or generation starts.
          </p>
        </div>

        <Button
          onClick={onStartGeneration}
          disabled={selectedCount === 0 || isProcessing}
          className="min-w-[220px]"
        >
          <Play className="w-4 h-4" />
          Generate {selectedCount} Approved Page{selectedCount !== 1 ? "s" : ""}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onAcceptRecommended} disabled={isProcessing}>
          <CheckCheck className="w-4 h-4" />
          Accept Recommended
        </Button>
        <Button variant="outline" size="sm" onClick={onSelectStaticPages} disabled={isProcessing}>
          <Sparkles className="w-4 h-4" />
          Select Static Pages
        </Button>
        <Button variant="outline" size="sm" onClick={onExcludeInventory} disabled={isProcessing}>
          <Filter className="w-4 h-4" />
          Exclude Inventory-Related
        </Button>
      </div>

      <ScrollArea className="h-[420px] rounded-lg border border-border">
        <div className="divide-y divide-border">
          {discovery.pages.map((page) => {
            const checked = selectedSet.has(page.normalizedUrl);
            const isStaticType = STATIC_TYPES.has(page.pageType);

            return (
              <div key={page.normalizedUrl} className="p-4 space-y-3">
                <div className="flex gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggleUrl(page.normalizedUrl)}
                    disabled={isProcessing}
                    className="mt-1"
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground truncate">
                        {page.title || page.h1 || page.normalizedUrl}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_TONE[page.pageType]}`}
                      >
                        {page.pageType.replace(/_/g, " ")}
                      </span>
                      {page.recommended && (
                        <Badge variant="secondary">Recommended</Badge>
                      )}
                      {isStaticType && (
                        <Badge variant="outline">Static</Badge>
                      )}
                    </div>

                    <p className="font-mono text-xs text-muted-foreground break-all">
                      {page.normalizedUrl}
                    </p>

                    {page.summary && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {page.summary}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Confidence: {Math.round(page.confidence * 100)}%</span>
                      <span>Source: {page.source}</span>
                      <span>{page.reason}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
