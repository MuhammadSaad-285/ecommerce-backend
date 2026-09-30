// const { includes } = require("zod")
// const { error } = require("winston")
// const { includes } = require("zod")
const prisma = require("../prismaClient")
const order_service = require("./order_services")
// const apperror = require("../utils/Apperror")

const dlq_services=async(paymentId,orderId,userId,idempotencyKey)=>{
    const order=await prisma.Order.findUnique({
        where:{
            id:orderId
        },include:{
            items:true,
            payment:true
        }
    })

    if(!order){
        throw new error("Order not found")
    }
    if(order.userId!=userId){
        throw new error("Invalid user")
    }
    if(order.paymentId!=paymentId){
        throw new error("Invalid payment")
    }
    if(order.status=="CONFIRMED"){
        return await order
    }
    if(order.payment.status=="FAILED"){
        return await cancelorder(orderId)
    }

    if(order.payment.status=="PAID"){
        try{
        await order_service(paymentId,orderId,userId,idempotencyKey)
        }catch(error){
            console.log(`Error Order ${orderId} can not be recovered`)
            return await cancelorder(orderId)       
        }
    }
    throw new error(`Unexpected payment status ${order.payment.status}`)
}

const cancelorder=async(orderId)=>{
    return await prisma.$transaction(async(tx)=>{
        const order=await tx.Order.findUnique({
            where:{
                id:orderId
            },include:{
                items:true,
                payment:true
            }
        })

        if(!order){
           throw new error("Order not found")
        }
        
        for(const item of order.items){
            await tx.$executeRaw`SELECT id FROM "product" WHERE id=${item.productId} FOR UPDATE`
        }

        if(order.status=="CANCELLED"){
            return order
            }
        
        for(const item of order.items){
            await tx.product.update({
                where:{
                    id:item.productId
                },data:{
                    reservedStock:{
                        decrement:item.quantity
                    }
                }
            })
        }

        const cancel_order=await tx.Order.update({
            where:{
                id:orderId
            },data:{
                status:"CANCELLED"
            }
        })
        if(order.payment.status=="PAID"){
            await tx.Payment.update({
            where:{
                id:order.paymentId
            },data:{
                status:"REFUND_PENDING"
            }
         })
        }
        

        return cancel_order
    })
}

module.exports=cancelorder;

    //          dlq_services()
    //                 │
    //                 ▼
    //           Find Order
    //           + Items
    //           + Payment
    //                 │
    //                 ▼
    //          Validate Order
    //                 │
    //     ┌───────────┼───────────┐
    //     ▼           ▼           ▼
    // Order exists  User valid  Payment valid
    //     │           │           │
    //     └───────────┼───────────┘
    //                 ▼
    //        Is Order CONFIRMED?
    //             │       │
    //            YES      NO
    //             │       │
    //             ▼       ▼
    //           RETURN  Check Payment
    //                      │
    //             ┌────────┴────────┐
    //             ▼                 ▼
    //          FAILED              PAID
    //             │                 │
    //             ▼                 ▼
    //       cancelorder()      order_service()
    //                               │
    //                               ▼
    //                         Can recover?
    //                           │      │
    //                          YES     NO
    //                           │       │
    //                           ▼       ▼
    //                       CONFIRMED cancelorder()

        //          cancelorder()
        //            │
        //            ▼
        //   START TRANSACTION
        //            │
        //            ▼
        //   Find Order + Items
        //            │
        //            ▼
        // Already CANCELLED?
        //      │          │
        //     YES         NO
        //      │           │
        //      ▼           ▼
        //    RETURN   Lock Products
        //                 │
        //                 ▼
        //         Release reservedStock
        //                 │
        //                 ▼
        //          Order → CANCELLED
        //                 │
        //                 ▼
        //         Payment status?
        //             │        │
        //            PAID    FAILED
        //             │        │
        //             ▼        ▼
        //    REFUND_PENDING   DONE
        //             │
        //             ▼
        //            COMMIT