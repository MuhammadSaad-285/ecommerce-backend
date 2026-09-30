const prisma = require("../prismaClient");
const apperror = require("../utils/Apperror");
const asynchandler = require("../utils/asynchandler");
const responsehandler = require("../utils/responsehandler");
const createJazzCashPayment = require("../utils/jazzcash_payment.js"); // Using our updated utility

const payment = asynchandler(async (req, res, next) => {
    const { id } = req.user;
    const { method } = req.body;

    if (!["EASYPAISA", "JAZZCASH"].includes(method)) {
        return next(new apperror("Payment method doesn't exist", 400));
    }
    
    const cart = await prisma.Cart.findMany({
        where: {
            userId: id
        },
        include: {
            product: true
        }
    });

    if (cart.length === 0) {
        return next(new apperror("Cart is empty", 400));
    }

    const total = cart.reduce((sum, item) => {
        return sum + (item.product.price * item.quantity);
    }, 0);

    const new_payment = await prisma.Payment.create({
        data: {
            userId: id,
            amount: total,
            status: "PENDING",
            method: method,
            provider: method
        }
    });

    if (method == "JAZZCASH") {
        const jazzcashdata = createJazzCashPayment({ paymentId: new_payment.id, amount: total });
        
        return responsehandler(res, {
            paymentUrl: process.env.JAZZCASH_PAYMENT_URL || "https://jazzcash.com.pk",
            fields: jazzcashdata
        }, 201, "Payment initialized");
    }

    return responsehandler(res, new_payment, 201, "Payment created");
});

module.exports = payment;

