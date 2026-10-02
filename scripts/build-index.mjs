// Bundles everything in content/ into content/index.json, which the site loads.
// Runs automatically on deploy (see netlify.toml) and live during `npm run dev`.
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const readJson = async path => JSON.parse(await readFile(join(ROOT, path), "utf8"));

async function readFolder(dir) {
  let files = [];
  try {
    files = (await readdir(join(ROOT, dir))).filter(f => f.endsWith(".json")).sort();
  } catch {}
  return Promise.all(files.map(async f => ({ slug: f.slice(0, -5), ...(await readJson(join(dir, f))) })));
}

export async function buildIndex() {
  return {
    settings: await readJson("content/settings.json"),
    projects: await readFolder("content/projects"),
    posts: await readFolder("content/posts"),
  };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const index = await buildIndex();
  await writeFile(join(ROOT, "content/index.json"), JSON.stringify(index));
  console.log(`content/index.json: ${index.projects.length} projects, ${index.posts.length} posts`);
}
