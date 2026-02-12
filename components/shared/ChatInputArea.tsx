"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Image as ImageIcon, Sparkles, Loader2, Zap, Camera, Gift } from "lucide-react";
import ChatUploader from "./ChatUploader";
import { useTranslations } from "next-intl";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
import { SCENARIO_CATEGORIES } from "@/constants/scenarios";

interface ChatInputAreaProps {
    inputValue: string;
    setInputValue: (val: string) => void;
    onSendMessage: () => void;
    onUploadComplete: (url: string) => void;
    onGenerateArt: (prompt: string, mode: 'standard' | 'selfie') => void;
    onGenerateHookup: () => void;
    onGetRecommendations: () => void;
    onScenarioSelect: (instruction: string) => void;
    isLoading: boolean;
    tone: string;
    setTone: (tone: string) => void;
    sender: 'user' | 'girl';
    setSender: (sender: 'user' | 'girl') => void;
}

export const ChatInputArea = ({
    inputValue,
    setInputValue,
    onSendMessage,
    onUploadComplete,
    onGenerateArt,
    onGenerateHookup,
    onGetRecommendations,
    onScenarioSelect,
    isLoading,
    tone,
    setTone,
    sender,
    setSender
}: ChatInputAreaProps) => {
    const t = useTranslations('Chat');
    const [isArtDialogOpen, setIsArtDialogOpen] = useState(false);
    const [artPrompt, setArtPrompt] = useState("");
    const [artMode, setArtMode] = useState<'standard' | 'selfie'>('standard');

    const handleSend = () => {
        if (!inputValue.trim()) return;
        onSendMessage();
    };

    const handleArtSubmit = () => {
        if (!artPrompt.trim()) return;
        onGenerateArt(artPrompt, artMode);
        setIsArtDialogOpen(false);
        setArtPrompt("");
    };

    return (
        <div className="bg-background border-t border-border p-4 flex items-end gap-2">
            <ChatUploader onUploadComplete={onUploadComplete} disabled={isLoading} />

            <Dialog open={isArtDialogOpen} onOpenChange={setIsArtDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isLoading} title={t('generateArtTitle')} aria-label={t('generateArtAria')}>
                        <ImageIcon size={24} className="text-muted-foreground hover:text-purple-500"/>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{t('generateArtTitle')}</DialogTitle>
                        <DialogDescription>
                            {t('generateArtDialogDesc')} <span className="text-purple-600 font-semibold">{t('cost', { amount: 3 })}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>{t('style')}</Label>
                            <RadioGroup defaultValue="standard" onValueChange={(val) => setArtMode(val as 'standard' | 'selfie')} className="flex gap-4">
                                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 flex-1">
                                    <RadioGroupItem value="standard" id="mode-standard" />
                                    <Label htmlFor="mode-standard" className="cursor-pointer">{t('standardArt')}</Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50 flex-1">
                                    <RadioGroupItem value="selfie" id="mode-selfie" />
                                    <Label htmlFor="mode-selfie" className="cursor-pointer flex items-center gap-1">
                                        <Camera size={14} /> {t('selfieMode')}
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="art-prompt">{t('prompt')}</Label>
                            <Input
                                id="art-prompt"
                                value={artPrompt}
                                onChange={(e) => setArtPrompt(e.target.value)}
                                placeholder={artMode === 'selfie' ? t('placeholderSelfie') : t('placeholderStandard')}
                                onKeyDown={(e) => e.key === "Enter" && handleArtSubmit()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleArtSubmit} disabled={isLoading || !artPrompt.trim()} className="bg-purple-600 w-full">
                            {t('generateImageBtn')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Button variant="ghost" size="icon" onClick={onGenerateHookup} disabled={isLoading} title={t('hookupButtonTitle')} aria-label={t('hookupAria')}>
                <Zap size={24} className="text-muted-foreground hover:text-yellow-500"/>
            </Button>

            <Button variant="ghost" size="icon" onClick={onGetRecommendations} disabled={isLoading} title={t('giftDateIdeas')} aria-label={t('giftDateIdeas')}>
                <Gift size={24} className="text-muted-foreground hover:text-pink-500"/>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isLoading} title={t('scenarioMode')} aria-label={t('scenarioMode')}>
                    <Sparkles size={24} className="text-muted-foreground hover:text-purple-500"/>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-[400px] overflow-y-auto">
                <DropdownMenuLabel>{t('scenarioMode')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SCENARIO_CATEGORIES.map((category) => (
                    <div key={category.id}>
                        <DropdownMenuLabel className="text-xs text-gray-400 font-normal uppercase mt-2 px-2">{t(`Scenarios.${category.id}`)}</DropdownMenuLabel>
                        {category.scenarios.map((scenario) => (
                            <DropdownMenuItem
                                key={scenario.id}
                                onClick={() => onScenarioSelect(scenario.instruction)}
                                className="cursor-pointer flex items-center gap-2 py-2"
                            >
                                <scenario.icon size={16} className={scenario.color || "text-gray-500"} />
                                <span>{t(`Scenarios.${scenario.id}`)}</span>
                            </DropdownMenuItem>
                        ))}
                    </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Select onValueChange={setTone} defaultValue="Flirty" value={tone}>
                <SelectTrigger className="w-[100px] border-none bg-transparent focus:ring-0" aria-label={t('toneAria')} title={t('toneAria')}>
                    <SelectValue placeholder={t('tone')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Flirty">{t('toneFlirty')}</SelectItem>
                    <SelectItem value="Funny">{t('toneFunny')}</SelectItem>
                    <SelectItem value="Serious">{t('toneSerious')}</SelectItem>
                    <SelectItem value="Mysterious">{t('toneMysterious')}</SelectItem>
                </SelectContent>
            </Select>

            <div className="flex-1 flex gap-2 w-full md:w-auto">
                 <div className="flex items-center border rounded-lg p-1 bg-gray-50 h-10" role="group" aria-label={t('senderAria')}>
                    <Button
                        variant={sender === 'user' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn("h-full text-xs px-3 rounded-md transition-all", sender === 'user' && "bg-white shadow-sm font-semibold")}
                        onClick={() => setSender('user')}
                        aria-pressed={sender === 'user'}
                        aria-label={t('senderMeAria')}
                    >
                        {t('me')}
                    </Button>
                    <Button
                        variant={sender === 'girl' ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn("h-full text-xs px-3 rounded-md transition-all", sender === 'girl' && "bg-white shadow-sm text-pink-500 font-semibold")}
                        onClick={() => setSender('girl')}
                        aria-pressed={sender === 'girl'}
                        aria-label={t('senderHerAria')}
                    >
                        {t('her')}
                    </Button>
                </div>
                 <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder={sender === 'girl' ? t('inputPlaceholderGirl') : t('inputPlaceholder')}
                    className="flex-1"
                    disabled={isLoading}
                    aria-label={t('inputAria')}
                />
                 <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-purple-gradient bg-cover rounded-full size-10 p-0 flex-center shrink-0"
                    aria-label={t('sendAria')}
                >
                    {isLoading ? <Loader2 size={18} className="text-white animate-spin" /> : <Send size={18} className="text-white ms-0.5" />}
                </Button>
            </div>
        </div>
    );
};
