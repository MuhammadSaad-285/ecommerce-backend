const express=require("express");
const router=express.Router();
const {contacts,getallcontacts}=require("../Controllers/contacts_controllers.js")
const token_mw=require("../middleware/token_mw")
const validate = require("../middleware/zod_mw.js");
const contactSchema = require("../Validations/contact_validations.js");

// contacts
router.post("/contacts",token_mw,validate(contactSchema),contacts);
router.get("/contacts",token_mw,getallcontacts);

module.exports=router;