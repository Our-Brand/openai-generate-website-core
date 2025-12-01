import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.warn("Warning: OPENAI_API_KEY is not set in your environment.");
}

export async function generatePage(prompt, projectPromptHistory = []) {
  // -------- 0. Format project history as text for context (oldest first) --------
  let historyBlock = "";
  if (Array.isArray(projectPromptHistory) && projectPromptHistory.length > 0) {
    const items = projectPromptHistory.map((p, idx) => {
      const text = typeof p === "string" ? p : p?.prompt ?? "";
      return `${idx + 1}. ${text}`;
    });

    historyBlock = [
      "",
      "Project prompt history (oldest first):",
      ...items,
      "",
      "Use this history to keep the visual language, tone, and information architecture consistent for this project.",
      "You may refine or extend previous ideas instead of starting from scratch if that fits the new prompt.",
    ].join("\n");
  }

  // -------- 1. Infer project name + context --------
  let projectMeta = {
    projectName: "New Project",
    sector: "SaaS",
    audience: "B2B decision makers",
    primaryGoal: "Generate a modern marketing landing page",
  };

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
    projectMeta = {
      ...projectMeta,
      ...parsed,
    };
  } catch (err) {
    console.warn("Failed to infer project meta, using defaults:", err);
  }

  // -------- 2. Propose color palette for this sector --------
  let colorMeta = {
    primary: "#4F46E5",
    primarySoft: "#EEF2FF",
    accent: "#0EA5E9",
    background: "#F8FAFC",
    surface: "#FFFFFF",
    textMain: "#0F172A",
    textMuted: "#6B7280",
  };

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
        '  "primary": "#4F46E5",',
        '  "primarySoft": "#EEF2FF",',
        '  "accent": "#0EA5E9",',
        '  "background": "#F8FAFC",',
        '  "surface": "#FFFFFF",',
        '  "textMain": "#0F172A",',
        '  "textMuted": "#6B7280"',
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
    colorMeta = {
      ...colorMeta,
      ...parsed,
    };
  } catch (err) {
    console.warn("Failed to infer color palette, using defaults:", err);
  }

  // -------- 3. Generate final React + HTML page --------
  const designSystemInstructions = [
    "You are a senior product designer + front-end engineer.",
    "You generate TWO things:",
    "1) A React + Tailwind component (as a full ES module).",
    "2) A static HTML page using Tailwind via CDN that visually matches the component.",
    "",
    'Return ONLY a JSON object with exactly these keys: "reactComponent" and "previewHtml".',
    "No markdown, no backticks, no explanations, no comments.",
    "",
    "---------------------------------------------------------",
    "VISIBLE COPY / BRAND VOICE:",
    "- All visible text must be product- and user-facing.",
    "- Do NOT mention or reference React, Tailwind, code, engineering tools, or developer tooling in any headings, body copy, CTAs, or labels.",
    "- Treat the page as a real product/marketing experience, not a developer or framework demo.",
    "",
    "---------------------------------------------------------",
    "PROJECT CONTEXT:",
    `- Project name: ${projectMeta.projectName}`,
    `- Sector: ${projectMeta.sector}`,
    `- Audience: ${projectMeta.audience}`,
    `- Primary goal: ${projectMeta.primaryGoal}`,
    "",
    "COLOR PALETTE (guidance, not strict Tailwind tokens):",
    `- primary: ${colorMeta.primary}`,
    `- primarySoft: ${colorMeta.primarySoft}`,
    `- accent: ${colorMeta.accent}`,
    `- background: ${colorMeta.background}`,
    `- surface: ${colorMeta.surface}`,
    `- textMain: ${colorMeta.textMain}`,
    `- textMuted: ${colorMeta.textMuted}`,
    "",
    "Use these colors as inspiration mapped to Tailwind classes (e.g. bg-slate-50, bg-indigo-600, text-slate-900, etc.).",
    "",
    "---------------------------------------------------------",
    "GLOBAL DESIGN SYSTEM (MODERN SAAS):",
    "- Overall vibe:",
    "  • Modern, premium B2B / SaaS design.",
    "  • Clean, minimal, with strong hierarchy and generous whitespace.",
    "  • Everything should feel polished enough to be a real startup product marketing page.",
    "",
    "- Layout & spacing:",
    "  • Use a centered max-width container, e.g. `max-w-6xl` or `max-w-7xl` with `mx-auto`.",
    "  • Use consistent horizontal padding: `px-4 sm:px-6 lg:px-8`.",
    "  • Use generous vertical spacing: `py-12 sm:py-16 lg:py-24` for sections.",
    "  • Use grid and flex layouts for a clean, orderly structure.",
    "",
    "- Color & theming:",
    "  • Default to a light, neutral background (e.g. `bg-slate-50` / `bg-gray-50`).",
    "  • Use white cards with subtle borders/shadows: `bg-white border border-slate-200 shadow-sm shadow-slate-100`.",
    "  • Use the derived primary/accent colors for buttons, highlights, and badges.",
    "  • Keep the palette restrained and business-like unless the user explicitly asks otherwise.",
    "",
    "- Typography:",
    "  • Use clear hierarchy:",
    "      - Hero: `text-3xl sm:text-4xl lg:text-5xl font-semibold`.",
    "      - Section titles: `text-xl sm:text-2xl font-semibold`.",
    "      - Body: `text-sm sm:text-base text-slate-600`.",
    "  • Use slightly increased line-height for readability.",
    "",
    "- Cards & sections:",
    "  • Use card-based layouts wherever possible:",
    "      - Cards with `rounded-2xl`, `border`, `shadow-sm` or `shadow-md`.",
    "      - Use `space-y-*` or `gap-*` utilities to keep internal padding consistent.",
    "  • Prefer grids like `grid gap-6 sm:grid-cols-2 lg:grid-cols-3` for feature/metric cards.",
    "",
    "---------------------------------------------------------",
    "SINGLE-PAGE vs MULTI-PAGE BEHAVIOR:",
    "- If the user clearly asks for a *single page* or gives a single-page description:",
    "  • Build a single-page layout with sections (hero, highlights/stats, features, testimonials, pricing, etc.).",
    "",
    "- If the user explicitly asks for *multiple pages* (e.g. “landing + dashboard page”,",
    "  “admin + public page”, “multi-page app with X, Y, Z pages”):",
    "  • Simulate multiple pages within a single React component and a single HTML document by:",
    "      - Creating clearly separated sections, each representing a 'page'.",
    "      - Labeling them with headings like 'Marketing Page', 'Dashboard Page', etc. when appropriate.",
    "      - Using different background shades to distinguish sections (e.g. alternating `bg-white` and `bg-slate-50`).",
    "  • Do NOT introduce real routing libraries or navigation logic.",
    "  • Do NOT rely on actual client-side routing or URL changes.",
    "",
    "---------------------------------------------------------",
    "HERO & KEY SECTIONS (DEFAULT EXPECTATION):",
    "- Hero:",
    "  • Full-width section with a clear value proposition.",
    "  • Two-column layout on desktop, stacked on mobile:",
    "      - Left: headline, supporting text, primary & secondary call-to-action elements.",
    "      - Right: visual mock (image card, stats, or simplified 'app preview' using cards).",
    "  • Subtle background treatments are encouraged (e.g. `bg-gradient-to-b from-slate-50 to-white`).",
    "",
    "- Recommended supporting sections (choose those that fit the prompt):",
    "  • Metrics / social proof.",
    "  • Feature grid.",
    "  • Use cases or personas.",
    "  • Simple pricing snapshot.",
    "  • FAQ section.",
    "  • Contact or summary section if explicitly requested by the user.",
    "",
    "---------------------------------------------------------",
    "IMAGES (NO SPECIAL RESTRICTIONS):",
    "- You MAY freely use <img> elements where appropriate for the design.",
    "- You MAY use external image URLs (Unsplash, Picsum, product screenshots, etc.) as long as they match the business context.",
    "- You MAY use SVGs or icon-like visuals if they are inline and self-contained.",
    "- Do NOT embed or reference any actual user data or secrets in URLs.",
    "",
    "---------------------------------------------------------",
    "INTERACTION, LINKS & BUTTONS (VISUAL ONLY, NO ROUTING):",
    "- The layout MUST NOT perform any real navigation or routing when the user interacts with it.",
    "- Do NOT use <a> elements with href at all (no external URLs, no hash links, no empty href).",
    "- If you want something that *looks* like a link (e.g. in a top nav or CTA):",
    "  • Use a <button type=\"button\"> or a non-interactive element (like <span>) styled to look like a link.",
    "  • These elements MUST NOT have any JavaScript handlers.",
    "",
    "- Buttons:",
    "  • Use <button type=\"button\"> for clickable-looking elements.",
    "  • Buttons are VISUAL ONLY (no JS behavior).",
    "  • They MUST NOT have onClick or any other event handlers.",
    "",
    "- Forms:",
    "  • Forms are OPTIONAL.",
    "  • Only include forms (e.g. contact, signup, request demo) if the user description clearly suggests or requests them.",
    "  • Forms are for layout and UI demonstration only.",
    "  • It is acceptable to leave form action empty or set to '#'.",
    "  • No JavaScript handlers.",
    "",
    "---------------------------------------------------------",
    "FOOTER REQUIREMENTS:",
    "- The page MUST include a footer at the bottom.",
    "- In the React component:",
    "  • The footer text MUST include the current year inside JSX.",
    '  • The footer MUST contain the brand name \"OurBrand\" (e.g. \"© {new Date().getUTCFullYear()} OurBrand. All rights reserved.\").',
    "- In the HTML preview:",
    "  • Render the same footer text, but with the year written as a concrete number (e.g. 2025) instead of a JavaScript expression.",
    "  • The brand name MUST still appear as \"OurBrand\".",
    "",
    "---------------------------------------------------------",
    "REACT COMPONENT REQUIREMENTS:",
    "- Must be a default export: `export default function GeneratedPage() { ... }`.",
    "- Use JSX (no TypeScript syntax).",
    "- Use Tailwind CSS classes for styling.",
    "- Use semantic HTML tags: <header>, <main>, <section>, <footer>, etc.",
    "- You may still use section ids for semantics (e.g. id=\"hero\", id=\"features\", id=\"pricing\"),",
    "  but you MUST NOT generate <a> links that navigate to them.",
    "- Always include:",
    "    • A strong hero section.",
    "    • At least one feature/benefit/card-based section.",
    "    • At least one social proof / trust section when reasonable.",
    "    • The required footer described above.",
    "- Component MUST be self-contained (no props, no external imports besides React if needed).",
    "",
    "---------------------------------------------------------",
    "HTML PREVIEW REQUIREMENTS:",
    "- Must be a complete HTML5 document:",
    "    <!DOCTYPE html>, <html>, <head>, <body>.",
    "- Load Tailwind via CDN:",
    '    <script src=\"https://cdn.tailwindcss.com\"></script>',
    "- Must visually match the React component as closely as possible.",
    "- Use the same section structure and ids.",
    "- Do NOT include any <a> tags with href. Use <button type=\"button\"> or non-interactive elements for link-like UI.",
    "- Follow all the same rules (design, no JS, footer present with current year and OurBrand).",
    "",
    "---------------------------------------------------------",
    "GENERAL RESTRICTIONS:",
    "- No custom JavaScript scripts except the Tailwind CDN in the HTML preview.",
    "- No inline event handlers (onClick, onSubmit, etc.).",
    "- No external navigation (no <a href=\"https://...\">, no <a href=\"#...\").",
    "- No local file references.",
  ].join("\n");

  const finalResponse = await client.responses.create({
    model: "gpt-4.1",
    max_output_tokens: 10000,
    instructions: designSystemInstructions,
    input: [
      {
        role: "user",
        content: [
          "Create a visually polished, responsive single-page or multi-page-feeling layout based on this description:",
          prompt,
          historyBlock,
          "",
          "Use the inferred project name, sector, audience and color palette above as your foundation.",
          "Default to a professional, modern SaaS, business-oriented design with cards, subtle shadows, and generous whitespace, unless the user explicitly asks for something different.",
          "If the user clearly asks for multiple pages, represent them as distinct page-like sections within one component and one HTML document.",
          "Remember: do NOT generate <a> tags with href, use only visual buttons or link-like elements without navigation, and include the required footer with the current year and OurBrand.",
        ].join("\n"),
      },
    ],
  });

  // Still returns a JSON string like { "reactComponent": "...", "previewHtml": "..." }
  return finalResponse.output_text;
}
