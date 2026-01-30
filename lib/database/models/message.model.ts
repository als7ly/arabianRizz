import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema({
  girl: {
    type: Schema.Types.ObjectId,
    ref: "Girl",
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "girl", "wingman", "system"], // 'wingman' is the AI response
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  embedding: {
    type: [Number], // Vector embedding for RAG
    default: [],
  },
  feedback: {
    type: String,
    enum: ["positive", "negative"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = models.Message || model("Message", MessageSchema);

export default Message;
