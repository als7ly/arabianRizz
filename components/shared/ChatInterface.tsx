"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Sparkles, Loader2, Copy, RotateCw, Trash2, Check, Volume2, ThumbsUp, ThumbsDown } from "lucide-react";
import ChatUploader from "./ChatUploader";
import { addMessage } from "@/lib/actions/rag.actions";
import { extractTextFromImage } from "@/lib/actions/ocr.actions";
import { generateWingmanReply, generateResponseImage } from "@/lib/actions/wingman.actions";
import { clearChat } from "@/lib/actions/girl.actions";
import { generateSpeech } from "@/lib/actions/audio.actions";
import { submitFeedback } from "@/lib/actions/feedback.actions";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname } from "next/navigation";

type Message = {
  _id?: string;
  role: string;
  content: string;
  createdAt?: string;
  feedback?: 'up' | 'down' | null;
};

export const ChatInterface = ({ girlId, initialMessages }: { girlId: string, initialMessages: Message[] }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tone, setTone] = useState("Flirty");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const pathname = usePathname();

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
      
      const aiMsg: Message = { role: "wingman", content: reply || "..." };
      setMessages((prev) => [...prev, aiMsg]);
      
      const savedMsg = await addMessage({ girlId, role: "wingman", content: reply || "..." });

      setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = savedMsg;
          return updated;
      });

      toast({
        title: "Wingman Tip",
        description: explanation,
        duration: 6000,
      });

    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to get reply", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (url: string) => {
    setIsLoading(true);
    toast({ title: "Reading Screenshot...", description: "Analyzing the conversation." });

    try {
        // 1. OCR
        const text = await extractTextFromImage(url);
        if (!text) {
            toast({ title: "Error", description: "Could not read text from image.", variant: "destructive" });
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

        const savedMsg = await addMessage({ girlId, role: "wingman", content: reply || "..." });

        setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = savedMsg;
            return updated;
        });

        toast({
            title: "Wingman Tip",
            description: explanation,
            duration: 6000,
        });

    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to process image", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || !lastMsg.content) {
         toast({ title: "Error", description: "No context to generate image from.", variant: "destructive" });
         return;
    }

    setIsLoading(true);
    try {
        const imageUrl = await generateResponseImage(lastMsg.content);
        if (imageUrl) {
            const imgMsg: Message = { role: "wingman", content: `[IMAGE]: ${imageUrl}` }; 
            setMessages((prev) => [...prev, imgMsg]);
        } else {
             toast({ title: "Error", description: "Image generation failed.", variant: "destructive" });
        }
    } catch(e) {
        console.error(e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ description: "Copied to clipboard" });
  };

  const handleRegenerate = async () => {
    if (messages.length === 0) return;

    setIsLoading(true);
    try {
       // Find last user/girl message
       let lastContextMsg = "";
       for(let i = messages.length - 1; i >= 0; i--) {
         if (messages[i].role !== 'wingman') {
            lastContextMsg = messages[i].content;
            break;
         }
       }

       if (!lastContextMsg) lastContextMsg = "What should I say?";

       const { reply, explanation } = await generateWingmanReply(girlId, lastContextMsg, tone);

       const aiMsg: Message = { role: "wingman", content: reply || "..." };
       setMessages((prev) => [...prev, aiMsg]);

       const savedMsg = await addMessage({ girlId, role: "wingman", content: reply || "..." });

       setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = savedMsg;
            return updated;
       });

       toast({
         title: "Regenerated Tip",
         description: explanation,
         duration: 6000,
       });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to regenerate", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if(!confirm("Are you sure you want to clear the chat? This cannot be undone.")) return;

    setIsLoading(true);
    try {
        await clearChat(girlId, pathname);
        setMessages([]);
        toast({ description: "Chat cleared." });
    } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Failed to clear chat", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  const handlePlayAudio = async (text: string, idx: number) => {
    if (playingIndex === idx) {
        if (audioRef.current) {
            audioRef.current.pause();
            setPlayingIndex(null);
        }
        return;
    }

    try {
        setPlayingIndex(idx);
        const audioSrc = await generateSpeech(text);

        if (audioSrc) {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            audioRef.current = new Audio(audioSrc);
            audioRef.current.onended = () => setPlayingIndex(null);
            audioRef.current.play();
        } else {
            toast({ description: "Could not generate audio.", variant: "destructive" });
            setPlayingIndex(null);
        }
    } catch (e) {
        console.error(e);
        setPlayingIndex(null);
    }
  };

  const handleFeedback = async (messageId: string, feedback: 'up' | 'down') => {
      try {
          await submitFeedback(messageId, feedback, pathname);
          setMessages((prev) => prev.map(msg =>
              msg._id === messageId ? { ...msg, feedback } : msg
          ));
          toast({ description: "Thanks for the feedback!" });
      } catch (e) {
          console.error(e);
          toast({ title: "Error", description: "Failed to submit feedback", variant: "destructive" });
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-200px)] w-full bg-slate-50 rounded-xl border overflow-hidden shadow-sm">

      {/* Toolbar */}
      <div className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm font-medium text-gray-500">Wingman Tone:</span>
            <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-[130px] h-8 text-xs bg-gray-50 border-gray-200 focus:ring-purple-200">
                    <SelectValue placeholder="Tone" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Flirty">Flirty 🔥</SelectItem>
                    <SelectItem value="Funny">Funny 😂</SelectItem>
                    <SelectItem value="Serious">Serious 🧐</SelectItem>
                    <SelectItem value="Mysterious">Mysterious 🕵️</SelectItem>
                    <SelectItem value="Rizz God">Rizz God 👑</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 sm:w-auto sm:px-3"
            onClick={handleClearChat}
            title="Clear Chat History"
        >
            <Trash2 size={16} />
            <span className="hidden sm:inline ml-2 text-xs">Clear Chat</span>
        </Button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <div className="bg-white p-4 rounded-full shadow-sm mb-2">
                    <Sparkles className="text-purple-400" size={32} />
                </div>
                <p className="font-medium text-gray-500">Your AI Wingman is ready</p>
                <p className="text-sm text-gray-400">Send a message or upload a screenshot</p>
            </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex w-full group animate-in slide-in-from-bottom-2 duration-300",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm whitespace-pre-wrap relative shadow-sm",
                msg.role === "user"
                  ? "bg-purple-600 text-white rounded-br-none"
                  : msg.role === "wingman"
                  ? "bg-white border border-purple-100 text-slate-700 rounded-bl-none"
                  : "bg-white border border-gray-200 text-slate-600 rounded-bl-none font-medium" // Girl/Screenshot
              )}
            >
              {msg.role === "wingman" && (
                  <div className="flex justify-between items-start mb-2 border-b border-gray-50 pb-2">
                     <div className="text-xs font-bold text-purple-600 flex items-center gap-1.5 bg-purple-50 px-2 py-0.5 rounded-full">
                        <Sparkles size={10} fill="currentColor" /> Wingman
                     </div>
                     <div className="flex gap-0.5">
                        {/* Feedback Buttons */}
                        {msg._id && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-6 w-6 text-gray-300 hover:text-green-500 hover:bg-green-50", msg.feedback === 'up' && "text-green-500")}
                                    onClick={() => handleFeedback(msg._id!, 'up')}
                                    title="Good Response"
                                >
                                    <ThumbsUp size={12} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={cn("h-6 w-6 text-gray-300 hover:text-red-500 hover:bg-red-50", msg.feedback === 'down' && "text-red-500")}
                                    onClick={() => handleFeedback(msg._id!, 'down')}
                                    title="Bad Response"
                                >
                                    <ThumbsDown size={12} />
                                </Button>
                                <div className="w-px h-4 bg-gray-200 mx-1 self-center" />
                            </>
                        )}
                        <Button
                           variant="ghost"
                           size="icon"
                           className={cn("h-6 w-6 text-gray-400 hover:text-purple-600 hover:bg-purple-50", playingIndex === idx && "text-purple-600 bg-purple-50 animate-pulse")}
                           onClick={() => handlePlayAudio(msg.content, idx)}
                           title="Read Aloud"
                        >
                           <Volume2 size={12} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-purple-600 hover:bg-purple-50"
                            onClick={() => handleCopy(msg.content, idx)}
                            title="Copy"
                        >
                            {copiedIndex === idx ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                        </Button>
                     </div>
                  </div>
              )}
              {msg.role === "girl" && <div className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1"><ImageIcon size={10}/> Screenshot Text</div>}
              
              {msg.content.startsWith("[IMAGE]:") ? (
                  <div className="rounded-lg overflow-hidden border border-gray-200">
                    <Image
                        src={msg.content.replace("[IMAGE]: ", "")}
                        alt="Generated"
                        width={500}
                        height={500}
                        className="w-full h-auto"
                    />
                  </div>
              ) : (
                  <div className="leading-relaxed">{msg.content}</div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start w-full">
                <div className="bg-white border border-purple-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-3">
                    <Loader2 className="animate-spin text-purple-500" size={18} />
                    <span className="text-sm text-gray-500 font-medium">Wingman is cooking up a reply...</span>
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-3 sm:p-4 flex items-end gap-2 sm:gap-3 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <ChatUploader onUploadComplete={handleImageUpload} disabled={isLoading} />
        
        <Button variant="ghost" size="icon" onClick={handleGenerateImage} disabled={isLoading} title="Generate Image Response" className="text-gray-400 hover:text-purple-600 hover:bg-purple-50">
            <ImageIcon size={22} />
        </Button>

        {messages.length > 0 && messages[messages.length - 1].role === 'wingman' && (
             <Button variant="ghost" size="icon" onClick={handleRegenerate} disabled={isLoading} title="Regenerate Response" className="text-gray-400 hover:text-purple-600 hover:bg-purple-50">
                <RotateCw size={22} />
            </Button>
        )}

        <div className="flex-1 relative">
             <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Type your message..."
                className="pr-4 py-6 bg-gray-50 border-gray-200 focus-visible:ring-purple-200 focus-visible:border-purple-400 text-base"
                disabled={isLoading}
            />
        </div>
        
        <Button 
            onClick={handleSendMessage} 
            disabled={!inputValue.trim() || isLoading}
            className={cn(
                "rounded-full size-12 p-0 flex-center transition-all shadow-md",
                !inputValue.trim() || isLoading ? "bg-gray-200 text-gray-400" : "bg-purple-gradient bg-cover text-white hover:opacity-90 hover:scale-105"
            )}
        >
            <Send size={20} className={cn("ml-0.5", !inputValue.trim() && "opacity-50")} />
        </Button>
      </div>
    </div>
  );
};
