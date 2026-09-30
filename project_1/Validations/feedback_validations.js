const {z}=require("zod")
const feedbackSchema=z.object({
    feedback:z
    .string()
    .trim()
    .min(1,"Feedback should be given")
    .max(100,"Word limit hit")
})
module.exports=feedbackSchema;