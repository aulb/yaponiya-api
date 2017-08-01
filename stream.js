const EMITTIME = 1000;
const isKanji = character => (
  0x4e00 <= character.charCodeAt(0) && character.charCodeAt(0) <= 0x9faf
);

const pushKanjiToHash = (data, kanjiHash) => {
  data.text.split('').forEach(character => {
    if (isKanji(character)) kanjiHash[character] = true;
  });
}

const handleStreamingError = error => {
  throw error;
}

module.exports = (stream, io) => {
  let kanjiHash = {};

	stream.on('data', (data) => {
    pushKanjiToHash(data, kanjiHash);
  });

	stream.on('error', (error) => {
    handleStreamingError(error);
  });

	const interval = setInterval(() => {
    const kanjis = Object.keys(kanjiHash);
		if (kanjis.length !== 0) {
			io.emit('tweet', kanjis);
		}
    kanjiHash = {};
	}, EMITTIME);
}
