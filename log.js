const {createLogger, format, transports} = require("winston");
const {combine, timestamp, label, printf} = format;

const myFormat = printf(({level, message, label, timestamp}) => {
    return `${timestamp} ${(!!label) ? label + ' ' : ''}${level}: ${(typeof message === 'string') ? message : JSON.stringify(message)}`;
});
let file = '';


const options = {
    file: {
        level: "info",
        filename: `app.log`,
        handleExceptions: true,
        colorize: true,
        timestamp: true,
    },
    console: {
        level: "debug",
        handleExceptions: true,
        colorize: true,
        timestamp: true,
    },
};

const splitTest = function (str) {
    return str.split('\\').pop().split('/').pop();
}

function makerLogger(){
    return createLogger({
        format: combine(label({label: file}), timestamp(), myFormat),
        transports: [new transports.Console(options.console), new transports.File(options.file)],
    });
}


module.exports = function (module) {
    file = (module) ? splitTest(module.filename) : '';
    return makerLogger();

}

// const logger = ;
