const sharp = require("sharp");
const fs = require("fs");

module.exports = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const optimizedPath = `${req.file.path}-optimized.jpg`;

  sharp(req.file.path)
    .resize(800)
    .jpeg({ quality: 80 })
    .toFile(optimizedPath)
    .then(() => {
      fs.unlinkSync(req.file.path);

      req.file.path = optimizedPath;
      req.file.filename = `${req.file.filename}-optimized.jpg`;

      next();
    })
    .catch((error) => {
      res.status(500).json({
        error: error.message
      });
    });
};