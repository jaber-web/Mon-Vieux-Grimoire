const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env.local"),
});

const express = require("express");
const mongoose = require("mongoose");

const app = express();

const port = 3000;

app.get("/", (req, res) => {
  res.send("Mon Vieux Grimoire API fonctionne !");
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connecté !");
  })
  .catch((error) => {
    console.error("Erreur de connexion MongoDB :", error);
  });

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});