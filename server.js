const http = require('http');
const logger = require('./log')(module);
const host = '192.168.1.81';
const server = new http.Server();
server.listen(8080, host);
server.on('request', require('./request'));
logger.debug(`Server running on ${host}`);
