import express, { Request, Response } from "express";
import { router } from "./routes";
const forge = require("node-forge");
const { connectMongo, disconnectMongo } = require("./db/mongo");
var cors = require("cors");

const bodyParser = require("body-parser");
const compression = require("compression");
const https = require("https");

/*app.listen(3000, () => {
  console.log("Server is running on port 3000");
});*/

const server = https.createServer(
  generateX509Certificate([
    { type: 6, value: "http://localhost" },
    { type: 7, ip: "127.0.0.1" },
  ]),

  makeExpressApp()
);
server.listen(3000, () => {
  console.log("Listening on https://localhost:3000/");
});

connectMongo();

function makeExpressApp() {
  const app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");
  });

  app.use("/api", router);

  app.use(cors());

  app.use((req, res, next) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "OPTIONS, POST, GET");
    res.set("Access-Control-Max-Age", "2592000");
    next();
  });

  app.use(compression());
  return app;
}

function generateX509Certificate(altNames: any) {
  const issuer = [
    { name: "commonName", value: "example.com" },
    { name: "organizationName", value: "E Corp" },
    { name: "organizationalUnitName", value: "Washington Township Plant" },
  ];
  const certificateExtensions = [
    { name: "basicConstraints", cA: true },
    {
      name: "keyUsage",
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: "extKeyUsage",
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
      emailProtection: true,
      timeStamping: true,
    },
    {
      name: "nsCertType",
      client: true,
      server: true,
      email: true,
      objsign: true,
      sslCA: true,
      emailCA: true,
      objCA: true,
    },
    { name: "subjectAltName", altNames },
    { name: "subjectKeyIdentifier" },
  ];
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  cert.publicKey = keys.publicKey;
  cert.setSubject(issuer);
  cert.setIssuer(issuer);
  cert.setExtensions(certificateExtensions);
  cert.sign(keys.privateKey);
  return {
    key: forge.pki.privateKeyToPem(keys.privateKey),
    cert: forge.pki.certificateToPem(cert),
  };
}
