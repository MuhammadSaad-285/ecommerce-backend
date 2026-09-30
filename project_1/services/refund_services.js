// const { includes } = require("zod");
const prisma = require("../prismaClient");
// const { error } = require("winston");
const axios = require("axios");
const {createJazzCashHash,paymentInquiry} = require("../utils/jazzcash");

const refund_order=async(paymentId,orderId,userId)=>{
    const payment=await prisma.Payment.findUnique({
    where:{
        id:paymentId
    },include:{
        order:true
    }
  })

   if(!payment){
    throw new Error("Payment not verified")
   }

   if(!payment.order){
    throw new Error("Order not found")
   }

   if(payment.order.id!==orderId){
    throw new Error("Order not found")
   }

   if(payment.userId!==userId){
    throw new Error("Id not found")
   }

   if(payment.status==="REFUNDED"){
    return payment
   }

   if(payment.status!=="REFUND_PENDING"){
    throw new Error(`Unexpected status:${payment.status}`)
   }
   
   if(!payment.providerPaymentId){
    throw new Error("Provider id not verified")
   }
   
    const inquiry = await paymentInquiry(
        payment.providerPaymentId
    );

    if (inquiry.responseCode === "131") {

        return await prisma.Payment.update({
            where: {
                id: paymentId
            },
            data: {
                status: "REFUNDED"
            }
        });
    }

   const refund_data={
            pp_TxnRefNo:payment.providerPaymentId,
            pp_Amount:Math.round(payment.amount*100),
            pp_TxnCurrency:"PKR",
            pp_MerchantID:process.env.JAZZCASH_MERCHANT_ID,
            pp_Password:process.env.JAZZCASH_PASSWORD
   }

   refund_data.pp_SecureHash=createJazzCashHash(refund_data)

   const response=await axios.post(
        process.env.JAZZCASH_REFUND_URL,{
            RefundRequest:refund_data
    },{
        headers:{
            "Content-Type":"application/json"
        }
     }
   )

   const result=response.data
   if(result.responseCode !=="000"){
    throw new Error("Jazzcash refund failed")
   }

   const update_payment=await prisma.Payment.update({
    where:{
        id:paymentId
    },data:{
        status:"REFUNDED"
    }
   })
   return update_payment
}
module.exports=refund_order

// DLQ / Refund Worker
//         ↓
// refund_service()
//         ↓
// Payment find karo
//         ↓
// Order verify karo
//         ↓
// User verify karo
//         ↓
// Payment status check
//         ↓
// REFUND_PENDING hona chahiye
//         ↓
// Provider Transaction ID check
//         ↓
// Payment Inquiry
//         ↓
// Already Refunded?
//    YES ↓       ↓ NO
//  REFUNDED    Refund API
//                ↓
//           responseCode 000?
//              YES ↓
//          Payment → REFUNDED