"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Sparkles, Loader2, Zap, Trash2, Volume2, RotateCw, Copy } from "lucide-react";
import ChatUploader from "./ChatUploader";
import { addMessage } from "@/lib/actions/rag.actions";
import { extractTextFromImage } from "@/lib/actions/ocr.actions";
import { generateWingmanReply, generateHookupLine, generateSpeech } from "@/lib/actions/wingman.actions";
import { generateArt } from "@/lib/actions/image.actions";
import { clearChat as clearChatAction, getGirlById } from "@/lib/actions/girl.actions";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import Feedback from "./Feedback";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Message = {
  _id?: string;
  role: string;
  content: string;
  createdAt?: string;
  feedback?: "up" | "down" | null;
};

export const ChatInterface = ({ girlId, initialMessages }: { girlId: string, initialMessages: Message[] }) => {
  const pathname = usePathname();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [tone, setTone] = useState("Flirty");
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string>("nova"); // Default to nova
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const t = useTranslations('Chat');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Fetch Voice ID on mount
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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setInputValue("");
    setIsLoading(true);

    const newMsg: Message = { role: "user", content: userMsg };
    setMessages((prev) => [...prev, newMsg]);

    try {
      await addMessage({ girlId, role: "user", content: userMsg });

      const { reply, explanation } = await generateWingmanReply(girlId, userMsg, tone);
      
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
      toast({ title: t('errorTitle'), description: t('errorReply'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (index: number) => {
    if (index <= 0) return;
    const userMsg = messages[index - 1];
    if (userMsg.role !== "user" && userMsg.role !== "girl") return;

    setIsLoading(true);
    try {
        const newMsgs = [...messages];
        newMsgs[index] = { ...newMsgs[index], content: "Regenerating..." };
        setMessages(newMsgs);

        const { reply, explanation } = await generateWingmanReply(girlId, userMsg.content, tone);

        const updatedMsgs = [...messages];
        updatedMsgs[index] = { ...updatedMsgs[index], content: reply || "Error" };
        setMessages(updatedMsgs);

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
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
        title: "Copied!",
        description: "Message copied to clipboard.",
        duration: 3000,
    });
  };

  const handlePlayAudio = async (text: string, msgIndex: number) => {
    try {
        setPlayingAudioId(msgIndex.toString());
        // Pass voiceId to generateSpeech
        const audioUrl = await generateSpeech(text, voiceId);

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
  };

  const handleImageUpload = async (url: string) => {
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
  };

  const [isArtDialogOpen, setIsArtDialogOpen] = useState(false);
  const [artPrompt, setArtPrompt] = useState("");

  const handleGenerateArt = async () => {
    if (!artPrompt.trim()) return;

    setIsArtDialogOpen(false);
    setIsLoading(true);
    toast({ title: "Generating Art", description: "This may take a few seconds..." });

    try {
        const { imageUrl, error } = await generateArt(artPrompt, girlId);

        if (imageUrl) {
            const imgMsg: Message = { role: "wingman", content: `[IMAGE]: ${imageUrl}` }; 
            setMessages((prev) => [...prev, imgMsg]);
            await addMessage({ girlId, role: "wingman", content: `[IMAGE]: ${imageUrl}` });
            setArtPrompt("");
        } else {
             toast({ title: "Error", description: error || "Could not generate image.", variant: "destructive" });
        }
    } catch(e) {
        console.error(e);
        toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
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
    if (confirm("Are you sure you want to clear the chat history? This cannot be undone.")) {
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
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-200px)] w-full bg-slate-50 rounded-xl border overflow-hidden relative shadow-inner">

      <div className="absolute top-2 right-2 z-10 flex gap-2">
          {messages.length > 0 && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500 bg-white/50 backdrop-blur-sm shadow-sm"
                        title="Clear Chat"
                        aria-label="Clear chat history"
                    >
                        <Trash2 size={16} />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Clear Chat History?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete all messages with this girl. This action cannot be undone.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearChat} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
            <div className="flex-center h-full text-gray-400">
                {t('startPrompt')}
            </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex w-full group animate-fade-in-up",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
            style={{ animationDelay: `${idx * 0.05}s` }}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl p-4 text-sm whitespace-pre-wrap relative",
                msg.role === "user"
                  ? "bg-purple-600 text-white rounded-br-none"
                  : msg.role === "wingman"
                  ? "bg-white border border-purple-100 text-dark-600 rounded-bl-none shadow-sm"
                  : "bg-gray-200 text-dark-600 rounded-bl-none" // Girl/Screenshot
              )}
            >
              {msg.role === "wingman" && <div className="text-xs font-bold text-purple-500 mb-1 flex items-center gap-1"><Sparkles size={12}/> {t('wingman')}</div>}
              {msg.role === "girl" && <div className="text-xs font-bold text-gray-500 mb-1">{t('sheSaid')}</div>}
              
              {msg.content.startsWith("[IMAGE]:") ? (
                  <Image 
                    src={msg.content.replace("[IMAGE]: ", "")} 
                    alt="Generated" 
                    width={500}
                    height={500}
                    className="rounded-lg max-w-full h-auto" 
                  />
              ) : (
                  <div className="flex flex-col gap-1">
                      <div className="flex items-start gap-2">
                          <span className="flex-1">{msg.content}</span>
                          {msg.role === "wingman" && (
                              <div className="flex flex-col gap-1">
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-purple-400 hover:text-purple-600"
                                    onClick={() => handlePlayAudio(msg.content, idx)}
                                    disabled={playingAudioId !== null}
                                    title="Play Audio"
                                    aria-label="Play audio"
                                >
                                    {playingAudioId === idx.toString() ? <Loader2 size={14} className="animate-spin"/> : <Volume2 size={14} />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-blue-400 hover:text-blue-600"
                                    onClick={() => handleRegenerate(idx)}
                                    disabled={isLoading}
                                    title="Regenerate Response"
                                    aria-label="Regenerate response"
                                >
                                    <RotateCw size={14} className={isLoading ? "animate-spin" : ""} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-400 hover:text-gray-600"
                                    onClick={() => handleCopy(msg.content)}
                                    title="Copy to Clipboard"
                                    aria-label="Copy to clipboard"
                                >
                                    <Copy size={14} />
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

      <div className="bg-white border-t p-4 flex items-end gap-2">
        <ChatUploader onUploadComplete={handleImageUpload} disabled={isLoading} />
        
        <Dialog open={isArtDialogOpen} onOpenChange={setIsArtDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isLoading} title="Generate Art" aria-label="Open art generation">
                    <ImageIcon size={24} className="text-dark-400 hover:text-purple-500"/>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Art</DialogTitle>
                    <DialogDescription>
                        Describe the scene or outfit you want to see her in. The AI will use her persona.
                        <br/><span className="text-xs text-purple-500 font-semibold">Cost: 3 Credits</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Input
                        value={artPrompt}
                        onChange={(e) => setArtPrompt(e.target.value)}
                        placeholder="e.g., Wearing a red dress at a cafe..."
                        onKeyDown={(e) => e.key === "Enter" && handleGenerateArt()}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleGenerateArt} disabled={isLoading || !artPrompt.trim()} className="bg-purple-600">
                        Generate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Button variant="ghost" size="icon" onClick={handleGenerateHookupLine} disabled={isLoading} title={t('hookupButtonTitle')} aria-label="Generate hookup line">
            <Zap size={24} className="text-dark-400 hover:text-yellow-500"/>
        </Button>

        <Select onValueChange={setTone} defaultValue="Flirty">
            <SelectTrigger className="w-[100px] border-none bg-transparent focus:ring-0">
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
             <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder={t('inputPlaceholder')}
                className="flex-1"
                disabled={isLoading}
                aria-label="Message input"
            />
             <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-purple-gradient bg-cover rounded-full size-10 p-0 flex-center shrink-0"
                aria-label="Send message"
            >
                <Send size={18} className="text-white ml-0.5" />
            </Button>
        </div>
      </div>
    </div>
  );
};
