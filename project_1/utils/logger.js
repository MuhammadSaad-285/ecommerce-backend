const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const logDirectory = path.join(__dirname, "../logs");

if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

const accessLogStream = fs.createWriteStream(
    path.join(logDirectory, "access.log"),
    { flags: "a" }
);

const errorLogStream = fs.createWriteStream(
    path.join(logDirectory, "error.log"),
    { flags: "a" }
);

const logFormat =
    ":date[iso] | :remote-addr | :method | :url | :status | :response-time ms | :user-agent";

const accessLogger = morgan(logFormat, {
    stream: accessLogStream
});

const errorLogger = morgan(logFormat, {
    skip: (req, res) => res.statusCode < 399,
    stream: errorLogStream
});

module.exports = {
    accessLogger,
    errorLogger
};
