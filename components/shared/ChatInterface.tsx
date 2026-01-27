"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Sparkles, Loader2, Zap } from "lucide-react";
import ChatUploader from "./ChatUploader";
import { addMessage } from "@/lib/actions/rag.actions";
import { extractTextFromImage } from "@/lib/actions/ocr.actions";
import { generateWingmanReply, generateResponseImage, generateHookupLine } from "@/lib/actions/wingman.actions";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

type Message = {
  _id?: string;
  role: string;
  content: string;
  createdAt?: string;
};

export const ChatInterface = ({ girlId, initialMessages }: { girlId: string, initialMessages: Message[] }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
      const { reply, explanation } = await generateWingmanReply(girlId, userMsg);
      
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
        const { reply, explanation } = await generateWingmanReply(girlId, text);
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
                  msg.content
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start w-full">
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
        
        <Button variant="ghost" size="icon" onClick={handleGenerateImage} disabled={isLoading} title={t('imageButtonTitle')}>
            <ImageIcon size={24} className="text-dark-400 hover:text-purple-500"/>
        </Button>

        <Button variant="ghost" size="icon" onClick={handleGenerateHookupLine} disabled={isLoading} title={t('hookupButtonTitle')}>
            <Zap size={24} className="text-dark-400 hover:text-yellow-500"/>
        </Button>

        <div className="flex-1 relative">
             <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder={t('inputPlaceholder')}
                className="pr-10"
                disabled={isLoading}
            />
        </div>
        
        <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isLoading}
            className="bg-purple-gradient bg-cover rounded-full size-10 p-0 flex-center"
        >
            <Send size={18} className="text-white ml-0.5" />
        </Button>
      </div>
    </div>
  );
};
