const prisma = require("../prismaClient");
const { Prisma } = require("@prisma/client");

const order_service = async (
    paymentId,
    orderId,
    userId,
    idempotencyKey
) => {

    return await prisma.$transaction(async (tx) => {

        const payment = await tx.Payment.findUnique({
            where: {
                id: paymentId
            }
        });

        if (!payment) {
            throw new Error("Payment is missing");
        }

        if (payment.status !== "PAID") {
            throw new Error("Payment is not paid");
        }

        const order = await tx.Order.findUnique({
            where: {
                id: orderId
            },
            include: {
                items: true
            }
        });

        if (!order) {
            throw new Error("Order is not created");
        }

        if (
            order.userId !== userId ||
            order.paymentId !== paymentId
        ) {
            throw new Error("Unauthorized");
        }

        const existing = await tx.IdempotencyKey.findUnique({
            where: {
                keyId: idempotencyKey
            }
        });

        if (existing?.status === "SUCCESS") {
            return order;
        }
        
        if (order.status === "CONFIRMED") {
            return order;
        }

        if (!existing) {
    await tx.IdempotencyKey.create({
        data: {
            keyId: idempotencyKey,
            status: "PROCESSING"
        }
    });
}

        

        if (order.status !== "PENDING") {
            throw new Error(
                `Order cannot be confirmed. Status: ${order.status}`
            );
        }

        if (order.items.length === 0) {
            throw new Error("Order has no items");
        }

        const total = order.items.reduce(
            (sum, item) => sum + item.subtotal,
            0
        );

        if (payment.amount !== total) {
            throw new Error("Payment amount is incorrect");
        }

        for (const item of order.items) {

            await tx.$executeRaw`
                SELECT id
                FROM "product"
                WHERE id = ${item.productId}
                FOR UPDATE
            `;
        }

        for (const item of order.items) {

            const product = await tx.product.findUnique({
                where: {
                    id: item.productId
                }
            });

            if (!product) {
                throw new Error(
                    `Product not found: ${item.productId}`
                );
            }

            if (product.reservedStock < item.quantity) {
                throw new Error(
                    `Reserved stock unavailable for ${item.name}`
                );
            }
        }

        for (const item of order.items) {

            await tx.product.update({
                where: {
                    id: item.productId
                },
                data: {
                    stock: {
                        decrement: item.quantity
                    },
                    reservedStock: {
                        decrement: item.quantity
                    }
                }
            });
        }


        const confirmedOrder = await tx.Order.update({
            where: {
                id: orderId
            },
            data: {
                status: "CONFIRMED"
            },
            include: {
                items: true
            }
        });

        await tx.OrderStatusHistory.create({
            data:{
                orderId:orderId,
                status:"CONFIRMED",
                note:"Payment confirmed order processed"
            }
        })

        await tx.IdempotencyKey.update({
            where: {
                keyId: idempotencyKey
            },
            data: {
                status: "SUCCESS"
            }
        });

        await tx.Cart.deleteMany({
            where:{
                userId:userId
            }
        })

        return confirmedOrder;
    }, {
        isolationLevel:
            Prisma.TransactionIsolationLevel.Serializable,

        timeout: 3000
    });
};

module.exports = order_service;
// module.exports=order_service

// Worker calls order_service()
//           │
//           ▼
// ┌──────────────────────────────┐
// │      START TRANSACTION       │
// └──────────────────────────────┘
//           │
//           ▼
// ① FIND PAYMENT
//    "Does the payment exist?"
//           │
//           ▼
// ② CHECK PAYMENT
//    "Is payment = PAID?"
//           │
//           ▼
// ③ FIND ORDER + ORDER ITEMS
//    "Does this order exist?"
//           │
//           ▼
// ④ VERIFY OWNERSHIP
//    "Does this order belong to
//     this user and payment?"
//           │
//           ▼
// ⑤ CHECK ORDER STATUS
//    "Is the order already confirmed?"
//           │
//           ├─────────────── YES ──────────────► Return Order
//           │
//           │
//           ▼ NO
// ⑥ CHECK IDEMPOTENCY
//    "Has this job already succeeded?"
//           │
//           ▼
// ⑦ CHECK ORDER ITEMS
//    "Does the order have items?"
//           │
//           ▼
// ⑧ CALCULATE TOTAL
//    "How much should the order cost?"
//           │
//           ▼
// ⑨ VERIFY AMOUNT
//    "Payment amount = Order total?"
//           │
//           ▼
// ⑩ LOCK PRODUCTS
//    "Don't let another transaction
//     change these products now."
//           │
//           ▼
// ⑪ CHECK RESERVED STOCK
//    "Is enough stock reserved?"
//           │
//           ▼
// ⑫ REDUCE STOCK
//    stock -= quantity
//           │
//           ▼
// ⑬ RELEASE RESERVATION
//    reservedStock -= quantity
//           │
//           ▼
// ⑭ CONFIRM ORDER
//    PENDING → CONFIRMED
//           │
//           ▼
// ⑮ MARK IDEMPOTENCY
//    PROCESSING → SUCCESS
//           │
//           ▼
// ┌──────────────────────────────┐
// │          COMMIT              │
// │   All changes become final   │
// └──────────────────────────────┘
//           │
//           ▼
// ⑯ RETURN CONFIRMED ORDER