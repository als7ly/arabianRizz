"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Star } from "lucide-react";
import { usePathname } from "next/navigation";
import { DeleteGirlButton } from "./DeleteGirlButton";
import { PinGirlButton } from "./PinGirlButton";
import { useTranslations } from "next-intl";

export const GirlCard = ({ girl }: { girl: Girl }) => {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const t = useTranslations('Dashboard');

  return (
    <Link href={`/${locale}/girls/${girl._id}`}>
      <div className="group relative flex flex-col gap-4 rounded-xl border border-purple-200/20 bg-white p-5 shadow-lg shadow-purple-200/10 transition-all hover:shadow-purple-200/20">
        <div className="flex justify-between items-start">
            <div>
                <div className="flex justify-between w-full">
                    <h3 className="h3-bold text-dark-600">{girl.name}</h3>
                    {girl.age && <Badge variant="outline" className="text-purple-500">{girl.age} yo</Badge>}
                </div>

                <div className="flex flex-wrap gap-2 mt-1">
                    <p className="p-14-medium text-dark-400">{girl.relationshipStatus}</p>
                    {girl.dialect && (
                         <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                            {girl.dialect}
                         </span>
                    )}
                     {girl.rating && (
                         <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star size={10} fill="currentColor" /> {girl.rating}/10
                         </span>
                    )}
                </div>
                <div className="flex gap-2 mt-1 items-center">
                   <div className="text-xs text-yellow-500 font-bold flex items-center">
                     ⭐ {girl.rating || 5}
                   </div>
                   {girl.socialMediaHandle && (
                     <div className="text-xs text-blue-500 truncate max-w-[100px]">
                       @{girl.socialMediaHandle.replace('@', '')}
                     </div>
                   )}
                </div>
            </div>
        </div>
        
        <p className="p-16-medium line-clamp-2 text-dark-400/80 min-h-[3rem]">
            {girl.vibe || t('noNotes')}
        </p>

        <div className="flex justify-between items-center mt-2">
            <Button
                variant="ghost"
                size="sm"
                className="text-purple-500 gap-2 ps-0 hover:bg-transparent hover:text-purple-600"
                aria-label={t('chatBtn')}
            >
                <MessageCircle size={18} />
                {t('chatBtn')}
            </Button>
            <div className="flex items-center gap-1" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <PinGirlButton
                    girlId={girl._id}
                    isPinned={girl.isPinned || false}
                    iconSize={18}
                />
                <DeleteGirlButton
                    girlId={girl._id}
                    className="text-red-400 hover:bg-red-50 hover:text-red-600 z-10"
                    iconSize={18}
                />
            </div>
        </div>
      </div>
    </Link>
  );
};
