import { Schema, model, models } from "mongoose";

const UsageLogSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    enum: ["message_generation", "image_generation", "girl_creation", "hookup_line", "speech_generation", "profile_analysis"],
    required: true,
  },
  cost: {
    type: Number,
    required: true,
  },
  metadata: {
    type: Object, // Store related IDs (e.g., girlId, messageId) or prompt snippets
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optimize queries by user (filtering) and createdAt (sorting)
UsageLogSchema.index({ user: 1, createdAt: -1 });

const UsageLog = models.UsageLog || model("UsageLog", UsageLogSchema);

export default UsageLog;
