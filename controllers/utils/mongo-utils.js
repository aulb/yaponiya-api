/*
 * Mongo setup.
 * The main schema is called kanji. 
 * Since the API is just a bunch of GET requests and no posts, the "query" is predefined below
 */ 
const mongoClient = require('mongodb').MongoClient;
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
}

// Helpers
const formatMongoResult = (result) => {
  // result object comes with mongodb's id, typically a hash, the data returned should
  // not contain any unnecessary data
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
 * Checks Mongo for possible result.
 * https://stackoverflow.com/questions/11661545/how-to-get-a-callback-on-mongodb-collection-find
 */
const checkMongoForValue = (key, operation) => {
  return new Promise((resolve) => {
    // Bandaid fix for nonexistent keys
    const isFindingOrder = operation === operations.findOrder;
    const isValidOrder = !Object.keys(mongoQuery).indexOf(key) < 0;
    if (isFindingOrder && !isValidOrder) {
      resolve(null);
      return;
    }

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

module.exports = { checkMongoForValue, formatMongoResult };
