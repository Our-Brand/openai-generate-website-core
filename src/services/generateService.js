import { generatePage } from "./llm.js";
import { getUserOrThrow } from "./userService.js";
import {
  createProjectWithLimit,
  updateProjectCode,
  savePrompt,
  getPromptHistoryForProject,
} from "./projectService.js";
import { inferProjectMeta } from "./llm/projectMetaService.js";

function normalizeProjectName(name) {
  if (typeof name !== "string") return null;
  const cleaned = name.trim().replace(/\s+/g, " ");
  if (!cleaned) return null;
  return cleaned.slice(0, 40); // match your meta constraint
}

export async function generateForProject({ userId, projectId, projectName, prompt }) {
  // ensure user exists
  await getUserOrThrow(userId); // keep await if async

  let history = [];
  if (projectId) {
    history = await getPromptHistoryForProject(projectId); // keep await if async
  }

  const raw = await generatePage(prompt, history);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    const error = new Error(
      "Model did not return valid JSON with 'reactComponent' and 'previewHtml'."
    );
    error.code = "LLM_INVALID_JSON";
    error.raw = raw;
    throw error;
  }

  const { reactComponent, previewHtml } = parsed || {};
  if (typeof reactComponent !== "string" || typeof previewHtml !== "string") {
    const error = new Error(
      "Model JSON missing 'reactComponent' or 'previewHtml' string fields."
    );
    error.code = "LLM_MISSING_FIELDS";
    throw error;
  }

  let project;

  if (projectId) {
    project = await updateProjectCode({
      userId,
      projectId,
      reactCode: reactComponent,
      htmlCode: previewHtml,
    });
  } else {
    // Prefer inferred name from prompt/history; fall back to provided; then fallback default
    const inferred = await inferProjectMeta(prompt, history);
    const inferredName = normalizeProjectName(inferred?.projectName);
    const providedName = normalizeProjectName(projectName);

    const finalName = inferredName ?? providedName ?? `Project ${Date.now()}`;

    project = await createProjectWithLimit({
      userId,
      name: finalName,
      reactCode: reactComponent,
      htmlCode: previewHtml,
    });
  }

  await savePrompt({ projectId: project.id, prompt });

  return {
    projectId: project.id,
    html: previewHtml,
    react: reactComponent,
  };
}
