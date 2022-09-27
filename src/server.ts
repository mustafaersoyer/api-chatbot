import express, { Request, Response } from "express";
import { router } from "./routes";

const { connectMongo, disconnectMongo } = require("./db/mongo");

const bodyParser = require("body-parser");
const compression = require("compression");
const http = require("http");
const https = require("https");
const fs = require("fs");

const app = express();

var key = fs.readFileSync(__dirname + "/../certs/selfsigned.key");
var cert = fs.readFileSync(__dirname + "/../certs/selfsigned.crt");
var options = {
  key: key,
  cert: cert,
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

var server = https.createServer(options, app);

server.listen(3000, () => {
  console.log("server starting on port : " + 3000);
});

connectMongo();
