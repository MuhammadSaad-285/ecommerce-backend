const jwt=require("jsonwebtoken")

const token_mw=(req,res,next)=>{
    const auth=req.headers.authorization;
    try{
        if(!auth){
            return res.status(400).json({
                message:"Token required..."
        })
    }
        const token=auth.split(" ")[1];
        if(!token){
            return res.status(400).json({
                message:"Invalid input"
        })
    }

    const verify=jwt.verify(token,process.env.JWT_SECRET);
        console.log(verify);
    req.user=verify;
    console.log(verify);
    next()
    }catch(error){
        res.status(400).json({
           message:error.message,
        })
    }
}

// console.log("Verify SECRET:", process.env.JWT_SECRET);

module.exports=token_mw;