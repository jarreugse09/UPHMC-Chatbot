import mongoose, { Schema, Document } from "mongoose";

export interface IConversationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  lastMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    default: "New Conversation",
  },
  lastMessage: {
    type: String,
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

conversationSchema.pre("save", function (next: any) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Conversation", conversationSchema);
