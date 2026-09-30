const express=require("express")
const router=express.Router()
const token_mw = require("../middleware/token_mw");
const restrictTo = require("../middleware/auth.js");
const order_status=require("../Controllers/order_status_controllers.js")

router.patch("/order/:OrderId/status",token_mw,restrictTo("Admin"),order_status);
module.exports=router