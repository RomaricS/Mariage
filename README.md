# Kalah & Romaric — wedding website

Live at **https://kalahandromaric.com**

Bilingual (EN/FR) wedding site with private invite links, RSVPs and an admin dashboard.
June 19, 2027 · The Abby – Kruse Plaza · Auburn, Indiana.

- **`/`** — the website: story, the day & venue, on-site extras (360° photobooth, pearl necklace bar), program, attire, registry, FAQ.
- **`/i/<token>`** — a household's personal invitation (envelope animation). The token *is* the key: no accounts, no passwords.
- **`/i/<token>/rsvp`** — yes/no per person, plus-one (only when allowed), dietary needs, a song request, a note. Guests can reopen the link to change their answer until the deadline.
- **`/i/demo`** — a preview of the invite and RSVP flow that saves nothing.
- **`/admin`** — sign in with Google (the two of you only):
  - **Overview**: headcount, RSVP progress, latest answers, dietary totals, CSV export for the caterer.
  - **Guests & invites**: add or edit households, turn plus-ones on or off, and share each link by copy, text, WhatsApp, email or QR code. **Reset link** replaces a link that went to the wrong person.
  - **Site content**: every text on the site in English and French, plus dates, times, registry and FAQ. **Publish** makes changes live with no redeploy.

## How it fits with the GuestList app

The two apps share one Firebase project (`guestlist-wedding-7k3m9`):

| Data | Where | Who can read / write |
| --- | --- | --- |
| Guests & parties | `workspaces/<id>/guests`, `/parties` (GuestList's own data) | GuestList app (unchanged) and `/admin` |
| One invite per household | `invites/<token>` | a guest can read **only their own** (by token) and write only their answer; admins everything |
| Website copy | `site/content` | everyone reads, admins write |
| Admin settings | `admin/settings` | admins |
| Admin allowlist | `admins/<email>` | set by hand in the Firebase console |

While `/admin` is open it keeps the two sides in step:

- Every household (a GuestList party, or a guest with no party) gets an invite link automatically.
- Name and plus-one changes made in either app flow into that household's invite.
- RSVP answers are copied back onto the GuestList guests: `rsvp` becomes `confirmed` or `declined`, `dietary` is filled in, and a named plus-one is added to the party as a new guest.

## One-time setup

1. **Turn on Google sign-in.** Firebase console → Authentication → Sign-in method → enable **Google**.
2. **Allow yourselves into the admin.** Firestore → start a collection `admins` → add one document per person, with the **document id = your Google email** (no fields needed).
3. **Hosting site.** The wedding site uses the project's default site (`guestlist-wedding-7k3m9`, see `.firebaserc`), which is also where `kalahandromaric.com` is connected. The GuestList app lives on its own site — see *GuestList app hosting* below.
4. **Build and deploy** the site and the database rules:
   ```bash
   npm install
   npm run build
   firebase deploy --only hosting:wedding,firestore:rules
   ```
   Then add the site's domain under Authentication → Settings → **Authorized domains** if it isn't listed.
4b. **Custom domain (kalahandromaric.com, bought on Namecheap).**
   - Firebase console → Hosting → site `guestlist-wedding-7k3m9` → **Add custom domain** → `kalahandromaric.com`.
   - Firebase shows DNS records (usually two `A` records and a `TXT`). In Namecheap → Domain List → Manage → **Advanced DNS**: delete the default *URL Redirect* and *CNAME www → parkingpage* records, then add exactly what Firebase shows (Host `@`).
   - Add `www.kalahandromaric.com` too and choose **Redirect to kalahandromaric.com**.
   - Wait for Firebase to say *Connected* (minutes to a few hours; HTTPS is automatic).
   - Authentication → Settings → Authorized domains → add `kalahandromaric.com` (and `www.kalahandromaric.com`).
   - Invite links always use `https://kalahandromaric.com` (set `VITE_SITE_URL` to change it).
5. **Connect the guest list.** Open `https://<your-site>/admin`, sign in, and paste the GuestList workspace id (the part after `#w=` in your GuestList link). Invite links are created within seconds.
6. **Fill in the rest** under *Site content*: RSVP deadline, ceremony time, program times, story text and photos, and the registry.

Photos: put files in `public/photos/` (e.g. `public/photos/hero.jpg`), redeploy, then use `/photos/hero.jpg` as the photo URL in the admin. Any https image URL also works.

> ⚠️ **Rules are per project.** This repo's `firestore.rules` includes the GuestList rules. From now on deploy rules from **this** repo only. Deploying the GuestList repo's old rules file would block invites and RSVPs.

> ⚠️ **GuestList privacy.** The GuestList repo is public, and its README contains the workspace link, which gives full read/write access to the guest list. Its `import/*.json` files also list guest names. Make that repo private, or remove those files and move to a new workspace id. Once GuestList also requires sign-in, change the `workspaces` rule to `isAdmin()`.

## GuestList app hosting

The wedding site took over `guestlist-wedding-7k3m9.web.app`, so the GuestList app needs its own site:

```bash
firebase hosting:sites:create kr-guestlist --project guestlist-wedding-7k3m9
# in the GuestList repo, firebase.json → "hosting": { "site": "kr-guestlist", … }
firebase deploy --only hosting --project guestlist-wedding-7k3m9   # never plain `firebase deploy` there: it would push its old rules
```

Its link becomes `https://kr-guestlist.web.app/#w=<workspace id>`; the data is unchanged.

## Development

```bash
npm install
npm run dev      # http://localhost:5173  (try /i/demo)
npm test         # sync / household / stats logic
npm run build    # typecheck + production build into dist/
```

Stack: React 18, Vite, TypeScript, Firebase (Firestore + Auth), Framer Motion. Fonts: Bodoni Moda + Manrope.
All animation respects the visitor's *reduce motion* setting.
