import { callLLM } from './llmClient';

export interface StrictSolution {
  reasoning: string[];
}

/**
 * Convert solution into structured steps based ONLY on the provided reasoning.
 */
export async function solveMathStrictly(latex_question: string, retrieved_chunks: string): Promise<StrictSolution> {
  const systemPrompt = `You are an expert CHEMISTRY SOLVER.
  Your task is to extract the EXACT mathematical/chemical logical steps from the provided Reference Solution.
  OUTPUT FORMAT (STRICT JSON):
  {"reasoning": ["Full Equation or Sentence 1", "Full Equation or Sentence 2"]}`;

  try {
    const result = await callLLM(systemPrompt, `Question: ${latex_question}\n\nReference Solution: ${retrieved_chunks}`);
    if (result && result.reasoning && Array.isArray(result.reasoning)) {
      return result;
    }
  } catch (e) {
    console.error("Solver Error:", e);
  }

  // INTELLIGENT SENTENCE RE-ASSEMBLER (Fallback)
  // Step 1: Normalize whitespace and join accidental line breaks inside sentences
  const normalized = retrieved_chunks
    .replace(/([a-z,])\n([a-z])/gui, '$1 $2') // Connect lowercase line breaks
    .replace(/\s{2,}/g, ' ');

  // Step 2: Split by dots, but keep acronyms/decimals safe
  const rawSteps = normalized.split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10 && 
                !s.toLowerCase().startsWith('text solution') && 
                !s.toLowerCase().startsWith('q'));

  if (rawSteps.length > 0) {
    return { reasoning: rawSteps.slice(0, 6) };
  }

  return {
    reasoning: [
      "Analyze the fundamental chemical properties given.",
      "Identify the core logic driving the solution.",
      "Match the final derived result with the correct option."
    ]
  };
}
