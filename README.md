# CKTV Christian Kingdom Trend Vision

Next.js (App Router) + Tailwind + Framer Motion. No database and no separate backend:
Cloudinary stores the videos, images **and** the content catalog (small JSON files).

## 1. Set it up (10 minutes)

1. Copy `.env.example` to `.env.local` (locally) or add the same variables in **Vercel → Project → Settings → Environment Variables**:
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `ADMIN_SECRET`: a long random text. This becomes your private admin address.
   - `NEXT_PUBLIC_SITE_URL` (optional): your live website address.
2. Install and run: `pnpm install` then `pnpm dev` (commit the updated `pnpm-lock.yaml`).
3. Open `http://localhost:3000/<ADMIN_SECRET>` to reach the admin dashboard.

Until Cloudinary is connected the public site shows **demo content** so you can review the design.

## 2. Pages (routes)

| Address                       | What it is                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------- |
| `/`                           | Home: hero carousel, latest videos, topics, podcast spotlight, verse, posts, FAQ, newsletter    |
| `/watch`                      | Video library with search, category filter and sorting (`/watch?category=podcast`)              |
| `/watch/<video-id>`           | Video page: player, Download, Share, WhatsApp, Copy link, related videos                        |
| `/posts`                      | All posts                                                                                       |
| `/posts/<slug>`               | A single post                                                                                   |
| `/about`                      | Story, mission, vision (editable in admin)                                                      |
| `/contact`                    | Contact details + message form (opens the visitor's email app)                                  |
| `/sitemap.xml`, `/robots.txt` | For search engines                                                                              |
| `/<ADMIN_SECRET>`             | **Hidden admin dashboard** (not linked anywhere, not indexed)                                   |
| `/api/admin/*`                | Admin API (videos, posts, settings, sign). Refuses every request that does not carry the secret |

## 3. Admin dashboard

- **Overview**: counts, latest uploads, quick actions.
- **Videos**: upload (chunked, with progress), edit, publish/draft, feature on home page, delete (also removes the files from Cloudinary). Optional translated titles and descriptions.
- **Posts**: write with a simple toolbar (heading, bold, list, quote, link, image upload), live preview, cover image, draft/publish, translations, delete.
- **Settings**: logo, featured video, About/Mission/Vision, verse of the week, email/phone/WhatsApp/address, social links.

How it is protected: there is no login, so the secret address _is_ the key. The admin page and every admin API call
check it on the server (`ADMIN_SECRET`), and the secret is never placed in the public website code. Anyone who learns the
address can edit the site, so keep it private and change `ADMIN_SECRET` (redeploy) if it ever leaks.

## 4. Languages

English, Igbo, Yorùbá, Hausa, Français, Español. All interface text lives in `lib/i18n/<code>.ts`
(one file per language, same keys). The **Igbo, Yorùbá and Hausa** files should be reviewed by native speakers.
Video/post titles and texts can be translated per item in the admin; missing translations fall back to English.

## 5. Good to know

- Free Cloudinary plans limit video file size (currently ~100 MB per video) and transformations. Upload MP4 (H.264).
- Content is cached ~60 seconds; saving in the admin refreshes the site immediately.
- The newsletter button and contact form open the visitor's email app (`mailto:`); nothing is stored. Add an email service later if you want real sign-ups.
- Images in `next.config` are unoptimized and `typescript.ignoreBuildErrors` is on (from the V0 starter). Turn the latter off once you can run `pnpm build` locally.
