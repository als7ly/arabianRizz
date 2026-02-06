import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const SubscriptionStatus = ({ user }: { user: any }) => {
    // For MVP, we assume planId > 1 implies a paid plan/subscription.
    // In a real app, you'd check a specific 'subscriptionStatus' field synced from Stripe.
    const isSubscribed = user.planId && user.planId > 1;

    if (!isSubscribed) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Status:</span>
                <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-200">Free Tier</Badge>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-700">Status:</span>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-sm">
                    Active Subscription
                </Badge>
            </div>
            {user.subscriptionPeriodEnd && (
                <p className="text-xs text-gray-400">
                    Renews on {format(new Date(user.subscriptionPeriodEnd), "MMM dd, yyyy")}
                </p>
            )}
        </div>
    );
};

export default SubscriptionStatus;
