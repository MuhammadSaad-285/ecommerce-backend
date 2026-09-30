const express = require("express");
const prisma = require("../prismaClient");
const { createJazzCashHash } = require("../utils/jazzcash");

const router = express.Router();

router.post("/jazzcash-success/:paymentId", async (req, res, next) => {
    try {
        const paymentId = Number(req.params.paymentId);

        const payment = await prisma.Payment.findUnique({
            where: {
                id: paymentId
            }
        });

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        const callbackData = {
            pp_Version: "1.1",
            pp_TxnType: "MWALLET",
            pp_TxnRefNo: `T${payment.id}`,
            pp_ResponseCode: "000",
            pp_ResponseMessage: "Success",
            pp_Amount: String(Math.round(payment.amount * 100)),
            pp_TxnCurrency: "PKR",
            pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID
        };

        callbackData.pp_SecureHash =
            createJazzCashHash(callbackData);

        req.body = callbackData;

        const jazzcash_callback =
            require("../Controllers/callback_controller.js");

        return jazzcash_callback(req, res, next);

    } catch (error) {
        next(error);
    }
});

module.exports = router;