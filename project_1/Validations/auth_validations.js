const {z}=require("zod")
const signup_validator=z.object({
    username:z
    .string()
    .min(3,"Must be st least 3 characters")
    .max(15,"Word Limit hits")
    .regex(/[A-Z]/,"Must have capital letter")
    .regex(/[0-9]/,"Must have a number"),
    Password:z
    .string()
    .min(8,"Password must be at least 8 characters")
})

const login_validator=z.object({
    username:z
    .string()
    .min(1,"Username required"),
    Password:z
    .string()
    .min(1,"Password required")
})

module.exports={
    signup_validator,
    login_validator,
}