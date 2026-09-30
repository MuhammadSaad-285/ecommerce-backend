const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "project_1/uploads/");
    },

    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// const fileFilter = (req, file, cb) => {
//     if (
//         file.mimetype.startsWith("image/") ||
//         file.mimetype === "application/pdf"
//     ) {
//         cb(null, true);
//     } else {
//         cb(new Error("Only images and PDF files are allowed"), false);
//     }
// };

const upload = multer({ 
    storage,
    limits:{
        fileSize:5*1024*1024
    }
 });

module.exports = upload;