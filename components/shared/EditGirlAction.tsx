"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EditGirlForm } from "@/components/forms/EditGirlForm";
import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";

export const EditGirlAction = ({ girl }: { girl: Girl }) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations('Dashboard');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-full border-2 border-purple-200 bg-white text-purple-700 hover:bg-purple-50"
          title={t('editProfileTitle')}
          aria-label={t('editProfileAria')}
        >
          <Pencil className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('editProfileTitle')}</DialogTitle>
          <DialogDescription>
            {t('editProfileDesc', { name: girl.name })}
          </DialogDescription>
        </DialogHeader>
        <EditGirlForm girl={girl} closeDialog={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};
