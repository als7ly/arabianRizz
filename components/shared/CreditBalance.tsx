"use client";

import { getUserById } from "@/lib/actions/user.actions";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const CreditBalance = ({ userId }: { userId: string }) => {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
        try {
            const user = await getUserById(userId);
            setBalance(user.creditBalance);
        } catch (error) {
            console.error("Failed to fetch balance", error);
        }
    }

    fetchBalance();

    // Optional: Poll every 30 seconds to keep updated
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  if (balance === null) return (
      <div className="h-8 w-24 bg-gray-200 animate-pulse rounded-full"></div>
  );

  const isLowBalance = balance < 3;

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="secondary"
        className={cn(
            "text-lg px-4 py-1 border",
            isLowBalance
                ? "bg-red-100 text-red-700 border-red-200"
                : "bg-purple-100 text-purple-700 border-purple-200"
        )}
      >
        {balance} Credits
      </Badge>
      <Link href="/credits" className="bg-purple-600 text-white p-1 rounded-full hover:bg-purple-700 transition-colors" title="Buy Credits">
        <Plus size={16} />
      </Link>
    </div>
  );
};

export default CreditBalance;
