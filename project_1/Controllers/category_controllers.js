const asynchandler = require("../utils/asynchandler");
const prisma=require("../prismaClient.js")
const responsehandler = require("../utils/responsehandler");
const { setcache, getcache, acquireLock, releaseLock,deletecache } = require("../middleware/cache_service.js");
const apperror = require("../utils/Apperror.js");

const category=asynchandler(async(req,res,next)=>{
    const {name}=req.body;
    // const {id}=req.user;
    const data=await prisma.Category.create({
        data:{
            name:name,
            // id:id
        }
    })
    await deletecache("category:all");
    responsehandler(res,{data:name},201,"Created successfully")
})

const getallcategories=asynchandler(async(req,res,next)=>{
    const key=`category:all`
    const lockkey=`lock:category:all`
    const cachedcategory=await getcache(key)
    if(cachedcategory){
        return responsehandler(res,cachedcategory,200,"Cache hit")
    }
    const lock = await acquireLock(lockkey,10)
    if(!lock){
        await new Promise(resolve=>setTimeout(resolve,60))
    

    const retrycache=await getcache(key)
    if(retrycache){
        return responsehandler(res,retrycache,200,"Cache hit...")
    }
    return next(new apperror("Failed to fetch data",503))
    }
    try{
    const data=await prisma.Category.findMany({
        orderBy:{
            name:"asc"
        }
    })
    await setcache(key,data,60)
    return responsehandler(res,data,200,"Fetched: ")

}finally{
    await releaseLock(lockkey)
   }
})

const getonecategory=asynchandler(async(req,res,next)=>{
    const id=Number(req.params.id);
    const key=`category:${id}`
    const lockkey=`lock:category:${id}`
    const cached_category=await getcache(key)
    if(cached_category){
        return responsehandler(res,cached_category,200,"Cache hit")
    }
    const lock=await acquireLock(lockkey,10)
    if(!lock){
        await new Promise(resolve=>setTimeout(resolve,50))
    
    const retrycache=await getcache(key)
    if(retrycache){
        return responsehandler(res,retrycache,200,"Cache hit")
    }
    return next (new apperror("Cache miss",503))
    }
    try{
      const data=await prisma.Category.findUnique({
        where:{
            id:id
        }
    })
    if(!data){
        return next (new apperror("Category not found",404))
    }
    await setcache(key,data,60)
    return responsehandler(res,data,200,"Category fetched: ")
    }finally{
        await releaseLock(lockkey)
    }
});

const updatecategory=asynchandler(async(req,res,next)=>{
    const {id}=req.params;
    const {name}=req.body;
    const data=await prisma.Category.update({
        where:{
            id:Number(id)
        },
        data:{
            name:name
        }
    })
    const key=`category:${id}`
    await deletecache(`category:${id}`);
    await deletecache("category:all");
    // await deleteListCache()
    await setcache(`category:${id}`,data,60);
    responsehandler(res,{data:name},201,"Updated successfully...")
})

const delete_category=asynchandler(async(req,res,next)=>{
    const id=Number(req.params.id);
    const product_count=await prisma.product.count({
        where:{
            categoryId:id
        }
    })
    if(product_count>0){
        return next(new apperror("Cant be deleted as product exist",400))
    }


    const data=await prisma.Category.delete({
        where:{
            id:id
        }
    })
    const key=`category:${id}`
    await deletecache(key);
    await deletecache("category:all");
    responsehandler(res,{data:data},200,"Deleted successfully")
})

module.exports={category,getallcategories,getonecategory,updatecategory,delete_category}