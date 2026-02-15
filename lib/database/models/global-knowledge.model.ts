import { Schema, model, models, Document } from "mongoose";

export interface IGlobalKnowledge extends Document {
  content: string;
  embedding: number[];
  language: string;
  sourceUrl?: string;
  status: 'pending' | 'approved';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const GlobalKnowledgeSchema = new Schema({
  content: { type: String, required: true },
  embedding: { type: [Number], required: true, select: false },
  language: { type: String, required: true, index: true },
  sourceUrl: { type: String },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending', index: true },
  tags: { type: [String], default: [] },
}, { timestamps: true });

// Optimize queries by status (filtering), language (filtering) and createdAt (sorting)
GlobalKnowledgeSchema.index({ status: 1, language: 1, createdAt: -1 });

const GlobalKnowledge = models.GlobalKnowledge || model<IGlobalKnowledge>("GlobalKnowledge", GlobalKnowledgeSchema);

export default GlobalKnowledge;
