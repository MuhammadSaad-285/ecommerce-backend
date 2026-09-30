const prisma=require("../prismaClient.js")
const asynchandler=require("../utils/asynchandler.js")
// const apperror=require("../utils/Apperror.js")
const responsehandler=require("../utils/responsehandler.js")

const contacts=asynchandler(async (req,res,next)=>{
    console.log("BODY:", req.body);
    console.log("Contact route hit");
    const {Phone_no}=req.body;
    const {id}=req.user;
    const data=await prisma.contacts.create({
        data:{
            Phone_no,
            user:{
                connect : 
                {id:id}
            }
        },
    })
    console.log("Inserted",data);
    const responseData = {
        ...data,
        Phone_no: data.Phone_no.toString() 
    };
    responsehandler(res,{data:responseData},201,"Contact has been added")
});

const getallcontacts=asynchandler(async(req,res,next)=>{
    console.log("Contacts pagination hit...");
    const page=(req.query.page)||1;
    const limit=(req.query.limit)||10;

    const pagecheck=(page < 1) ?1 :page;
    const limitcheck=(limit<1) ?10 :limit;
    const skiprows=(pagecheck-1)*limitcheck;

    const [contacts,countallcontacts]= await prisma.$transaction([
        prisma.contacts.findMany({
            skip:skiprows,
            take:Number(limitcheck),
            orderBy:{id:"desc"}
        }),
        prisma.contacts.count()
    ]);

    const total_pages=Math.ceil(countallcontacts/limitcheck);

    responsehandler(res,{
        metadata:{
           page:pagecheck,
           limit:limitcheck,
           contacts:countallcontacts,
           pages:total_pages,
        },data:contacts},201,"Contacts loaded...");
})

module.exports={contacts,getallcontacts};