"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitFeedback } from "@/lib/actions/wingman.actions";
import { cn } from "@/lib/utils";

interface FeedbackProps {
  messageId?: string;
  initialFeedback?: "positive" | "negative";
}

const Feedback = ({ messageId, initialFeedback }: FeedbackProps) => {
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(initialFeedback || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!messageId) return null;

  const handleFeedback = async (value: "positive" | "negative") => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(value); // Optimistic update

    try {
      await submitFeedback(messageId, value);
    } catch (error) {
      console.error(error);
      // Revert if needed, but for feedback simple logging is usually enough
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-1 mt-1">
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-6 w-6", feedback === "positive" ? "text-green-500" : "text-gray-300 hover:text-green-500")}
        onClick={() => handleFeedback("positive")}
        disabled={isSubmitting}
        aria-label="Thumbs up"
      >
        <ThumbsUp size={14} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn("h-6 w-6", feedback === "negative" ? "text-red-500" : "text-gray-300 hover:text-red-500")}
        onClick={() => handleFeedback("negative")}
        disabled={isSubmitting}
        aria-label="Thumbs down"
      >
        <ThumbsDown size={14} />
      </Button>
    </div>
  );
};

export default Feedback;
