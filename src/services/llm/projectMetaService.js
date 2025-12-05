import client from "./openaiClient.js";
import { formatProjectHistory } from "./historyUtils.js";

const DEFAULT_META = {
  projectName: "New Project",
  sector: "SaaS",
  audience: "B2B decision makers",
  primaryGoal: "Generate a modern marketing landing page",
};

export async function inferProjectMeta(prompt, projectPromptHistory = []) {
  const historyBlock = formatProjectHistory(projectPromptHistory);

  try {
    const metaResponse = await client.responses.create({
      model: "gpt-4.1-mini",
      max_output_tokens: 400,
      instructions: [
        "You are a concise branding and product strategist.",
        "From the user's description and history, infer:",
        '- projectName: a short, product-like name (max 40 chars, no quotes).',
        '- sector: a short description of the sector, like \"B2B analytics SaaS\", \"DevTools\", \"Fintech\", etc.',
        '- audience: the main target audience, e.g. \"founders\", \"data teams\", \"marketing leaders\".',
        '- primaryGoal: what this page is mainly trying to achieve, in 1 short sentence.',
        "",
        'Return ONLY a JSON object: {"projectName": "...", "sector": "...", "audience": "...", "primaryGoal": "..."}',
        "No markdown, no backticks, no commentary.",
      ].join("\n"),
      input: [
        {
          role: "user",
          content: ["User prompt:", prompt, historyBlock].join("\n"),
        },
      ],
    });

    const metaText = metaResponse.output_text;
    const parsed = JSON.parse(metaText);

    return {
      ...DEFAULT_META,
      ...parsed,
    };
  } catch (err) {
    console.warn("Failed to infer project meta, using defaults:", err);
    return { ...DEFAULT_META };
  }
}
