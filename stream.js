/* 
 * Instead of emitting every time theres a new tweet we would instead
 * save all incoming tweets within a second in a "buffer" and emit that instead.
 */
const EMITTIME = 1000;

/*
 * Checks for whether or not a character is a kanji.
 * isKanji('あ') -> false
 * isKanji('虹') -> true
 * isKanji('a') -> false
 */ 
const isKanji = character => (
  0x4e00 <= character.charCodeAt(0) && character.charCodeAt(0) <= 0x9faf
);

/*
 * Pushes kanjis from data (which is just a tweet/string) to object.
 * data: '今日はムズイな〜'
 * kanjiHash: {
 *   '今': true,
 *   '日': true
 * }
 */
const pushKanjiToHash = (data, kanjiHash) => {
  data.text.split('').forEach(character => {
    if (isKanji(character)) kanjiHash[character] = true;
  });
}

const handleStreamingError = error => {
  throw error;
}

// Default export. Imported as "twitterStreamHandler" in 'app-stream.js'
module.exports = (stream, io) => {
  let kanjiHash = {};

  // On data ("on tweet") find the kanjis that are used.
	stream.on('data', (data) => {
    pushKanjiToHash(data, kanjiHash);
  });

  // On error, we should do something...
	stream.on('error', (error) => {
    handleStreamingError(error);
  });

  // Every EMITTIME we will emit the data to whoever is listening.
	const interval = setInterval(() => {
    const kanjis = Object.keys(kanjiHash);
    // Only emit if theres actually kanjis being used, otherwise skip
		if (kanjis.length !== 0) io.emit('tweet', kanjis);
    kanjiHash = {};
	}, EMITTIME);
}
