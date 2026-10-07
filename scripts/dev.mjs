// Local preview of the site. The CMS at /admin can edit this folder directly
// (click "Work with Local Repository" in Chrome or Edge).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSite } from "./site.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = Number(process.argv[2] || process.env.PORT) || 4321;
const GENERATED = new Set(["index.html", "content/index.json", "llms.txt", "llms-full.txt", "resume.md", "robots.txt", "sitemap.xml"]);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json; charset=utf-8", ".yml": "text/yaml; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8", ".md": "text/markdown; charset=utf-8", ".xml": "application/xml",
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  try {
    const generated = path === "/" ? "index.html" : path.slice(1);
    if (GENERATED.has(generated)) {
      const { files } = await generateSite();
      res.writeHead(200, { "content-type": TYPES[extname(generated)] || "text/plain; charset=utf-8", "cache-control": "no-store" });
      return res.end(files[generated]);
    }
    let file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) throw new Error("outside root");
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch {
    if (res.headersSent) return res.end();
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("Not found");
  }
})
  .on("error", err => {
    if (err.code !== "EADDRINUSE") throw err;
    console.error(`\n  Port ${PORT} is already in use — another server is probably still running.`);
    console.error(`  Stop it (Ctrl+C in its terminal), or use another port:  npm run dev -- ${PORT + 1}\n`);
    process.exit(1);
  })
  .listen(PORT, () => {
    console.log(`\n  Website:  http://localhost:${PORT}`);
    console.log(`  CMS:      http://localhost:${PORT}/admin/\n`);
  });
