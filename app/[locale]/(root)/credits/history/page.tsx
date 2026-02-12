import { auth } from "@clerk/nextjs";
import { getTransactions } from "@/lib/actions/transaction.actions";
import { getUserUsage } from "@/lib/actions/usage-log.actions";
import { format } from "date-fns";
import { Link } from "@/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export default async function HistoryPage() {
    const { userId } = auth();
    if (!userId) return null;

    const t = await getTranslations('Credits');

    const [transactionsData, usageData] = await Promise.all([
        getTransactions(userId),
        getUserUsage(userId)
    ]);

    const history = [
        ...transactionsData.map((t: any) => ({
            id: t._id,
            type: 'purchase',
            date: new Date(t.createdAt),
            amount: t.credits,
            description: `Purchased ${t.plan || 'Credits'}`,
            meta: null
        })),
        ...usageData.map((u: any) => ({
            id: u._id,
            type: 'usage',
            date: new Date(u.createdAt),
            amount: -u.cost,
            description: formatAction(u.action),
            meta: u.metadata
        }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <section className="max-w-4xl mx-auto py-8 px-4 animate-fade-in-up">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/credits">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Icons.chevronLeft className="h-6 w-6" />
                    </Button>
                </Link>
                <h1 className="h2-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">Transaction History</h1>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm glass-card">
                {history.length > 0 ? (
                    <div className="divide-y divide-white/10">
                        {history.map((item) => (
                            <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-10 w-10 rounded-full flex-center shrink-0",
                                        item.type === 'purchase' ? "bg-green-500/10 text-green-500" : "bg-purple-500/10 text-purple-500"
                                    )}>
                                        {item.type === 'purchase' ? <Icons.billing className="h-5 w-5" /> : <Icons.sparkles className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">{item.description}</p>
                                        <p className="text-sm text-muted-foreground">{format(item.date, "PPP p")}</p>
                                    </div>
                                </div>
                                <div className={cn(
                                    "font-bold text-lg",
                                    item.amount > 0 ? "text-green-500" : "text-white"
                                )}>
                                    {item.amount > 0 ? "+" : ""}{item.amount}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                        <div className="h-16 w-16 bg-white/5 rounded-full flex-center">
                            <Icons.post className="h-8 w-8 opacity-50" />
                        </div>
                        <p>No transactions found.</p>
                    </div>
                )}
            </div>
        </section>
    );
}

function formatAction(action: string) {
    switch (action) {
        case "message_generation": return "Wingman Reply";
        case "image_generation": return "Art Generation";
        case "girl_creation": return "Persona Creation";
        case "hookup_line": return "Hookup Line";
        default: return "Credit Usage";
    }
}
