import express, { Request, Response } from "express";
import { router } from "./routes";

const { connectMongo, disconnectMongo } = require("./db/mongo");

const bodyParser = require("body-parser");
const app = express();
const compression = require("compression");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/api", router);

app.use(compression());

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

connectMongo();
