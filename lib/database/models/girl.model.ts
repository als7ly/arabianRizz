import { Schema, model, models } from "mongoose";

const GirlSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
  },
  vibe: {
    type: String, // Description of her personality/notes
  },
  dialect: {
    type: String, // e.g., "Egyptian", "Levantine", "Gulf", "Maghrebi", "Modern Standard Arabic"
    default: "Modern Standard Arabic",
  },
  relationshipStatus: {
    type: String, // e.g., "Just met", "Talking", "Dating"
    default: "Just met",
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const Girl = models?.Girl || model("Girl", GirlSchema);

export default Girl;
