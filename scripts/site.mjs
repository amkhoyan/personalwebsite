// Generates the machine-readable side of the site from content/:
// llms.txt, llms-full.txt, resume.md, robots.txt, sitemap.xml, plus SEO tags,
// JSON-LD and a plain-HTML profile injected into index.html.
//
// AI crawlers (GPTBot, ClaudeBot, PerplexityBot…) don't run JavaScript, so
// without this they would only ever see an empty page.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndex } from "./build-index.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const SITE_URL = "https://mkhn.xyz";
const LANGS = ["en", "hy"];

const isEmpty = v => v == null || v === "" || (Array.isArray(v) && !v.length);
// English first, falling back to any other language that has a value.
const pick = entry => {
  const out = {};
  for (const l of [...LANGS].reverse()) for (const [k, v] of Object.entries(entry?.[l] || {})) if (!isEmpty(v)) out[k] = v;
  for (const [k, v] of Object.entries(entry?.en || {})) if (!isEmpty(v)) out[k] = v;
  return out;
};
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const oneLine = s => String(s ?? "").replace(/\s+/g, " ").trim();
const CATEGORY = { product: "Product", tech: "Tech", community: "Community", volunteering: "Volunteering", creative: "Creative", education: "Education", sport: "Sport", personal: "Personal", love: "For the love of it" };

function profile(index) {
  const s = index.settings?.en || {};
  const withSlug = e => ({ ...pick(e), slug: e.slug });
  const projects = (index.projects || []).map(withSlug).filter(p => p.title);
  const posts = (index.posts || []).map(withSlug).filter(p => p.title && !p.draft).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const gear = (index.coffee?.equipment || []).map(pick).filter(g => g.name);
  const jobs = s.resume || [];
  const current = jobs[0];
  return { s, projects, posts, gear, jobs, current };
}

function resumeMarkdown({ s, jobs }) {
  const lines = [`# ${s.name} — Resume`, ""];
  if (s.resume_title) lines.push(`**${s.resume_title}**`, "");
  lines.push([s.location, s.email, ...(s.links || []).map(l => l.url)].filter(Boolean).join(" · "), "");
  if (s.open_to_work) lines.push(`**Open to new roles.**${s.looking_for ? ` ${oneLine(s.looking_for)}` : ""}`, "");
  if (s.resume_summary) lines.push("## Summary", "", s.resume_summary, "");
  if (jobs.length) {
    lines.push("## Experience", "");
    for (const j of jobs) {
      lines.push(`### ${j.role} — ${j.org}`, "");
      if (j.when) lines.push(`*${j.when}*`, "");
      if (j.description) lines.push(j.description.trim(), "");
    }
  }
  if (s.resume_skills?.length) {
    lines.push("## Skills", "");
    for (const g of s.resume_skills) lines.push(`- **${g.title}:** ${(g.items || []).join(", ")}`);
    lines.push("");
  }
  if (s.education?.length) {
    lines.push("## Education", "");
    for (const e of s.education) lines.push(`- ${e.degree}, ${e.school}${e.when ? ` (${e.when})` : ""}`);
    lines.push("");
  }
  if (s.resume_languages?.length) {
    lines.push("## Languages", "");
    for (const l of s.resume_languages) lines.push(`- ${l.language}: ${l.level}`);
    lines.push("");
  }
  lines.push("## Contact", "");
  if (s.email) lines.push(`- Email: ${s.email}`);
  for (const l of s.links || []) lines.push(`- ${l.label}: ${l.url}`);
  return lines.join("\n") + "\n";
}

function llmsTxt(p) {
  const { s, projects, posts, current, jobs } = p;
  const years = s.stats?.map(x => `${x.value} ${x.label}`).join(", ");
  const lines = [`# ${s.name}`, ""];
  lines.push(`> ${oneLine([s.resume_title, s.location && `based in ${s.location}`].filter(Boolean).join(", "))}. ${oneLine(s.resume_summary || s.tagline)}`, "");
  if (s.open_to_work) lines.push(`**Open to new roles.**${s.looking_for ? ` ${oneLine(s.looking_for)}` : ""}`, "");
  lines.push("Key facts for recruiters and hiring tools:", "");
  if (current) lines.push(`- Most recent role: ${current.role} at ${current.org}${current.when ? ` (${current.when})` : ""}`);
  if (jobs.length > 1) lines.push(`- Previous roles: ${jobs.slice(1).map(j => `${j.role} at ${j.org}${j.when ? ` (${j.when})` : ""}`).join("; ")}`);
  if (years) lines.push(`- In numbers: ${years}`);
  if (s.location) lines.push(`- Location: ${s.location}`);
  if (s.resume_languages?.length) lines.push(`- Languages: ${s.resume_languages.map(l => `${l.language} (${l.level})`).join(", ")}`);
  if (s.education?.length) lines.push(`- Education: ${s.education.map(e => `${e.degree}, ${e.school}`).join("; ")}`);
  if (s.email) lines.push(`- Email: ${s.email}`);
  for (const l of s.links || []) lines.push(`- ${l.label}: ${l.url}`);
  lines.push("");
  lines.push("## Profile", "");
  lines.push(`- [Resume](${SITE_URL}/resume.md): full work history with achievements, skills, education and languages`);
  lines.push(`- [Full profile](${SITE_URL}/llms-full.txt): resume, about, projects and writing in one file`);
  lines.push(`- [Website](${SITE_URL}/): interactive version of this profile (English and Armenian)`);
  lines.push("");
  if (projects.length) {
    lines.push("## Projects", "");
    for (const pr of projects) lines.push(`- [${pr.title}](${SITE_URL}/#project/${pr.slug})${pr.summary ? `: ${oneLine(pr.summary)}` : ""}`);
    lines.push("");
  }
  if (posts.length) {
    lines.push("## Writing", "");
    for (const po of posts) lines.push(`- [${po.title}](${SITE_URL}/#post/${po.slug})${po.summary ? `: ${oneLine(po.summary)}` : ""}`);
    lines.push("");
  }
  lines.push("## Optional", "");
  lines.push(`- [Coffee](${SITE_URL}/#coffee): personal interest — home espresso and brewing gear, latte art`);
  return lines.join("\n") + "\n";
}

function llmsFull(p) {
  const { s, projects, posts, gear } = p;
  const parts = [resumeMarkdown(p).replace(/^# .*/, `# ${s.name}`)];
  if (s.about) parts.push(`## About\n\n${s.about.trim()}\n`);
  if (projects.length) {
    parts.push("## Projects\n");
    for (const pr of projects) {
      const meta = [CATEGORY[pr.category], pr.role, pr.year].filter(Boolean).join(" · ");
      parts.push(`### ${pr.title}\n\n${meta ? `*${meta}*\n\n` : ""}${pr.summary ? `${pr.summary.trim()}\n\n` : ""}${pr.body ? `${pr.body.trim()}\n` : ""}`);
    }
  }
  if (posts.length) {
    parts.push("## Writing\n");
    for (const po of posts) parts.push(`### ${po.title}\n\n*${po.date}*\n\n${(po.body || po.summary || "").trim()}\n`);
  }
  if (gear.length) parts.push(`## Personal interest: coffee\n\nHome coffee setup: ${gear.map(g => g.name).join(", ")}.\n`);
  return parts.join("\n");
}

function jsonLd({ s, jobs }) {
  const sameAs = (s.links || []).map(l => l.url).filter(Boolean);
  const person = {
    "@type": "Person",
    name: s.name,
    url: `${SITE_URL}/`,
    jobTitle: jobs[0]?.role?.split(",")[0] || "Product Manager",
    description: oneLine(s.resume_summary || s.tagline),
    ...(s.email && { email: `mailto:${s.email}` }),
    ...(s.location && { address: { "@type": "PostalAddress", addressLocality: s.location } }),
    ...(sameAs.length && { sameAs }),
    knowsAbout: (s.resume_skills || []).flatMap(g => g.items || []),
    knowsLanguage: (s.resume_languages || []).map(l => l.language),
    alumniOf: (s.education || []).map(e => ({ "@type": "CollegeOrUniversity", name: e.school })),
  };
  return { "@context": "https://schema.org", "@type": "ProfilePage", mainEntity: person };
}

function seoHead(p) {
  const { s } = p;
  const title = `${s.name} — ${(s.resume_title || "").split("·")[0].trim() || "Product Manager"}`;
  const desc = oneLine(s.resume_summary || s.tagline).slice(0, 300);
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(desc)}">`,
    `<link rel="canonical" href="${SITE_URL}/">`,
    `<meta property="og:type" content="profile">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(desc)}">`,
    `<meta property="og:url" content="${SITE_URL}/">`,
    `<meta name="twitter:card" content="summary">`,
    `<link rel="alternate" type="text/markdown" href="/resume.md" title="Resume (Markdown)">`,
    `<link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-friendly profile">`,
    `<script type="application/ld+json">${JSON.stringify(jsonLd(p)).replace(/</g, "\\u003c")}</script>`,
  ].join("\n");
}

// Plain HTML copy of the profile for crawlers that don't run JavaScript.
// It sits underneath the full-screen desktop and is removed as soon as the app boots.
function prerender(p) {
  const { s, jobs, projects } = p;
  const li = items => items.map(x => `<li>${x}</li>`).join("");
  return `<article id="prerender" class="prerender">
<h1>${esc(s.name)}</h1>
${s.resume_title ? `<p><strong>${esc(s.resume_title)}</strong></p>` : ""}
<p>${esc([s.location, s.email].filter(Boolean).join(" · "))}</p>
${s.resume_summary ? `<p>${esc(s.resume_summary)}</p>` : ""}
${jobs.length ? `<h2>Experience</h2>${jobs.map(j => `<h3>${esc(j.role)} — ${esc(j.org)}</h3>${j.when ? `<p>${esc(j.when)}</p>` : ""}<p>${esc(oneLine(j.description))}</p>`).join("")}` : ""}
${s.resume_skills?.length ? `<h2>Skills</h2><ul>${li(s.resume_skills.map(g => `${esc(g.title)}: ${esc((g.items || []).join(", "))}`))}</ul>` : ""}
${s.education?.length ? `<h2>Education</h2><ul>${li(s.education.map(e => `${esc(e.degree)}, ${esc(e.school)}`))}</ul>` : ""}
${s.resume_languages?.length ? `<h2>Languages</h2><ul>${li(s.resume_languages.map(l => `${esc(l.language)}: ${esc(l.level)}`))}</ul>` : ""}
${projects.length ? `<h2>Projects</h2><ul>${li(projects.map(pr => `${esc(pr.title)}${pr.summary ? ` — ${esc(oneLine(pr.summary))}` : ""}`))}</ul>` : ""}
<p><a href="/resume.md">Resume (Markdown)</a> · <a href="/llms.txt">llms.txt</a>${(s.links || []).map(l => ` · <a href="${esc(l.url)}">${esc(l.label)}</a>`).join("")}</p>
</article>`;
}

const replaceBetween = (html, name, content) =>
  html.replace(new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`), `$1\n${content}\n$2`);

export async function generateSite() {
  const index = await buildIndex();
  const p = profile(index);
  let html = await readFile(join(ROOT, "index.html"), "utf8");
  html = replaceBetween(html, "SEO", seoHead(p));
  html = replaceBetween(html, "PRERENDER", prerender(p));
  const today = new Date().toISOString().slice(0, 10);
  return {
    index,
    files: {
      "index.html": html,
      "content/index.json": JSON.stringify(index),
      "llms.txt": llmsTxt(p),
      "llms-full.txt": llmsFull(p),
      "resume.md": resumeMarkdown(p),
      "robots.txt": `# AI assistants and search engines are welcome.\nUser-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE_URL}/sitemap.xml\n# LLM-friendly profile: ${SITE_URL}/llms.txt\n`,
      "sitemap.xml": `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${["/", "/?lang=hy", "/resume.md", "/llms.txt", "/llms-full.txt"].map(u => `  <url><loc>${SITE_URL}${u.replace("&", "&amp;")}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`,
    },
  };
}
