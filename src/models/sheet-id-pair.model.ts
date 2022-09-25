import { Schema, model } from "mongoose";

export interface ISheetIdPair {
  sheetId: string;
  facebookPageId: string;
  _id: string;
}

const sheetIdPairSchema = new Schema<ISheetIdPair>({
  sheetId: String,
  facebookPageId: String,
});

export const SheetIdPair = model<ISheetIdPair>(
  "SheetIdPair",
  sheetIdPairSchema
);
