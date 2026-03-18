import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import type { DiscoveredPage, DiscoveryResult } from "@/lib/dealer-workflow";
import { CheckCheck, ChevronDown, Filter, Play, Sparkles } from "lucide-react";

interface DiscoveredPagesReviewProps {
  discovery: DiscoveryResult;
  selectedUrls: string[];
  isProcessing: boolean;
  recommendedSelectionApplied: boolean;
  hasGeneratedPages?: boolean;
  onToggleUrl: (url: string) => void;
  onAcceptRecommended: () => void;
  onSelectStaticPages: () => void;
  onExcludeInventory: () => void;
  onStartGeneration: () => void;
  onOpenWorkspace?: () => void;
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
  recommendedSelectionApplied,
  hasGeneratedPages = false,
  onToggleUrl,
  onAcceptRecommended,
  onSelectStaticPages,
  onExcludeInventory,
  onStartGeneration,
  onOpenWorkspace,
}: DiscoveredPagesReviewProps) {
  const selectedSet = useMemo(() => new Set(selectedUrls), [selectedUrls]);
  const [expandedUrl, setExpandedUrl] = useState<string | null>(discovery.pages[0]?.normalizedUrl || null);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-foreground">Review Discovered Pages</h2>
            <Badge variant="secondary">{discovery.site.rootDomain}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {discovery.summary.totalDiscovered} pages discovered, {discovery.summary.recommendedCount} recommended.
            Select the pages you want to turn into generated outputs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenWorkspace}
            disabled={!onOpenWorkspace || !hasGeneratedPages}
          >
            Open Generated Pages
          </Button>
          <Button
            onClick={onStartGeneration}
            disabled={selectedUrls.length === 0 || isProcessing}
            className="min-w-[220px]"
          >
            <Play className="w-4 h-4" />
            Generate {selectedUrls.length} Selected Page{selectedUrls.length !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onAcceptRecommended}
          disabled={isProcessing || recommendedSelectionApplied}
        >
          <CheckCheck className="w-4 h-4" />
          {recommendedSelectionApplied ? "Recommended Applied" : "Accept Recommended"}
        </Button>
        <Button variant="outline" size="sm" onClick={onSelectStaticPages} disabled={isProcessing}>
          <Sparkles className="w-4 h-4" />
          Static Only
        </Button>
        <Button variant="outline" size="sm" onClick={onExcludeInventory} disabled={isProcessing}>
          <Filter className="w-4 h-4" />
          Exclude Inventory
        </Button>
      </div>

      <ScrollArea className="h-[560px] rounded-xl border border-border">
        <div className="divide-y divide-border">
          {discovery.pages.map((page) => {
            const checked = selectedSet.has(page.normalizedUrl);
            const expanded = expandedUrl === page.normalizedUrl;
            const isStaticType = STATIC_TYPES.has(page.pageType);

            return (
              <div key={page.normalizedUrl} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggleUrl(page.normalizedUrl)}
                    disabled={isProcessing}
                    className="mt-1"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="max-w-full truncate font-medium text-foreground">
                            {page.title || page.h1 || page.normalizedUrl}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${TYPE_TONE[page.pageType]}`}
                          >
                            {page.pageType.replace(/_/g, " ")}
                          </span>
                          {page.recommended ? <Badge variant="secondary">Recommended</Badge> : null}
                          {isStaticType ? <Badge variant="outline">Static</Badge> : null}
                        </div>
                        <p className="font-mono text-[11px] text-muted-foreground break-all">
                          {page.normalizedUrl}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                          <span>Confidence {Math.round(page.confidence * 100)}%</span>
                          <span>{page.reason}</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-xs"
                        onClick={() => setExpandedUrl(expanded ? null : page.normalizedUrl)}
                      >
                        Details
                        <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
                      </Button>
                    </div>

                    <Collapsible open={expanded}>
                      <CollapsibleContent className="pt-3">
                        <div className="rounded-lg border border-border bg-secondary/20 px-3 py-3 text-sm text-muted-foreground">
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] uppercase tracking-wide">
                            <span>Source: {page.source}</span>
                            {page.anchorText ? <span>Anchor: {page.anchorText}</span> : null}
                          </div>
                          {page.summary ? (
                            <p className="mt-2 leading-relaxed">{page.summary}</p>
                          ) : (
                            <p className="mt-2 text-xs">No summary extracted for this page.</p>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
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
