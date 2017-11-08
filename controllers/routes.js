module.exports = function(app) {
  var api = require('./api');
  app.get('/api/kanji/:kanji', api.findKanji);
  app.get('/api/order/:type', api.findOrder);
  app.get('/api/stroke/:kanji', api.findStroke);
}
