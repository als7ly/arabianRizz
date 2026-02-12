"use client";

import { useState } from "react";
import { MoreVertical, Trash2, Download, Search, Loader2 } from "lucide-react";
import { SearchChatDialog } from "./SearchChatDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { getChatHistory } from "@/lib/actions/girl.actions";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";

interface ChatHeaderActionsProps {
  girlId: string;
  onClearChat: () => void;
}

export const ChatHeaderActions = ({ girlId, onClearChat }: ChatHeaderActionsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('Chat');

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const messages = await getChatHistory(girlId);
      if (!messages || messages.length === 0) {
        toast({ title: t('noMessages'), description: t('noMessagesDesc') });
        return;
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `chat_history_${girlId}.json`);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast({ title: t('exportSuccess'), description: t('exportSuccessDesc') });
    } catch (e) {
      console.error(e);
      toast({ title: t('exportError'), description: t('exportErrorDesc'), variant: "destructive" });
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-purple-500 bg-white/50 backdrop-blur-sm shadow-sm"
            aria-label="Chat Actions"
          >
            <MoreVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowSearchDialog(true)} className="cursor-pointer">
            <Search className="me-2 h-4 w-4" />
            <span>{t('searchChat')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              handleExport();
            }}
            disabled={isExporting}
            className="cursor-pointer"
          >
            {isExporting ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : <Download className="me-2 h-4 w-4" />}
            <span>{isExporting ? t('exporting') : t('exportChat')}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowClearDialog(true)}
            className="text-red-600 focus:text-red-600 cursor-pointer"
          >
            <Trash2 className="me-2 h-4 w-4" />
            <span>{t('clearChatTitle')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('clearChatDialogTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('clearChatDialogDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClearChat();
                setShowClearDialog(false);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SearchChatDialog
        girlId={girlId}
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
      />
    </>
  );
};
