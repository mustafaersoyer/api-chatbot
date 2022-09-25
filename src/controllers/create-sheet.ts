import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import { Request, Response } from "express";
import { ISheetIdPair, SheetIdPair } from "../models/sheet-id-pair.model";
import nodemailer from "nodemailer";

/**
 * Downloads a file
 * @param{string} realFileId file ID
 * @return{obj} file status
 * */
async function copyFile(realFileId: string, pageId: string, email: string) {
  const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/drive",
    projectId: "autorepl",
    keyFile: "./credentials/autorepl-keyfile.json",
  });
  const service = google.drive({ version: "v2", auth });
  let sheetId;
  try {
    sheetId = await service.files.copy(
      {
        supportsAllDrives: true,
        requestBody: {
          title: "from-api",
          parents: [{ id: "1bPZ7vjcAS7ybcCK_b68RJ2_yUqtH3Mad" }],
        },
        fileId: realFileId,
      },

      async function (err: any, response: any) {
        sheetId = response.data.id;
        const sheetLink = response.data.alternateLink;
        const sheetIdPair = {
          sheetId: sheetId,
          facebookPageId: pageId,
        };
        const newSheet = new SheetIdPair(sheetIdPair);
        await newSheet.save(function (err: any, todo: ISheetIdPair) {
          if (err) console.log(err);
        });

        var transporter = nodemailer.createTransport({
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
          } else {
            console.log("Email sent: " + info.response);
          }
        });

        return response.data.id;
      }
    );

    return sheetId;
  } catch (err) {
    console.log(err);
  }
}

export async function createSheet(request: Request, response: Response) {
  try {
    const { facebookPageId, email } = request.body;
    await copyFile(
      "1pWl4BuHX0vK8u3vBvdTgAWm-Womknn_1l_sz0WGooCc",
      facebookPageId,
      email
    );

    response.send({ success: "true" });
  } catch (e) {
    response.send({ success: "false", error: e });
  }
}
