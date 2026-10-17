# Kalah & Romaric — wedding website

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
3. **Create the hosting site.** With the Firebase CLI signed in:
   ```bash
   firebase hosting:sites:create kalah-romaric   # or another free name; update .firebaserc if different
   ```
4. **Build and deploy** the site and the database rules:
   ```bash
   npm install
   npm run build
   firebase deploy --only hosting:wedding,firestore:rules
   ```
   Then add the site's domain under Authentication → Settings → **Authorized domains** if it isn't listed.
5. **Connect the guest list.** Open `https://<your-site>/admin`, sign in, and paste the GuestList workspace id (the part after `#w=` in your GuestList link). Invite links are created within seconds.
6. **Fill in the rest** under *Site content*: RSVP deadline, ceremony time, program times, story text and photos, and the registry.

Photos: put files in `public/photos/` (e.g. `public/photos/hero.jpg`), redeploy, then use `/photos/hero.jpg` as the photo URL in the admin. Any https image URL also works.

> ⚠️ **Rules are per project.** This repo's `firestore.rules` includes the GuestList rules. From now on deploy rules from **this** repo only. Deploying the GuestList repo's old rules file would block invites and RSVPs.

> ⚠️ **GuestList privacy.** The GuestList repo is public, and its README contains the workspace link, which gives full read/write access to the guest list. Its `import/*.json` files also list guest names. Make that repo private, or remove those files and move to a new workspace id. Once GuestList also requires sign-in, change the `workspaces` rule to `isAdmin()`.

## Development

```bash
npm install
npm run dev      # http://localhost:5173  (try /i/demo)
npm test         # sync / household / stats logic
npm run build    # typecheck + production build into dist/
```

Stack: React 18, Vite, TypeScript, Firebase (Firestore + Auth), Framer Motion. Fonts: Bodoni Moda + Manrope.
All animation respects the visitor's *reduce motion* setting.
