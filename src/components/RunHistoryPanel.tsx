import { Clock3, FolderOpen, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DealerRunListItem } from "@/lib/dealer-workflow";
import { brands } from "@/lib/brands";
import { cn } from "@/lib/utils";

interface RunHistoryPanelProps {
  runs: DealerRunListItem[];
  activeRunId?: string | null;
  isLoading: boolean;
  onOpenRun: (runId: string) => void;
}

export default function RunHistoryPanel({
  runs,
  activeRunId,
  isLoading,
  onOpenRun,
}: RunHistoryPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Brand Workspaces</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Switch between saved Honda, Toyota, or other OEM runs without losing previous work.
          </p>
        </div>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      </div>

      <div className="mt-4 space-y-2">
        {runs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No saved runs yet.
          </div>
        ) : (
          runs.slice(0, 8).map((run) => {
            const brand = brands[run.brand_key];
            const active = run.id === activeRunId;
            return (
              <button
                key={run.id}
                type="button"
                onClick={() => onOpenRun(run.id)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                  active
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-secondary/20 hover:bg-secondary/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {brand?.name || run.brand_key}
                      </p>
                      <Badge variant="secondary" className="text-[10px]">
                        {run.mode === "seed_discovery" ? "Seed" : "Manual"}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {run.site_title || run.site_domain || run.seed_url || "Untitled run"}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {run.counts.completed}/{run.counts.total}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock3 className="h-3.5 w-3.5" />
                    <span>{formatDistanceToNow(new Date(run.updated_at), { addSuffix: true })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {run.counts.failed > 0 ? (
                      <span>{run.counts.failed} failed</span>
                    ) : null}
                    <FolderOpen className="h-3.5 w-3.5" />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {runs.length > 8 ? (
        <Button variant="ghost" size="sm" className="mt-3 w-full justify-center text-xs" disabled>
          More history coming next
        </Button>
      ) : null}
    </div>
  );
}
