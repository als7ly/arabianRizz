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

      // Get the price ID from the invoice line item
      // This is more robust than guessing by amount
      const priceId = invoice.lines?.data[0]?.price?.id;

      if (!customerEmail) {
          return NextResponse.json({ message: "No customer email found in invoice" });
      }

      await connectToDatabase();

      const user = await User.findOne({ email: customerEmail });

      if (user) {
          // Identify Plan by Stripe Price ID
          const matchedPlan = plans.find(p => p.stripePriceId === priceId);

          if (matchedPlan) {
              await User.findByIdAndUpdate(user._id, {
                  $inc: { creditBalance: matchedPlan.credits }
              });

              // Log transaction for record keeping
              await createTransaction({
                  stripeId: invoice.id,
                  amount: invoice.amount_paid / 100,
                  plan: matchedPlan.name + " (Renewal)",
                  credits: matchedPlan.credits,
                  buyerId: user._id,
                  createdAt: new Date(),
              });

              return NextResponse.json({ message: `Renewed ${matchedPlan.name} for ${user.username}` });
          } else {
             // Fallback to legacy amount-based matching if Price ID fails
             console.warn(`Price ID ${priceId} not found in constants. Falling back to amount.`);
             const amountPaid = invoice.amount_paid / 100;
             const amountMatchedPlan = plans.find(p => p.price === amountPaid);

             if (amountMatchedPlan) {
                await User.findByIdAndUpdate(user._id, {
                    $inc: { creditBalance: amountMatchedPlan.credits }
                });

                await createTransaction({
                  stripeId: invoice.id,
                  amount: amountPaid,
                  plan: amountMatchedPlan.name + " (Renewal/Fallback)",
                  credits: amountMatchedPlan.credits,
                  buyerId: user._id,
                  createdAt: new Date(),
                });
                return NextResponse.json({ message: `Renewed (Fallback) ${amountMatchedPlan.name}` });
             }
          }
      }

      return NextResponse.json({ message: "Invoice Processed but User/Plan not matched" });
  }

  return new Response("", { status: 200 });
}
