const express=require("express")
const router=express.Router()
const token_mw = require("../middleware/token_mw");
// const asynchandler = require("../utils/asynchandler");
const {order,get_order}=require("../Controllers/order_controller.js")

router.post("/order",token_mw,order);
router.get("/order",token_mw,get_order)
module.exports=router