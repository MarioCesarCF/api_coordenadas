import multer from "multer";

const ALLOWED_MIMES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "text/xml",
  "application/xml",
];

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".xml"];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf("."));
  if (ALLOWED_EXTENSIONS.includes(ext) || ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const err = new Error("Formato de arquivo não suportado. Use: xlsx, xls, csv ou xml.");
    err.status = 400;
    cb(err);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export default upload;
