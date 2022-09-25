"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotQA = void 0;
const mongoose_1 = require("mongoose");
const chatbotQASchema = new mongoose_1.Schema({
    sheetId: String,
    facebookPageId: String,
    iceBreakers: [],
    qa: mongoose_1.Schema.Types.Mixed,
});
exports.ChatbotQA = (0, mongoose_1.model)("ChatbotQA", chatbotQASchema);
