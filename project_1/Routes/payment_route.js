const express=require("express");
const router=express.Router();
const payment=require("../Controllers/payment_controllers.js")
const token_mw=require("../middleware/token_mw")
// const validate = require("../middleware/zod_mw.js");
// const cartSchema = require("../Validations/cart_validations.js");
const restrictTo = require("../middleware/auth.js");
const {user_rate_limit}=require("../middleware/rate_limit.js");
const jazzcash_callback=require("../Controllers/callback_controller.js")
const uploadImage = require("../middleware/multer_eh,.js");

// router
router.post("/payment",
    token_mw,
    // checkout_limiter,
    user_rate_limit,
    uploadImage,
    payment)

router.post("/jazzcash/callback",jazzcash_callback)

module.exports=router;