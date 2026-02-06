"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

type Transaction = {
    _id: string;
    createdAt: string;
    amount: number;
    plan: string;
    credits: number;
};

const BillingHistory = ({ transactions }: { transactions: Transaction[] }) => {
  if (transactions.length === 0) {
      return <div className="text-center text-gray-500 py-4">No transactions found.</div>;
  }

  return (
    <div className="w-full overflow-hidden border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Date</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t._id}>
              <TableCell>{format(new Date(t.createdAt), "MMM dd, yyyy")}</TableCell>
              <TableCell className="font-medium text-purple-700">{t.plan}</TableCell>
              <TableCell>+{t.credits}</TableCell>
              <TableCell className="text-right font-semibold">${t.amount.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BillingHistory;
