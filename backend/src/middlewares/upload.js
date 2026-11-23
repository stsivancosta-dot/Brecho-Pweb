const multer = require("multer");
const path = require("path");
const AppError = require("../errors/app-error");

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function uploadsDir(subfolder) {
  return path.join(__dirname, "..", "..", "..", "uploads", subfolder);
}

function buildStorage(subfolder) {
  return multer.diskStorage({
    destination(req, file, cb) {
      cb(null, uploadsDir(subfolder));
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e6);
      cb(null, unique + ext);
    }
  });
}

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, "TIPO_INVALIDO", "Apenas imagens JPG, PNG ou WebP são aceitas."));
  }
}

const uploadPerfil = multer({
  storage: buildStorage("perfis"),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter
});

const uploadAnuncio = multer({
  storage: buildStorage("anuncios"),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter
});

module.exports = { uploadPerfil, uploadAnuncio };
