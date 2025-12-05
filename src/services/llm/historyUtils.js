export function formatProjectHistory(projectPromptHistory = []) {
  if (!Array.isArray(projectPromptHistory) || projectPromptHistory.length === 0) {
    return "";
  }

  const items = projectPromptHistory.map((p, idx) => {
    const text = typeof p === "string" ? p : p?.prompt ?? "";
    return `${idx + 1}. ${text}`;
  });

  return [
    "",
    "Project prompt history (oldest first):",
    ...items,
    "",
    "Use this history to keep the visual language, tone, and information architecture consistent for this project.",
    "You may refine or extend previous ideas instead of starting from scratch if that fits the new prompt.",
  ].join("\n");
}
