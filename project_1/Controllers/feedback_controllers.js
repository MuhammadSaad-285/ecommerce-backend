const prisma=require("../prismaClient.js")
const asynchandler=require("../utils/asynchandler.js")
// const apperror=require("../utils/Apperror.js")
const responsehandler=require("../utils/responsehandler.js")

const feedback_controller=asynchandler(async(req,res,next)=>{
        console.log("Feedback route hit");
        const {feedback}=req.body;
        const {id}=req.user;
        const data=await prisma.feedback.create({
            data:{
                feedback:feedback,
                user:{
                    connect:{id:id}
                }
            },
        })
        console.log("INSERTED:", data);
        responsehandler(res,{data:data.feedback},201,"Feedback added")
});
// console.log("feedback:", feedback_controller);


module.exports={feedback_controller};