"use client";

import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { checkoutCredits } from "@/lib/actions/transaction.actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Checkout = ({
  plan,
  amount,
  credits,
  buyerId,
}: {
  plan: string;
  amount: number;
  credits: number;
  buyerId: string;
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }, []);

  useEffect(() => {
    // Check to see if this is a redirect back from Checkout
    const query = new URLSearchParams(window.location.search);
    if (query.get("success")) {
      toast({
        title: "Order placed!",
        description: "You will receive an email confirmation.",
        className: "success-toast",
      });
    }

    if (query.get("canceled")) {
      toast({
        title: "Order canceled!",
        description: "Continue to shop around and checkout when you're ready.",
        variant: "destructive",
      });
    }
  }, []);

  const onCheckout = async () => {
    setIsLoading(true);
    try {
      const transaction = {
        plan,
        amount,
        credits,
        buyerId,
      };

      await checkoutCredits(transaction);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to initiate checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
        // Note: checkoutCredits redirects, so this might not run on success, but good for error cases
       setIsLoading(false);
    }
  };

  return (
    <form action={onCheckout}>
      <section>
        <Button
          type="submit"
          role="link"
          className="w-full rounded-full bg-purple-gradient bg-cover"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
            </>
          ) : (
            "Buy Credit"
          )}
        </Button>
      </section>
    </form>
  );
};

export default Checkout;
