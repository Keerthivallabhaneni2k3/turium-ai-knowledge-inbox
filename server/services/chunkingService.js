
const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

const splitIntoChunks = (text) => {
  if (!text || !text.trim()) {
    return [];
  }

  const words = text.trim().split(/\s+/);
  const chunks = [];

  let currentChunk = [];
  let currentLength = 0;

  for (const word of words) {
    const additionalLength = word.length + 1;

    if (
      currentLength + additionalLength > CHUNK_SIZE &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.join(" "));

      // Preserve some context between chunks
      const overlapWords = [];
      let overlapLength = 0;

      for (let i = currentChunk.length - 1; i >= 0; i--) {
        const candidateLength = currentChunk[i].length + 1;

        if (overlapLength + candidateLength > CHUNK_OVERLAP) {
          break;
        }

        overlapWords.unshift(currentChunk[i]);
        overlapLength += candidateLength;
      }

      currentChunk = overlapWords;
      currentLength = overlapLength;
    }

    currentChunk.push(word);
    currentLength += additionalLength;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(" "));
  }

  return chunks;
};

module.exports = { splitIntoChunks };
