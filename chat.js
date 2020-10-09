let HttpClients = [];
let history = [];
const logger = require('./log')(module);

function ClientsCountLog() {
    logger.info(`Current stack: ${HttpClients.length}`);
}

exports.history = function () {
    return history.slice(-50);
}

exports.subscribe = function (request, response) {
    HttpClients.push(response);
    ClientsCountLog();
    // next();

    response.on('close', function () {
        logger.info('response close');
        HttpClients.splice(HttpClients.indexOf(request), 1);
        ClientsCountLog();
    })
}

exports.publish = (message) => {

    logger.debug(message);
    message.date = new Date();
    logger.debug(message);
    history.push(message);
    history.slice(-1000);

    HttpClients.forEach(function (response) {
        setImmediate(function () {
            response.end(JSON.stringify(message))
        });
    });
    HttpClients = [];
    // ClientsCountLog();
}
