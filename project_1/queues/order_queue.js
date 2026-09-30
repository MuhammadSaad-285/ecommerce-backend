const { Queue } = require("bullmq");

const orderQueue = new Queue("order-queue", {
    connection: {
        host: "redis",
        port: 6379
    },
    defaultJobOptions:{
        attempts:3,
        backoff:{
            delay:5000,
            type:"exponential"
        },
        removeOnComplete:true,
        removeOnFail:false
    }
});

module.exports = orderQueue;

// Order job
//    ↓
// Attempt 1
//    ↓ fail
// wait 5 sec
//    ↓
// Attempt 2
//    ↓ fail
// wait longer
//    ↓
// Attempt 3
//    ↓ fail
// FAILED
//    ↓
// DLQ