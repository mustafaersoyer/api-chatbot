import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import fs from "fs";
import { Request, Response } from "express";
import { read, readFile } from "xlsx";
import ExcelJS from "exceljs";
import { setTimeout } from "timers";
import { ChatbotQA, IChatbotQA } from "../models/chatbot-qa.model";
import { SheetIdPair } from "../models/sheet-id-pair.model";

const delay = (delayInms: number) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms));
};

async function downloadFile(realFileId: string, callback: Function) {
  const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/drive",
    projectId: "autorepl",
    keyFile: "./credentials/autorepl-keyfile.json",
  });
  const service = google.drive({ version: "v3", auth });

  var dest = fs.createWriteStream("./autorepl-chatbot.xlsx");

  try {
    const result = service.files.export(
      {
        fileId: realFileId,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      { responseType: "stream" },
      function(err: any, response: any) {
        if (err) {
          console.log("err", err);
        }
        response.data
          .on("end", async function() {
            try {
              const delatRes = await delay(1000);
              const buf = fs.readFileSync("autorepl-chatbot.xlsx");
              console.log("isnuffed", Buffer.isBuffer(buf));
              /* buf is a Buffer */
              const workbook = read(buf);

              /*  const workbook = new ExcelJS.Workbook();
              await workbook.xlsx.load(buf);
              const worksheet = workbook.getWorksheet("Soru ve Cevaplar");
              const row = worksheet.getRow(2).values;
              const cell = worksheet.getRow(2).getCell("A");

              console.log("worksheet", worksheet);
              console.log("row", row);
              console.log("cell", cell);*/

              console.log(
                "Done.",
                workbook.Sheets["Sohbet Başlatıcılar"]["B4"]
              );
              const iceBreakers = [];
              for (let i = 4; i < 8; i++) {
                const iceBreaker =
                  workbook.Sheets["Sohbet Başlatıcılar"][`B${i}`];
                if (iceBreaker) {
                  iceBreakers.push(iceBreaker["h"]);
                }
              }

              console.log("icebreaksers", iceBreakers);

              const quenstionsAndAnswers: { [key: string]: string | {} } = {};

              let i = 2;
              let letter = "A";
              while (i > 0) {
                let question =
                  workbook.Sheets["Soru ve Cevaplar"][`${letter}${i}`];
                console.log("question", question);

                if (question) {
                  console.log("question first ");

                  // letter = getNextChar(letter);
                  console.log(letter);
                  let letterForNestedQA = getNextChar(letter);
                  letterForNestedQA = getNextChar(letterForNestedQA);
                  console.log(letterForNestedQA);

                  const nestedQuestion =
                    workbook.Sheets["Soru ve Cevaplar"][
                      `${letterForNestedQA}${i}`
                    ];
                  console.log(nestedQuestion);

                  if (nestedQuestion) {
                    console.log("nested");

                    const nestedQuestionAndAnswers: {
                      [key: string]: string | {};
                    } = {};
                    const answer =
                      workbook.Sheets["Soru ve Cevaplar"][
                        `${getNextChar(letter)}${i}`
                      ];
                    nestedQuestionAndAnswers[question["h"]] = answer["h"];
                    while (true) {
                      let nestedQuestion =
                        workbook.Sheets["Soru ve Cevaplar"][
                          `${letterForNestedQA}${i}`
                        ];
                      console.log("nestedQuestion", nestedQuestion);

                      if (nestedQuestion) {
                        console.log("nestedQuestion", nestedQuestion);
                        letterForNestedQA = getNextChar(letterForNestedQA);

                        let answer =
                          workbook.Sheets["Soru ve Cevaplar"][
                            `${letterForNestedQA}${i}`
                          ];
                        console.log("answer", answer);

                        nestedQuestionAndAnswers[nestedQuestion["h"]] =
                          answer["h"];
                        letterForNestedQA = getNextChar(letterForNestedQA);
                        nestedQuestion =
                          workbook.Sheets["Soru ve Cevaplar"][
                            `${letterForNestedQA}${i}`
                          ];
                      } else {
                        quenstionsAndAnswers[
                          question["h"]
                        ] = nestedQuestionAndAnswers;
                        letter = "A";

                        i += 1;
                        break;
                      }
                    }
                  } else {
                    const answer =
                      workbook.Sheets["Soru ve Cevaplar"][
                        `${getNextChar(letter)}${i}`
                      ];
                    quenstionsAndAnswers[question["h"]] = answer["h"];
                    i += 1;
                  }
                } else {
                  break;
                }
              }
              console.log("qaa", quenstionsAndAnswers);
              callback(quenstionsAndAnswers, iceBreakers);
            } catch (e) {
              console.log(e);
            }
          })
          .on("error", function(err: any) {
            console.log("Error during download", err);
          })
          .pipe(dest);
      }
    );

    return result;
  } catch (err) {
    throw err;
  }
}

function getNextChar(char: string) {
  return String.fromCharCode(char.charCodeAt(0) + 1);
}

export async function saveSheetToDb(request: Request, response: Response) {
  try {
    const { sheetId } = request.body;
    let qa;
    await downloadFile(
      sheetId,
      async (quenstionsAndAnswers: {}, iceBreakers: []) => {
        qa = quenstionsAndAnswers;
        console.log("qa", qa);
        const sheetIdPair = await SheetIdPair.findOne({ sheetId: sheetId });
        console.log("sheetIdPair", sheetIdPair);

        const chatbotQA = {
          sheetId: sheetId,
          facebookPageId: sheetIdPair?.facebookPageId,
          qa: qa,
        };
        /*  const newChatbotQA = new ChatbotQA(chatbotQA);
      await newChatbotQA.save(function(err: any, todo: IChatbotQA) {
        if (err) console.log(err);
      });*/

        await ChatbotQA.updateOne(
          {
            facebookPageId: sheetIdPair?.facebookPageId,
          },
          {
            sheetId: sheetId,
            facebookPageId: sheetIdPair?.facebookPageId,
            qa: qa,
            iceBreakers: iceBreakers,
          },
          { upsert: true }
        );
      }
    );

    response.send({ success: "true" });
  } catch (e) {
    response.send({ success: "false", error: e });
  }
}
