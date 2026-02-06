import { Schema, model, models } from "mongoose";

const EventSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false, // Can be anonymous
  },
  eventType: {
    type: String,
    required: true,
  },
  metadata: {
    type: Object,
    default: {},
  },
  path: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30, // Auto-delete after 30 days to save space
  },
});

const Event = models?.Event || model("Event", EventSchema);

export default Event;
