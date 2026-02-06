"use client";

import { useState } from "react";
import { MoreVertical, Trash2, Download } from "lucide-react";
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

interface ChatHeaderActionsProps {
  girlId: string;
  onClearChat: () => void;
}

export const ChatHeaderActions = ({ girlId, onClearChat }: ChatHeaderActionsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const messages = await getChatHistory(girlId);
      if (!messages || messages.length === 0) {
        toast({ title: "No Messages", description: "There is nothing to export." });
        return;
      }

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `chat_history_${girlId}.json`);
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast({ title: "Success", description: "Chat history exported." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to export chat.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
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
          <DropdownMenuItem onClick={handleExport} disabled={isExporting} className="cursor-pointer">
            <Download className="mr-2 h-4 w-4" />
            <span>{isExporting ? "Exporting..." : "Export Chat"}</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowClearDialog(true)}
            className="text-red-600 focus:text-red-600 cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Clear Chat</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all messages with this persona. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClearChat();
                setShowClearDialog(false);
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
