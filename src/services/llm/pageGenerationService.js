import { inferProjectMeta } from "./projectMetaService.js";
import { inferColorPalette } from "./colorPaletteService.js";
import { generateLayout } from "./layoutService.js";

/**
 * High-level service that orchestrates the LLM calls
 * and returns the final { reactComponent, previewHtml } JSON string.
 */
export async function generatePage(prompt, projectPromptHistory = []) {
  // 1. infer meta
  const projectMeta = await inferProjectMeta(prompt, projectPromptHistory);

  // 2. infer colors
  const colorMeta = await inferColorPalette(projectMeta);

  // 3. generate final layout
  const resultJson = await generateLayout(
    prompt,
    projectMeta,
    colorMeta,
    projectPromptHistory
  );

  return resultJson;
}
