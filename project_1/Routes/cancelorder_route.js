

const express=require("express");
const router=express.Router();
const cancelOrder=require("../Controllers/cancelorder_controller.js")
const token_mw=require("../middleware/token_mw")
// const validate = require("../middleware/zod_mw.js");
// const categorySchema = require("../Validations/category_validation.js");
// const restrictTo = require("../middleware/auth.js");
// const {category_limiter,user_rate_limit}=require("../middleware/rate_limit.js");

router.patch(
    "/:OrderId/cancel",
    token_mw,
    cancelOrder
);
module.exports=router;