const express=require("express");
const router=express.Router();
const {category,getallcategories,getonecategory,updatecategory,delete_category}=require("../Controllers/category_controllers.js")
const token_mw=require("../middleware/token_mw")
const validate = require("../middleware/zod_mw.js");
const categorySchema = require("../Validations/category_validation.js");
const restrictTo = require("../middleware/auth.js");
const {category_limiter,user_rate_limit}=require("../middleware/rate_limit.js");

const uploadImage = require("../middleware/multer_eh,.js");


// router
router.post("/category",
    token_mw,
    category_limiter,
    user_rate_limit,
    uploadImage,
    validate(categorySchema),

    // restrictTo("Admin","admin","ADMIN"),
    
    category);

// console.log("WHAT DID WE IMPORT?", require("../Controllers/product_controllers.js"));


router.get("/category",token_mw,getallcategories);
router.get("/category/:id",token_mw,getonecategory)
router.patch("/category/:id",token_mw,updatecategory)
router.delete("/category/:id",token_mw,delete_category);
module.exports=router;