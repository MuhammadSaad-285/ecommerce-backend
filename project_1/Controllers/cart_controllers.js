const prisma = require("../prismaClient");
const { connect } = require("../Routes/category_route");
const apperror = require("../utils/Apperror");
const asynchandler = require("../utils/asynchandler");
const responsehandler = require("../utils/responsehandler");

const cart=asynchandler(async(req,res,next)=>{
    const {id}=req.user;
    const {productId,quantity}=req.body;

    if(!quantity || Number(quantity)<1){
        return next(new apperror("No quantity present",404))
    }

    const product=await prisma.product.findUnique({
        where:{
            id:Number(productId)
        }
    })
    if(!product){
        return next(new apperror("No product found",404))
    }
    
  
    const cart_check=await prisma.Cart.findUnique({
        where:{
            userId_productId:{
                userId:id,
                productId:Number(productId)
            }
        
        }
    })
    
    if(cart_check){
        const total_quantity=cart_check.quantity+Number(quantity)
        if(total_quantity>product.stock){
            return next(new apperror("Not enough stock"))
        }
        const cart_update=await prisma.Cart.update({
                where:{
                    userId_productId:{
                            productId:Number(productId),
                            userId:id
                    }
                },
                data:{
                    quantity:total_quantity,
                }
            })
        return responsehandler(res,cart_update,200,"Exists already and updated")
    }

    if(!cart_check){
        const create_cart=await prisma.Cart.create({
            data:{
                userId:id,
                productId:Number(productId),
                quantity:Number(quantity)
            }
        })
        return responsehandler(res,create_cart,201,"Added to cart")
    }
})

const get_cart=asynchandler(async(req,res,next)=>{
    const id=req.user.id;
    const data=await prisma.Cart.findMany({
        where:{
            userId:id
        },
        select:{
            quantity:true,
            productId:true,
            product:{
                select:{
                    name:true,
                    price:true,
                    stock:true,
                    category:{
                        select:{
                            name:true,
                            id:true
                        }
                    }
                }
             }
           }
         })
     
        const cartItems = data.map((cartitem) => {

        const itemTotal = cartitem.product.price * cartitem.quantity;

        return {
            ...cartitem,
            itemTotal
        };
    });

    const cartTotal = cartItems.reduce((total, cartitem) => {
        return total + cartitem.itemTotal;
    }, 0);

    const result = {
        cartitems: cartItems,
        cartTotal: cartTotal
    };
    return responsehandler(res,result,200,"Cart fetched")
})

const update_cart=asynchandler(async(req,res,next)=>{
    const {id}=req.user;
    const productId=Number(req.params.productId);
    const {quantity}=req.body;
    if(!quantity || quantity<1){
        return next( new apperror("Quantity doesn't exist"))
    }
    
    const data=await prisma.Cart.findUnique({
            where:{
                userId_productId:{
                    userId:id,
                    productId:productId
                }
            }
        })

        if(!data){
            return next (new apperror("Not found",404))
        }

        const product=await prisma.product.findUnique({
            where:{
                id:productId
            }
        })

        if(!product){
            return next(new apperror("No product found",404))
        }

        if(product.stock<Number(quantity)){
           return next(new apperror("Not enough stock",400))
        }

        const data1=await prisma.Cart.update({
            where:{
                userId_productId:{
                     userId:id,
                     productId:productId
                }
            ,data:{
                quantity:Number(quantity)
            }}
        })
        return responsehandler(res,data1,200,"Updated successfully")
})

const delete_cart=asynchandler(async(req,res,next)=>{
    const {id}=req.user
    const productId=Number(req.params.productId);
    const cart_item=await prisma.Cart.findUnique({
        where:{
            userId_productId:{
                userId:id,
                productId:productId
            }
        }
    })
    if(!cart_item){
        return next(new apperror("Product doesnt exist in cart",404))
    }
    const cart_delete=await prisma.Cart.delete({
        where:{
            userId_productId:{
                userId:id,
                productId:productId
            }
        }
    })
    return responsehandler(res,cart_delete,200,"Deleted successfully")
})
module.exports={cart,get_cart,update_cart,delete_cart};