const morgan = require("morgan");
const logger = require("../utils/logger");

const morganStream = {
    write: (message) => logger.info(message.trim())
};

const morganFormat = process.env.NODE_ENV === "development"
    ? ":method :url :status :response-time ms - :res[content-length]"
    : '{"method":":method","url":":url","status":":status","duration":":response-time ms","bytes":":res[content-length]"}';

const httpRequestLogger = morgan(morganFormat, { stream: morganStream });

module.exports = httpRequestLogger;