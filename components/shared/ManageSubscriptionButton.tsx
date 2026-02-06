"use client";

import { Button } from "@/components/ui/button";
import { createCustomerPortalSession } from "@/lib/actions/transaction.actions";
import { toast } from "@/components/ui/use-toast";
import { CreditCard } from "lucide-react";

const ManageSubscriptionButton = () => {
    const handleManage = async () => {
        try {
            const url = await createCustomerPortalSession();
            if (url) {
                window.location.href = url;
            } else {
                toast({
                    title: "Unavailable",
                    description: "No subscription history found.",
                    variant: "destructive"
                });
            }
        } catch (e) {
            console.error(e);
            toast({
                title: "Error",
                description: "Could not redirect to billing portal.",
                variant: "destructive"
            });
        }
    };

    return (
        <Button
            onClick={handleManage}
            variant="outline"
            className="w-full sm:w-auto flex items-center gap-2"
        >
            <CreditCard size={16} />
            Manage Subscription
        </Button>
    );
};

export default ManageSubscriptionButton;
