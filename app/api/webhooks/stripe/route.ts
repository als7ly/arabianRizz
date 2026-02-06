/* eslint-disable camelcase */
import { createTransaction } from "@/lib/services/transaction.service";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectToDatabase } from "@/lib/database/mongoose";
import User from "@/lib/database/models/user.model";
import { plans } from "@/constants";
import { logger } from "@/lib/services/logger.service";
import { sendEmail } from "@/lib/services/email.service";

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
    logger.error("Webhook Signature Verification Failed", err);
    return NextResponse.json({ message: "Webhook error", error: err }, { status: 400 });
  }

  const eventType = event.type;
  logger.info(`Webhook Received: ${eventType}`, { id: event.id });

  // Handle One-Time Payments (Checkout Session)
  if (eventType === "checkout.session.completed") {
    const { id, amount_total, metadata, customer_details, customer, subscription, mode } = event.data.object;

    // Update User with Stripe Customer ID
    if (metadata?.buyerId && customer) {
        await connectToDatabase();
        const updateData: any = { stripeCustomerId: customer };

        if (mode === 'subscription' && subscription) {
            updateData.stripeSubscriptionId = subscription;
            updateData.subscriptionStatus = 'active';
        }

        await User.findByIdAndUpdate(metadata.buyerId, updateData);
        logger.info(`Updated user ${metadata.buyerId} with Stripe Customer ID ${customer}`);
    }

    const transaction = {
      stripeId: id,
      amount: amount_total ? amount_total / 100 : 0,
      plan: metadata?.plan || "",
      credits: Number(metadata?.credits) || 0,
      buyerId: metadata?.buyerId || "",
      createdAt: new Date(),
    };

    const newTransaction = await createTransaction(transaction);

    // Send Receipt Email
    if (customer_details?.email) {
        await sendEmail({
            to: customer_details.email,
            subject: "Purchase Confirmation - ArabianRizz",
            html: `<h1>Thank you for your purchase!</h1><p>You have successfully purchased the ${metadata?.plan}. ${metadata?.credits} credits have been added to your account.</p>`
        });
    }

    return NextResponse.json({ message: "OK", transaction: newTransaction });
  }

  // Handle Recurring Subscriptions (Invoice Paid)
  if (eventType === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;

      const priceId = invoice.lines?.data[0]?.price?.id;

      if (!customerEmail) {
          logger.warn("Invoice processed but no email found");
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

              await createTransaction({
                  stripeId: invoice.id,
                  amount: invoice.amount_paid / 100,
                  plan: matchedPlan.name + " (Renewal)",
                  credits: matchedPlan.credits,
                  buyerId: user._id,
                  createdAt: new Date(),
              });

              await sendEmail({
                to: user.email,
                subject: "Subscription Renewed - ArabianRizz",
                html: `<h1>Your subscription has renewed!</h1><p>Your ${matchedPlan.name} is active. ${matchedPlan.credits} credits have been added.</p>`
              });

              logger.info(`Subscription renewed for user ${user._id}`);
              return NextResponse.json({ message: `Renewed ${matchedPlan.name} for ${user.username}` });
          } else {
             // Fallback
             logger.warn(`Price ID ${priceId} not found in constants. Falling back to amount.`);
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
