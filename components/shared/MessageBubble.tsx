"use client";

import React, { memo, useState } from "react";
import Image from "next/image";
import { Sparkles, Share2, Volume2, Loader2, RotateCw, Copy, Check } from "lucide-react";
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
}

const MessageBubble = memo(({
  msg,
  index,
  playingAudioId,
  isLoading,
  onPlayAudio,
  onRegenerate,
  onCopy,
  onShare
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
        "flex w-full group animate-fade-in-up",
        isUser ? "justify-end" : "justify-start"
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl p-4 text-sm whitespace-pre-wrap relative",
          isUser
            ? "bg-purple-600 text-white rounded-br-none"
            : isWingman
            ? "bg-white border border-purple-100 text-dark-600 rounded-bl-none shadow-sm"
            : "bg-gray-200 text-dark-600 rounded-bl-none" // Girl/Screenshot
        )}
      >
        {isWingman && (
          <div className="text-xs font-bold text-purple-500 mb-1 flex items-center gap-1">
            <Sparkles size={12}/> {t('wingman')}
          </div>
        )}
        {isGirl && (
          <div className="text-xs font-bold text-gray-500 mb-1">{t('sheSaid')}</div>
        )}

        {msg.content.startsWith("[IMAGE]:") ? (
            <div className="relative">
              <Image
                  src={msg.content.replace("[IMAGE]: ", "")}
                  alt="Generated"
                  width={500}
                  height={500}
                  className="rounded-lg max-w-full h-auto"
              />
              <Button
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-2 right-2 bg-white/80 hover:bg-white text-gray-700"
                  onClick={() => onShare(msg.content.replace("[IMAGE]: ", ""), true)}
                  title={t('shareImageTitle')}
                  aria-label={t('shareImageAria')}
              >
                  <Share2 size={16} />
              </Button>
            </div>
        ) : (
            <div className="flex flex-col gap-1">
                <div className="flex items-start gap-2">
                    <span className="flex-1">{msg.content}</span>
                    {isWingman && (
                        <div className="flex flex-col gap-1">
                      <div className="flex gap-1" role="toolbar" aria-label="Message actions">
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-purple-400 hover:text-purple-600"
                              onClick={() => onPlayAudio(msg, index)}
                              disabled={playingAudioId !== null}
                              title={t('playAudioTitle')}
                              aria-label={t('playAudioAria')}
                          >
                              {isPlaying ? <Loader2 size={16} className="animate-spin"/> : <Volume2 size={16} />}
                          </Button>
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-blue-400 hover:text-blue-600"
                              onClick={() => onRegenerate(index)}
                              disabled={isLoading}
                              title={t('regenerateTitle')}
                              aria-label={t('regenerateAria')}
                          >
                              <RotateCw size={16} className={isLoading ? "animate-spin" : ""} />
                          </Button>
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-gray-600"
                              onClick={handleCopyClick}
                              title={isCopied ? "Copied" : t('copyTitle')}
                              aria-label={t('copyAria')}
                          >
                              {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                          </Button>
                          <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-green-600"
                              onClick={() => onShare(msg.content)}
                              title={t('shareTitle')}
                              aria-label={t('shareAria')}
                          >
                              <Share2 size={16} />
                          </Button>
                      </div>
                      {msg._id && <Feedback messageId={msg._id} />}
                    </div>
                    )}
                </div>
                <span className="text-[10px] text-gray-400 self-end">
                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
