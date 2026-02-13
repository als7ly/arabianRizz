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
  language: {
    type: String,
    default: "en", // Default to English
  },
  dialect: {
    type: String, // e.g., "Egyptian", "Levantine", "Gulf", "Maghrebi", "Modern Standard Arabic"
    default: "Modern Standard Arabic",
  },
  voiceId: {
    type: String, // OpenAI Voice ID: alloy, echo, fable, onyx, nova, shimmer
    default: "nova", // Default to a female-sounding voice
  },
  relationshipStatus: {
    type: String, // e.g., "Just met", "Talking", "Dating"
    default: "Just met",
  },
  rating: {
    type: Number,
    default: 5,
    min: 1,
    max: 10,
  },
  socialMediaHandle: {
    type: String,
  },
  isPinned: {
    type: Boolean,
    default: false,
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

// Optimize queries by author (filtering) and createdAt (sorting)
GirlSchema.index({ author: 1, isPinned: -1, createdAt: -1 });

const Girl = models?.Girl || model("Girl", GirlSchema);

export default Girl;
