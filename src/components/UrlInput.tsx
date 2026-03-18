import { useMemo, useState } from "react";
import { ChevronDown, Compass, Wrench, Zap } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brands, brandKeys } from "@/lib/brands";
import type { InputMode } from "@/lib/dealer-workflow";

interface UrlInputProps {
  onSubmit: (payload: { mode: InputMode; urls?: string[]; seedUrl?: string; brandKey: string }) => void;
  isProcessing: boolean;
}

export default function UrlInput({ onSubmit, isProcessing }: UrlInputProps) {
  const [isManualModeExpanded, setIsManualModeExpanded] = useState(false);
  const [urlText, setUrlText] = useState("");
  const [seedUrl, setSeedUrl] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  const urls = useMemo(
    () =>
      urlText
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u.length > 0),
    [urlText],
  );

  const mode: InputMode = isManualModeExpanded ? "manual_urls" : "seed_discovery";

  const handleSubmit = () => {
    if (!selectedBrand) return;

    if (mode === "manual_urls") {
      if (urls.length === 0) return;
      onSubmit({ mode, urls, brandKey: selectedBrand });
      return;
    }

    if (!seedUrl.trim()) return;
    onSubmit({ mode, seedUrl: seedUrl.trim(), brandKey: selectedBrand });
  };

  const submitDisabled =
    isProcessing ||
    !selectedBrand ||
    (mode === "manual_urls" ? urls.length === 0 : seedUrl.trim().length === 0);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
            <Compass className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Seed Discovery</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Start from one homepage URL. DealerForge will discover likely migration pages,
              exclude junk, and pause for review before generation.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground block">
            Dealership Homepage URL
          </label>
          <Input
            value={seedUrl}
            onChange={(e) => setSeedUrl(e.target.value)}
            placeholder="https://www.examplemotors.com"
            className="bg-background border-border font-mono text-sm"
            disabled={isProcessing || isManualModeExpanded}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">
          Target OEM Brand
        </label>
        <Select value={selectedBrand} onValueChange={setSelectedBrand} disabled={isProcessing}>
          <SelectTrigger className="bg-background border-border">
            <SelectValue placeholder="Select brand..." />
          </SelectTrigger>
          <SelectContent>
            {brandKeys.map((key) => (
              <SelectItem key={key} value={key}>
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: brands[key].primary }}
                  />
                  {brands[key].name}
                  <span className="text-muted-foreground text-xs ml-1">({brands[key].tier})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Collapsible open={isManualModeExpanded} onOpenChange={setIsManualModeExpanded}>
        <div className="rounded-lg border border-border bg-secondary/10">
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              disabled={isProcessing}
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-secondary p-2">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Advanced: Manual URLs</p>
                  <p className="text-xs text-muted-foreground">
                    Use this fallback if discovery misses pages or you want total control.
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${isManualModeExpanded ? "rotate-180" : ""}`}
              />
            </button>
          </CollapsibleTrigger>

          <CollapsibleContent className="border-t border-border px-4 pb-4 pt-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground block">
                Paste dealership URLs (one per line)
              </label>
              <Textarea
                value={urlText}
                onChange={(e) => setUrlText(e.target.value)}
                placeholder={"https://dealer-website.com/about\nhttps://dealer-website.com/service\nhttps://dealer-website.com/contact"}
                className="min-h-[132px] bg-background border-border font-mono text-sm resize-none"
                disabled={isProcessing}
              />
              {urls.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {urls.length} URL{urls.length !== 1 ? "s" : ""} detected
                </p>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      <Button
        onClick={handleSubmit}
        disabled={submitDisabled}
        className="w-full h-11 text-sm font-semibold"
        size="lg"
      >
        {mode === "manual_urls" ? <Zap className="w-4 h-4" /> : <Compass className="w-4 h-4" />}
        {mode === "manual_urls"
          ? isProcessing
            ? "Processing Manual URLs..."
            : `Generate ${urls.length} Manual Page${urls.length !== 1 ? "s" : ""}`
          : isProcessing
            ? "Discovering..."
            : "Discover Migration Pages"}
      </Button>
    </div>
  );
}
