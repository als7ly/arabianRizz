"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { getUserUsage } from "@/lib/actions/usage-log.actions";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type UsageLog = {
    _id: string;
    createdAt: string;
    action: string;
    cost: number;
    metadata: any;
};

interface UsageHistoryProps {
    initialLogs: UsageLog[];
    userId: string;
    totalPages: number;
    currentPage: number;
}

const UsageHistory = ({ initialLogs, userId, totalPages: initialTotalPages, currentPage: initialPage }: UsageHistoryProps) => {
  const [logs, setLogs] = useState<UsageLog[]>(initialLogs);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [isLoading, setIsLoading] = useState(false);

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setIsLoading(true);
    try {
        const result = await getUserUsage(userId, newPage, 10);
        if (result && result.data) {
            setLogs(result.data);
            setCurrentPage(result.currentPage);
            setTotalPages(result.totalPages);
        }
    } catch (error) {
        console.error("Failed to fetch usage logs", error);
    } finally {
        setIsLoading(false);
    }
  };

  if (!logs || logs.length === 0) {
      return <div className="text-center text-muted-foreground py-8 border rounded-lg bg-muted/20">No usage history found.</div>;
  }

  return (
    <div className="w-full overflow-hidden border rounded-lg flex flex-col bg-background shadow-sm">
      <div className="overflow-x-auto">
        <Table>
            <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-[180px]">Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>
                <TableHead className="text-right">Cost</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                        <Loader2 className="animate-spin h-6 w-6 mx-auto text-primary" />
                    </TableCell>
                </TableRow>
            ) : (
                logs.map((log) => (
                    <TableRow key={log._id}>
                    <TableCell className="font-medium text-muted-foreground">
                        {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="capitalize font-medium text-foreground">
                        {log.action.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground text-xs max-w-[200px] truncate">
                        {log.metadata && Object.keys(log.metadata).length > 0 ? (
                            <span title={JSON.stringify(log.metadata, null, 2)}>
                                {Object.keys(log.metadata).map(k => `${k}: ${log.metadata[k]}`).join(", ")}
                            </span>
                        ) : (
                            <span className="text-muted-foreground/50">-</span>
                        )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-red-500">-{log.cost}</TableCell>
                    </TableRow>
                ))
            )}
            </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
              <span className="text-sm text-muted-foreground font-medium">
                  Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    className="h-8 w-8 p-0"
                  >
                      <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || isLoading}
                    className="h-8 w-8 p-0"
                  >
                      <ChevronRight className="h-4 w-4" />
                  </Button>
              </div>
          </div>
      )}
    </div>
  );
};

export default UsageHistory;
