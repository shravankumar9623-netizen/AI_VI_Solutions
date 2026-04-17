/**
 * Visual Generator module.
 * Determines the visual annotations and pen actions based on the script.
 */

export interface VisualInstructions {
  annotations: string[];
}

/**
 * Generate visual instructions based on the spoken script.
 */
export async function generateVisuals(script: string[]): Promise<VisualInstructions> {
  // In production, this would determine exactly when to draw, underline, or star.

  const annotations = script.map((line, idx) => {
    if (line.includes("answer") || line.includes("finally")) return "Box Answer";
    if (line.includes("important") || line.includes("note")) return "Star Mark";
    return `Write Math ${idx + 1}`;
  });

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 900));

  return {
    annotations
  };
}
