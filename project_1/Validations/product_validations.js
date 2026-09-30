const {z}=require("zod")
// const { product } = require("../prismaClient")
const productSchema=z.object({
    // username:z
    // .string()
    // .min(1,"Username cant be empty")
    // .max(10,"Maximum 10 characters")
    // .trim()
    // .regex(/[A-Z]/,"Must have capital letters"),
    name:z
    .string()
    .trim()
    .min(1,"Product should be placed"),
     
    price:z
    .coerce.number(),

    stock:z
    .coerce.number(),
    
    categoryId:z.coerce.number()
})
    

module.exports=productSchema;