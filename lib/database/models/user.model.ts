import { Schema, model, models } from "mongoose";

const UserSchema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  photo: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  planId: { type: Number, default: 1 },
  creditBalance: { type: Number, default: 20 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  locale: { type: String, default: 'en' },
  streak: {
    current: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now, index: true }
  },
  badges: { type: [String], default: [] },
  totalInteractions: { type: Number, default: 0 },

  stripeCustomerId: { type: String, unique: true, sparse: true },
  stripeSubscriptionId: { type: String, unique: true, sparse: true },
  stripePriceId: { type: String },
  stripeCurrentPeriodEnd: { type: Date },
  subscriptionStatus: { type: String },
});

// Optimize queries for Analytics (Active Users) and Leaderboard (Top Users)
UserSchema.index({ "streak.lastActive": -1 });
UserSchema.index({ totalInteractions: -1 });

const User = models?.User || model("User", UserSchema);

export default User;
