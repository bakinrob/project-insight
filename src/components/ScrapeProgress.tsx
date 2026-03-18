import type { ReactNode } from "react";
import { ArrowUpRight, CheckCircle2, AlertCircle, Globe, Cpu, Compass, ListChecks, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PageJob, PageStatus } from "@/lib/dealer-workflow";

interface ScrapeProgressProps {
  jobs: PageJob[];
  onOpenWorkspace?: () => void;
  hasGeneratedPages?: boolean;
}

const statusConfig: Record<PageStatus, { icon: ReactNode; label: string; color: string }> = {
  pending: { icon: <Globe className="w-4 h-4" />, label: "Queued", color: "text-muted-foreground" },
  discovering: { icon: <Compass className="w-4 h-4 animate-pulse" />, label: "Discovering", color: "text-primary" },
  discovered: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Discovered", color: "text-primary" },
  approved: { icon: <ListChecks className="w-4 h-4" />, label: "Approved", color: "text-primary" },
  scraping: { icon: <Globe className="w-4 h-4 animate-pulse" />, label: "Scraping", color: "text-primary" },
  scraped: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Scraped", color: "text-primary" },
  structuring: { icon: <Cpu className="w-4 h-4 animate-pulse" />, label: "Structuring", color: "text-primary" },
  structured: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Structured", color: "text-primary" },
  generating: { icon: <Sparkles className="w-4 h-4 animate-pulse" />, label: "Generating", color: "text-primary" },
  done: { icon: <CheckCircle2 className="w-4 h-4" />, label: "Complete", color: "text-primary" },
  error: { icon: <AlertCircle className="w-4 h-4" />, label: "Failed", color: "text-destructive" },
};

export default function ScrapeProgress({
  jobs,
  onOpenWorkspace,
  hasGeneratedPages = false,
}: ScrapeProgressProps) {
  if (jobs.length === 0) return null;

  const completed = jobs.filter((job) => job.status === "done").length;
  const failed = jobs.filter((job) => job.status === "error").length;
  const total = jobs.length;
  const pct = total === 0 ? 0 : Math.round(((completed + failed) / total) * 100);
  const activeJob = jobs.find((job) =>
    ["discovering", "scraping", "structuring", "generating"].includes(job.status),
  );
  const latestJobs = jobs.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Run Status</p>
          <p className="text-xs text-muted-foreground">
            {completed} complete, {failed} failed, {total - completed - failed} remaining
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenWorkspace}
          disabled={!onOpenWorkspace || (!hasGeneratedPages && !activeJob)}
        >
          <ArrowUpRight className="w-4 h-4" />
          Open Generated Pages
        </Button>
      </div>

      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Progress</p>
          <p className="text-lg font-semibold text-foreground">{pct}%</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Generated</p>
          <p className="text-lg font-semibold text-foreground">{completed}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Failed</p>
          <p className="text-lg font-semibold text-foreground">{failed}</p>
        </div>
      </div>

      {activeJob ? (
        <div className="rounded-lg border border-border bg-secondary/30 px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Current Task</p>
          <p className="mt-1 truncate text-sm font-medium text-foreground">{activeJob.url}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span className={statusConfig[activeJob.status].color}>{statusConfig[activeJob.status].icon}</span>
            <span>{statusConfig[activeJob.status].label}</span>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        {latestJobs.map((job) => {
          const cfg = statusConfig[job.status];
          return (
            <div
              key={job.url}
              className="flex items-center gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-2"
            >
              <span className={cfg.color}>{cfg.icon}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-foreground">{job.url}</span>
              <span className={`text-[11px] font-medium ${cfg.color}`}>{cfg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
