/*
 * This file contains all the necessary utilities to open and read SVG files. 
 * Used primarily for /api/stroke/:kanji endpoint.
 */

// https://blog.yld.io/2016/11/07/node-js-databases-using-redis-for-fun-and-profit/
const fs = require('fs');
const xml2js = require('xml2js');

const parseString = xml2js.parseString;
const builder = new xml2js.Builder();
const htmlWhiteSpaceRegex = /\r?\n|\r|\s{2,}/g;
const folder = './kanji/0';

/*
 * Convert the first character of a string to its hex representation.
 * convertToHex('a')   -> 61
 * convertToHex('abc') -> 61
 * convertToHex('あ')  -> 3042  
 */ 
const convertToHex = (character) => {
  return character.charCodeAt(0).toString(16);
}

/*
 * Gets the SVG filename of a character (first character of the string).
 * getSVGFilename('日') -> '65e5.svg'
 */
const getSVGFilename = (character) => {
  return convertToHex(character) + '.svg';
}

/*
 * This function is used to read the SVG files. Uses the node fs library.
 */
const readFileAsync = (filename) => {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(filename)) {
      fs.readFile(filename, 'utf8', (error, data) => {
        if (error) reject(err);
        else resolve(data);
      });
    } else {
      resolve(null);
    }
  });
}

/*
 * Compresses XML string a.k.a removing all whitespaces. 
 */
const parseXMLResponse = (XMLString) => {
  if (XMLString === '' || XMLString === null) {
    return null;
  }
  let responseXML = '';

  // parseString is not Async
  parseString(XMLString, (error, result) => {
    if (error) throw error;
    responseXML = builder.buildObject(result).replace(htmlWhiteSpaceRegex, '');
  });
  return responseXML;
}

/*
 * Wrapper callback to read file.
 */
const fetchCharacterSVGData = (filename) => {
  return new Promise((resolve, reject) => {
    readFileAsync(filename)
      .then(XMLString => resolve(parseXMLResponse(XMLString)))
      .catch(error => reject(error));
  });
}

/*
 * Main fetcher for svg.
 */
const fetchSVG = (key) => {
  // key: 'stroke:日';
  try {
    const strokeKey = key.split(':')[1];
    return fetchCharacterSVGData(folder + getSVGFilename(strokeKey));
  } catch (error) {
    return null;
  }
}

module.exports = fetchSVG;
