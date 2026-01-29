"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Sparkles, Loader2, RotateCw, Trash2, ThumbsUp, ThumbsDown } from "lucide-react";
import ChatUploader from "./ChatUploader";
import { addMessage, clearChat, submitFeedback } from "@/lib/actions/rag.actions";
import { extractTextFromImage } from "@/lib/actions/ocr.actions";
import { generateWingmanReply, generateResponseImage } from "@/lib/actions/wingman.actions";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
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
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
      await generateResponse(userMsg);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
      setIsLoading(false);
    }
  };

  const generateResponse = async (contextText: string) => {
      try {
        // 2. Generate Wingman Reply
        const { reply, explanation } = await generateWingmanReply(girlId, contextText);

        const aiMsg: Message = { role: "wingman", content: reply || "..." };
        setMessages((prev) => [...prev, aiMsg]);

        const savedMsg = await addMessage({ girlId, role: "wingman", content: reply || "..." });

        // Update the last message with the real ID for feedback
        setMessages((prev) => prev.map((msg, i) =>
            i === prev.length - 1 ? { ...msg, _id: savedMsg._id } : msg
        ));

        toast({
            title: "Wingman Tip",
            description: explanation,
            duration: 6000,
        });
      } catch (error) {
          console.error(error);
          toast({ title: "Error", description: "Wingman failed to reply.", variant: "destructive" });
      } finally {
          setIsLoading(false);
      }
  }

  const handleRegenerate = async () => {
      // Find last user message
      const lastUserMsg = [...messages].reverse().find(m => m.role === "user" || m.role === "girl"); // User or Girl context
      if (!lastUserMsg) {
          toast({ title: "Error", description: "No context to regenerate from.", variant: "destructive" });
          return;
      }

      setIsLoading(true);
      await generateResponse(lastUserMsg.content);
  };

  const handleClearChat = async () => {
      try {
          await clearChat(girlId);
          setMessages([]);
          toast({ title: "Success", description: "Chat history cleared." });
      } catch (error) {
          toast({ title: "Error", description: "Failed to clear chat.", variant: "destructive" });
      }
  };

  const handleFeedback = async (index: number, type: "up" | "down") => {
      const msg = messages[index];
      if (!msg._id) return; // Can't rate unsaved message

      // Optimistic Update
      const newMessages = [...messages];
      newMessages[index].feedback = type;
      setMessages(newMessages);

      try {
          await submitFeedback(msg._id, type);
          toast({ title: "Thanks!", description: "Feedback submitted." });
      } catch (error) {
          console.error(error);
          // Revert on failure
          newMessages[index].feedback = msg.feedback;
          setMessages([...newMessages]);
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
        await addMessage({ girlId, role: "girl", content: text });

        // 3. Generate Reply
        await generateResponse(text);

    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Failed to process image", variant: "destructive" });
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
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] w-full bg-slate-50 rounded-xl border overflow-hidden relative">

      {/* Top Bar for Actions */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
          {messages.length > 0 && (
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500 bg-white/50 backdrop-blur-sm shadow-sm" title="Clear Chat">
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

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
            <div className="flex-center h-full text-gray-400">
                Start by sending a message or uploading a screenshot!
            </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex w-full group",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn("flex flex-col max-w-[80%]", msg.role === "user" ? "items-end" : "items-start")}>
                <div
                className={cn(
                    "rounded-2xl p-4 text-sm whitespace-pre-wrap relative",
                    msg.role === "user"
                    ? "bg-purple-600 text-white rounded-br-none"
                    : msg.role === "wingman"
                    ? "bg-white border border-purple-100 text-dark-600 rounded-bl-none shadow-sm"
                    : "bg-gray-200 text-dark-600 rounded-bl-none" // Girl/Screenshot
                )}
                >
                {msg.role === "wingman" && <div className="text-xs font-bold text-purple-500 mb-1 flex items-center gap-1"><Sparkles size={12}/> Wingman</div>}
                {msg.role === "girl" && <div className="text-xs font-bold text-gray-500 mb-1">She said</div>}

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

                {/* Wingman Actions (Feedback & Regenerate) */}
                {msg.role === "wingman" && (
                    <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-6 w-6", msg.feedback === "up" ? "text-green-500" : "text-gray-400 hover:text-green-500")}
                            onClick={() => handleFeedback(idx, "up")}
                        >
                            <ThumbsUp size={14} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-6 w-6", msg.feedback === "down" ? "text-red-500" : "text-gray-400 hover:text-red-500")}
                            onClick={() => handleFeedback(idx, "down")}
                        >
                            <ThumbsDown size={14} />
                        </Button>
                        {idx === messages.length - 1 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-purple-500 ml-2"
                                onClick={handleRegenerate}
                                title="Regenerate"
                            >
                                <RotateCw size={14} />
                            </Button>
                        )}
                    </div>
                )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start w-full">
                <div className="bg-white border border-purple-100 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                    <Loader2 className="animate-spin text-purple-500" size={16} />
                    <span className="text-xs text-gray-400">Wingman is thinking...</span>
                </div>
            </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-4 flex items-end gap-2">
        <ChatUploader onUploadComplete={handleImageUpload} disabled={isLoading} />
        
        <Button variant="ghost" size="icon" onClick={handleGenerateImage} disabled={isLoading} title="Generate Image Response">
            <ImageIcon size={24} className="text-dark-400 hover:text-purple-500"/>
        </Button>

        <div className="flex-1 relative">
             <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                placeholder="Type what you want to say..."
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
