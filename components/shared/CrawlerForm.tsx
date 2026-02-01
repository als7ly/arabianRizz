"use client";

import { useState } from "react";
import { crawlAndStage } from "@/lib/actions/admin.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function CrawlerForm() {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState("ar");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCrawl = async () => {
    if (!url) return;
    setLoading(true);

    const res = await crawlAndStage(url, language);

    if (res.success) {
      toast({ title: "Success", description: `Crawled and staged ${res.count} chunks.` });
      setUrl("");
    } else {
      toast({ title: "Error", description: res.error, variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-4 items-end bg-white p-6 rounded-lg shadow-sm border mb-8">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium">Source URL</label>
        <Input
          placeholder="https://example.com/blog/flirting-tips"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>
      <div className="w-40 space-y-2">
         <label className="text-sm font-medium">Language</label>
         <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="ar">Arabic</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
                <SelectItem value="ru">Russian</SelectItem>
                <SelectItem value="pt">Portuguese</SelectItem>
                <SelectItem value="zh">Chinese</SelectItem>
                <SelectItem value="ja">Japanese</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
            </SelectContent>
         </Select>
      </div>
      <Button onClick={handleCrawl} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
        {loading ? <Loader2 className="animate-spin mr-2" /> : null}
        Start Crawl
      </Button>
    </div>
  );
}
