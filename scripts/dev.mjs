// Local preview of the site. The CMS at /admin can edit this folder directly
// (click "Work with Local Repository" in Chrome or Edge).
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndex } from "./build-index.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = Number(process.argv[2] || process.env.PORT) || 4321;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json; charset=utf-8", ".yml": "text/yaml; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".pdf": "application/pdf",
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  try {
    if (path === "/content/index.json") {
      res.writeHead(200, { "content-type": TYPES[".json"], "cache-control": "no-store" });
      return res.end(JSON.stringify(await buildIndex()));
    }
    let file = normalize(join(ROOT, path));
    if (!file.startsWith(ROOT)) throw new Error("outside root");
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(await readFile(file));
  } catch {
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
