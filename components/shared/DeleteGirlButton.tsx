"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteGirl } from "@/lib/actions/girl.actions";
import { useTranslations } from "next-intl";

export const DeleteGirlButton = ({ girlId }: { girlId: string }) => {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('Index'); // Using generic translations for now, or add specific ones

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this profile? This cannot be undone.")) {
      startTransition(async () => {
        await deleteGirl(girlId);
      });
    }
  };

  return (
    <Button
        variant="ghost"
        size="icon"
        onClick={handleDelete}
        disabled={isPending}
        className="text-red-400 hover:bg-red-50 hover:text-red-600"
        title="Delete Profile"
    >
        <Trash2 size={24} />
    </Button>
  );
};
