const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const prisma=require("../prismaClient.js")
const asynchandler=require("../utils/asynchandler.js")
const responsehandler=require("../utils/responsehandler.js")
const apperror=require("../utils/Apperror.js")
// const env=require("dotenv").config()

const signup=asynchandler(async (req,res,next)=>{ 
        console.log("Signup data hit...") 
        const {username,Password}=req.body 
        const hashedpassword=await bcrypt.hash(Password,12);
        const data=await prisma.users.create({ 
            data:{ 
                username, 
                Password:hashedpassword,
                role:"User" 
            } 
        }) 
        console.log("Inserted :",data); 
        responsehandler(res,{username:data.username,role:data.role},201,"Successfully data created")
});

const login=asynchandler(async(req,res,next)=>{
        console.log("1. Login started");
    console.log("Login data hit...")
         console.log("2. body started");
    const {username,Password}=req.body
    const user=await prisma.users.findUnique({
        where:{ username }
    })
    console.log("3. User query finished");
    // console.log("USER FROM DATABASE:", user);
    if(!user){
        return next(new apperror("Invalid user",400))
        }
    

    const compare=await bcrypt.compare(Password,user.Password)
    
    if (!compare){
        return next(new apperror("Verification failed",400))
        }
        
    

    const token=jwt.sign(
        {id:user.id,username:user.username,role:user.role},
        process.env.JWT_SECRET,
        {expiresIn:"1h"}
    )

    const refresh_token=jwt.sign(
        {id:user.id},
        process.env.JWT_refresh_token,
        {expiresIn:"7d"}
    )

    await prisma.RefreshToken.create({
        data:{
                userId:user.id,
                token:refresh_token,
                expiresAt:new Date(Date.now() + 7*24*60*60*1000)

        }
    });

    res.cookie("refreshToken",refresh_token,{
        httpOnly:true,
        secure:process.env.Node_ENV === "PRODUCTION",
        sameSite:"lax",
        maxAge:7*24*60*60*1000,
        path:"/"
    })

    console.log("Inserted :",user);

    responsehandler(res,{username:username,token:token},200,"Successfully logged in... ")
});

const refreshtoken=asynchandler(async(req,res,next)=>{
    console.log("Refresh route hit")
    const {refreshToken}=req.cookies;
    if(!refreshToken){
        return next(new apperror("No token present",404));
    }
    const refresh_token_verify=jwt.verify(
        refreshToken,
        process.env.JWT_refresh_token
    )
    
    const check_token=await prisma.RefreshToken.findUnique({
        where:{
            token:refreshToken
        }
    })

    if(!check_token){
        return next(new apperror("No token present",404))
    }

    if(check_token.expiresAt<new Date()){
        return next(new apperror("Token expire",401))
    }

    await prisma.RefreshToken.delete({
        where:{
            token:refreshToken
        }
    })

    const newtoken=jwt.sign({
        id:refresh_token_verify.id},
        process.env.JWT_SECRET,
        {expiresIn:"1h"})

    const new_refresh_token=jwt.sign(
        {id:refresh_token_verify.id},
        process.env.JWT_refresh_token,
        {expiresIn:"7d"}
    )

    await prisma.RefreshToken.create({
        data:{
                userId:refresh_token_verify.id,
                token:new_refresh_token,
                expiresAt:new Date(Date.now() + 7*24*60*60*1000)

        }
    });

    res.cookie("refreshToken",new_refresh_token,{
        httpOnly:true,
        secure:process.env.Node_ENV==="PRODUCTION",
        sameSite:"lax",
        maxAge:7*24*60*60*1000
    })

    responsehandler(res,{token:newtoken},201,"Success new token generated")
})

const logout=asynchandler(async(req,res,next)=>{
    const {refreshToken}=req.cookies
    if(!refreshToken){
        return next(new apperror("Refresh token doesnt provided",400))
    }
    await prisma.RefreshToken.delete({
        where:{
            token:refreshToken
        }
    })

    res.clearCookie("refreshToken",{
        httpOnly:true,
        secure:process.env.Node_ENV==="PRODUCTION",
        sameSite:"lax",
        path:"/"
    })
    responsehandler(res,null,200,"Logged out")
});


// console.log("AUTH ROUTES LOADED",refreshtoken);
module.exports={
    signup,
    login,
    refreshtoken,logout
}