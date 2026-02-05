"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteGirl } from "@/lib/actions/girl.actions";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
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

interface DeleteGirlButtonProps {
  girlId: string;
  className?: string;
  iconSize?: number;
}

export const DeleteGirlButton = ({ girlId, className, iconSize = 24 }: DeleteGirlButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('Dashboard');

  const handleDelete = () => {
    startTransition(async () => {
      await deleteGirl(girlId);
    });
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    // Prevent navigation if used inside a Link.
    // e.preventDefault() is NOT used because it prevents the AlertDialog from opening.
    e.stopPropagation();
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          className={cn("text-red-400 hover:bg-red-50 hover:text-red-600", className)}
          title={t('deleteProfileTitle')}
          aria-label={t('deleteProfileAria')}
          onClick={handleTriggerClick}
        >
          <Trash2 size={iconSize} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteDialogTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteDialogDesc')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('deleteDialogCancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
            {t('deleteDialogConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
