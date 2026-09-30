const express=require("express");
const router=express.Router();
const {cart,get_cart,update_cart,delete_cart}=require("../Controllers/cart_controllers.js")
const token_mw=require("../middleware/token_mw")
const validate = require("../middleware/zod_mw.js");
const cartSchema = require("../Validations/cart_validations.js");
const restrictTo = require("../middleware/auth.js");
const {cart_limiter,user_rate_limit}=require("../middleware/rate_limit.js");

const uploadImage = require("../middleware/multer_eh,.js");


// router
router.post("/cart",
    token_mw,
    cart_limiter,
    user_rate_limit,
    uploadImage,
    validate(cartSchema),

    // restrictTo("Admin","admin","ADMIN"),
    
    cart);

// console.log("WHAT DID WE IMPORT?", require("../Controllers/product_controllers.js"));


router.get("/cart",token_mw,cart_limiter,user_rate_limit,get_cart);
// router.get("/category/:id",token_mw,getonecategory)
router.patch("/cart/:productId",token_mw,update_cart)
router.delete("/cart/:productId",token_mw,delete_cart);
module.exports=router;