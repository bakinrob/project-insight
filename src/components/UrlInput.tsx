import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { brands, brandKeys } from "@/lib/brands";
import { Zap } from "lucide-react";

interface UrlInputProps {
  onSubmit: (urls: string[], brandKey: string) => void;
  isProcessing: boolean;
}

const UrlInput = ({ onSubmit, isProcessing }: UrlInputProps) => {
  const [urlText, setUrlText] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("");

  const handleSubmit = () => {
    const urls = urlText
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    if (urls.length === 0 || !selectedBrand) return;
    onSubmit(urls, selectedBrand);
  };

  const urlCount = urlText
    .split("\n")
    .filter((u) => u.trim().length > 0).length;

  return (
    <div className="space-y-5">
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
        {urlCount > 0 && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {urlCount} URL{urlCount !== 1 ? "s" : ""} detected
          </p>
        )}
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
        disabled={urlCount === 0 || !selectedBrand || isProcessing}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        <Zap className="w-5 h-5" />
        {isProcessing ? "Processing..." : `Generate ${urlCount} Page${urlCount !== 1 ? "s" : ""}`}
      </Button>
    </div>
  );
};

export default UrlInput;
