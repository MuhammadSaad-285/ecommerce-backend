const { Worker } = require("bullmq");

const refund_service = require("../services/refund_services.js");

const refundWorker = new Worker(
    "refund-queue",

    async (job) => {

        console.log(
            "Processing refund:",
            job.id
        );

        const {
            paymentId,
            orderId,
            userId
        } = job.data;

        const result = await refund_service(
            paymentId,
            orderId,
            userId
        );

        console.log(
            "Refund processed:",
            paymentId
        );

        return result;
    },

    {
        connection: {
            host: "redis",
            port: 6379
        }
    }
);


refundWorker.on("completed", (job) => {

    console.log(
        `Refund job ${job.id} completed`
    );

});


refundWorker.on("failed", (job, error) => {

    console.log(
        `Refund job ${job.id} failed`
    );

    console.log(
        "Error:",
        error.message
    );

});


module.exports = refundWorker;