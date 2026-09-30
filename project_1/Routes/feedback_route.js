const express=require("express");
const router=express.Router();
const {feedback_controller}=require("../Controllers/feedback_controllers.js")
const token_mw=require("../middleware/token_mw")
const validate = require("../middleware/zod_mw.js");
const feedbackSchema = require("../Validations/feedback_validations.js");

// feedback
router.post("/feedback",token_mw,validate(feedbackSchema),feedback_controller)
module.exports=router;