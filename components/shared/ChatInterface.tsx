"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Sparkles, Loader2, Zap, Trash2, Volume2, RotateCw, Copy } from "lucide-react";
import ChatUploader from "./ChatUploader";
import { addMessage } from "@/lib/actions/rag.actions";
import { extractTextFromImage } from "@/lib/actions/ocr.actions";
import { generateWingmanReply, generateResponseImage, generateHookupLine, clearChat, generateSpeech } from "@/lib/actions/wingman.actions";
import { clearChat as clearChatAction } from "@/lib/actions/girl.actions";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import Feedback from "./Feedback";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Message = {
  _id?: string;
  role: string;
  content: string;
  createdAt?: string;
};

export const ChatInterface = ({ girlId, initialMessages }: { girlId: string, initialMessages: Message[] }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [tone, setTone] = useState("Flirty");
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const t = useTranslations('Chat');

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setInputValue("");
    setIsLoading(true);

    // 1. Add User Message
    const newMsg: Message = { role: "user", content: userMsg };
    setMessages((prev) => [...prev, newMsg]);

    try {
      await addMessage({ girlId, role: "user", content: userMsg });

      // 2. Generate Wingman Reply
      const { reply, explanation } = await generateWingmanReply(girlId, userMsg, tone);
      
      const aiMsg: Message = { role: "wingman", content: reply || "..." }; // Ensure string
      setMessages((prev) => [...prev, aiMsg]);
      
      await addMessage({ girlId, role: "wingman", content: reply || "..." });

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
    // Ensure there is a preceding user message
    if (index <= 0) return;
    const userMsg = messages[index - 1];
    if (userMsg.role !== "user" && userMsg.role !== "girl") return; // Only regenerate if responding to user/girl

    setIsLoading(true);
    try {
        // Optimistically show loading
        const newMsgs = [...messages];
        newMsgs[index] = { ...newMsgs[index], content: "Regenerating..." };
        setMessages(newMsgs);

        const { reply, explanation } = await generateWingmanReply(girlId, userMsg.content, tone);

        const updatedMsgs = [...messages];
        updatedMsgs[index] = { ...updatedMsgs[index], content: reply || "Error" };
        setMessages(updatedMsgs);

        // Don't add to DB again, or update existing?
        // For simplicity, we just show the new one.
        // Ideally we might update the DB record if we had the ID.

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
        const audioUrl = await generateSpeech(text);

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
        // 1. OCR
        const text = await extractTextFromImage(url);
        if (!text) {
            toast({ title: t('errorTitle'), description: t('noTextInImage'), variant: "destructive" });
            setIsLoading(false);
            return;
        }

        // 2. Add Girl Message (Context)
        const newMsg: Message = { role: "girl", content: `(Screenshot): ${text}` };
        setMessages((prev) => [...prev, newMsg]);
        await addMessage({ girlId, role: "girl", content: text }); // Store raw text for better embedding

        // 3. Generate Reply
        const { reply, explanation } = await generateWingmanReply(girlId, text, tone);
        const aiMsg: Message = { role: "wingman", content: reply || "..." };
        setMessages((prev) => [...prev, aiMsg]);
        await addMessage({ girlId, role: "wingman", content: reply || "..." });

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

  const handleGenerateImage = async () => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || !lastMsg.content) {
         toast({ title: t('errorTitle'), description: t('errorContext'), variant: "destructive" });
         return;
    }

    setIsLoading(true);
    try {
        const imageUrl = await generateResponseImage(lastMsg.content);
        if (imageUrl) {
            const imgMsg: Message = { role: "wingman", content: `[IMAGE]: ${imageUrl}` }; 
            setMessages((prev) => [...prev, imgMsg]);
        } else {
             toast({ title: t('errorTitle'), description: t('errorImage'), variant: "destructive" });
        }
    } catch(e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  }

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
            await clearChatAction(girlId);
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
    <div className="flex flex-col h-[calc(100vh-200px)] w-full bg-slate-50 rounded-xl border overflow-hidden">
      {/* Messages Area */}
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
              "flex w-full",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl p-4 text-sm whitespace-pre-wrap",
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
                                >
                                    <RotateCw size={14} className={isLoading ? "animate-spin" : ""} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-400 hover:text-gray-600"
                                    onClick={() => handleCopy(msg.content)}
                                    title="Copy to Clipboard"
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
            <div className="flex justify-start w-full" role="status" aria-live="polite">
                <div className="bg-white border border-purple-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="animate-spin text-purple-500" size={16} />
                    <span className="text-xs text-gray-400">{t('wingmanThinking')}</span>
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-4 flex items-end gap-2">
        <ChatUploader onUploadComplete={handleImageUpload} disabled={isLoading} />
        
        <Button
            variant="ghost"
            size="icon"
            onClick={handleGenerateImage}
            disabled={isLoading}
            title="Generate Image Response"
            aria-label="Generate Image Response"
        >
            <ImageIcon size={24} className="text-dark-400 hover:text-purple-500"/>
        </Button>

        <Button variant="ghost" size="icon" onClick={handleGenerateHookupLine} disabled={isLoading} title={t('hookupButtonTitle')}>
            <Zap size={24} className="text-dark-400 hover:text-yellow-500"/>
        </Button>

        <Button variant="ghost" size="icon" onClick={handleClearChat} disabled={isLoading} title="Clear Chat">
            <Trash2 size={24} className="text-dark-400 hover:text-red-500"/>
        </Button>

        <Select value={tone} onValueChange={setTone}>
            <SelectTrigger className="w-[100px] h-10 border-0 focus:ring-0 px-2 text-xs font-medium text-gray-500 bg-gray-50 rounded-lg">
                <SelectValue placeholder="Tone" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="Flirty">Flirty</SelectItem>
                <SelectItem value="Funny">Funny</SelectItem>
                <SelectItem value="Serious">Serious</SelectItem>
                <SelectItem value="Mysterious">Mysterious</SelectItem>
            </SelectContent>
        </Select>

        <div className="flex-1 relative">
             <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder={t('inputPlaceholder')}
                className="pr-10"
                disabled={isLoading}
                aria-label="Message input"
            />
        </div>
        
        <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isLoading}
            className="bg-purple-gradient bg-cover rounded-full size-10 p-0 flex-center"
            aria-label="Send message"
        >
            <Send size={18} className="text-white ml-0.5" />
        </Button>
      </div>
    </div>
  );
};
