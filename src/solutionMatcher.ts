import { callLLM } from './llmClient';

export interface AlignmentResult {
  matched_solution: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Alignment Engine: Matches an extracted question to its relevant part in a full solution document.
 */
export async function matchSolutionToQuestion(questionText: string, fullSolutionDoc: string): Promise<AlignmentResult> {
  const qMatch = questionText.match(/Q\s*(\d+)/i);
  const questionNumber = qMatch ? qMatch[1] : null;

  // GREEDY VICINITY SEARCH: Capture a very large block around the identifier
  let focusDoc = fullSolutionDoc;
  if (questionNumber) {
    // Escape special characters and create a pattern that finds the START of the solution block
    // We look for "Q[N] Solution" or just "Q[N]"
    const startPattern = new RegExp(`(Q|Question|Solution|Text Solution)\\s*:?\\s*${questionNumber}`, 'i');
    
    // Find ALL occurrences and pick the one that looks most like a solution
    const startIndex = fullSolutionDoc.search(startPattern);
    
    if (startIndex !== -1) {
        // Look for the next question as the end marker
        const nextQ = parseInt(questionNumber) + 1;
        const endPattern = new RegExp(`(Q|Question|Solution|Text Solution)\\s*:?\\s*${nextQ}`, 'i');
        const endIndex = fullSolutionDoc.slice(startIndex + 5).search(endPattern);
        
        if (endIndex !== -1) {
            focusDoc = fullSolutionDoc.slice(startIndex, startIndex + 5 + endIndex);
        } else {
            // If no next question, take the rest of the document (up to 5000 chars)
            focusDoc = fullSolutionDoc.slice(startIndex, startIndex + 5000);
        }
    }
  }

  // If the focused block is still empty or too short, fallback to the full doc
  if (focusDoc.trim().length < 50) focusDoc = fullSolutionDoc;

  const systemPrompt = `You are a HIGH-PRECISION CHEMISTRY ALIGNMENT ENGINE.
  CRITICAL: You MUST extract the FULL solution including ALL equations, formulas, and math.
  If you see "Rate =", "k1", or any LaTeX/Math, EXFILTRATE it. DO NOT SUMMARIZE.
  
  OUTPUT FORMAT (STRICT JSON):
  {"matched_solution": "...full content...", "confidence": "high/medium/low"}`;

  const userPrompt = `TARGET: Question ${questionNumber}
  
  SOURCE_TEXT:
  ${focusDoc}`;

  try {
    const result = await callLLM(systemPrompt, userPrompt);
    if (result && result.matched_solution && result.confidence !== 'low') {
      return result;
    }
  } catch (err) {
    console.error("Alignment Engine LLM Error:", err);
  }

  // ROBUST FALLBACK: If LLM fails, use the programmatically isolated block
  return {
    matched_solution: focusDoc.trim(),
    confidence: focusDoc.length < fullSolutionDoc.length ? 'high' : 'medium'
  };
}
