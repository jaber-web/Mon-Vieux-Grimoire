const path = require("path");
require("dotenv").config({
  path: path.join(__dirname, "../.env.local"),
});

const express = require("express");
const mongoose = require("mongoose");
const Book = require("./models/Book");
const authRoutes = require("./routes/auth");
const auth = require("./middleware/auth");

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

const port = 3000;

app.get("/", (req, res) => {
  res.send("Mon Vieux Grimoire API fonctionne !");
});

app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/books/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put("/api/books/:id", auth, async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedBook) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete("/api/books/:id", async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);

    if (!deletedBook) {
      return res.status(404).json({ message: "Livre non trouvé" });
    }

    res.status(200).json({ message: "Livre supprimé" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/books", async (req, res) => {
  try {
    const book = new Book(req.body);
    const savedBook = await book.save();

    res.status(201).json(savedBook);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
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