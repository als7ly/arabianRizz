/* eslint-disable camelcase */
import { createTransaction } from "@/lib/actions/transaction.actions";
import { NextResponse } from "next/server";
import stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();

  const sig = request.headers.get("stripe-signature") as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return NextResponse.json({ message: "Webhook error", error: err });
  }

  // Handle the event
  const eventType = event.type;

  // Handle One-Time Payments (Checkout Session)
  if (eventType === "checkout.session.completed") {
    const { id, amount_total, metadata } = event.data.object;

    const transaction = {
      stripeId: id,
      amount: amount_total ? amount_total / 100 : 0,
      plan: metadata?.plan || "",
      credits: Number(metadata?.credits) || 0,
      buyerId: metadata?.buyerId || "",
      createdAt: new Date(),
    };

    const newTransaction = await createTransaction(transaction);

    return NextResponse.json({ message: "OK", transaction: newTransaction });
  }

  // Handle Recurring Subscriptions (Invoice Paid)
  if (eventType === "invoice.payment_succeeded") {
      const invoice = event.data.object;

      // Logic to find user by customer email or ID and grant credits
      // This assumes we stored customer_id on the user model, or can look up by email.
      // For this MVP, we might log it.
      // If metadata is present on subscription, use it.

      // Note: Recurring credits logic typically requires robust subscription management
      // linking Stripe Customer ID to our User ID.
      console.log("Invoice paid:", invoice.id);

      return NextResponse.json({ message: "Invoice Processed" });
  }

  return new Response("", { status: 200 });
}
