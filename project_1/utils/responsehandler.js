const { users } = require("../prismaClient");
const token=require("../middleware/token_mw.js")

const responsehandler=(res,data,statusCode=200,message='Success')=>{
    return res.status(statusCode).json({
        message:"Success",
        data:data,
        token:token
    })
};

module.exports=responsehandler;