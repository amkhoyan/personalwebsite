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
  const entries = await Promise.all(files.map(async f => {
    try {
      return { slug: f.slice(0, -5), ...(await readJson(join(dir, f))) };
    } catch (err) {
      // One broken file shouldn't take the whole site down.
      console.warn(`Skipping ${join(dir, f)}: ${err.message}`);
      return null;
    }
  }));
  return entries.filter(Boolean);
}

export async function buildIndex() {
  return {
    settings: await readJson("content/settings.json"),
    projects: await readFolder("content/projects"),
    posts: await readFolder("content/posts"),
    coffee: {
      equipment: await readFolder("content/coffee/equipment"),
      latte_art: await readFolder("content/coffee/latte-art"),
    },
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const index = await buildIndex();
  await writeFile(join(ROOT, "content/index.json"), JSON.stringify(index));
  console.log(`content/index.json: ${index.projects.length} projects, ${index.posts.length} posts`);
}
