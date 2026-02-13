"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Pin } from "lucide-react";
import { togglePinGirl } from "@/lib/actions/girl.actions";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

interface PinGirlButtonProps {
  girlId: string;
  isPinned: boolean;
  className?: string;
  iconSize?: number;
}

export const PinGirlButton = ({ girlId, isPinned, className, iconSize = 24 }: PinGirlButtonProps) => {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('Dashboard');
  const pathname = usePathname();

  const handlePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    startTransition(async () => {
      await togglePinGirl(girlId, pathname);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={isPending}
      className={cn("hover:bg-purple-50 hover:text-purple-600", isPinned ? "text-purple-600" : "text-gray-400", className)}
      title={isPinned ? t('unpinProfileTitle') : t('pinProfileTitle')}
      aria-label={isPinned ? t('unpinProfileAria') : t('pinProfileAria')}
      onClick={handlePin}
    >
      <Pin size={iconSize} fill={isPinned ? "currentColor" : "none"} />
    </Button>
  );
};
