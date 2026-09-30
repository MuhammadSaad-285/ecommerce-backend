const express=require("express");
const router=express.Router();
const {signup,login,refreshtoken,logout}=require("../Controllers/auth_controllers.js")
const {login_validator,signup_validator} = require("../Validations/auth_validations.js");
const validate = require("../middleware/zod_mw.js");
const { login_limiter } = require("../middleware/rate_limit.js");

// Signup route
router.post("/signup",validate(signup_validator),signup);

// Login route
router.post("/login",login_limiter,validate(login_validator),login);

// Refresh token
router.post("/refresh",refreshtoken);

// Logout route
router.post("/logout",logout)

module.exports=router;