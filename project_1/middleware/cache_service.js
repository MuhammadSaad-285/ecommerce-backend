// const { json } = require("zod")
const { redis } = require("../config/redis")
// const responsehandler = require("../utils/responsehandler")

const getcache=async(key)=>{
    const data= await redis.get(key)
    return data ?JSON.parse(data):null
};

const setcache=async(key,data,ttl=60)=>{
     await redis.set(
        key,
        JSON.stringify(data),
        {
            EX:ttl
        }
     );
};

const deletecache=async(key)=>{
    await redis.del(key)
};

const deleteListCache = async () => {
    const keys = await redis.keys("products:page:*");

    if (keys.length > 0) {
        await redis.del(keys);
    }
};

const acquireLock = async (key, ttl = 10) => {
    return await redis.set(
        key,
        "locked",
        {
            NX: true,
            EX: ttl
        }
    );
};

const releaseLock = async (key) => {
    await redis.del(key);
};

module.exports={
    getcache,
    deletecache,
    setcache,
    deleteListCache,
    acquireLock,
    releaseLock
};