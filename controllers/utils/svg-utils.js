// https://www.google.ca/url?sa=t&rct=j&q=&esrc=s&source=web&cd=8&cad=rja&uact=8&ved=0ahUKEwiFqs-v5qrVAhWMJ8AKHV_cCEoQFghXMAc&url=https%3A%2F%2Fblog.yld.io%2F2016%2F11%2F07%2Fnode-js-databases-using-redis-for-fun-and-profit%2F&usg=AFQjCNHnlDg69EgzaGrYg3L_X8ppSwiUZQ
const fs = require('fs');
const xml2js = require('xml2js');

const parseString = xml2js.parseString;
const builder = new xml2js.Builder();
const htmlWhiteSpaceRegex = /\r?\n|\r|\s{2,}/g;
const folder = './kanji/0';

const convertToHex = (character) => {
  return character.charCodeAt(0).toString(16);
}

const getSVGFilename = (character) => {
  return convertToHex(character) + '.svg';
}

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

const fetchCharacterSVGData = (filename) => {
  return new Promise((resolve, reject) => {
    readFileAsync(filename)
      .then(XMLString => resolve(parseXMLResponse(XMLString)))
      .catch(error => reject(error));
  });
}

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
