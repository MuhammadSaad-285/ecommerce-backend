const {z}=require("zod")
const cart_schema=z.object({
    quantity:z.coerce.number(),
    productId:z.coerce.number()
})
module.exports=cart_schema;