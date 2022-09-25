import { Schema, model } from "mongoose";

export interface IChatbotQA {
  sheetId: string;
  facebookPageId: string;
  qa: Schema.Types.Mixed;
  iceBreakers: [];
  _id: string;
}

const chatbotQASchema = new Schema<IChatbotQA>({
  sheetId: String,
  facebookPageId: String,
  iceBreakers: [],
  qa: Schema.Types.Mixed,
});

export const ChatbotQA = model<IChatbotQA>("ChatbotQA", chatbotQASchema);
