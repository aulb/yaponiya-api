module.exports = function(app) {
  var api = require('./controllers');
  app.get('/api/kanji/:kanji', api.findKanji);
  app.get('/api/order/:type', api.findOrder);
  app.get('/api/stroke/:kanji', api.findStroke);
}
