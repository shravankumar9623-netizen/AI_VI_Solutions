import { callLLM } from './llmClient';

export interface SpokenSegment {
  audio: string;
  visual: string;
}

export interface SpokenScript {
  script: SpokenSegment[];
}

/**
 * Generate a highly engaging conversational explanation using Gemini.
 */
export async function generateSpokenScript(clean_slide: string, steps: string[], slideNum: number = 1): Promise<SpokenScript> {
  const systemPrompt = `You are a professional chemistry teacher. 
  Your task is to turn chemistry logic into a conversational teaching script.
  OUTPUT FORMAT (JSON):
  {"script": [{"audio": "...conversational audio...", "visual": "...equation or core sentence..."}]}`;

  try {
    const result = await callLLM(systemPrompt, `Question: ${clean_slide}\n\nSteps:\n${steps.join("\n")}`);
    if (result && result.script && Array.isArray(result.script) && result.script.length >= 1) {
      return result;
    }
  } catch (e) {
    console.error("Script Writer Error:", e);
  }

  // REINFORCED COHESIVE FALLBACK
  const scriptSegments: SpokenSegment[] = [];

  steps.forEach((step, idx) => {
    if (idx === 0) {
      scriptSegments.push({
        audio: `Chalo bacchon, is question ko logic se solve karte hain. Sabse pehle observe karein: ${step}.`,
        visual: step
      });
    } else if (idx === steps.length - 1) {
      scriptSegments.push({
        audio: `Toh is pure discussion se ye clear hai dosto: ${step}.`,
        visual: step
      });
    } else {
      scriptSegments.push({
        audio: `Aage badhte hue, is point par dhyan dein: ${step}.`,
        visual: step
      });
    }
  });

  return { script: scriptSegments };
}
