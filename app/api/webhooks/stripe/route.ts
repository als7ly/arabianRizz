/* eslint-disable camelcase */
import { createTransaction } from "@/lib/services/transaction.service";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectToDatabase } from "@/lib/database/mongoose";
import User from "@/lib/database/models/user.model";
import { plans } from "@/constants";

export async function POST(request: Request) {
  const body = await request.text();

  const sig = request.headers.get("stripe-signature") as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  // Properly initialize Stripe
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
  });

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    return NextResponse.json({ message: "Webhook error", error: err });
  }

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
      const customerEmail = invoice.customer_email;

      if (!customerEmail) {
          return NextResponse.json({ message: "No customer email found in invoice" });
      }

      await connectToDatabase();

      const user = await User.findOne({ email: customerEmail });

      if (user) {
          // Identify Plan
          // Ideally, use invoice.lines.data[0].price.id to match product
          // For this MVP, we assume a standard refill amount or check description

          // Heuristic: Check amount paid to guess plan
          const amountPaid = invoice.amount_paid / 100;
          const matchedPlan = plans.find(p => p.price === amountPaid);

          if (matchedPlan) {
              await User.findByIdAndUpdate(user._id, {
                  $inc: { creditBalance: matchedPlan.credits }
              });

              // Log transaction for record keeping
              await createTransaction({
                  stripeId: invoice.id,
                  amount: amountPaid,
                  plan: matchedPlan.name + " (Renewal)",
                  credits: matchedPlan.credits,
                  buyerId: user._id,
                  createdAt: new Date(),
              });

              return NextResponse.json({ message: `Renewed ${matchedPlan.name} for ${user.username}` });
          }
      }

      return NextResponse.json({ message: "Invoice Processed but User/Plan not matched" });
  }

  return new Response("", { status: 200 });
}
