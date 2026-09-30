const prisma = require("../prismaClient");
const orderQueue = require("../queues/order_queue");
const apperror = require("../utils/Apperror");
const asynchandler = require("../utils/asynchandler");
const { createJazzCashHash } = require("../utils/jazzcash");
const responsehandler = require("../utils/responsehandler");

const jazzcash_callback=asynchandler(async(req,res,next)=>{
    const validhash=createJazzCashHash(req.body);
    if(!validhash){
        return next(new apperror("Hash Failed ",400))
    }
    const {
            pp_TxnRefNo,
            pp_ResponseCode,
            pp_ResponseMessage,
            pp_Amount,
            pp_TxnCurrency,
            pp_MerchantID
    }=req.body;

    if(!pp_TxnRefNo || !pp_TxnRefNo.startsWith("T")){
        return next(new apperror("Reference number not valid",400))
    }

    const paymentId=Number(pp_TxnRefNo.replace("T",""))

    if(!paymentId || !Number.isInteger(paymentId)){
        return next(new apperror("Payment id incorrect or missing",400))
    }

    const payment_db=await prisma.Payment.findUnique({
        where:{
            id:paymentId
        }
    })

    if(!payment_db){
        return next(new apperror("ID do not exist",400))
    }

    if(pp_MerchantID!==process.env.JAZZCASH_MERCHANT_ID){
        return next(new apperror("Merchant id incorrect !",400))
    }

    if(pp_TxnCurrency!=="PKR"){
        return next(new apperror("Currency is incorrect",400))
    }

    const expected_amount=Math.round(payment_db.amount*100)

    if(Number(pp_Amount)!==expected_amount){
        return next(new apperror("Payment amount incorrect",400))
    }

    if(payment_db.status=="PAID"){
        return next(new apperror("Already PAID ",200))
    }

    if(pp_ResponseCode!=="000"){
        await prisma.Payment.update({
            where:{
                id:paymentId
            },data:{
                status:"FAILED"
            }
        })
        return next(new apperror("Payment failed",400))
    }

    await prisma.Payment.update({
        where:{
            id:paymentId
        },data:{
            status:"PAID",
            providerPaymentId:pp_TxnRefNo
        }
    })
    const order = await prisma.Order.findUnique({
    where: {
        paymentId: paymentId
    }
});

if (!order) {
    return next(
        new apperror("Order not found for payment", 404)
    );
}

    await orderQueue.add("Create=order",{
        paymentId:paymentId,
        userId:payment_db.userId,
        orderId:order.id
    })

    responsehandler(res,paymentId,201,"Payment successful...")
})

module.exports=jazzcash_callback

// Customer pays JazzCash
//         ↓
// JazzCash sends callback to our server
//         ↓
// ┌──────────────────────────────┐
// │   JAZZCASH CALLBACK           │
// └──────────────────────────────┘
//         ↓
// 1. Verify Secure Hash
//         ↓
//    "Can I trust this callback?"
//         ↓
// 2. Validate Transaction Reference
//         ↓
//    "Which payment is this?"
//         ↓
// 3. Find Payment in our DB
//         ↓
//    "Does this payment actually exist?"
//         ↓
// 4. Verify Merchant ID
//         ↓
//    "Is this payment for OUR account?"
//         ↓
// 5. Verify Currency
//         ↓
//    "Is it PKR?"
//         ↓
// 6. Verify Amount
//         ↓
//    "Does JazzCash amount match our DB?"
//         ↓
// 7. Check if already PAID
//         ↓
//    "Have we already processed this?"
//         ↓
// 8. Check JazzCash Response Code
//         ↓
//    ┌───────────────┴───────────────┐
//    ↓                               ↓
// FAILED                          SUCCESS (000)
//    ↓                               ↓
// Payment = FAILED              Payment = PAID
//                                    ↓
//                          Save JazzCash TxnRef
//                                    ↓
//                             Find Order
//                                    ↓
//                          Add Order to Queue
//                                    ↓
//                             Order Worker