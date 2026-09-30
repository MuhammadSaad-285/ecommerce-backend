const crypto = require("crypto");
const axios = require("axios");

// const crypto = require("crypto");

const createJazzCashHash = (data) => {

    const secret = process.env.JAZZCASH_SHARED_SECRET;

    const fields = Object.keys(data)
        .filter(key =>
            key.toLowerCase().startsWith("pp") &&
            key !== "pp_SecureHash"
        )
        .sort();

    const message = fields
        .map(key => data[key] ?? "")
        .join("&");

    return crypto
        .createHmac("sha256", secret)
        .update(message, "utf8")
        .digest("hex")
        .toUpperCase();
};


const paymentInquiry = async (txnRefNo) => {

    const inquiryData = {
        pp_TxnRefNo: txnRefNo,
        pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID,
        pp_Password: process.env.JAZZCASH_PASSWORD,
        pp_Version: "1.1"
    };

    inquiryData.pp_SecureHash =
        createJazzCashHash(inquiryData);

    const response = await axios.post(
        process.env.JAZZCASH_INQUIRY_URL,
        {
            PaymentInquiry: inquiryData
        },
        {
            headers: {
                "Content-Type": "application/json"
            }
        }
    );

    return response.data;
};


module.exports = {
    createJazzCashHash,
    paymentInquiry
};
