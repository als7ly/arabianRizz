"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteGirl } from "@/lib/actions/girl.actions";
import { useTranslations } from "next-intl";
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

export const DeleteGirlButton = ({ girlId }: { girlId: string }) => {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('Index'); // Using generic translations for now, or add specific ones

  const handleDelete = () => {
    startTransition(async () => {
      await deleteGirl(girlId);
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={isPending}
          className="text-red-400 hover:bg-red-50 hover:text-red-600"
          title="Delete Profile"
          aria-label="Delete Profile"
        >
          <Trash2 size={24} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Profile?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this profile? This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
