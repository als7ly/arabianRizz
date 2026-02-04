import { Schema, model, models } from "mongoose";

const SavedMessageSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  message: {
    type: Schema.Types.ObjectId,
    ref: "Message",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optimize queries by user (filtering) and createdAt (sorting)
SavedMessageSchema.index({ user: 1, createdAt: -1 });

const SavedMessage = models.SavedMessage || model("SavedMessage", SavedMessageSchema);

export default SavedMessage;
