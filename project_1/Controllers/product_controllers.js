// const { AR_OPERATIONS } = require("redis");
const prisma=require("../prismaClient.js")
const asynchandler=require("../utils/asynchandler.js")
// const apperror=require("../utils/Apperror.js")
const responsehandler=require("../utils/responsehandler.js");
const apperror = require("../utils/Apperror.js");
const { setcache,getcache, deletecache, deleteListCache, acquireLock, releaseLock } = require("../middleware/cache_service.js");
const { promise } = require("zod");
// const { query } = require("winston");
// const { error } = require("winston");


const products=asynchandler(async (req,res,next)=>{
        console.log("Product route hit")
        const {name,price,stock,categoryId}=req.body;
        console.log("BODY:", req.body);
        console.log("FILE",req.file)
        const {id}=req.user;
        const category=await prisma.Category.findUnique({
                where:{
                        id:Number(categoryId)
                }
        })

        if(!category){
                return next(new apperror("Category not found",404))
        }
        const data=await prisma.product.create({
            data:{
                userid:id,
                name:name,
                price:price || 0.00,
                stock:stock || 0,
                categoryId:Number(categoryId),
                image:req.file ?req.file.path :null},
        })
        await deleteListCache();
        responsehandler(res,data.name,201,"Product has been inserted")
});

const getallproducts=asynchandler(async(req,res,next)=>{
        console.log("Products pagination hit ");
        
        const page=(req.query.page)||1;
        const limit=(req.query.limit)||10;
        const search=(req.query.search);
        const minprice=(req.query.minprice);
        const maxprice=(req.query.maxprice);
        const sort=(req.query.sort);
        const categoryId=(req.query.categoryId)

        const checkpages=(page<1) ?1 :page;
        const checklimit=(limit<1) ?10 :limit;

        const skiprows=(checkpages-1)*checklimit;

        const searched={}
        if(search){
                searched.name= {
                        contains:search,
                        mode:"insensitive"
                }
        }

        if(minprice||maxprice){
                searched.price={}
                if(minprice){
                        searched.price.gte=Number(minprice)
                }if(maxprice){
                        searched.price.lte=Number(maxprice)
                }
        }
        if(categoryId){
              searched.categoryId=Number(categoryId)
        }

        let orderby={id:"desc"}
        if(sort==="price_asc"){
                orderby={price:"asc"}
        }
        if(sort==='price_desc'){
                orderby={price:"desc"}
        }
        if(sort==="newest"){
                orderby={createdAt:"desc"}
        }
        if(sort==="oldest"){
                orderby={createdAt:"asc"}
        }

        const key=`products:search:${search || "null"}:category:${categoryId||"all"}:sort:${sort}:minprice:${minprice}:maxprice:${maxprice}:page:${page}:limit:${limit}`;
      console.log("SEARCHED:", searched);
        const cachedproduct=await getcache(key)
        if(cachedproduct){
                return responsehandler(res,cachedproduct,200,"Products: ")
        }
 console.log("DATABASE HIT");
        const [products,countallproducts]=await prisma.$transaction([
               prisma.product.findMany({
                        where:searched,
                        skip:skiprows,
                        select:{name:true,price:true,image:true,
                                category:{
                                        select:{
                                                id:true,
                                                name:true
                                        }
                                }
                        },
                        take:Number(checklimit),
                        orderBy:orderby
               }),
               prisma.product.count({
                  where:searched
               })
        ])

        const total_pages=Math.ceil(countallproducts/checklimit);

        const result={
                metadata:{
                page:checkpages,
                limit:checklimit,
                search:search,
                price:minprice||maxprice,
                product:countallproducts,
                total_pages:total_pages
            },
                data:products
        }
        await setcache(key,result,60)

        responsehandler(res,result,201,"Loaded successfully...")
        
});

const getoneproduct=asynchandler(async(req,res,next)=>{
        const id=Number(req.params.id);
        const key=`product:${id}`;
        const lockkey=`lock:product:${id}`;
        const cachedproduct=await getcache(key);
        
        if(cachedproduct){
                return responsehandler(res,cachedproduct,200,"Data fetched: ")
        }

        const lock=await acquireLock(lockkey,10)
        
        if(!lock){
                await new Promise(resolve =>setTimeout(resolve,50))
        

        const retrycache=await getcache(key)

        if(retrycache){
                return responsehandler(res,retrycache,200,"Product fetched from cache")
        }

        return next(new apperror("Failed to fetch",503));}

        try{

        const data=await prisma.product.findUnique({
                where:{
                        id:id
                },
                select:{
                        id:true,
                        name:true,
                        price:true,
                        image:true,
                        category:{
                                select:{
                                     id:true,
                                     name:true
                                }
                        }
                }
        })

        if(!data){
                return next (new apperror("Failed...",404))
        }

        await setcache(key,data,60)

        responsehandler(res,data,200,"Product fetched: ")
  }finally{
        await releaseLock(lockkey)
  }
});



const delete_products=asynchandler(async(req,res,next)=>{
        const id=Number(req.params.id);
        const data=await prisma.product.delete({
                where:{
                        id:id
                }
        })
        const key=`product:${id}`
        await deletecache(key)
        await deleteListCache()
        responsehandler(res,data,200,`Deleted successfully: ${data.id}`)
});

const update_product=asynchandler(async(req,res,next)=>{
        const id=Number(req.params.id);
        const key=`product:${id}`
        const  update=await prisma.product.update({
                where:{
                        id:id
                },
                data:{
                        name:"Laptop",
                        price:100,
                        stock:5
                }
        })
        const deleted=await deletecache(key)
        await deleteListCache()
        responsehandler(res,update,200,"Updated successfully")
        
});

module.exports={products,getallproducts,delete_products,getoneproduct,update_product};