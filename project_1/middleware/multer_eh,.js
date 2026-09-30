const multer = require("multer");
const upload = require("../middleware/upload");

const uploadImage = (req, res, next) => {
    upload.single("image")(req, res, (err) => {

        if (err instanceof multer.MulterError) {

            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    message: "File is too large. Maximum size is 5MB."
                });
            }

            return res.status(400).json({
                message: err.message
            });
        }

        if (err) {
            return res.status(400).json({
                message: err.message
            });
        }

        next();
    });
};

module.exports = uploadImage;