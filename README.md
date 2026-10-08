# Personal website

A PostHog-style "desktop" personal site in English and Armenian, edited through a CMS ([Sveltia CMS](https://sveltiacms.app)) at `/admin`. Hosted for free on GitHub Pages.

## Editing content (no code needed)

Go to **`https://<your-site>/admin`** and click **Sign In Using Access Token** (see one-time setup below). There are three sections:

| Section | What's in it |
|---|---|
| **Projects** | Everything you've worked on. Pick a **category** (Product, Tech, Community, Volunteering, Creative, Education, Sport, Personal, For the love of it) — non-IT projects are first-class. Tick **Featured** to show it on the home page. |
| **Writing** | Blog posts. Tick **Draft** to hide one until it's ready. |
| **Services** | Paid coffee consultancy. Set a **Price** (empty = "Price on request"), duration, format and what's included. **Book** opens your **Booking link**, or an email to you if empty. Untick **Draft** to publish. |
| **Site settings** | Your name, headline, "What I do", stats, About, Right now, Fun facts, Resume, email and social links. |

**Languages:** each editor shows English on the left and Armenian (ՀԱՅ) on the right. Anything you leave empty in Armenian automatically falls back to English, so you can translate gradually. Fields that are the same in both languages (category, year, links, images) are only edited on the English side.

When you click **Save**, the CMS saves the change to GitHub and the site updates automatically in about a minute.

**Tips**
- In the headline, wrap a word in `**double stars**` to give it the yellow squiggle.
- Upload a **Photo** in Site settings to replace the dragon avatar.
- Links can open straight to a window or language, e.g. `/?lang=hy#projects` or `/#project/<file-name>`.

## For AI tools and recruiters

On every publish the site also generates, from your CMS content:

| URL | What it is |
|---|---|
| `/llms.txt` | Short profile for AI assistants ([llmstxt.org](https://llmstxt.org)): role, experience, contact, links |
| `/resume.md` | Full resume in Markdown |
| `/llms-full.txt` | Resume + about + projects + writing in one file |
| `/robots.txt`, `/sitemap.xml` | Lets search engines and AI crawlers in |

The home page also includes your resume as plain HTML (for crawlers that don't run JavaScript) and schema.org `Person` data. Turn on **Site settings → Open to new roles** (and fill **Looking for**) to tell AI recruiting tools you're available.

## Running it on your computer

Needs [Node.js](https://nodejs.org) 18+.

```bash
npm run dev
```

- Website: http://localhost:4321
- CMS: http://localhost:4321/admin → **Work with Local Repository** → choose this folder (Chrome or Edge). Edits save straight to the files in `content/`; they go live once pushed to GitHub.

## How it fits together

```
index.html            the whole website (design + interface text in EN/HY)
admin/                the CMS (Sveltia CMS) and its field configuration
content/settings.json site-wide text, one block per language
content/projects/     one file per project
content/posts/        one file per post
images/uploads/       images uploaded through the CMS
scripts/              builds _site/: bundles content/, generates llms.txt, resume.md, SEO tags
.github/workflows/    publishes the site to GitHub Pages on every change
```

## One-time setup

**Hosting (GitHub Pages):** repo Settings → Pages → Source: **GitHub Actions**. Every change to `main` publishes the site.

**Custom domain:** repo Settings → Pages → Custom domain → enter your domain, then add these records at your domain registrar:

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `amkhoyan.github.io` |

Once the domain checks out, tick **Enforce HTTPS**.

**CMS login (access token):**
1. GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
2. Repository access: **Only select repositories** → `personalwebsite`. Permissions → Repository → **Contents: Read and write**.
3. Set an expiration you're comfortable with (you'll make a new one when it expires).
4. Open `/admin`, click **Sign In Using Access Token**, and paste it. Your browser remembers it.
