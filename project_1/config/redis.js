const { createClient } = require("redis");

const redis = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

redis.on("error", (err) => {
    console.error("Redis Error:", err);
});

const connectRedis = async () => {
    try {
        await redis.connect();
        console.log("Redis connected");
    } catch (error) {
        console.error("Redis connection failed:", error);
        throw error;
    }
};

module.exports = {
    redis,
    connectRedis
};