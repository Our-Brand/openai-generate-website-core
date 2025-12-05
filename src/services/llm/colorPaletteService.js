import client from "./openaiClient.js";

const DEFAULT_COLORS = {
  primary: "#4F46E5",
  primarySoft: "#EEF2FF",
  accent: "#0EA5E9",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  textMain: "#0F172A",
  textMuted: "#6B7280",
};

export async function inferColorPalette(projectMeta) {
  try {
    const colorResponse = await client.responses.create({
      model: "gpt-4.1-mini",
      max_output_tokens: 400,
      instructions: [
        "You are a senior brand + UI designer.",
        "Based on the sector, audience, and goal, pick a modern, usable SaaS color palette.",
        "The palette must be suitable for Tailwind-like designs (light background, readable text).",
        "",
        'Return ONLY a JSON object like:',
        "{",
        '  \"primary\": \"#4F46E5\",',
        '  \"primarySoft\": \"#EEF2FF\",',
        '  \"accent\": \"#0EA5E9\",',
        '  \"background\": \"#F8FAFC\",',
        '  \"surface\": \"#FFFFFF\",',
        '  \"textMain\": \"#0F172A\",',
        '  \"textMuted\": \"#6B7280\"',
        "}",
        "",
        "No markdown, no backticks, no commentary.",
      ].join("\n"),
      input: [
        {
          role: "user",
          content: [
            "Project context:",
            `Name: ${projectMeta.projectName}`,
            `Sector: ${projectMeta.sector}`,
            `Audience: ${projectMeta.audience}`,
            `Primary goal: ${projectMeta.primaryGoal}`,
          ].join("\n"),
        },
      ],
    });

    const colorText = colorResponse.output_text;
    const parsed = JSON.parse(colorText);

    return {
      ...DEFAULT_COLORS,
      ...parsed,
    };
  } catch (err) {
    console.warn("Failed to infer color palette, using defaults:", err);
    return { ...DEFAULT_COLORS };
  }
}
