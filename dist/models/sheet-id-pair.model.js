"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheetIdPair = void 0;
const mongoose_1 = require("mongoose");
const sheetIdPairSchema = new mongoose_1.Schema({
    sheetId: String,
    facebookPageId: String,
});
exports.SheetIdPair = (0, mongoose_1.model)("SheetIdPair", sheetIdPairSchema);
