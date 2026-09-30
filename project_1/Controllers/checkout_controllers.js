// Cart
//  ↓
// check cart empty
//  ↓
// lock products
//  ↓
// check available stock
//  ↓
// calculate total
//  ↓
// create Payment(PENDING)
//  ↓
// create Order(PENDING)
//  ↓
// create OrderItems snapshot
//  ↓
// reserve stock
//  ↓
// COMMIT

const { Prisma } = require("@prisma/client");
const prisma = require("../prismaClient");
const apperror = require("../utils/Apperror");
const asynchandler = require("../utils/asynchandler");
const responsehandler = require("../utils/responsehandler");
const createJazzCashPayment=require("../utils/jazzcash_payment.js")

const checkout=asynchandler(async(req,res,next)=>{
    const {id}=req.user;
    const {Name,Phone,Address,City,postalCode}=req.body
    const result=await prisma.$transaction(async(tx)=>{
            const cart=await tx.Cart.findMany({
                where:{
                    userId:id
                },
                include:{
                    product:true
                }
            })

            if(!Phone||!Name||!Address||!City){
                return next(new apperror("Please fill address details correctly"))
            }

            if(cart.length===0){
               throw new Error("Cart is empty")
            }

            for(const item of cart){
                await tx.$executeRaw`
                SELECT id 
                FROM "product"
                WHERE id=${item.productId}
                FOR UPDATE`
            }

            for(const item of cart){
                const available_stock=item.product.stock-item.product.reservedStock

                if(available_stock<item.quantity){
                    throw new Error(`Not enough stock for ${item.product.name}`)
                }
              }

            const total=cart.reduce((sum,item)=>{
                return sum+item.product.price*item.quantity},0)

            const payment=await tx.Payment.create({
                data:{
                    userId:id,
                    amount:total,
                    status:"PENDING",
                    method:"JAZZCASH",
                    provider:"JAZZCASH"
                }
            })

            const order=await tx.Order.create({
                data:{
                    userId:id,
                    paymentId:payment.id,
                    amountPaid:total,
                    status:"PENDING",

                    Name:Name,
                    Phone:Phone,
                    Address:Address,
                    City:City,
                    postalCode:postalCode
                }
            })
            
            for(const item of cart){
                    await tx.OrderItem.create({
                        data:{
                            orderId:order.id,
                            productId:item.productId,
                            name:item.product.name,
                            price:item.product.price,
                            quantity:item.quantity,
                            subtotal:item.product.price*item.quantity
                        }
                    })
            }
            
            for(const item of cart){
                await tx.product.update({
                    where:{
                        id:item.productId
                    },data:{
                        reservedStock:{
                            increment:item.quantity
                        }
                    }
                })
            }
            const jazzcash=createJazzCashPayment({
                paymentId:payment.id,
                amount:total
            })
            return{
                orderId:order.id,
                paymentId:payment.id,
                amount:total
            }         
},{isolationLevel
    :Prisma.TransactionIsolationLevel.Serializable,
    timeout:3000})
    responsehandler(res,result,200,"Order created proceed to payment")
});

module.exports=checkout;

// ### Checkout Flow — Step by Step

// 1. Get the logged-in user's `id` from `req.user`.

// 2. Start a database transaction using Prisma.

// 3. Get all cart items belonging to that user.

// 4. Include each cart item's product information.

// 5. Check if the cart is empty.

//    * If empty → throw `Cart is empty`.

// 6. Lock each product row using `FOR UPDATE`.

//    * This prevents concurrent checkout transactions from modifying the same product at the same time.

// 7. Calculate available stock:

//    * `availableStock = stock - reservedStock`

// 8. Check whether enough stock is available.

//    * If not enough → throw an error.

// 9. Calculate the total order amount:

//    * `product price × quantity`

// 10. Create a `Payment` record.

//     * Status = `PENDING`
//     * Method = `ONLINE`
//     * Provider = `JazzCash`

// 11. Create an `Order` record.

//     * Status = `PENDING`
//     * Connect it with the user and payment.

// 12. Create `OrderItem` records for every cart item.

//     * Save product ID
//     * Save product name
//     * Save purchase-time price
//     * Save quantity
//     * Save subtotal

// 13. Reserve the required stock.

//     * `reservedStock += quantity`

// 14. Return:

//     * `orderId`
//     * `paymentId`
//     * `amount`

// 15. Commit the transaction.

// 16. Customer can now proceed to JazzCash payment.

// ### Important

// * We reserve stock at checkout.
// * We do NOT call JazzCash inside the database transaction.
// * Order remains `PENDING` until payment is successfully verified.
// * After JazzCash payment succeeds, the callback will trigger the order processing flow.
