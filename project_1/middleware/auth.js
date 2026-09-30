const apperror = require("../utils/Apperror")

const auth_RBAC=(...allowedroles)=>{
    return (req,res,next)=>{
        if (!req.user){
            return next(new apperror("Invalid command failed to find",401))
        }
        
        if(!allowedroles.includes(req.user.role)){
            return next(new apperror("Access denied",403))
        }
        next()
    }
   
};
module.exports=auth_RBAC