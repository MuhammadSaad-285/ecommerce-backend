const { Queue } = require("bullmq");

const refundQueue = new Queue("refund-queue", {
    connection: {
        host: "redis",
        port: 6379
    },

    defaultJobOptions: {
        attempts: 3,

        backoff: {
            type: "exponential",
            delay: 5000
        },

        removeOnComplete: true,
        removeOnFail: false
    }
});

module.exports = refundQueue;