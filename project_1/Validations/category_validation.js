const {z}=require("zod")
const category_schema=z.object({
    name:z
    .string()
    .trim()
    .min(1,"Category should be placed")
})

module.exports=category_schema
    