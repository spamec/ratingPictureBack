// import * as rxjs from 'rxjs';

// import {Observable} from "rxjs";

// import {Subject} from "rxjs";

const rxjs = require("rxjs");
// const {Observable} = rxjs;
const url = require('url');
// const products = require('./jsondb/products.json');
const fs = require('fs');
const logger = require('./log')(module);
const rating = require('./rating');

function sendStream(inputStream, outputStream) {
    inputStream.pipe(outputStream);
    // inputStream.pipe(process.stdout);

    inputStream.on('error', (e) => {
        outputStream.statusCode = 500;
        outputStream.end(JSON.stringify(e));
    });

    inputStream
        .on('open', () => {
            logger.debug('open');
        })
        .on('close', () => {
            logger.debug('close');
        });
    outputStream.on('close', () => {
        inputStream.destroy();
    })

    /*function write() {
        const content  = inputStream.read(); //читаем
        if(content && !outputStream.write(content)){ //отправляем если можно
            inputStream.removeListener('readable', write);
            outputStream.once('drain', function (){ //ждем отправки
                inputStream.on('readable', write);
                write();
            })
        }
    }

    inputStream.on('readable', write);
    inputStream.on('end', function () {
        outputStream.end();
    })*/
}

function readStream$(inputStream) {
    const data$ = new rxjs.Subject();
    let body = '';
    inputStream
        .on('readable', () => {
            const read = inputStream.read();
            if (read) body += read;
            if (body.length > 1e4) {
                const error = new Error('Message too big!');
                error.code = 413;
                data$.error(error);
            }
        })
        .on('end', () => {
            try {
                body = JSON.parse(body);
                data$.next(body);
            } catch (e) {
                logger.error(e);
                data$.error(e);
            }
        })

    return data$;
}

module.exports = function (request, response) {
    // logger.debug(request.method, request.url);
    const parsedUrl = url.parse(request.url, true);
    response.setHeader('Content-Type', 'application/json');
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');


    switch (request.method) {
        case 'GET':
            logger.info(`Request GET: ${parsedUrl.pathname}`);
            switch (parsedUrl.pathname) {
                case '/api/products/':

                    const productsStream = fs.createReadStream('./jsondb/products.json');
                    sendStream(productsStream, response);
                    break;
                case '/api/products/rating/':

                    const currentRating = rating.current();
                    response.end(JSON.stringify(currentRating));
                    break;
                case '/api/product/subscribe/':
                    rating.subscribe(request, response);
                    break;
                default:
                    const message = 'GET: Page not found!';
                    logger.error(`Error ${message}`)
                    response.statusCode = 404;
                    response.end(message)
                    break;
            }
            break;
        case 'POST':
            logger.info(`Request POST: ${parsedUrl.pathname}`);
            switch (parsedUrl.pathname) {
                case '/api/product/update/':
                    const subscription = new rxjs.Subscription();
                    subscription.add(readStream$(request).subscribe(data => {
                            rating.publish(data)
                            response.end();
                        },
                        (err) => {
                            logger.error(err);
                            response.statusCode = (err.code) ? err.code : 400;
                            response.end(JSON.stringify(err.message))
                        }))

                    break;
                default:
                    const message = 'POST: Page not found!';
                    logger.error(`Error ${message}`)
                    response.statusCode = 404;
                    response.end(message)
                    break;
            }
            break;
        default:
            response.end();
            break;
    }
}
