"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { plans } from '@/constants';

export async function checkoutCredits(transaction: CheckoutTransactionParams) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Validate plan
  const selectedPlan = plans.find((p) => p.name === transaction.plan);
  if (!selectedPlan) throw new Error("Invalid plan selected");

  // Securely get price from server-side constant
  const amount = selectedPlan.price * 100;
  const credits = selectedPlan.credits;

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
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan: transaction.plan,
        credits: credits,
        buyerId: transaction.buyerId,
      },
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/profile?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/?canceled=true`,
    });

    redirect(session.url!);
  } catch (error) {
    throw error;
  }
}

