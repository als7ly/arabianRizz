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
});

const User = models?.User || model("User", UserSchema);

export default User;
