"use server";

import { redirect } from 'next/navigation';
import Stripe from "stripe";
import { plans } from '@/constants';

export async function checkoutCredits(transaction: CheckoutTransactionParams) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const selectedPlan = plans.find((p) => p.name === transaction.plan);
  if (!selectedPlan) throw new Error("Invalid plan selected");

  const amount = selectedPlan.price * 100;
  const credits = selectedPlan.credits;

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: amount,
          product_data: {
            name: transaction.plan,
          }
        },
        quantity: 1
      }
    ],
    metadata: {
      plan: transaction.plan,
      credits: credits,
      buyerId: transaction.buyerId,
    },
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/credits?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/credits?canceled=true`,
  });

  redirect(session.url!);
}
