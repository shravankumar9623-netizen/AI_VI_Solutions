import { callLLM } from './llmClient';

export interface PreprocessedContent {
  clean_slide: string;
  clean_solution: string;
}

/**
 * Clean and standardize raw text from PPT slides and PDF solutions.
 */
export async function preprocessContent(raw_slide: string, raw_solution: string): Promise<PreprocessedContent> {
  // 1. Prepare Prompts
  const systemPrompt = "You are a preprocessing engine for educational content. Clean and standardize the input. Rules: Remove noise, OCR errors, fix grammar, preserve formulas.";
  const userPrompt = `Input Slide: ${raw_slide}\nInput Solution: ${raw_solution}`;

  // 2. Execute Structured LLM Call (Simulated)
  // In real use: const response = await callLLM(systemPrompt, userPrompt, true);
  await callLLM(systemPrompt, userPrompt, true);

  // 3. Fallback Heuristic logic for prototype
  const cleanText = (text: string) => {
    return text
      .replace(/[^\x20-\x7E\n]/g, '')
      .replace(/\[Slide \d+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  return {
    clean_slide: cleanText(raw_slide),
    clean_solution: cleanText(raw_solution)
  };
}
