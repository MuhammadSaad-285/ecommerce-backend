const {z}=require("zod")

const checkout_val=z.object({
    Name:z
       .string()
       .min(1,"Name is missing"),
    
    Phone:z.coerce.number(),

    Address:z 
       .string()
       .min(1,"Address field is missing"),

    City:z
    .string()
    .min(1,"City field is missing"),

    postalCode:z.coerce.number()

})

module.exports=checkout_val;