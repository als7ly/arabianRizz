"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Sparkles, Loader2, Zap, Heart, Coffee, Flame, MessageCircle, Camera, AlertCircle } from "lucide-react";
import ChatUploader from "./ChatUploader";
import { addMessage } from "@/lib/actions/rag.actions";
import { extractTextFromImage } from "@/lib/actions/ocr.actions";
import { generateWingmanReply, generateHookupLine, generateSpeech } from "@/lib/actions/wingman.actions";
import { generateArt } from "@/lib/actions/image.actions";
import { toggleSaveMessage, getSavedMessages } from "@/lib/actions/saved-message.actions";
import { clearChat as clearChatAction, getGirlById } from "@/lib/actions/girl.actions";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MessageBubble, { Message } from "./MessageBubble";
import { ChatHeaderActions } from "./ChatHeaderActions";
import { Link } from "@/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const ChatInterface = ({ girlId, initialMessages, creditBalance }: { girlId: string, initialMessages: Message[], creditBalance?: number }) => {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [sender, setSender] = useState<'user' | 'girl'>('user');
  const [tone, setTone] = useState("Flirty");
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string>("nova");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const t = useTranslations('Chat');

  // Bolt Optimization: Use ref to track messages for stable callbacks
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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

  useEffect(() => {
    const fetchSaved = async () => {
        try {
            const saved = await getSavedMessages();
            const ids = new Set(saved.map((s: any) => s.message?._id).filter(Boolean));
            setSavedMessageIds(ids);
        } catch (e) {
            console.error("Failed to fetch saved messages", e);
        }
    };
    fetchSaved();
  }, []);

  const handleToggleSave = async (msg: Message) => {
    if (!msg._id) return;
    const isSaved = savedMessageIds.has(msg._id);

    // Optimistic Update
    const newSet = new Set(savedMessageIds);
    if (isSaved) newSet.delete(msg._id);
    else newSet.add(msg._id);
    setSavedMessageIds(newSet);

    try {
        const result = await toggleSaveMessage(msg._id, pathname);
        if (result.isSaved) {
             toast({ title: "Saved", description: "Message saved to bookmarks." });
        } else {
             toast({ title: "Removed", description: "Message removed from bookmarks." });
        }
    } catch (e) {
        // Revert
        setSavedMessageIds(prev => {
             const reverted = new Set(prev);
             if (isSaved) reverted.add(msg._id!);
             else reverted.delete(msg._id!);
             return reverted;
        });
        toast({ title: "Error", description: "Failed to save message.", variant: "destructive" });
    }
  };

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

    } catch (error) {
      console.error(error);
      toast({ title: t('errorTitle'), description: t('errorReply'), variant: "destructive" });
    } finally {
      setIsLoading(false);
      setSender('user'); // Reset to user default
    }
  };

  // Bolt Optimization: Stabilized callback using messagesRef and functional state updates
  // This allows React.memo on MessageBubble to work correctly by keeping the onRegenerate prop stable
  const handleRegenerate = useCallback(async (index: number) => {
    if (index <= 0) return;

    // Use ref to get current messages without adding to dependency array
    const currentMessages = messagesRef.current;
    const userMsg = currentMessages[index - 1];
    if (userMsg.role !== "user" && userMsg.role !== "girl") return;

    setIsLoading(true);
    try {
        setMessages(prev => {
            const newMsgs = [...prev];
            newMsgs[index] = { ...newMsgs[index], content: "Regenerating..." };
            return newMsgs;
        });

        const { reply, explanation } = await generateWingmanReply(girlId, userMsg.content, tone);

        setMessages(prev => {
            const updatedMsgs = [...prev];
            updatedMsgs[index] = { ...updatedMsgs[index], content: reply || "Error" };
            return updatedMsgs;
        });

        toast({
            title: "Regenerated Tip",
            description: explanation,
            duration: 6000,
        });

    } catch (e) {
        console.error(e);
        toast({ title: t('errorTitle'), description: "Failed to regenerate.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [girlId, tone, t, toast]); // Dependency on 'messages' removed!

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "Copied!",
        description: "Message copied to clipboard.",
        duration: 3000,
    });
  }, [toast]);

  const handleShare = useCallback(async (text: string, isImage: boolean = false) => {
      const shareData = {
          title: 'ArabianRizz',
          text: isImage ? 'Check out this generated image!' : text,
          url: isImage ? text : undefined
      };

      if (navigator.share) {
          try {
              await navigator.share(shareData);
          } catch (err) {
              console.error(err);
          }
      } else {
          // Fallback: Copy to clipboard
          handleCopy(text);
          toast({ title: "Copied Link", description: "Sharing not supported, link copied." });
      }
  }, [handleCopy, toast]);

  const handlePlayAudio = useCallback(async (message: Message, idx: number) => {
    try {
        setPlayingAudioId(idx.toString());
        let audioUrl = message.audioUrl;

        // If no persistent URL, generate and upload (which returns a URL)
        if (!audioUrl) {
            audioUrl = await generateSpeech(message.content, voiceId, message._id);

            // Update local state with new URL to avoid re-generating next time
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
             toast({ title: t('errorTitle'), description: "Could not generate audio.", variant: "destructive" });
             setPlayingAudioId(null);
        }
    } catch (e) {
        console.error(e);
        toast({ title: t('errorTitle'), description: "Audio playback failed.", variant: "destructive" });
        setPlayingAudioId(null);
    }
  }, [voiceId, t, toast]);

  // Bolt Optimization: Stabilized callback
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

    } catch (error) {
        console.error(error);
        toast({ title: t('errorTitle'), description: t('errorProcessImage'), variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  }, [girlId, tone, t, toast]);

  const [isArtDialogOpen, setIsArtDialogOpen] = useState(false);
  const [artPrompt, setArtPrompt] = useState("");
  const [artMode, setArtMode] = useState<'standard' | 'selfie'>('standard');

  const handleGenerateArt = async () => {
    if (!artPrompt.trim()) return;

    setIsArtDialogOpen(false);
    setIsLoading(true);
    toast({ title: "Generating Art", description: "This may take a few seconds..." });

    try {
        const { imageUrl, error } = await generateArt(artPrompt, girlId, artMode);

        if (imageUrl) {
            const imgMsg: Message = { role: "wingman", content: `[IMAGE]: ${imageUrl}` }; 
            setMessages((prev) => [...prev, imgMsg]);
            await addMessage({ girlId, role: "wingman", content: `[IMAGE]: ${imageUrl}` });
            setArtPrompt("");
        } else {
             toast({ title: "Error", description: error || "Could not generate image.", variant: "destructive" });
        }
    } catch(e: any) {
        console.error(e);
        toast({ title: "Error", description: e.message || "Something went wrong.", variant: "destructive" });
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
    } catch (e) {
        console.error(e);
        toast({ title: t('errorTitle'), description: t('errorHookup'), variant: "destructive" });
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
            title: "Chat Cleared",
            description: "All messages have been deleted.",
        });
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to clear chat.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    setIsLoading(true);
    let instruction = "";

    switch (action) {
        case "date":
            instruction = "Suggest a creative and fun date idea based on our conversation.";
            break;
        case "roast":
            instruction = "Give me a playful, flirty roast to tease her.";
            break;
        case "comfort":
            instruction = "She seems upset. Suggest a comforting and supportive message.";
            break;
        case "topic":
            instruction = "Change the subject to something interesting and engaging.";
            break;
        default:
            instruction = "What should I say next?";
    }

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

    } catch (error) {
        console.error(error);
        toast({ title: t('errorTitle'), description: "Failed to generate action.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-200px)] w-full bg-slate-50 rounded-xl border overflow-hidden relative shadow-inner">

      <div className="absolute top-2 right-2 z-10 flex gap-2">
          {messages.length > 0 && (
            <ChatHeaderActions girlId={girlId} onClearChat={handleClearChat} />
          )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
            <div className="flex-center h-full text-gray-400">
                {t('startPrompt')}
            </div>
        )}
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg._id || idx}
            msg={msg}
            index={idx}
            playingAudioId={playingAudioId}
            isLoading={isLoading}
            onPlayAudio={handlePlayAudio}
            onRegenerate={handleRegenerate}
            onCopy={handleCopy}
            onShare={handleShare}
          />
        ))}
        {isLoading && (
            <div className="flex justify-start w-full animate-pulse" role="status" aria-live="polite">
                <div className="bg-white border border-purple-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                    <Sparkles className="animate-spin text-purple-500" size={16} />
                    <span className="text-xs text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 font-semibold">
                        {t('wingmanThinking')}...
                    </span>
                </div>
            </div>
        )}
      </div>

      {creditBalance !== undefined && creditBalance < 5 && (
        <Link href="/credits" className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-red-100 border border-red-200 text-red-600 px-3 py-1 rounded-full text-xs font-semibold shadow-sm z-10 flex items-center gap-1 hover:bg-red-200 transition-colors">
            <AlertCircle size={12} />
            {creditBalance === 0 ? "No Credits Left" : `Low Credits: ${creditBalance}`}
        </Link>
      )}

      <div className="bg-white border-t p-4 flex items-end gap-2">
        <ChatUploader onUploadComplete={handleImageUpload} disabled={isLoading} />
        
        <Dialog open={isArtDialogOpen} onOpenChange={setIsArtDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isLoading} title={t('generateArtTitle')} aria-label={t('generateArtAria')}>
                    <ImageIcon size={24} className="text-dark-400 hover:text-purple-500"/>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generate Art</DialogTitle>
                    <DialogDescription>
                        Create an image of her. <span className="text-purple-600 font-semibold">Cost: 3 Credits</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Style</Label>
                        <RadioGroup defaultValue="standard" onValueChange={(val) => setArtMode(val as 'standard' | 'selfie')} className="flex gap-4">
                            <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 flex-1">
                                <RadioGroupItem value="standard" id="mode-standard" />
                                <Label htmlFor="mode-standard" className="cursor-pointer">Standard Art</Label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 flex-1">
                                <RadioGroupItem value="selfie" id="mode-selfie" />
                                <Label htmlFor="mode-selfie" className="cursor-pointer flex items-center gap-1">
                                    <Camera size={14} /> Selfie Mode
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                        <Label>Prompt</Label>
                        <Input
                            value={artPrompt}
                            onChange={(e) => setArtPrompt(e.target.value)}
                            placeholder={artMode === 'selfie' ? "e.g., At the gym, smiling..." : "e.g., Wearing a red dress at a cafe..."}
                            onKeyDown={(e) => e.key === "Enter" && handleGenerateArt()}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleGenerateArt} disabled={isLoading || !artPrompt.trim()} className="bg-purple-600 w-full">
                        Generate Image
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Button variant="ghost" size="icon" onClick={handleGenerateHookupLine} disabled={isLoading} title={t('hookupButtonTitle')} aria-label="Generate hookup line">
            <Zap size={24} className="text-dark-400 hover:text-yellow-500"/>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={isLoading} title={t('QuickActions.title')} aria-label={t('QuickActions.title')}>
                <Sparkles size={24} className="text-dark-400 hover:text-purple-500"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{t('QuickActions.title')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleQuickAction('date')} className="cursor-pointer">
                <Coffee className="mr-2 h-4 w-4 text-orange-500" />
                <span>{t('QuickActions.date')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickAction('roast')} className="cursor-pointer">
                <Flame className="mr-2 h-4 w-4 text-red-500" />
                <span>{t('QuickActions.roast')}</span>
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => handleQuickAction('comfort')} className="cursor-pointer">
                <Heart className="mr-2 h-4 w-4 text-pink-500" />
                <span>{t('QuickActions.comfort')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleQuickAction('topic')} className="cursor-pointer">
                <MessageCircle className="mr-2 h-4 w-4 text-blue-500" />
                <span>{t('QuickActions.topic')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Select onValueChange={setTone} defaultValue="Flirty">
            <SelectTrigger className="w-[100px] border-none bg-transparent focus:ring-0" aria-label="Select tone">
                <SelectValue placeholder="Tone" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Flirty">Flirty</SelectItem>
                <SelectItem value="Funny">Funny</SelectItem>
                <SelectItem value="Serious">Serious</SelectItem>
                <SelectItem value="Mysterious">Mysterious</SelectItem>
            </SelectContent>
        </Select>

        <div className="flex-1 flex gap-2 w-full md:w-auto">
             <div className="flex items-center border rounded-lg p-1 bg-gray-50 h-10" role="group" aria-label="Message sender">
                <Button
                    variant={sender === 'user' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn("h-full text-xs px-3 rounded-md transition-all", sender === 'user' && "bg-white shadow-sm font-semibold")}
                    onClick={() => setSender('user')}
                    aria-pressed={sender === 'user'}
                    aria-label="Set sender to Me"
                >
                    Me
                </Button>
                <Button
                    variant={sender === 'girl' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn("h-full text-xs px-3 rounded-md transition-all", sender === 'girl' && "bg-white shadow-sm text-pink-500 font-semibold")}
                    onClick={() => setSender('girl')}
                    aria-pressed={sender === 'girl'}
                    aria-label="Set sender to Her"
                >
                    Her
                </Button>
            </div>
             <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder={sender === 'girl' ? t('inputPlaceholderGirl') : t('inputPlaceholder')}
                className="flex-1"
                disabled={isLoading}
                aria-label={t('inputAria')}
            />
             <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-purple-gradient bg-cover rounded-full size-10 p-0 flex-center shrink-0"
                aria-label={t('sendAria')}
            >
                {isLoading ? <Loader2 size={18} className="text-white animate-spin" /> : <Send size={18} className="text-white ml-0.5" />}
            </Button>
        </div>
      </div>
    </div>
  );
};
