const { Worker } = require("bullmq");
const dlq_service = require("../services/dlq_services.js");

const dlqWorker = new Worker(
    "order-dlq",

    async (job) => {

        console.log(
            "Recovering failed order:",
            job.id
        );

        const {
            paymentId,
            orderId,
            userId
        } = job.data;

        const result = await dlq_service(
            paymentId,
            orderId,
            userId,
            `ORDER-${orderId}`
        );

        console.log(
            "DLQ order recovered:",
            orderId
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


dlqWorker.on("completed", (job) => {

    console.log(
        `DLQ job ${job.id} recovered successfully`
    );

});

dlqWorker.on("error", (error) => {
    console.log("DLQ Worker Error:", error.message);
});


dlqWorker.on("failed", async (job, error) => {

    console.log(
        `DLQ job ${job.id} failed`
    );

    console.log(
        "Error:",
        error.message
    );

});


module.exports = dlqWorker;

    //           ORDER DLQ
    //               │
    //               │ Failed order job
    //               ▼
    //         DLQ WORKER
    //               │
    //               ▼
    //          Receive job
    //               │
    //               ▼
    //       Extract job.data
    //               │
    //       ┌───────┼────────┐
    //       ▼       ▼        ▼
    //   paymentId orderId  userId
    //       │       │        │
    //       └───────┼────────┘
    //               ▼
    //        dlq_services()
    //               │
    //               ▼
    //          Return result
    //               │
    //       ┌───────┴────────┐
    //       ▼                ▼
    //    SUCCESS            ERROR
    //       │                │
    //       ▼                ▼
    //   completed           failed
    //    listener           listener