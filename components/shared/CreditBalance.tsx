"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getUserById } from "@/lib/actions/user.actions";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

const CreditBalance = () => {
  const { userId } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const fetchCredits = async () => {
      if (userId) {
        try {
          const user = await getUserById(userId);
          setCredits(user.creditBalance);
        } catch (error) {
          console.error("Failed to fetch credits", error);
        }
      }
    };
    fetchCredits();
  }, [userId]);

  if (credits === null) return null;

  return (
    <div className="flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 border border-purple-200">
      <Image
        src="/assets/icons/coins.svg"
        alt="credits"
        width={20}
        height={20}
        className="h-5 w-5"
      />
      <span className="font-semibold text-purple-900">{credits} Credits</span>
      {credits < 3 && (
        <Badge variant="destructive" className="ml-1 text-xs">Low</Badge>
      )}
    </div>
  );
};

export default CreditBalance;
