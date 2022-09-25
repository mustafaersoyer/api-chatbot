"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveSheetToDb = void 0;
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const fs_1 = __importDefault(require("fs"));
const xlsx_1 = require("xlsx");
const timers_1 = require("timers");
const chatbot_qa_model_1 = require("../models/chatbot-qa.model");
const sheet_id_pair_model_1 = require("../models/sheet-id-pair.model");
const delay = (delayInms) => {
    return new Promise((resolve) => (0, timers_1.setTimeout)(resolve, delayInms));
};
function downloadFile(realFileId, callback) {
    return __awaiter(this, void 0, void 0, function* () {
        const auth = new google_auth_library_1.GoogleAuth({
            scopes: "https://www.googleapis.com/auth/drive",
            projectId: "autorepl",
            keyFile: "./credentials/autorepl-keyfile.json",
        });
        const service = googleapis_1.google.drive({ version: "v3", auth });
        var dest = fs_1.default.createWriteStream("./autorepl-chatbot.xlsx");
        try {
            const result = service.files.export({
                fileId: realFileId,
                mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }, { responseType: "stream" }, function (err, response) {
                if (err) {
                    console.log("err", err);
                }
                response.data
                    .on("end", function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        try {
                            const delatRes = yield delay(1000);
                            const buf = fs_1.default.readFileSync("autorepl-chatbot.xlsx");
                            /* buf is a Buffer */
                            const workbook = (0, xlsx_1.read)(buf);
                            console.log("Done.", workbook.Sheets["Sohbet Başlatıcılar"]["B4"]);
                            const iceBreakers = [];
                            for (let i = 4; i < 8; i++) {
                                const iceBreaker = workbook.Sheets["Sohbet Başlatıcılar"][`B${i}`];
                                if (iceBreaker) {
                                    iceBreakers.push(iceBreaker["h"]);
                                }
                            }
                            const quenstionsAndAnswers = {};
                            let i = 2;
                            let letter = "A";
                            while (i > 0) {
                                let question = workbook.Sheets["Soru ve Cevaplar"][`${letter}${i}`];
                                if (question) {
                                    let letterForNestedQA = getNextChar(letter);
                                    letterForNestedQA = getNextChar(letterForNestedQA);
                                    const nestedQuestion = workbook.Sheets["Soru ve Cevaplar"][`${letterForNestedQA}${i}`];
                                    if (nestedQuestion) {
                                        const nestedQuestionAndAnswers = {};
                                        const answer = workbook.Sheets["Soru ve Cevaplar"][`${getNextChar(letter)}${i}`];
                                        nestedQuestionAndAnswers[question["h"]] = answer["h"];
                                        while (true) {
                                            let nestedQuestion = workbook.Sheets["Soru ve Cevaplar"][`${letterForNestedQA}${i}`];
                                            if (nestedQuestion) {
                                                letterForNestedQA = getNextChar(letterForNestedQA);
                                                let answer = workbook.Sheets["Soru ve Cevaplar"][`${letterForNestedQA}${i}`];
                                                nestedQuestionAndAnswers[nestedQuestion["h"]] =
                                                    answer["h"];
                                                letterForNestedQA = getNextChar(letterForNestedQA);
                                                nestedQuestion =
                                                    workbook.Sheets["Soru ve Cevaplar"][`${letterForNestedQA}${i}`];
                                            }
                                            else {
                                                quenstionsAndAnswers[question["h"]] =
                                                    nestedQuestionAndAnswers;
                                                letter = "A";
                                                i += 1;
                                                break;
                                            }
                                        }
                                    }
                                    else {
                                        const answer = workbook.Sheets["Soru ve Cevaplar"][`${getNextChar(letter)}${i}`];
                                        quenstionsAndAnswers[question["h"]] = answer["h"];
                                        i += 1;
                                    }
                                }
                                else {
                                    break;
                                }
                            }
                            callback(quenstionsAndAnswers, iceBreakers);
                        }
                        catch (e) {
                            console.log(e);
                        }
                    });
                })
                    .on("error", function (err) {
                    console.log("Error during download", err);
                })
                    .pipe(dest);
            });
            return result;
        }
        catch (err) {
            throw err;
        }
    });
}
function getNextChar(char) {
    return String.fromCharCode(char.charCodeAt(0) + 1);
}
function saveSheetToDb(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { sheetId } = request.body;
            let qa;
            yield downloadFile(sheetId, (quenstionsAndAnswers, iceBreakers) => __awaiter(this, void 0, void 0, function* () {
                qa = quenstionsAndAnswers;
                const sheetIdPair = yield sheet_id_pair_model_1.SheetIdPair.findOne({ sheetId: sheetId });
                yield chatbot_qa_model_1.ChatbotQA.updateOne({
                    facebookPageId: sheetIdPair === null || sheetIdPair === void 0 ? void 0 : sheetIdPair.facebookPageId,
                }, {
                    sheetId: sheetId,
                    facebookPageId: sheetIdPair === null || sheetIdPair === void 0 ? void 0 : sheetIdPair.facebookPageId,
                    qa: qa,
                    iceBreakers: iceBreakers,
                }, { upsert: true });
            }));
            response.send({ success: "true" });
        }
        catch (e) {
            response.send({ success: "false", error: e });
        }
    });
}
exports.saveSheetToDb = saveSheetToDb;
