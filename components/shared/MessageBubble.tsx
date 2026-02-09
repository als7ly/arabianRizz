"use client";

import React, { memo, useState } from "react";
import Image from "next/image";
import { Sparkles, Share2, Volume2, Loader2, RotateCw, Copy, Check, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Feedback from "./Feedback";
import { useTranslations } from "next-intl";

// Define the type locally or import it if shared
export type Message = {
  _id?: string;
  role: string;
  content: string;
  createdAt?: string;
  feedback?: "up" | "down" | null;
  audioUrl?: string;
};

interface MessageBubbleProps {
  msg: Message;
  index: number;
  playingAudioId: string | null;
  isLoading: boolean;
  onPlayAudio: (msg: Message, idx: number) => void;
  onRegenerate: (idx: number) => void;
  onCopy: (text: string) => void;
  onShare: (text: string, isImage?: boolean) => void;
  onToggleSave: (msg: Message) => void;
  isSaved: boolean;
}

const MessageBubble = memo(({
  msg,
  index,
  playingAudioId,
  isLoading,
  onPlayAudio,
  onRegenerate,
  onCopy,
  onShare,
  onToggleSave,
  isSaved
}: MessageBubbleProps) => {
  const t = useTranslations('Chat');
  const [isCopied, setIsCopied] = useState(false);
  const isWingman = msg.role === "wingman";
  const isUser = msg.role === "user";
  const isGirl = msg.role === "girl";
  const isPlaying = playingAudioId === index.toString();

  const handleCopyClick = () => {
    onCopy(msg.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex w-full group animate-fade-in-up mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm md:text-base leading-relaxed relative shadow-sm transition-all",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : isWingman
            ? "bg-secondary text-secondary-foreground rounded-bl-sm border border-border"
            : "bg-muted text-muted-foreground rounded-bl-sm italic" // Girl/Screenshot
        )}
      >
        {isWingman && (
          <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5 uppercase tracking-wide">
            <Sparkles size={14} className="animate-pulse" /> {t('wingman')}
          </div>
        )}
        {isGirl && (
          <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">{t('sheSaid')}</div>
        )}

        {msg.content.startsWith("[IMAGE]:") ? (
            <div className="relative group/image overflow-hidden rounded-lg">
              <Image
                  src={msg.content.replace("[IMAGE]: ", "")}
                  alt="Generated"
                  width={500}
                  height={500}
                  className="rounded-lg max-w-full h-auto transition-transform duration-500 group-hover/image:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-opacity flex-center">
                  <Button
                      variant="secondary"
                      size="sm"
                      className="bg-white/90 hover:bg-white text-gray-900 font-bold"
                      onClick={() => onShare(msg.content.replace("[IMAGE]: ", ""), true)}
                  >
                      <Share2 size={16} className="mr-2" />
                      Share
                  </Button>
              </div>
            </div>
        ) : (
            <div className="flex flex-col gap-2">
                <div className="whitespace-pre-wrap">{msg.content}</div>

                <div className="flex items-center justify-between mt-1 min-h-[24px]">
                    <span className={cn("text-[10px] font-medium", isUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                    </span>

                    {isWingman && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" role="toolbar" aria-label="Message actions">
                          <ActionButton icon={isPlaying ? <Loader2 size={14} className="animate-spin"/> : <Volume2 size={14} />} onClick={() => onPlayAudio(msg, index)} label={t('playAudioTitle')} disabled={playingAudioId !== null} />
                          <ActionButton icon={<RotateCw size={14} className={isLoading ? "animate-spin" : ""} />} onClick={() => onRegenerate(index)} label={t('regenerateTitle')} disabled={isLoading} />
                          <ActionButton icon={isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />} onClick={handleCopyClick} label={t('copyTitle')} />
                          <ActionButton
                            icon={<Bookmark size={14} className={cn("transition-colors", isSaved ? "fill-current text-purple-500" : "")} />}
                            onClick={() => onToggleSave(msg)}
                            label={isSaved ? t('unsaveTitle') : t('saveTitle')}
                            aria-pressed={isSaved}
                          />
                          <ActionButton icon={<Share2 size={14} />} onClick={() => onShare(msg.content)} label={t('shareTitle')} />
                          {msg._id && <Feedback messageId={msg._id} />}
                      </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
});

const ActionButton = ({ icon, onClick, label, disabled, ...props }: { icon: React.ReactNode, onClick: () => void, label: string, disabled?: boolean } & React.ComponentProps<typeof Button>) => (
    <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full"
        onClick={onClick}
        disabled={disabled}
        title={label}
        aria-label={label}
        {...props}
    >
        {icon}
    </Button>
)

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
