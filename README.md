# Achu & Lekshmi — wedding invitation

Live at **https://achupradeep.online/invitation/** (GitHub Pages, repo `achupradeep3050/invitation`).
A static site with no build step, bilingual (English / മലയാളം). **Redesigned 2026-10-18**: Kerala-mural heritage in an aged-gold tone, a tall portrait hero film that settles into a temple arch as you scroll, mural strips that slide in from the sides, a auto-scroll after the invitation opens (≈70–130 px/s) (any touch, wheel or key hands control back; the pill bottom-right pauses/resumes; it stops at the RSVP), and two HyperFrames films. The previous live design is kept on the branch `backup/live-2026-10-01` and the tag `backup-2026-10-18-before-redesign`.
RSVPs go to a **Google Sheet** through a small Apps Script.

```
index.html          the page
css/site.css        all styling
js/config.js        ← RSVP_URL, names, intro on/off
js/i18n.js          every English and Malayalam string
js/site.js          behaviour (gate doors, scroll scenes, auto-scroll, films, event chapters, RSVP)
assets/v2/          the five photos (720/1200 px, JPEG + WebP), the two films + posters, mural-vine.svg
assets/portrait-garden.jpg  old portrait — not on the page any more, kept because ~/wedding-sender attaches it
apps-script/Code.gs the RSVP receiver (lives in Google, not served)
```

## Connect RSVP (once)

1. Create a Google Sheet, e.g. "Wedding RSVPs". It stays **private**, and only people you share it with can see it.
2. In the Sheet, go to **Extensions → Apps Script**, delete what's there, and paste `apps-script/Code.gs`. Save.
3. Pick `setup` in the function menu, then **Run**, then allow access. This makes the `RSVPs` and `Summary` tabs.
4. Go to **Deploy → New deployment**, set the type to **Web app**, set *Execute as* to **Me** and *Who has access* to **Anyone**, then click **Deploy**.
   Copy the URL that ends in `/exec`. Opening it in a browser should show `{"ok":true,"service":"wedding-rsvp"}`.
5. Paste it into `js/config.js` as `RSVP_URL`, then commit and push.

Optional: set `NOTIFY_EMAIL` in the script to get an email for each RSVP.
⚠️ **If you change the script, redeploy it with Deploy → Manage deployments → Edit → *New version*.** That keeps the
same `/exec` URL. A *New deployment* makes a new URL.

### What the RSVP does
- The page shows "Thank you" **only when the Sheet confirms it saved the row** (`{"ok":true}`). If the send fails, the
  guest sees an error, and their form stays filled so they can retry.
- Each browser has its own RSVP id, so **Edit response updates the same row** instead of adding a second one.
- The server checks everything again: name, a 10–15-digit phone, one of the four options, 1–15 guests, and a note of at most 500 characters.
  "Can't make it" saves 0 guests. A hidden honeypot field blocks simple bots. Anything starting with `= + - @` is stored as
  text, not run as a formula.
- `Summary` tab: responses and guests for each option, plus totals for the wedding (Both + Wedding only) and
  the reception (Both + Reception only).
- Guruvayur (3 Dec) has no RSVP option, which is how the design has it.

## Change things
- **Names, intro:** `js/config.js`.
- **Wording:** `js/i18n.js` (keep the `en` and `ml` keys in step).
- **Times, venues, map links:** `EVENTS` at the top of `js/app.js`.
- **Photos:** `assets/v2/kerala-home-*` (link preview + inside the hero film), `bamboo-laugh`, `monochrome`, `gym-mirror` (Our Story), `kasavu-white` (The Celebrations). Shown as they are — motion only, no colour filter. ⚠️ **To change a photo, give it a NEW file name and update `index.html`.** Also bump `?v=` on the CSS/JS links whenever you change them. Browsers and GitHub's CDN keep the old copies under an old name, so reusing a name looks like nothing changed.
- **Music:** one song only — `assets/v2/audio/wedding-song-v1.mp3` (owner's song, trimmed to 19.6 s: the 4 s of silence at the end cut off), looped by Web Audio (no door chime or other effects). Browsers only allow sound after a tap, so it starts on *Open the invitation*; the speaker button top-right mutes/resumes and the choice is remembered on that phone. It fades in to 24 % volume (`VOL` in `js/site.js`) and pauses when the tab is hidden; on iPhone it plays even with the silent switch on (iOS 16.4+). To change the song, add a NEW file name (caching) and update `MUSIC_URL`.
- **Invitation letters:** `assets/v2/letters/achu-lekshmi-letter-grooms-family.jpg` and `…-brides-family.jpg` are the families' letters exactly as received (download + view buttons; previews are `letter-*-thumb.*`). A link with `?side=bride` or `?side=groom` puts that family's letter first and rings it in gold — use it in the WhatsApp invitations, e.g. `https://achupradeep.online/invitation/?side=bride&lang=ml`.
- **Films:** `assets/v2/hero-film.mp4` (12 s portrait loop) and `moments-film.mp4` (15 s, all five photos) are rendered with HyperFrames from `~/wedding-tools/hyperframes/wedding-hero` and `wedding-moments` (not in this repo). Re-render: `HYPERFRAMES_NO_TELEMETRY=1 PATH=~/wedding-tools/node_modules/@ffprobe-installer/darwin-arm64:$PATH npx -y hyperframes@0.8.172 render --fps 30 --quality looks --workers 2 --output renders/master.mp4`, then encode with ffmpeg (H.264, `-crf 24 -movflags +faststart`, 720 px wide for the hero, 864 px for moments) under a NEW file name.

## Run locally
```
python3 -m http.server 8780 --bind 127.0.0.1    # then open http://127.0.0.1:8780/  (NOT 8765 — the Hermes gadget hub listens there)
```

## Deploy
Push to `main`. GitHub Pages serves the repo root at `achupradeep.online/invitation/`. It uses the custom domain of the
`achupradeep3050.github.io` user site, so no DNS changes are needed. Every path is relative, so it works under `/invitation/`.
The page has `noindex` so it stays out of search results. The link is meant to be shared with guests directly.
