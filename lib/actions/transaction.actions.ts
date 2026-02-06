"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { plans } from '@/constants';
import { connectToDatabase } from "../database/mongoose";
import Transaction from "../database/models/transaction.model";
import User from "../database/models/user.model";
import { auth } from "@clerk/nextjs";

export async function checkoutCredits(transaction: CheckoutTransactionParams & { mode?: 'payment' | 'subscription' }) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Validate plan
  const selectedPlan = plans.find((p) => p.name === transaction.plan);
  if (!selectedPlan) throw new Error("Invalid plan selected");

  // Securely get price from server-side constant
  const amount = selectedPlan.price * 100;
  const credits = selectedPlan.credits;
  const mode = transaction.mode || 'payment';

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: transaction.plan,
            },
            unit_amount: amount,
            recurring: mode === 'subscription' ? { interval: 'month' } : undefined,
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan: transaction.plan,
        credits: credits,
        buyerId: transaction.buyerId,
      },
      mode: mode,
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/?canceled=true`,
    });

    redirect(session.url!);
  } catch (error) {
    throw error;
  }
}

export async function getTransactions(userId: string) {
  try {
    await connectToDatabase();

    const { userId: clerkId } = auth();
    if (!clerkId) throw new Error("Unauthorized");

    const user = await User.findOne({ clerkId });
    if (!user) throw new Error("User not found");

    if (user._id.toString() !== userId) {
      throw new Error("Unauthorized access to transactions");
    }

    const transactions = await Transaction.find({ buyer: userId }).sort({ createdAt: -1 });
    return JSON.parse(JSON.stringify(transactions));
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

export async function createCustomerPortalSession() {
    const { userId } = auth();
    if (!userId) {
        throw new Error("Unauthorized");
    }

    await connectToDatabase();
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
        throw new Error("User not found");
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    try {
        let customerId = user.stripeCustomerId;

        // If no stripeCustomerId on user, fallback to email lookup
        if (!customerId) {
            const customers = await stripe.customers.list({
                email: user.email,
                limit: 1,
            });

            if (customers.data.length > 0) {
                customerId = customers.data[0].id;

                // Optional: Save it back to the user for next time?
                // We'll leave it as just a lookup to avoid side-effects in this read-heavy action,
                // but strictly speaking we should probably save it.
                // For now, just using it is enough.
            }
        }

        if (!customerId) {
             throw new Error("No Stripe customer found for this user.");
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile`,
        });

        return session.url;
    } catch (error) {
        console.error("Error creating portal session:", error);
        return null;
    }
}
