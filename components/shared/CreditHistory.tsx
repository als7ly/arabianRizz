"use client";

import { useState } from "react";
import BillingHistory from "./BillingHistory";
import UsageHistory from "./UsageHistory";
import { cn } from "@/lib/utils";

interface CreditHistoryProps {
  transactions: any[];
  initialUsageLogs: {
    data: any[];
    currentPage: number;
    totalPages: number;
  };
  userId: string;
}

const CreditHistory = ({ transactions, initialUsageLogs, userId }: CreditHistoryProps) => {
  const [activeTab, setActiveTab] = useState<"transactions" | "usage">("transactions");

  return (
    <div className="w-full bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="flex border-b border-border bg-muted/20">
        <button
          onClick={() => setActiveTab("transactions")}
          className={cn(
            "flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 border-b-2",
            activeTab === "transactions"
              ? "border-primary text-primary bg-background"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Transaction History
        </button>
        <button
          onClick={() => setActiveTab("usage")}
          className={cn(
            "flex-1 px-6 py-4 text-sm font-semibold transition-all duration-200 border-b-2",
            activeTab === "usage"
              ? "border-primary text-primary bg-background"
              : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Credit Usage
        </button>
      </div>

      <div className="p-0">
        {activeTab === "transactions" ? (
          <div className="p-4 md:p-6">
            <BillingHistory transactions={transactions} />
          </div>
        ) : (
          <div className="p-4 md:p-6">
             <UsageHistory
                initialLogs={initialUsageLogs.data}
                totalPages={initialUsageLogs.totalPages}
                currentPage={initialUsageLogs.currentPage}
                userId={userId}
             />
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditHistory;
