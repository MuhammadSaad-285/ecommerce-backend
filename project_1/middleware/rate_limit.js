const {  rateLimit } = require("express-rate-limit");
const apperror = require("../utils/Apperror");
const { error } = require("winston");
const { RedisStore } = require("rate-limit-redis");

const { redis } = require("../config/redis");

const general_rate_limit=rateLimit({
    windowMs:5*60*100,
    limit:50,
    standardHeaders:"draft-8",
    legacyHeaders:false,
    store:new RedisStore({
        prefix:"rl:general:",
        sendCommand:(...args)=>
            redis.sendCommand(args)
        
    }),
    message:{
        status:error,
        message:"Too many requests try again later"
    }

})

const login_limiter=rateLimit({
    windowMs:2*60*1000,
    limit:10,
    standardHeaders:"draft-8",
    legacyHeaders:false,
    store:new RedisStore({
        prefix:"rl:login:",
        sendCommand:(...args)=>
            redis.sendCommand(args)
        
    }),


    message:{
        status:error,
        message:"Too many login attempts"
    }
});

const product_limiter=rateLimit({
    windowMs:2*60*1000,
    limit:10,
    standardHeaders:"draft-8",
    legacyHeaders:false,
    store:new RedisStore({
        prefix:"rl:product:",
        sendCommand:(...args)=>
            redis.sendCommand(args)
        
    }),

    message:{
        status:error,
        message:"Too many product taking attempts"
    }
})

const category_limiter=rateLimit({
    windowMs:2*60*1000,
    limit:5,
    standardHeaders:"draft-8",
    legacyHeaders:false,
    store:new RedisStore({
        prefix:"rl:product:",
        sendCommand:(...args)=>
           redis.sendCommand(args)
    
}),
    message:{
        status:error,
        message:"Too many category requests "
    }
})

const cart_limiter=rateLimit({
    windowMs:2*60*1000,
    limit:5,
    standardHeaders:"draft-8",
    legacyHeaders:false,
    store:new RedisStore({
        prefix:"rl:product:",
        sendCommand:(...args)=>
            redis.sendCommand(args)
    }),
    message:{
        status:error,
        message:"Cart limits exceeded"
    }
});

const checkout_limiter=rateLimit({
    windowMs:2*60*1000,
    limit:5,
    standardHeaders:"draft-8",
    legacyHeaders:false,
    store:new RedisStore({
        prefix:"rl:product:",
        sendCommand:(...args)=>
            redis.sendCommand(args)
    }),
    message:{
        status:error,
        message:"Checkout limits exceeded"
    }
});

const user_rate_limit=rateLimit({
    windowMs:5*60*100,
    limit:5,
    standardHeaders:"draft-8",
    legacyHeaders:false,
    store:new RedisStore({
        prefix:"rl:general:",
        sendCommand:(...args)=>
            redis.sendCommand(args)
        
    }),

    keyGenerator:(req)=>{
        return `user:{req.user.id}`
    },
    message:{
        status:error,
        message:"Too many requests for this user try again later"
    }
});
module.exports={general_rate_limit,login_limiter,user_rate_limit,product_limiter,category_limiter,cart_limiter,checkout_limiter}

