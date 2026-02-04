"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Sparkles, Loader2, Zap, Trash2, Volume2, RotateCw, Copy, Camera, Share2, Heart, Coffee, Flame, MessageCircle } from "lucide-react";
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

type Message = {
  _id?: string;
  role: string;
  content: string;
  createdAt?: string;
  feedback?: "up" | "down" | null;
  audioUrl?: string; // Add audioUrl to type
};

export const ChatInterface = ({ girlId, initialMessages }: { girlId: string, initialMessages: Message[] }) => {
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

  const handleShare = async (text: string, isImage: boolean = false) => {
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
  };

  const handlePlayAudio = async (message: Message, idx: number) => {
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
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-red-500 bg-white/50 backdrop-blur-sm shadow-sm"
                        title={t('clearChatTitle')}
                        aria-label={t('clearChatAria')}
                    >
                        <Trash2 size={16} />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>{t('clearChatDialogTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {t('clearChatDialogDesc')}
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
                        onClick={() => handleShare(msg.content.replace("[IMAGE]: ", ""), true)}
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
                          {msg.role === "wingman" && (
                              <div className="flex flex-col gap-1">
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-purple-400 hover:text-purple-600"
                                    onClick={() => handlePlayAudio(msg, idx)}
                                    disabled={playingAudioId !== null}
                                    title={t('playAudioTitle')}
                                    aria-label={t('playAudioAria')}
                                >
                                    {playingAudioId === idx.toString() ? <Loader2 size={14} className="animate-spin"/> : <Volume2 size={14} />}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-blue-400 hover:text-blue-600"
                                    onClick={() => handleRegenerate(idx)}
                                    disabled={isLoading}
                                    title={t('regenerateTitle')}
                                    aria-label={t('regenerateAria')}
                                >
                                    <RotateCw size={14} className={isLoading ? "animate-spin" : ""} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-400 hover:text-gray-600"
                                    onClick={() => handleCopy(msg.content)}
                                    title={t('copyTitle')}
                                    aria-label={t('copyAria')}
                                >
                                    <Copy size={14} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-gray-400 hover:text-green-600"
                                    onClick={() => handleShare(msg.content)}
                                    title={t('shareTitle')}
                                    aria-label={t('shareAria')}
                                >
                                    <Share2 size={14} />
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
             <div className="flex items-center border rounded-lg p-1 bg-gray-50 h-10">
                <Button
                    variant={sender === 'user' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn("h-full text-xs px-3 rounded-md transition-all", sender === 'user' && "bg-white shadow-sm font-semibold")}
                    onClick={() => setSender('user')}
                >
                    Me
                </Button>
                <Button
                    variant={sender === 'girl' ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn("h-full text-xs px-3 rounded-md transition-all", sender === 'girl' && "bg-white shadow-sm text-pink-500 font-semibold")}
                    onClick={() => setSender('girl')}
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
