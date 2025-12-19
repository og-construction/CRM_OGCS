import mongoose from "mongoose";

const ContactDiscussionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true },
    companyName: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    discussionNote: { type: String, required: true, trim: true, maxlength: 2000 }
  },
  { timestamps: true }
);

export default mongoose.model("ContactDiscussion", ContactDiscussionSchema);
