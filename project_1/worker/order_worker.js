const { Worker } = require("bullmq");
const prisma = require("../prismaClient");
const order_service = require("../services/order_services.js");
const orderdlq = require("../queues/order_dlq.js");

const orderWorker = new Worker(
    "order-queue",

    async (job) => {

        console.log("Processing:", job.name);
        console.log("Job data:", job.data);
        console.log("Attempts made", job.attemptsMade + 1);

        const {
            paymentId,
            userId,
            orderId
        } = job.data;
        
    //     const order = await prisma.Order.findUnique({
    //     where: {
    //         paymentId: paymentId
    //     }
    // });

    //    if (!order) {
    //        return next(new apperror("Order not found for payment", 404));
    //     }
 
        const confirmedOrder = await order_service(
            paymentId,
            orderId,
            userId,
            `ORDER-${orderId}`
        );

        console.log(
            "Order confirmed:", orderId
        );

        return confirmedOrder;
    },

    {
        connection: {
            host: "redis",
            port: 6379
        }
    }
);

orderWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
});

orderWorker.on("failed", async (job, error) => {
    console.log(
        `Job ${job?.id} failed. Attempt: ${job.attemptsMade}/3`,
        error.message
    );

    if (job.attemptsMade >= job.opts.attempts) {
        console.log(
            "Job moved to failed state /DLQ state",
            job.id
        );

        await orderdlq.add(
            "Failed order",
            {
                paymentId: job.data.paymentId,
                userId: job.data.userId,
                error: error.message
            },
            {
                jobId: `Job-${job.data.paymentId}`
            }
        );
    }
});
module.exports = orderWorker;

// Order Queue
//       ↓
// Worker receives Order Job
//       ↓
// ┌──────────────────────────────┐
// │        ORDER WORKER          │
// └──────────────────────────────┘
//       ↓
// 1. Get Job Data
//       ↓
//    paymentId
//    orderId
//    userId
//       ↓
// 2. Call order_service()
//       ↓
//    "Process this order"
//       ↓
// 3. Wait for Service Result
//       ↓
//    ┌─────────────────┴─────────────────┐
//    ↓                                   ↓
// SUCCESS                              ERROR
//    ↓                                   ↓
// Job Completed                     Job Failed
//                                        ↓
//                                  BullMQ Retry
//                                        ↓
//                                   Attempt 1
//                                        ↓
//                                   Attempt 2
//                                        ↓
//                                   Attempt 3
//                                        ↓
//                                 Still Failed
//                                        ↓
//                                       DLQ

// order_service fails
//         ↓
// Worker reports failure
//         ↓
// BullMQ handles retry
//         ↓
// 1st failure → retry
// 2nd failure → retry
// 3rd failure → permanently failed
//         ↓
// "failed" event
//         ↓
// your code checks attemptsMade
//         ↓
// all attempts used?
//         ↓
// YES
//         ↓
// send to DLQ