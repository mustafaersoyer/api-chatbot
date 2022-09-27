import express, { Request, Response } from "express";
import { router } from "./routes";

const { connectMongo, disconnectMongo } = require("./db/mongo");

const bodyParser = require("body-parser");
const compression = require("compression");
const http = require("http");
const https = require("https");
const fs = require("fs");

const app = express();

const privateKey = fs.readFileSync(
  "/etc/letsencrypt/live/yourdomain.com/privkey.pem",
  "utf8"
);
const certificate = fs.readFileSync(
  "/etc/letsencrypt/live/yourdomain.com/cert.pem",
  "utf8"
);
const ca = fs.readFileSync(
  "/etc/letsencrypt/live/yourdomain.com/chain.pem",
  "utf8"
);

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/api", router);

app.use(compression());

/*app.listen(3000, () => {
  console.log("Server is running on port 3000");
});*/

const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(80, () => {
  console.log("HTTP Server running on port 80");
});

httpsServer.listen(3000, () => {
  console.log("HTTPS Server running on port 443");
});

connectMongo();
