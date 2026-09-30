const {z}=require("zod")
const contactSchema = z.object({
    Phone_no: z
        .string()
        .min(1, "Can't be left empty")
        .regex(/^\d+$/, "Must be a number") // Ensures only digits
        .min(10, "Phone number is too short")
        .max(15, "Phone number is too long")
});
module.exports=contactSchema;