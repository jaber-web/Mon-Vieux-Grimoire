const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      message: "Utilisateur créé !"
    });
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

module.exports = router;