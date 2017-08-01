// Initialize all the clients and libraries up here
const redis = require('redis');
const bluebird = require('bluebird');
const mongoClient = require('mongodb').MongoClient;

// Async-ify redis, this will make getAsync available to redis
bluebird.promisifyAll(redis.RedisClient.prototype);
const redisClient = redis.createClient();
// Put error handle on redisClient if for whatever reason it breaks
redisClient.on('error', (error) => throwError(error));

// Global vars
const timeToLive = 120; // Two minutes
const mongoURL = 'mongodb://localhost:27017/kanji';
const mongoMainSchema = 'kanji';
const mongoQuery = {
  jlpt  : {'jlpt': { $exists: true }},
  grade : {'grade': { $exists: true }},
  news  : {'freq.news': { $exists: true }},
  tweet : {'freq.tweet': { $exists: true }},
  heisig: {'dict.heisig': { $exists: true }},
  stroke: {'stroke_count': { $exists: true }},
}
const operations = {
  findKanji: 'findKanji',
  findOrder: 'findOrder',
  findStroke: 'findStroke',
}

/*
 * General purpose functions
 */
const createSendResponse = (response, statusCode=200) => {
  return (result) => {
    response.status(statusCode).send(result);
  }
}

const saveToRedis = (key, result) => {
  redisClient.setex(key, timeToLive, result);
}

const formatMongoResult = (result) => {
  // If exist delete
  delete result._id;
  return JSON.stringify(result) + '\n';
}

const createResultObject = (results, key) => {
  let result = {};
  let currentResult = null;
  let currentKanji = null;
  let currentOrder = null;
  // forEach is async... so we use a for loop here
  for (let i = 0; i < results.length; i++) {
    currentResult = results[i];
    currentKanji = currentResult['kanji'];

    switch(key) {
      case 'tweet':
      case 'news':
        currentOrder = currentResult['freq'][key];
        break;
      case 'heisig':
        currentOrder = currentResult['dict'][key];
        break;
      default:
        currentOrder = currentResult[key];
        break;
    }

    result[currentKanji] = currentOrder;
  }
  return result;
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
 * Checks Mongo for possible result.
 * https://stackoverflow.com/questions/11661545/how-to-get-a-callback-on-mongodb-collection-find
 */
const checkMongoForValue = (key, operation) => {
  return new Promise((resolve) => {
    mongoClient.connect(mongoURL)
    .then((db) => {
      const collection = db.collection(mongoMainSchema);
      // Different query/find operation depending on the get request
      switch (operation) {
        case operations.findKanji:
          collection.findOne({'kanji': key}, (error, result) => {
            db.close();
            if (error) throw error;
            resolve(result);
          });
          break;
        // This one is a bit trickier to do
        case operations.findOrder:
          collection.find(mongoQuery[key]).toArray((error, results) => {
            db.close();
            if (error) throw error;
            resolve(createResultObject(results, key));
          });
          break;
        default:
          resolve(null);
          break;
      }
    })
    .catch(error => { throw error });
  });
}

/*
 * Main routes, these functions determine the key and additional ops
 * that will go into the main function.
 */

const findKanji = (request, response) => {
  const key = request.params.kanji;
  main(request, response, key, operations.findKanji);
}

const findStroke = (request, response) => {
  const key = request.params.kanji;
  main(request, response, key, operations.findStroke);
}

const findOrder = (request, response) => {
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
  // const sendSucessfulResponse = createSendResponse(response);
  // const sendErrorResponse = createSendResponse(response, 404);
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

  Promise.all([checkForData])
    .then(() => {
      if (data !== null) {
        console.log(data);
        // saveToRedis(key, data);
        // sendSucessfulResponse(data);
      } else {
        // sendErrorResponse({});
      }
    })
}

const pass = () => {};

main(null, null, '日', 'findStroke');
