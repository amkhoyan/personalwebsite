// Builds the deployable site into _site/: static files plus everything
// generated from content/ (see site.mjs). Run by GitHub Actions on every push.
import { cp, mkdir, rm, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSite } from "./site.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, "_site");

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
for (const item of ["admin", "content", "images", "CNAME"]) {
  try {
    await access(join(ROOT, item));
    await cp(join(ROOT, item), join(OUT, item), { recursive: true });
  } catch {}
}
const { files } = await generateSite();
for (const [path, content] of Object.entries(files)) {
  await mkdir(dirname(join(OUT, path)), { recursive: true });
  await writeFile(join(OUT, path), content);
}
console.log(`_site/ built: ${Object.keys(files).join(", ")}`);
