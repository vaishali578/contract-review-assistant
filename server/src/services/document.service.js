import fs from "fs/promises";
import mammoth from "mammoth";

import {
  getDocument,
} from "pdfjs-dist/legacy/build/pdf.mjs";


export const extractDocumentText = async (
  filePath,
  mimeType
) => {
  try {

    // PDF extraction
    if (mimeType === "application/pdf") {

      const buffer = await fs.readFile(filePath);

      const pdf = await getDocument({
        data: new Uint8Array(buffer),
      }).promise;

      const pages = [];

      for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
      ) {

        const page = await pdf.getPage(pageNumber);

        const content = await page.getTextContent();

        let previousY = null;
        let text = "";

        for (const item of content.items) {

          if (!("str" in item) || !item.str) {
            continue;
          }

          const currentY = item.transform?.[5];

          // Detect a new line using vertical position
          if (
            typeof currentY === "number" &&
            previousY !== null &&
            Math.abs(previousY - currentY) > 3
          ) {
            if (!text.endsWith("\n")) {
              text += "\n";
            }
          } else if (
            text.length > 0 &&
            !text.endsWith("\n")
          ) {
            text += " ";
          }

          text += item.str;

          // PDF.js can explicitly indicate line endings
          if (item.hasEOL && !text.endsWith("\n")) {
            text += "\n";
          }

          if (typeof currentY === "number") {
            previousY = currentY;
          }
        }

        pages.push({
          pageNumber,
          text: text.trim(),
        });
      }

      return pages;
    }


    // DOCX extraction
    if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {

      const result = await mammoth.extractRawText({
        path: filePath,
      });

      return [
        {
          pageNumber: null,
          text: result.value,
        },
      ];
    }


    // TXT extraction
    if (mimeType === "text/plain") {

      const text = await fs.readFile(
        filePath,
        "utf-8"
      );

      return [
        {
          pageNumber: null,
          text,
        },
      ];
    }

    throw new Error("Unsupported document format");

  } catch (error) {

    console.error("Text extraction error:", error);

    throw error;
  }
};