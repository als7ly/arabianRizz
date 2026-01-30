import { Schema, model, models } from "mongoose";

const MessageSchema = new Schema({
  girl: { type: Schema.Types.ObjectId, ref: "Girl", required: true },
  role: { type: String, required: true }, // 'user', 'wingman', 'girl', 'system'
  content: { type: String, required: true },
  embedding: { type: [Number] }, // Vector embedding
  feedback: { type: String, enum: ['up', 'down', null], default: null }, // Feedback field
  createdAt: { type: Date, default: Date.now },
});

const Message = models.Message || model("Message", MessageSchema);

export default Message;
