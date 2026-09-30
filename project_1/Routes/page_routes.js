const express=require("express");
const router=express.Router();
const {home,about,careers,help}=require("../Controllers/page_controllers.js")

router.get("/",home);

router.get("/about",about);

router.get("/careers",careers);

router.get("Help",help);

module.exports=router;