import * as pdfjs from 'pdfjs-dist';

// Use a more reliable worker configuration (importing worker as a module)
if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();
}

export interface ParsedPdfQuestion {
  pageNumber: number;
  text: string;
  options: string[];
}

/**
 * Parses a PDF file and extracts questions page by page.
 */
export async function parsePdfQuestions(file: File): Promise<ParsedPdfQuestion[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const questions: ParsedPdfQuestion[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map((item: any) => item.str);
    const fullText = textItems.join(' ');
    
    if (fullText.trim().length > 20) {
      const detected = detectQuestionsFromText(fullText);
      if (detected.length > 0) {
        questions.push(...detected.map(d => ({
          pageNumber: i,
          text: d.questionText,
          options: d.options
        })));
      } else {
        questions.push({
          pageNumber: i,
          text: fullText.trim(),
          options: []
        });
      }
    }
  }

  return questions;
}

export async function extractAllPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const textItems = textContent.items.map((item: any) => item.str);
    // Join with newlines to preserve the multi-line structure of equations/math
    fullText += `--- PAGE ${i} ---\n` + textItems.join('\n') + "\n\n";
  }

  return fullText;
}

function detectQuestionsFromText(text: string): { questionText: string, options: string[] }[] {
  const results: { questionText: string, options: string[] }[] = [];
  let cleanText = text.replace(/\s{2,}/g, ' ');
  
  const metadataPatterns = [
    /Chemistry\s+\d+-\d+-\d+\s+\w+/gi,
    /Page\s+\d+\s+of\s+\d+/gi,
    /JEE\s+Replica\s+Test-\d+/gi
  ];
  
  metadataPatterns.forEach(p => { cleanText = cleanText.replace(p, ''); });
  const questionBlocks = cleanText.split(/\s*(?=Q\d+|Question\s*\d+)/gi).filter(block => block.trim().length > 10);
  
  for (const block of questionBlocks) {
    const options: string[] = [];
    const optionMatches = block.matchAll(/\(([1-4A-D])\)\s*([^()]+)/gi);
    for (const match of optionMatches) {
      let optText = match[2].trim();
      metadataPatterns.forEach(p => { optText = optText.replace(p, ''); });
      options.push(`(${match[1].toUpperCase()}) ${optText}`);
    }
    
    let questionText = block.trim();
    if (options.length > 0) {
      const firstOptionIndex = block.search(/\(([1-4A-D])\)/i);
      if (firstOptionIndex !== -1) {
        questionText = block.substring(0, firstOptionIndex).trim();
      }
    }
    metadataPatterns.forEach(p => { questionText = questionText.replace(p, ''); });
    if (questionText.length > 5) {
      results.push({ questionText, options: options.length > 0 ? options : [] });
    }
  }
  return results;
}
