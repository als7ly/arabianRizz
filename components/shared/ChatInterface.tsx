"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, AlertCircle, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addMessage } from "@/lib/actions/rag.actions";
import { extractTextFromImage } from "@/lib/actions/ocr.actions";
import { generateWingmanReply, generateHookupLine, generateSpeech } from "@/lib/actions/wingman.actions";
import { generateArt } from "@/lib/actions/image.actions";
import { toggleSaveMessage, getSavedMessageIds } from "@/lib/actions/saved-message.actions";
import { clearChat as clearChatAction, getGirlById } from "@/lib/actions/girl.actions";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import MessageBubble, { Message } from "./MessageBubble";
import { ChatHeaderActions } from "./ChatHeaderActions";
import { ChatInputArea } from "./ChatInputArea";
import { Link } from "@/navigation";
import { RecommendationsDialog } from "./RecommendationsDialog";

export const ChatInterface = ({ girlId, initialMessages, creditBalance, defaultTone }: { girlId: string, initialMessages: Message[], creditBalance?: number, defaultTone?: string }) => {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [sender, setSender] = useState<'user' | 'girl'>('user');
  const [tone, setTone] = useState(defaultTone || "Flirty");
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string>("nova");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('Chat');
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAtBottom = useRef(true);

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const atBottom = scrollHeight - scrollTop - clientHeight < 100;
      isAtBottom.current = atBottom;
      setShowScrollButton(!atBottom);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (scrollRef.current && isAtBottom.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  // Smart auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100;
      const lastMessage = messages[messages.length - 1];
      const isUserMessage = lastMessage?.role === 'user';

      if (isAtBottom || isUserMessage) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const fetchGirlVoice = async () => {
        try {
            const girl = await getGirlById(girlId);
            if (girl && girl.voiceId) {
                setVoiceId(girl.voiceId);
            }
        } catch (error) {
            console.error("Failed to fetch girl details:", error);
        }
    };
    fetchGirlVoice();
  }, [girlId]);

  const [savedMessageIds, setSavedMessageIds] = useState<Set<string>>(new Set());

  // Ref to keep track of savedMessageIds for callbacks without dependency
  const savedMessageIdsRef = useRef(savedMessageIds);
  useEffect(() => {
    savedMessageIdsRef.current = savedMessageIds;
  }, [savedMessageIds]);

  useEffect(() => {
    const fetchSaved = async () => {
        try {
            const ids = await getSavedMessageIds();
            setSavedMessageIds(new Set(ids));
        } catch (e) {
            console.error("Failed to fetch saved messages", e);
        }
    };
    fetchSaved();
  }, []);

  const handleToggleSave = useCallback(async (msg: Message) => {
    if (!msg._id) return;

    const wasSaved = savedMessageIdsRef.current.has(msg._id);

    setSavedMessageIds((prev) => {
        const newSet = new Set(prev);
        if (wasSaved) newSet.delete(msg._id!);
        else newSet.add(msg._id!);
        return newSet;
    });

    try {
        const result = await toggleSaveMessage(msg._id, pathname);
        if (result.isSaved) {
             toast({ title: t('saved'), description: t('savedDesc') });
        } else {
             toast({ title: t('removed'), description: t('removedDesc') });
        }
    } catch (e) {
        // Rollback
        setSavedMessageIds(prev => {
             const reverted = new Set(prev);
             if (wasSaved) reverted.add(msg._id!);
             else reverted.delete(msg._id!);
             return reverted;
        });
        toast({ title: t('errorTitle'), description: t('saveError'), variant: "destructive" });
    }
  }, [pathname, toast, t]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const msgContent = inputValue;
    setInputValue("");
    setIsLoading(true);

    const role = sender === 'girl' ? 'girl' : 'user';

    const newMsg: Message = { role: role, content: msgContent };
    setMessages((prev) => [...prev, newMsg]);

    try {
      await addMessage({ girlId, role: role, content: msgContent });

      const { reply, explanation, newBadges } = await generateWingmanReply(girlId, msgContent, tone, role);
      
      const aiMsg: Message = { role: "wingman", content: reply || "..." };
      setMessages((prev) => [...prev, aiMsg]);
      
      const savedMsg = await addMessage({ girlId, role: "wingman", content: reply || "..." });

      setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = savedMsg;
          return updated;
      });

      toast({
        title: t('wingmanTip'),
        description: explanation,
        duration: 6000,
      });

      if (newBadges && newBadges.length > 0) {
          newBadges.forEach((badge: string) => {
              toast({
                  title: "🏆 Achievement Unlocked!",
                  description: `You earned the '${badge}' badge!`,
                  className: "bg-yellow-50 border-yellow-200 text-yellow-800",
                  duration: 5000
              });
          });
      }

    } catch (error: any) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : t('errorReply');
      toast({ title: t('errorTitle'), description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
      setSender('user');
    }
  };

  const handleRegenerate = useCallback(async (index: number) => {
    if (index <= 0) return;

    const currentMessages = messagesRef.current;
    const userMsg = currentMessages[index - 1];
    if (userMsg.role !== "user" && userMsg.role !== "girl") return;

    setIsLoading(true);
    try {
        setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[index] = { ...newMsgs[index], content: t('regenerating') };
            return newMsgs;
        });

        const { reply, explanation } = await generateWingmanReply(girlId, userMsg.content, tone);

        setMessages(prev => {
            const updatedMsgs = [...prev];
            updatedMsgs[index] = { ...updatedMsgs[index], content: reply || "Error" };
            return updatedMsgs;
        });

        toast({
            title: t('wingmanTip'),
            description: explanation,
            duration: 6000,
        });

    } catch (e: any) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "Failed to regenerate.";
        toast({ title: t('errorTitle'), description: errorMessage, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [girlId, tone, t, toast]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: t('copied'),
        description: t('copiedDesc'),
        duration: 3000,
    });
  }, [toast, t]);

  const handleShare = useCallback(async (text: string, isImage: boolean = false) => {
      const shareData = {
          title: 'ArabianRizz',
          text: isImage ? t('shareImageText') : text,
          url: isImage ? text : undefined
      };

      if (navigator.share) {
          try {
              await navigator.share(shareData);
          } catch (err) {
              console.error(err);
          }
      } else {
          handleCopy(text);
          toast({ title: t('shareLinkTitle'), description: t('shareLinkText') });
      }
  }, [handleCopy, toast, t]);

  const handlePlayAudio = useCallback(async (message: Message, idx: number) => {
    try {
        setPlayingAudioId(idx.toString());
        let audioUrl = message.audioUrl;

        if (!audioUrl) {
            audioUrl = await generateSpeech(message.content, voiceId, message._id);

            if (audioUrl && message._id) {
                setMessages(prev => {
                    const updated = [...prev];
                    updated[idx] = { ...updated[idx], audioUrl: audioUrl };
                    return updated;
                });
            }
        }

        if (audioUrl) {
            const audio = new Audio(audioUrl);
            audio.onended = () => setPlayingAudioId(null);
            await audio.play();
        } else {
             toast({ title: t('errorTitle'), description: t('audioError'), variant: "destructive" });
             setPlayingAudioId(null);
        }
    } catch (e) {
        console.error(e);
        toast({ title: t('errorTitle'), description: t('audioPlaybackError'), variant: "destructive" });
        setPlayingAudioId(null);
    }
  }, [voiceId, t, toast]);

  const handleImageUpload = useCallback(async (url: string) => {
    setIsLoading(true);
    toast({ title: t('readingScreenshot'), description: t('readingScreenshotDesc') });

    try {
        const text = await extractTextFromImage(url);
        if (!text) {
            toast({ title: t('errorTitle'), description: t('noTextInImage'), variant: "destructive" });
            setIsLoading(false);
            return;
        }

        const newMsg: Message = { role: "girl", content: `(Screenshot): ${text}` };
        setMessages((prev) => [...prev, newMsg]);
        await addMessage({ girlId, role: "girl", content: text });

        const { reply, explanation } = await generateWingmanReply(girlId, text, tone);
        const aiMsg: Message = { role: "wingman", content: reply || "..." };
        setMessages((prev) => [...prev, aiMsg]);

        const savedMsg = await addMessage({ girlId, role: "wingman", content: reply || "..." });

        setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = savedMsg;
            return updated;
        });

        toast({
            title: t('wingmanTip'),
            description: explanation,
            duration: 6000,
        });

    } catch (error: any) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : t('errorProcessImage');
        toast({ title: t('errorTitle'), description: errorMessage, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [girlId, tone, t, toast]);

  const handleGenerateArt = async (prompt: string, mode: 'standard' | 'selfie') => {
    setIsLoading(true);
    toast({ title: t('generatingArt'), description: t('generatingArtDesc') });

    try {
        const { imageUrl, error } = await generateArt(prompt, girlId, mode);

        if (imageUrl) {
            const imgMsg: Message = { role: "wingman", content: `[IMAGE]: ${imageUrl}` }; 
            setMessages((prev) => [...prev, imgMsg]);
            await addMessage({ girlId, role: "wingman", content: `[IMAGE]: ${imageUrl}` });
        } else {
             toast({ title: t('errorTitle'), description: error || t('artError'), variant: "destructive" });
        }
    } catch(e) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : t('genericError');
        toast({ title: t('errorTitle'), description: errorMessage, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateHookupLine = async () => {
    setIsLoading(true);
    try {
        const { line, explanation } = await generateHookupLine(girlId);
        if (line) {
            setInputValue(line);
            toast({
                title: t('hookupToastTitle'),
                description: explanation,
                duration: 6000,
            });
        }
    } catch (e: any) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : t('errorHookup');
        toast({ title: t('errorTitle'), description: errorMessage, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    setIsLoading(true);
    try {
        await clearChatAction(girlId, pathname);
        setMessages([]);
        toast({
            title: t('chatCleared'),
            description: t('chatClearedDesc'),
        });
    } catch (error) {
        console.error(error);
        toast({ title: t('errorTitle'), description: t('clearError'), variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGetRecommendations = () => {
    setIsRecommendationsOpen(true);
  };

  const handleScenarioSelect = async (instruction: string) => {
    setIsLoading(true);

    try {
        const { reply, explanation, newBadges } = await generateWingmanReply(girlId, instruction, tone, "instruction");

        const aiMsg: Message = { role: "wingman", content: reply || "..." };
        setMessages((prev) => [...prev, aiMsg]);

        const savedMsg = await addMessage({ girlId, role: "wingman", content: reply || "..." });

        setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = savedMsg;
            return updated;
        });

        toast({
            title: t('wingmanTip'),
            description: explanation,
            duration: 6000,
        });

         if (newBadges && newBadges.length > 0) {
          newBadges.forEach((badge: string) => {
              toast({
                  title: "🏆 Achievement Unlocked!",
                  description: `You earned the '${badge}' badge!`,
                  className: "bg-yellow-50 border-yellow-200 text-yellow-800",
                  duration: 5000
              });
          });
      }

    } catch (error: any) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : t('actionError');
        toast({ title: t('errorTitle'), description: errorMessage, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-200px)] w-full bg-background border border-border rounded-2xl overflow-hidden relative shadow-sm">

      <div className="absolute top-2 end-2 z-10 flex gap-2">
          {messages.length > 0 && (
            <ChatHeaderActions girlId={girlId} onClearChat={handleClearChat} />
          )}
      </div>

      <div
        className="flex-1 overflow-y-auto p-4 space-y-6"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Sparkles className="h-10 w-10 text-muted-foreground/50" />
                <p>{t('startPrompt')}</p>
            </div>
        )}
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg._id || idx}
            msg={msg}
            index={idx}
            isPlaying={playingAudioId === idx.toString()}
            isLoading={isLoading}
            onPlayAudio={handlePlayAudio}
            onRegenerate={handleRegenerate}
            onCopy={handleCopy}
            onShare={handleShare}
            onToggleSave={handleToggleSave}
            isSaved={msg._id ? savedMessageIds.has(msg._id) : false}
          />
        ))}
        {isLoading && (
            <div className="flex justify-start w-full animate-pulse" role="status" aria-live="polite">
                <div className="bg-secondary p-4 rounded-2xl rounded-bl-none flex items-center gap-2">
                    <Sparkles className="animate-spin text-primary" size={16} />
                    <span className="text-sm text-muted-foreground font-medium">
                        {t('wingmanThinking')}...
                    </span>
                </div>
            </div>
        )}
      </div>

      {showScrollButton && (
        <Button
          size="icon"
          className="absolute bottom-24 right-4 rounded-full shadow-lg z-20 bg-primary/90 hover:bg-primary animate-in fade-in zoom-in duration-300"
          onClick={scrollToBottom}
          aria-label={t('scrollToBottom')}
        >
          <ArrowDown size={20} />
        </Button>
      )}

      {creditBalance !== undefined && creditBalance < 5 && (
        <Link href="/credits" className="absolute bottom-24 left-1/2 transform -translate-x-1/2 bg-destructive/10 border border-destructive/20 text-destructive px-3 py-1 rounded-full text-xs font-semibold shadow-sm z-10 flex items-center gap-1 hover:bg-destructive/20 transition-colors">
            <AlertCircle size={12} />
            {creditBalance === 0 ? t('noCredits') : `${t('lowCredits')} ${creditBalance}`}
        </Link>
      )}

      <RecommendationsDialog
          girlId={girlId}
          open={isRecommendationsOpen}
          onOpenChange={setIsRecommendationsOpen}
      />

      <ChatInputArea
          inputValue={inputValue}
          setInputValue={setInputValue}
          onSendMessage={handleSendMessage}
          onUploadComplete={handleImageUpload}
          onGenerateArt={handleGenerateArt}
          onGenerateHookup={handleGenerateHookupLine}
          onGetRecommendations={handleGetRecommendations}
          onScenarioSelect={handleScenarioSelect}
          isLoading={isLoading}
          tone={tone}
          setTone={setTone}
          sender={sender}
          setSender={setSender}
       />
    </div>
  );
};
