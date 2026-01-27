import { getUserById } from "@/lib/actions/user.actions";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus } from "lucide-react";

const CreditBalance = async ({ userId }: { userId: string }) => {
  const user = await getUserById(userId);

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-lg px-4 py-1 bg-purple-100 text-purple-700 border border-purple-200">
        {user.creditBalance} Credits
      </Badge>
      <Link href="/credits" className="bg-purple-600 text-white p-1 rounded-full hover:bg-purple-700 transition-colors" title="Buy Credits">
        <Plus size={16} />
      </Link>
    </div>
  );
};

export default CreditBalance;
