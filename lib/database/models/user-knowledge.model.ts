import { Schema, model, models } from "mongoose";

const UserKnowledgeSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number], // Vector embedding for RAG
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optimize queries by user (filtering) and createdAt (sorting)
UserKnowledgeSchema.index({ user: 1, createdAt: -1 });

const UserKnowledge = models.UserKnowledge || model("UserKnowledge", UserKnowledgeSchema);

export default UserKnowledge;
