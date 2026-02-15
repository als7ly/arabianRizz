"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { analyzeConversation } from "@/lib/actions/analysis.actions";
import { ConversationAnalysis } from "@/lib/validations/analysis";
import { ThumbsUp, ThumbsDown, Lightbulb, Activity } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalysisDialogProps {
  girlId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnalysisDialog({ girlId, open, onOpenChange }: AnalysisDialogProps) {
  const [data, setData] = useState<ConversationAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('Analysis');

  useEffect(() => {
    if (open && !data) {
      setLoading(true);
      analyzeConversation(girlId)
        .then((result) => {
          if (result) {
            setData(result);
          } else {
             toast({
                title: t('failedTitle'),
                description: t('failedDesc'),
                variant: "destructive"
             });
             onOpenChange(false);
          }
        })
        .catch((err) => {
            console.error(err);
             toast({
                title: t('errorTitle'),
                description: t('errorDesc'),
                variant: "destructive"
             });
            onOpenChange(false);
        })
        .finally(() => setLoading(false));
    }
  }, [open, girlId, data, onOpenChange, toast, t]);

  useEffect(() => {
      setData(null);
  }, [girlId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500 border-green-500 bg-green-50";
    if (score >= 50) return "text-yellow-500 border-yellow-500 bg-yellow-50";
    return "text-red-500 border-red-500 bg-red-50";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="text-purple-600" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6" aria-live="polite">
          {loading ? (
             <div className="space-y-6 flex flex-col items-center justify-center py-2 animate-pulse">
                {/* Score Skeleton */}
                <div className="flex flex-col items-center gap-2">
                    <Skeleton className="w-24 h-24 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                </div>

                {/* Summary Skeleton */}
                <Skeleton className="h-20 w-full rounded-xl" />

                {/* Lists Skeleton */}
                <div className="w-full space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                    </div>
                </div>
             </div>
          ) : data ? (
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Score */}
                <div className="flex flex-col items-center">
                    <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-bold ${getScoreColor(data.score)}`}>
                        {data.score}
                    </div>
                    <span className="text-sm text-muted-foreground mt-2">{t('score')}</span>
                </div>

                {/* Summary */}
                <div className="bg-secondary/50 p-4 rounded-xl text-sm italic text-center">
                    "{data.summary}"
                </div>

                {/* Strengths */}
                <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-semibold text-green-700">
                        <ThumbsUp size={16} /> {t('strengths')}
                    </h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground ml-1">
                        {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                </div>

                {/* Weaknesses */}
                <div className="space-y-2">
                    <h4 className="flex items-center gap-2 font-semibold text-red-700">
                        <ThumbsDown size={16} /> {t('weaknesses')}
                    </h4>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground ml-1">
                        {data.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>

                {/* Tips */}
                <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl space-y-2">
                     <h4 className="flex items-center gap-2 font-semibold text-purple-700">
                        <Lightbulb size={16} /> {t('tips')}
                    </h4>
                    <p className="text-sm text-purple-900">
                        {data.tips}
                    </p>
                </div>

                 <div className="flex justify-center pt-2">
                    <Button variant="outline" size="sm" onClick={() => setData(null)} className="text-xs">
                        {t('refresh')}
                    </Button>
                 </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
                {t('noAnalysis')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
