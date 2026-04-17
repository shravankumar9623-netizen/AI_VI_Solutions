/**
 * PPTX Parser v2 — Extracts ALL slides from uploaded .pptx files
 * 
 * PPTX files are ZIP archives. We extract:
 * 1. Text from each slide's XML (preserving original format)
 * 2. Embedded media/images from ppt/media/
 * 3. Slide relationship maps to connect images to slides
 * 
 * ALL slides are included regardless of text content, because
 * MathType equations are OLE objects that don't appear as text.
 */
import JSZip from 'jszip';

export interface ParsedSlide {
  slideNumber: number;
  textBlocks: string[];
  fullText: string;
  imageUrl?: string;
  // Track which media images are referenced by this slide
  mediaRefs: string[];
}

/**
 * Parse a .pptx File and extract ALL slides sequentially (slide 1 to N).
 */
export async function parsePPTX(file: File): Promise<ParsedSlide[]> {
  const zip = await JSZip.loadAsync(file);
  const slides: ParsedSlide[] = [];

  // Step 1: Find all slide XML files and sort them numerically
  const slideFiles: { name: string; index: number }[] = [];
  zip.forEach((relativePath) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/);
    if (match) {
      slideFiles.push({ name: relativePath, index: parseInt(match[1], 10) });
    }
  });

  slideFiles.sort((a, b) => a.index - b.index);

  // Step 2: Extract media metadata (size) and blob URLs
  const mediaMap: Record<string, { url: string; size: number }> = {};
  const mediaPromises: Promise<void>[] = [];
  
  zip.forEach((relativePath) => {
    if (relativePath.startsWith('ppt/media/') && /\.(png|jpg|jpeg|gif|bmp)$/i.test(relativePath)) {
      const fileEntry = zip.file(relativePath);
      if (fileEntry) {
        // Record the uncompressed size to find high-res assets
        const size = (fileEntry as any)._data?.uncompressedSize || 0;
        const promise = fileEntry.async('blob').then(blob => {
          mediaMap[relativePath] = { 
            url: URL.createObjectURL(blob), 
            size: size 
          };
        });
        mediaPromises.push(promise);
      }
    }
  });
  await Promise.all(mediaPromises);

  // Step 3: Parse each slide — extract text AND image references
  for (const slideFile of slideFiles) {
    const xmlContent = await zip.file(slideFile.name)?.async('string');
    if (!xmlContent) continue;

    const textBlocks = extractTextFromSlideXML(xmlContent);
    const fullText = textBlocks.join('\n').trim();

    // Get image references from slide relationships
    const relsPath = `ppt/slides/_rels/slide${slideFile.index}.xml.rels`;
    const slideMedia: { url: string; size: number }[] = [];
    const relsFile = zip.file(relsPath);
    if (relsFile) {
      const relsXml = await relsFile.async('string');
      const parser = new DOMParser();
      const relsDoc = parser.parseFromString(relsXml, 'application/xml');
      const relationships = relsDoc.getElementsByTagName('Relationship');
      for (let i = 0; i < relationships.length; i++) {
        const target = relationships[i].getAttribute('Target') || '';
        if (target.includes('media/')) {
          const fullPath = 'ppt/' + target.replace('../', '');
          if (mediaMap[fullPath]) {
            slideMedia.push(mediaMap[fullPath]);
          }
        }
      }
    }

    // Rank images by size: Largest is most likely the main slide content (MathType image or diagram)
    slideMedia.sort((a, b) => b.size - a.size);

    slides.push({
      slideNumber: slideFile.index,
      textBlocks: textBlocks.length > 0 ? textBlocks : [`[Slide ${slideFile.index}]`],
      fullText: fullText || `[Slide ${slideFile.index}]`,
      mediaRefs: slideMedia.map(m => m.url),
      imageUrl: slideMedia.length > 0 ? slideMedia[0].url : undefined,
    });
  }

  // Fallback to thumbnail for Slide 1 if no media found
  try {
    const thumb = zip.file('docProps/thumbnail.jpeg') || zip.file('docProps/thumbnail.png');
    if (thumb && slides.length > 0 && !slides[0].imageUrl) {
      const blob = await thumb.async('blob');
      slides[0].imageUrl = URL.createObjectURL(blob);
    }
  } catch { /* Optional */ }

  return slides;
}

/**
 * Extract text runs from slide XML.
 * Preserves text exactly as authored — no LaTeX, no reformatting.
 */
function extractTextFromSlideXML(xml: string): string[] {
  const textBlocks: string[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  // Standard text paragraphs (a:p → a:r → a:t)
  const paragraphs = doc.getElementsByTagNameNS(
    'http://schemas.openxmlformats.org/drawingml/2006/main',
    'p'
  );

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const runs = para.getElementsByTagNameNS(
      'http://schemas.openxmlformats.org/drawingml/2006/main',
      't'
    );

    let paragraphText = '';
    for (let j = 0; j < runs.length; j++) {
      paragraphText += runs[j].textContent || '';
    }

    // Also get Office MathML text (m:t elements)
    const mathElements = para.getElementsByTagNameNS(
      'http://schemas.openxmlformats.org/officeDocument/2006/math',
      't'
    );
    for (let j = 0; j < mathElements.length; j++) {
      paragraphText += mathElements[j].textContent || '';
    }

    const trimmed = paragraphText.trim();
    if (trimmed.length > 0) {
      textBlocks.push(trimmed);
    }
  }

  // Also scan for standalone Office MathML blocks outside paragraphs
  const standaloneMath = doc.getElementsByTagNameNS(
    'http://schemas.openxmlformats.org/officeDocument/2006/math',
    'oMath'
  );
  for (let i = 0; i < standaloneMath.length; i++) {
    const mathTexts = standaloneMath[i].getElementsByTagNameNS(
      'http://schemas.openxmlformats.org/officeDocument/2006/math',
      't'
    );
    let mathStr = '';
    for (let j = 0; j < mathTexts.length; j++) {
      mathStr += mathTexts[j].textContent || '';
    }
    if (mathStr.trim().length > 0 && !textBlocks.includes(mathStr.trim())) {
      textBlocks.push(mathStr.trim());
    }
  }

  return textBlocks;
}

/**
 * Detect question boundaries from parsed slide text.
 */
export function detectQuestionFromSlide(slide: ParsedSlide): {
  questionText: string;
  options: string[];
} {
  const lines = slide.textBlocks;
  let questionText = '';
  const options: string[] = [];

  for (const line of lines) {
    // Detect MCQ options: (A), (B), (C), (D) or A), B), etc.
    const optionMatch = line.match(/^\s*\(?([A-Da-d])\)?\s*[.)]\s*(.*)/);
    if (optionMatch) {
      options.push(`${optionMatch[1].toUpperCase()}) ${optionMatch[2]}`);
    } else if (line.length > 3 && !line.startsWith('[Slide')) {
      questionText += (questionText ? ' ' : '') + line;
    }
  }

  return { questionText: questionText.trim(), options };
}
