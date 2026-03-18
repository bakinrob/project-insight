import { useMemo, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { brands, brandKeys } from "@/lib/brands";
import type { InputMode } from "@/lib/dealer-workflow";
import { Compass, Zap } from "lucide-react";

interface UrlInputProps {
  onSubmit: (payload: { mode: InputMode; urls?: string[]; seedUrl?: string; brandKey: string }) => void;
  isProcessing: boolean;
}

const UrlInput = ({ onSubmit, isProcessing }: UrlInputProps) => {
  const [mode, setMode] = useState<InputMode>("manual_urls");
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
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground block">
          Input Mode
        </label>
        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as InputMode)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="manual_urls">Manual URLs</TabsTrigger>
            <TabsTrigger value="seed_discovery">Seed Discovery</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Manual mode is the safest demo path. Seed discovery starts from one homepage URL,
          finds likely migration pages, and pauses for review before scraping.
        </p>
      </div>

      {mode === "manual_urls" ? (
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Paste dealership URLs (one per line)
          </label>
          <Textarea
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            placeholder={"https://dealer-website.com/about\nhttps://dealer-website.com/service\nhttps://dealer-website.com/inventory"}
            className="min-h-[160px] bg-background border-border font-mono text-sm resize-none"
            disabled={isProcessing}
          />
          {urls.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">
              {urls.length} URL{urls.length !== 1 ? "s" : ""} detected
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground block">
            Dealership Homepage URL
          </label>
          <Input
            value={seedUrl}
            onChange={(e) => setSeedUrl(e.target.value)}
            placeholder="https://www.examplemotors.com"
            className="bg-background border-border font-mono text-sm"
            disabled={isProcessing}
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            DealerForge will crawl the same domain, infer page types, exclude junk pages,
            and generate a reviewable sitemap before any AI generation starts.
          </p>
        </div>
      )}

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
                  <span className="text-muted-foreground text-xs ml-1">
                    ({brands[key].tier})
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={submitDisabled}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {mode === "manual_urls" ? <Zap className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
        {mode === "manual_urls"
          ? isProcessing
            ? "Processing..."
            : `Generate ${urls.length} Page${urls.length !== 1 ? "s" : ""}`
          : isProcessing
            ? "Discovering..."
            : "Discover Migration Pages"}
      </Button>
    </div>
  );
};

export default UrlInput;
