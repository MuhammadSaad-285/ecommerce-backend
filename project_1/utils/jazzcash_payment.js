const { createJazzCashHash } = require("./jazzcash");

const createJazzCashPayment = ({
    paymentId,
    amount
}) => {
    // 1. Get raw system absolute milliseconds (Independent of OS timezone)
    const absoluteMs = Date.now(); 
    const pkrOffsetMs = 5 * 60 * 60 * 1000; // Force exactly +5 hours for Pakistan (PKT)
    
    // Build an explicit Pakistan Standard Time date object instance
    const pkrTime = new Date(absoluteMs + pkrOffsetMs);

    // Helper function to format dates reliably to YYYYMMDDHHMMSS
    const formatJCDate = (dateObj) => {
        // Use UTC methods to read our manually shifted digits exactly
        const y = dateObj.getUTCFullYear(); 
        const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getUTCDate()).padStart(2, '0');
        const h = String(dateObj.getUTCHours()).padStart(2, '0');
        const min = String(dateObj.getUTCMinutes()).padStart(2, '0');
        const s = String(dateObj.getUTCSeconds()).padStart(2, '0');
        return `${y}${m}${d}${h}${min}${s}`;
    };

    const txnDateTime = formatJCDate(pkrTime);
    
    // Expiry Window: Exactly 30 minutes forward from the Pakistan base time
    const expiryTime = new Date(pkrTime.getTime() + 30 * 60 * 1000);
    const txnExpiryDateTime = formatJCDate(expiryTime);

    const data = {
        pp_Version: "1.1",
        pp_TxnType: "MWALLET",
        pp_Language: "EN",

        pp_MerchantID:
            process.env.JAZZCASH_MERCHANT_ID,

        pp_Password:
            process.env.JAZZCASH_PASSWORD,

        pp_TxnRefNo:
            `T${paymentId}`,

        // Enforce strong string typing to avoid form mapping breaks in browser views
        pp_Amount:
            String(Math.round(amount * 100)),

        pp_TxnCurrency: "PKR",
        pp_BankID: "TBANK",
        pp_ProductID: "RETL",
        pp_SubMerchantID: "",

        pp_TxnDateTime:
            txnDateTime,

        pp_TxnExpiryDateTime:
            txnExpiryDateTime,

        pp_BillReference:
            `ORDER${paymentId}`,

        // Purely alphanumeric string to bypass hidden validation firewall scans
        pp_Description:
            `PaymentForOrder${paymentId}`,

        pp_ReturnURL:
            process.env.JAZZCASH_RETURN_URL,

        ppmpf_1: "",
        ppmpf_2: "",
        ppmpf_3: "",
        ppmpf_4: "",
        ppmpf_5: ""
    };

    // Build hash mapping matching fresh localized mathematical structures
    data.pp_SecureHash =
        createJazzCashHash(data);

    return data;
};

module.exports = createJazzCashPayment;
