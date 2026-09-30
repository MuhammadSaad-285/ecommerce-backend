// require("dotenv").config();
// const express=require("express")
// const prisma = require("./project_1/prismaClient.js");
// const cors=require("cors")
// const helmet=require("helmet")
// const restrictTo = require("./project_1/middleware/auth.js");
// const morgan=require("morgan");
// const {general_rate_limit} = require("./project_1/middleware/rate_limit.js");
// // const logger = require("./project_1//utils/logger.js"); 
// // const httpRequestLogger = require("./project_1/middleware/requestlogger.js");
// // require("dotenv").config();

// // const express = require("express");
// // const cors = require("cors");
// // const helmet = require("helmet");
// // const morgan = require("morgan");



// const app=express()

// // rate-limit
// app.use(general_rate_limit)

// // logger
// app.use(morgan("dev"));
// // app.use(httpRequestLogger);

// // monitor
// app.use(helmet());
// // cors guard
// const Allowed_origin=process.env.Allowed_origin 
//     ? process.env.Allowed_origin.split(",") 
//     : ["http://localhost:5173"]

// app.use(cors({
//     origin:Allowed_origin,
//     methods:["GET","POST","PUT","DELETE"],
//     credentials:true
// }
// ))
// const { connectRedis } = require("./project_1/config/redis.js");


// const feedback=require("./project_1/Routes/feedback_route.js");

// const contact=require("./project_1/Routes/contact_route.js");

// const globalErrorHandler = require("./project_1/middleware/errorcontroller.js");

// const product=require("./project_1/Routes/product_route.js");

// const auth=require("./project_1/Routes/auth_routes.js");

// const page_routes=require("./project_1/Routes/page_routes.js");

// const order=require("./project_1/Routes/order_route.js");
// // const { connectRedis } = require("./project_1/config/redis.js");

// // const jwt=require("project_1/middleware/token_mw.js");
// app.use(express.json());

// app.use("/api",feedback);
// app.use("/api",contact);
// app.use("/api",product);
// app.use("/api",auth);
// app.use("/api",page_routes);
// app.use("/api",order);
// app.use(globalErrorHandler)

// // console.log("SIGN SECRET:", process.env.JWT_SECRET);
// // app.use("/api",jwt);
// const port=process.env.PORT || 5000;

// // console.log("MODELS:", Object.keys(prisma));
// const startserver=async()=>{
//     try{
//         await connectRedis()
//         console.log("Redis open:", redis.isOpen);
// console.log("Redis ready:", redis.isReady);

// const result = await redis.sendCommand([
//     "SCRIPT",
//     "LOAD",
//     "return 123"
// ]);

// console.log("SCRIPT LOAD result:", result);
//         app.listen(port,()=>{
//         console.log("Server running on port" ,port);
//       })
//     }catch(error){
//       console.error(error)
//       process.exit(1)
//     }
// };
// console.log(startserver());

require("dotenv").config();

const express=require("express")

const prisma = require("./project_1/prismaClient.js");

const cors=require("cors")

const helmet=require("helmet")

const restrictTo = require("./project_1/middleware/auth.js");

const {accessLogger,errorLogger} = require("./project_1/utils/logger.js");

const cookie_parser=require("cookie-parser")

const asynchandler = require("./project_1/utils/asynchandler.js");

// const morgan=require("morgan");

const app=express()

app.use(accessLogger);
app.use(errorLogger);

app.use(helmet());
app.use(cookie_parser())

const Allowed_origin=process.env.Allowed_origin 
    ? process.env.Allowed_origin.split(",") 
    : ["http://localhost:5173","http://127.0.0.1:5500/test_jazzcash.html"]

app.use(cors({
    origin:Allowed_origin,
    methods:["GET","POST","PUT","DELETE"],
    credentials:true
}))

const { connectRedis } = require("./project_1/config/redis.js");
const responsehandler = require("./project_1/utils/responsehandler.js");
// const asynchandler = require("./project_1/utils/asynchandler.js");

app.use(express.json());

const port=process.env.PORT || 5000;
const INSTANCE=process.env.INSTANCE || "default"

const startserver=async()=>{

    try{

        await connectRedis()

        const {general_rate_limit} = require("./project_1/middleware/rate_limit.js");

        const feedback=require("./project_1/Routes/feedback_route.js");

        const contact=require("./project_1/Routes/contact_route.js");

        const globalErrorHandler = require("./project_1/middleware/errorcontroller.js");

        const product=require("./project_1/Routes/product_route.js");

        const auth=require("./project_1/Routes/auth_routes.js");

        const page_routes=require("./project_1/Routes/page_routes.js");

        const order=require("./project_1/Routes/order_route.js");

        const category=require("./project_1/Routes/category_route.js")

        const cart=require("./project_1/Routes/cart_route.js")

        const checkout=require("./project_1/Routes/checkout_route.js")

        const payment=require("./project_1/Routes/payment_route.js")

        // const callback=require("./project_1/Routes/")

        const jazzcashTestRoute =require("./project_1/Routes/callback_test.js");

        const orderStatus=require("./project_1/Routes/order_status_route.js");

        const cancelorder=require("./project_1/Routes/cancelorder_route.js");
        
//         app.get("/health", async (req, res) => {
//     try {
//         await prisma.$queryRaw`SELECT 1`;

//         res.status(200).json({
//             status: "OK",
//             server: "running",
//             database: "connected"
//         });
//     } catch (error) {
//         res.status(503).json({
//             status: "ERROR",
//             server: "running",
//             database: "disconnected"
//         });
//     }
// });
        app.use(general_rate_limit)

        app.use("/api", jazzcashTestRoute);

        app.use("/api",feedback);

        app.use("/api",orderStatus);

        app.use("/api",contact);

        app.use("/api",product);

        app.use("/api",auth);

        app.use("/api",page_routes);

        app.use("/api",order);

        app.use("/api",category)

        app.use("/api",cart)
        
        app.use("/api",cancelorder)

        app.use("/api",checkout)

        app.use("/api",payment)

        app.use(globalErrorHandler)

        app.get("/server",(req,res)=>{
            responsehandler(res,{
                instance:INSTANCE,
                port:port},200,`Request running on ${INSTANCE}`)
        })

        app.listen(port,()=>{

            console.log(`Server ${INSTANCE} running on port ${port}`);

        })

    }catch(error){

        console.error(error)

        process.exit(1)

    }

};

startserver();