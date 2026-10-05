const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env.local"),
});

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const Book = require("./models/Book");
const authRoutes = require("./routes/auth");
const auth = require("./middleware/auth");
const multer = require("./middleware/multer-config");
const sharp = require("./middleware/sharp");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/images", express.static(path.join(__dirname, "images")));

app.use("/api/auth", authRoutes);

const port = 3000;

// =========================
// ROUTE PRINCIPALE
// =========================

app.get("/", (req, res) => {
  res.send("Mon Vieux Grimoire API fonctionne !");
});

// =========================
// GET TOUS LES LIVRES
// =========================

app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find();

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// =========================
// GET LES 3 LIVRES LES MIEUX NOTÉS
// IMPORTANT : cette route doit être AVANT /:id
// =========================

app.get("/api/books/bestrating", async (req, res) => {
  try {
    const books = await Book.find()
      .sort({ averageRating: -1 })
      .limit(3);

    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// =========================
// GET UN LIVRE PAR SON ID
// =========================

app.get("/api/books/:id", auth, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: "Livre non trouvé",
      });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// =========================
// MODIFIER UN LIVRE
// =========================

app.put("/api/books/:id", auth, multer, sharp, async (req, res) => {
  try {
    const updateData = {
      ...req.body,
    };

    if (req.file) {
      updateData.imageUrl = `${req.protocol}://${req.get("host")}/images/${req.file.filename}`;
    }

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedBook) {
      return res.status(404).json({
        message: "Livre non trouvé",
      });
    }

    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// =========================
// NOTER UN LIVRE
// =========================

app.post("/api/books/:id/rating", auth, async (req, res) => {
  try {
    const { grade } = req.body;

    // Vérifier que la note est un nombre entre 0 et 5
    if (!Number.isInteger(grade) || grade < 0 || grade > 5) {
      return res.status(400).json({
        message: "La note doit être un nombre entier entre 0 et 5",
      });
    }

    // Chercher le livre
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: "Livre non trouvé",
      });
    }

    // Vérifier si l'utilisateur a déjà noté ce livre
    const alreadyRated = book.ratings.some(
      (rating) => rating.userId === req.auth.userId
    );

    if (alreadyRated) {
      return res.status(400).json({
        message: "Vous avez déjà noté ce livre",
      });
    }

    // Ajouter la nouvelle note
    book.ratings.push({
      userId: req.auth.userId,
      grade,
    });

    // Calculer la moyenne
    const total = book.ratings.reduce(
      (sum, rating) => sum + rating.grade,
      0
    );

    book.averageRating = total / book.ratings.length;

    await book.save();

    res.status(200).json(book);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// =========================
// SUPPRIMER UN LIVRE
// =========================

app.delete("/api/books/:id", auth, async (req, res) => {
  try {
    const deletedBook = await Book.findByIdAndDelete(req.params.id);

    if (!deletedBook) {
      return res.status(404).json({
        message: "Livre non trouvé",
      });
    }

    res.status(200).json({
      message: "Livre supprimé",
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// =========================
// AJOUTER UN LIVRE
// =========================

app.post("/api/books", auth, multer, sharp, async (req, res) => {
  try {
    const book = new Book({
      ...req.body,
      imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename}`,
    });

    const savedBook = await book.save();

    res.status(201).json(savedBook);
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

// =========================
// CONNEXION MONGODB
// =========================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connecté !");
  })
  .catch((error) => {
    console.error("Erreur de connexion MongoDB :", error);
  });

// =========================
// DÉMARRAGE SERVEUR
// =========================

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});