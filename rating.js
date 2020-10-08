let HttpClients = [];
let products = {};
const logger = require('./log')(module);

function ClientsCountLog(){
    logger.info(`Current stack: ${HttpClients.length}`);
}

exports.current = function (){
    return products;
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

exports.publish = (product) => {
    logger.debug(product);
    if(!products[product.id]){
        products[product.id] = product;
    }else {
        products[product.id].rating = product.rating;
    }


    HttpClients.forEach(function (response) {
        setImmediate(function () {
            response.end(JSON.stringify(products[product.id]))
        });
    });
    HttpClients = [];
    // ClientsCountLog();
}
