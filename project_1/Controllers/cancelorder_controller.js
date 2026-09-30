const prisma = require("../prismaClient");
const refundQueue = require("../queues/refund_queue");
const apperror = require("../utils/Apperror.js");
const asynchandler=require("../utils/asynchandler.js");
const responsehandler = require("../utils/responsehandler");

const cancelOrder = asynchandler(async (req, res, next) => {

    const userId = req.user.id;
    const orderId = Number(req.params.OrderId);

    const order = await prisma.Order.findUnique({
        where: {
            id: orderId
        },
        include: {
            payment: true,
            items:true
        }
    });

    if (!order) {
        return next(new apperror("Order not found", 404));
    }

    if (order.userId !== userId) {
        return next(new apperror("Unauthorized", 403));
    }

    if (
        order.status !== "PENDING" &&
        order.status !== "CONFIRMED"
    ) {
        return next(
            new apperror(
                `Order cannot be cancelled from ${order.status}`,
                400
            )
        );
    }

    if (order.payment.status !== "PAID") {
        return next(
            new apperror("Payment is not eligible for refund", 400)
        );
    }

    const cancelledOrder = await prisma.$transaction(async (tx) => {

        const updatedOrder = await tx.Order.update({
            where: {
                id: orderId
            },
            data: {
                status: "CANCELLED"
            }
        });

        await tx.OrderStatusHistory.create({
            data: {
                orderId: orderId,
                status: "CANCELLED",
                note: "Order cancelled by customer",
                changedby:userId
            }
        });

        await tx.Payment.update({
            where: {
                id: order.payment.id
            },
            data: {
                status: "REFUND_PENDING"
            }
        });

        for (const item of order.items) {
    await tx.product.update({
        where: {
            id: item.productId
        },
        data: {
            stock: {
                increment: item.quantity
            }
        }
    });
}

        return updatedOrder;
    });

    await refundQueue.add("Process=refund", {
        paymentId: order.payment.id,
        orderId: orderId,
        userId: userId
    });

    responsehandler(
        res,
        cancelledOrder,
        200,
        "Order cancelled. Refund processing started."
    );
});

module.exports=cancelOrder;