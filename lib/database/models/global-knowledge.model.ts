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
  embedding: { type: [Number], required: true },
  language: { type: String, required: true },
  sourceUrl: { type: String },
  status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  tags: { type: [String], default: [] },
}, { timestamps: true });

// Optimize queries by status + language (filtering) and createdAt (sorting)
// Matches patterns:
// 1. find({ status: ... }).sort({ createdAt: -1 })
// 2. find({ status: ..., language: ... }).sort({ createdAt: -1 })
GlobalKnowledgeSchema.index({ status: 1, language: 1, createdAt: -1 });

const GlobalKnowledge = models.GlobalKnowledge || model<IGlobalKnowledge>("GlobalKnowledge", GlobalKnowledgeSchema);

export default GlobalKnowledge;
