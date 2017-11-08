// Initialize all the clients and libraries up here
const redis = require('redis');
const bluebird = require('bluebird');

// Async-ify redis, this will make getAsync available to redis
bluebird.promisifyAll(redis.RedisClient.prototype);
const redisClient = redis.createClient();
redisClient.on('error', (error) => throwError(error));

// Global vars
const timeToLive = 120; // Two minutes
const operations = {
  findKanji: 'findKanji',
  findOrder: 'findOrder',
  findstroke: 'findStroke',
}

const fetchSVG = require('./utils/svg-utils');
const { checkMongoForValue, formatMongoResult } = require('./utils/mongo-utils');

/*
 * Sends HTTP response with code.
 */
const createSendResponse = (response, statusCode=200) => {
  return (result) => {
    response.status(statusCode).send(result);
  }
}

/*
 * Key value storage for quicker lookups. TTL is set at two minutes.
 */
const saveToRedis = (key, result) => {
  redisClient.setex(key, timeToLive, result);
}

/*
 * Checks Redis for possible cached result of key.
 * If found it will simply pass the result to the callback provided.
 */
const checkRedisForValue = (key) => {
  return new Promise((resolve) => {
    redisClient.getAsync(key)
      .then((result) => {
        // If result is not null that means the key exist,
        // call the callback function to continue the operation
        resolve(result);
      })
      .catch(error => { throw error });
  });
}

/*
 * Main routes, these functions determine the key and additional ops
 * that will go into the main function.
 */

exports.findKanji = (request, response) => {
  const key = request.params.kanji;
  main(request, response, key, operations.findKanji);
}

exports.findStroke = (request, response) => {
  const key = 'stroke:' + request.params.kanji;
  main(request, response, key, operations.findStroke);
}

exports.findOrder = (request, response) => {
  const key = request.params.type;
  main(request, response, key, operations.findOrder);
}

/*
 * The main workflow.
 * First it will check redis to see if the value is cached.
 * It will then check mongo or the files for return values.
 * Depending if the result is successful or not if will then cache the result.
 * https://stackoverflow.com/questions/31413749/node-js-promise-all-and-foreach
 */
const main = (request, response, key, operation) => {
  const sendSucessfulResponse = createSendResponse(response);
  const sendErrorResponse = createSendResponse(response, 404);
  let data = null;

  // Attempt to grab the data
  const checkForData = checkRedisForValue(key)
    .then((result) => {
      if (result !== null) data = result;
      else if (operation === operations.findStroke) return fetchSVG(key)
        .then((result) => {
          if (result !== null || result !== '') data = result;
        })
        .catch(error => { throw error });
      else return checkMongoForValue(key, operation)
        .then((result) => {
          if (result !== null) data = formatMongoResult(result);
        }).catch((error) => { throw error });
    }).catch(error => { throw error });

  // Once we have all the data do...
  Promise.all([checkForData])
    .then(() => {
      // Cache to redis if the data isn't null and send back response
      if (data !== null) {
        saveToRedis(key, data);
        sendSucessfulResponse(data);
      } else {
        // Or send back an error response
        sendErrorResponse({});
      }
    })
}
