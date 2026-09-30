const prisma = require("../prismaClient");
const apperror = require("../utils/Apperror");
const asynchandler = require("../utils/asynchandler");
const responsehandler = require("../utils/responsehandler");

const admin_order=asynchandler(async(req,res,next)=>{
    const orderId=Number(req.params.OrderId);
    const {status,note}=req.body;
    const allowed_transactions={
        PENDING:["CONFIRMED","CANCELLED"],
        CONFIRMED:["PROCESSING","CANCELLED"],
        PROCESSING:["SHIPPED","CANCELLED"],
        SHIPPED:"DELIVERED"
    }
    const find_order=await prisma.Order.findUnique({
        where:{
            id:orderId
        }
    })

    if(!find_order){
        return next (new apperror("Order not found",404))
    }

    if(allowed_transactions[find_order.status]!==status){
        return next(new apperror(`Not matched ${find_order.status} != ${status}`))
    }

    const result=await prisma.$transaction(async(tx)=>{
        const updated_order=await tx.Order.update({
            where:{
                id:orderId
            },data:{
                status:status
            }
        })

        await tx.OrderStatusHistory.create({
            data:{
                orderId:orderId,
                status:status,
                note:note,
                changedby:req.user.id
            }
        });
        return updated_order
    })
    responsehandler(res,result,200,"Order status updated");
});
module.exports=admin_order;