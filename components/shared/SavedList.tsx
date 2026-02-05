"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { deleteSavedMessage } from "@/lib/actions/saved-message.actions";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, MessageCircle, Quote } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Link } from "@/navigation";

type SavedMessage = {
  _id: string;
  content: string;
  createdAt: string;
  message: {
    _id: string;
    girl: {
      _id: string;
      name: string;
    }
  }
};

export default function SavedList({ initialMessages }: { initialMessages: SavedMessage[] }) {
  const t = useTranslations("Saved");
  const { toast } = useToast();
  const pathname = usePathname();
  const [messages, setMessages] = useState<SavedMessage[]>(initialMessages);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Message copied to clipboard.",
    });
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      await deleteSavedMessage(id, pathname);
      setMessages((prev) => prev.filter((msg) => msg._id !== id));
      toast({
        title: "Deleted",
        description: "Message removed from saved lines.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete message.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-white rounded-xl shadow-sm border border-dashed">
        <Quote className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700">{t("empty")}</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {messages.map((msg) => (
        <div key={msg._id} className="bg-white p-6 rounded-xl shadow-sm border flex flex-col gap-4 transition-all hover:shadow-md">
          <div className="flex-1">
            <Quote className="w-8 h-8 text-purple-200 mb-2" />
            <p className="text-gray-800 text-lg font-medium leading-relaxed whitespace-pre-wrap">
              {msg.content}
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
            <div className="flex items-center gap-2 text-sm text-gray-500">
               <span className="font-semibold text-purple-600">{msg.message?.girl?.name || "Unknown Girl"}</span>
               <span>•</span>
               <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="flex gap-2">
               <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(msg.content)}
                title={t("copy")}
                aria-label={t("copy")}
                className="text-gray-400 hover:text-purple-600"
              >
                <Copy size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(msg._id)}
                disabled={isDeleting === msg._id}
                title={t("remove")}
                aria-label={t("remove")}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
