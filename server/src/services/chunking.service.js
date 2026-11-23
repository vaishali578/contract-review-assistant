const MAX_CHUNK_SIZE = 2500;
const TARGET_CHUNK_SIZE = 1500;
const OVERLAP_SIZE = 200;

// Detect common legal section headings
const extractSection = (text) => {
  const match = text.match(
    /^(?:SECTION\s+)?(\d+(?:\.\d+)*|[IVXLCDM]+)[.:\s-]+(.+)/i
  );

  if (!match) return null;

  return {
    sectionNumber: match[1],
    sectionTitle: match[2].trim(),
  };
};

export const createChunks = (pages) => {
  const chunks = [];

  for (const page of pages) {
    const paragraphs = page.text
      .split(/\n+/)
      .map((p) => p.trim())
      .filter(Boolean);

    let currentText = "";
    let currentSection = null;

    const saveChunk = () => {
      if (!currentText.trim()) return;

      chunks.push({
        text: currentText.trim(),
        pageNumber: page.pageNumber,
        section: currentSection,
      });

      currentText = "";
    };

    for (const paragraph of paragraphs) {
      const section = extractSection(paragraph);

      if (section) {
        saveChunk();
        currentSection = section;
      }

      if (
        currentText &&
        currentText.length + paragraph.length > TARGET_CHUNK_SIZE
      ) {
        saveChunk();
      }

      if (paragraph.length > MAX_CHUNK_SIZE) {
        saveChunk();

        for (
          let i = 0;
          i < paragraph.length;
          i += MAX_CHUNK_SIZE - OVERLAP_SIZE
        ) {
          chunks.push({
            text: paragraph.slice(i, i + MAX_CHUNK_SIZE),
            pageNumber: page.pageNumber,
            section: currentSection,
          });
        }

        continue;
      }

      currentText += (currentText ? "\n\n" : "") + paragraph;
    }

    saveChunk();
  }

  return chunks.map((chunk, index) => ({
    ...chunk,
    chunkIndex: index,
  }));
};