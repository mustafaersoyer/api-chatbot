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
exports.createSheet = void 0;
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const sheet_id_pair_model_1 = require("../models/sheet-id-pair.model");
const nodemailer_1 = __importDefault(require("nodemailer"));
/**
 * Downloads a file
 * @param{string} realFileId file ID
 * @return{obj} file status
 * */
function copyFile(realFileId, pageId, email) {
    return __awaiter(this, void 0, void 0, function* () {
        const auth = new google_auth_library_1.GoogleAuth({
            scopes: "https://www.googleapis.com/auth/drive",
            projectId: "autorepl",
            keyFile: "./credentials/autorepl-keyfile.json",
        });
        const service = googleapis_1.google.drive({ version: "v2", auth });
        let sheetId;
        try {
            sheetId = yield service.files.copy({
                supportsAllDrives: true,
                requestBody: {
                    title: "from-api",
                    parents: [{ id: "1bPZ7vjcAS7ybcCK_b68RJ2_yUqtH3Mad" }],
                },
                fileId: realFileId,
            }, function (err, response) {
                return __awaiter(this, void 0, void 0, function* () {
                    sheetId = response.data.id;
                    const sheetLink = response.data.alternateLink;
                    const sheetIdPair = {
                        sheetId: sheetId,
                        facebookPageId: pageId,
                    };
                    const newSheet = new sheet_id_pair_model_1.SheetIdPair(sheetIdPair);
                    yield newSheet.save(function (err, todo) {
                        if (err)
                            console.log(err);
                    });
                    var transporter = nodemailer_1.default.createTransport({
                        service: "gmail",
                        auth: {
                            user: "getautorepl@gmail.com",
                            pass: "krntwlsonpyedapd",
                        },
                    });
                    var mailOptions = {
                        from: "getautorepl@gmail.com",
                        to: email,
                        subject: "Your AutoRepl Chatbot was created!",
                        text: `Your AutoRepl Chatbot was created! \n Hi, thanks for signup to AutoRepl. This is your Google Sheet link. You can create and update your chatbot via this Google Sheet. \n ${sheetLink}`,
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            console.log("Email sent: " + info.response);
                        }
                    });
                    return response.data.id;
                });
            });
            return sheetId;
        }
        catch (err) {
            console.log(err);
        }
    });
}
function createSheet(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { facebookPageId, email } = request.body;
            yield copyFile("1pWl4BuHX0vK8u3vBvdTgAWm-Womknn_1l_sz0WGooCc", facebookPageId, email);
            response.send({ success: "true" });
        }
        catch (e) {
            response.send({ success: "false", error: e });
        }
    });
}
exports.createSheet = createSheet;
