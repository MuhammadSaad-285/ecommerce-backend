const prisma = require("../prismaClient");
const apperror = require("../utils/Apperror");
const asynchandler = require("../utils/asynchandler");
const responsehandler = require("../utils/responsehandler");
const { Prisma } = require("@prisma/client");

const order=asynchandler(async(req,res,next)=>{
    const {productId,quantity}=req.body;
    const {id}=req.user;
    const idempotencykey=req.headers["x-idempotency-key"]

    if (!idempotencykey){
        throw next(new apperror("Idempotency key required"))
    }
    try{
    const data=await prisma.$transaction(async (tx) => {
        await tx.IdempotencyKey.create({
            data:{
                keyId:idempotencykey,
                status:"Processing"
            }
        });

        await tx.$executeRaw`SELECT id  FROM "product" where id=${productId} FOR UPDATE`;

        const product=await tx.product.findUnique({
            where:{
                id:productId
            }
        });

        if(!product){
            throw next(new apperror("Product not found"))
        };

        if(product.stock<quantity){
            throw next (new apperror("Not enough stock"))
        };

        const stock=await tx.product.update({
            where:{
                id:productId
            },
            data:{
                stock: {
                    decrement:quantity
                }
            }
        });

        const create_order=await tx.order.create({
            data:{
                userId:id,
                quantity:quantity,
                amountPaid:product.price * quantity,
                product:{
                    connect:{
                        id:productId,
                    }
                }
            }
        })

        await tx.IdempotencyKey.update({
            where:{
                keyId:idempotencykey
            },
            data:{
                status:"Success"    
          }
        });
        throw new Error("TEST ROLLBACK");

        return create_order
       
    },{
        // isolationLevel:"Serializable",
        isolationLevel:Prisma.TransactionIsolationLevel.Serializable,
        timeout:3000
    
    });

    
    responsehandler(res,
        {productId:data.productId,
        orderId:data.id,
        quantity:data.quantity,
        amountpaid:data.amountpaid},
        201,
        "Order created");

    console.log(data.quantity);
        } catch(error){
           if(error.code==="P2002"){
                throw next(new apperror("Duplicate request ",403))
           }
           if(error.message==="Product not found"){
              throw next(new apperror("Product not found",404))
           }
           if(error.message==="Not enough stock"){
            throw next(new apperror("Not enough stock",403))
           }
           if(error){
            console.log("Transaction failed so rolled back: ", error)
           }
        }
});

const get_order=asynchandler(async(req,res,next)=>{
    const id=Number(req.user.id)
    const data=await prisma.Order.findMany({
        where:{
            userId:req.user.id
        },include:{
            items:{
                include:{
                    product:{
                        select:{
                            name:true,
                            image:true,
                            createdAt:true
                        }
                    }
                }
            },
            orderstatus:true
        },orderBy:{
            createdAt:"desc"
        }
    })
    responsehandler(res,data,200,"Fetched")
})

module.exports={order,get_order};

// const data=await prisma.order.create({
    //     data:{
    //         // productId:productId,
    //         userId:id,
    //         quantity:quantity,
    //         amountPaid:0,
    //         product:{
    //             connect:{
    //                 id:productId
    //             }
    //         }
    //     },
    // })