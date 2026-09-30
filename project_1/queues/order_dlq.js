const { Queue } = require("bullmq");

const orderdlq = new Queue("order-dlq", {
    connection: {
        host: "redis",
        port: 6379
    },})

module.exports=orderdlq;