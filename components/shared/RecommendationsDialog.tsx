"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Gift, Sparkles, Loader2 } from "lucide-react";
import { getWingmanRecommendations } from "@/lib/actions/referral.actions";
import { Badge } from "@/components/ui/badge";

interface RecommendationsDialogProps {
  girlId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecommendationsDialog({ girlId, open, onOpenChange }: RecommendationsDialogProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getWingmanRecommendations(girlId)
        .then((data) => {
            setItems(data);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [open, girlId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Gift className="text-purple-600" />
            Wingman's Gift & Date Ideas
          </DialogTitle>
          <DialogDescription>
            Curated recommendations based on your conversation and her vibe.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="animate-spin text-purple-600" size={32} />
                    <p className="text-sm text-gray-500">Analyzing her vibe and finding the perfect match...</p>
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <Sparkles className="text-gray-400" size={32} />
                    </div>
                    <p className="text-lg font-medium text-gray-900">No ideas just yet.</p>
                    <p className="text-sm">Keep chatting to give me more context!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map((item) => (
                        <div key={item._id} className="border rounded-xl p-4 flex flex-col hover:bg-gray-50/50 transition-colors shadow-sm group">
                            <div className="flex gap-4">
                                {item.imageUrl ? (
                                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border shrink-0">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                                    </div>
                                ) : (
                                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                        <Gift className="text-gray-300" size={24} />
                                    </div>
                                )}
                                <div className="flex-1 flex flex-col min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <h4 className="font-semibold text-sm line-clamp-2 text-gray-900 leading-tight">
                                            {item.name}
                                        </h4>
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 shrink-0 capitalize whitespace-nowrap">
                                            {item.category.replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                                        {item.description}
                                    </p>
                                    <div className="mt-auto pt-2 flex justify-between items-center">
                                        <span className="font-bold text-purple-700 text-sm">
                                            {item.price ? `${item.currency} ${item.price}` : ""}
                                        </span>
                                        <Button size="sm" className="h-7 text-xs bg-gray-900 hover:bg-gray-800" asChild>
                                            <a href={item.url} target="_blank" rel="noopener noreferrer">
                                                Check it out <ExternalLink size={10} className="ml-1" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
