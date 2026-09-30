const express=require("express");
const router=express.Router();
const {products,getallproducts,delete_products,getoneproduct}=require("../Controllers/product_controllers.js")
const token_mw=require("../middleware/token_mw")
const validate = require("../middleware/zod_mw.js");
const productSchema = require("../Validations/product_validations.js");
const restrictTo = require("../middleware/auth.js");
const {product_limiter,user_rate_limit}=require("../middleware/rate_limit.js");

const uploadImage = require("../middleware/multer_eh,.js");


// router
router.post("/products",
    token_mw,
    product_limiter,
    user_rate_limit,
    uploadImage,
    validate(productSchema),

    restrictTo("Admin","admin","ADMIN"),
    
    products);

// console.log("WHAT DID WE IMPORT?", require("../Controllers/product_controllers.js"));


router.get("/products",token_mw,getallproducts);
router.get("/product/:id",token_mw,getoneproduct)
router.delete("/product/:id",token_mw,restrictTo("Admin"),delete_products);
module.exports=router;