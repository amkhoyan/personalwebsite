# Personal website

A PostHog-style "desktop" personal site in English and Armenian, edited through a CMS at `/admin`.

## Editing content (no code needed)

Go to **`https://<your-site>/admin`** and log in with GitHub. There are three sections:

| Section | What's in it |
|---|---|
| **Projects** | Everything you've worked on. Pick a **category** (Product, Tech, Community, Volunteering, Creative, Education, Sport, Personal) — non-IT projects are first-class. Tick **Featured** to show it on the home page. |
| **Writing** | Blog posts. Tick **Draft** to hide one until it's ready. |
| **Site settings** | Your name, headline, "What I do", stats, About, Right now, Fun facts, Resume, email and social links. |

**Languages:** each editor shows English on the left and Armenian (ՀԱՅ) on the right. Anything you leave empty in Armenian automatically falls back to English, so you can translate gradually. Fields that are the same in both languages (category, year, links, images) are only edited on the English side.

When you click **Publish**, the CMS saves the change to GitHub and the site redeploys automatically in about a minute.

**Tips**
- In the headline, wrap a word in `**double stars**` to give it the yellow squiggle.
- Upload a **Photo** in Site settings to replace the hedgehog avatar.
- Links can open straight to a window or language, e.g. `/?lang=hy#projects` or `/#project/onboarding-revamp`.

## Running it on your computer

Needs [Node.js](https://nodejs.org) 18+.

```bash
npm run dev
```

- Website: http://localhost:4321
- CMS: http://localhost:4321/admin — edits save straight to the files in `content/` (no login needed locally). Open entries from the list rather than reloading an entry's page directly.

## How it fits together

```
index.html            the whole website (design + interface text in EN/HY)
admin/                the CMS (Decap CMS) and its field configuration
content/settings.json site-wide text, one block per language
content/projects/     one file per project
content/posts/        one file per post
images/uploads/       images uploaded through the CMS
scripts/              bundles content/ into content/index.json on deploy
```

## One-time setup for the online CMS (Netlify)

1. **Netlify:** Add new site → Import from GitHub → pick this repo. The build settings come from `netlify.toml`, so just click Deploy.
2. **GitHub OAuth app:** GitHub → Settings → Developer settings → OAuth Apps → New.
   - Homepage URL: your Netlify URL
   - Authorization callback URL: `https://api.netlify.com/auth/done`
   - Copy the **Client ID** and generate a **Client secret**.
3. **Connect them:** Netlify → Site configuration → Access & security → OAuth → Install provider → GitHub → paste the ID and secret.
4. Visit `https://<your-site>/admin` and log in with GitHub.
