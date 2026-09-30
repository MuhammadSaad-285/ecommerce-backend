const express=require("express");
const router=express.Router();
const checkout=require("../Controllers/checkout_controllers.js")
const token_mw=require("../middleware/token_mw")
// const validate = require("../middleware/zod_mw.js");
const checkout_val = require("../Validations/checkout_validations.js");
const restrictTo = require("../middleware/auth.js");
const {checkout_limiter,user_rate_limit}=require("../middleware/rate_limit.js");

const uploadImage = require("../middleware/multer_eh,.js");

// router
router.post("/checkout",
    token_mw,
    checkout_limiter,
    user_rate_limit,
    uploadImage,
    checkout)

module.exports=router;