"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Trash2 } from "lucide-react";
import { deleteGirl } from "@/lib/actions/girl.actions";
import { useTransition } from "react";
import { usePathname } from "next/navigation";

export const GirlCard = ({ girl }: { girl: any }) => {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation();
    if (confirm("Are you sure?")) {
      startTransition(async () => {
        await deleteGirl(girl._id);
      });
    }
  };

  return (
    <Link href={`/${locale}/girls/${girl._id}`}>
      <div className="group relative flex flex-col gap-4 rounded-xl border border-purple-200/20 bg-white p-5 shadow-lg shadow-purple-200/10 transition-all hover:shadow-purple-200/20">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="h3-bold text-dark-600">{girl.name}</h3>
                <div className="flex gap-2">
                    <p className="p-14-medium text-dark-400">{girl.relationshipStatus}</p>
                    {girl.dialect && (
                         <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                            {girl.dialect}
                         </span>
                    )}
                </div>
            </div>
            {girl.age && <Badge variant="outline" className="text-purple-500">{girl.age} yo</Badge>}
        </div>
        
        <p className="p-16-medium line-clamp-2 text-dark-400/80 min-h-[3rem]">
            {girl.vibe || "No notes yet."}
        </p>

        <div className="flex justify-between items-center mt-2">
            <Button variant="ghost" size="sm" className="text-purple-500 gap-2 pl-0 hover:bg-transparent hover:text-purple-600">
                <MessageCircle size={18} />
                Chat
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className="text-red-400 hover:bg-red-50 hover:text-red-600 z-10"
                onClick={handleDelete}
                aria-label="Delete profile"
                title="Delete profile"
            >
                <Trash2 size={18} />
            </Button>
        </div>
      </div>
    </Link>
  );
};
