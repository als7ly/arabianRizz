import { Schema, model, models } from "mongoose";

const ReferralItemSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['date_idea', 'gift', 'product', 'clothes', 'jewelry', 'perfume'],
    required: true
  },
  url: { type: String, required: true },
  imageUrl: { type: String },
  price: { type: Number },
  currency: { type: String, default: 'USD' },
  tags: { type: [String], default: [] },
  embedding: { type: [Number], select: false },
  isActive: { type: Boolean, default: true },
  clickCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ReferralItemSchema.index({ category: 1 });
ReferralItemSchema.index({ tags: 1 });

const ReferralItem = models?.ReferralItem || model("ReferralItem", ReferralItemSchema);

export default ReferralItem;
