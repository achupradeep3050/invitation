# Achu & Lekshmi — wedding invitation

Live at **https://achupradeep.online/invitation/** (GitHub Pages, repo `achupradeep3050/invitation`).
A static site with no build step, recreated from the Claude Design prototype *Wedding Invitation v2*. It's bilingual (English / മലയാളം).
RSVPs go to a **Google Sheet** through a small Apps Script.

```
index.html          the page
css/style.css       all styling
js/config.js        ← RSVP_URL, names, photo style, intro on/off
js/i18n.js          every English and Malayalam string
js/app.js           behaviour (intro doors, countdown, lamp, cards, carousel, RSVP)
assets/             photos (hero.jpg, m1–m6.jpg)
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
- **Names, photo style, intro:** `js/config.js`.
- **Wording:** `js/i18n.js` (keep the `en` and `ml` keys in step).
- **Times, venues, map links:** `EVENTS` at the top of `js/app.js`.
- **Photos:** `assets/portrait-garden.jpg` is the portrait, which is also the WhatsApp/link preview and the sender app's photo. `assets/moment-*.jpg` fill the 8-tile carousel, each shown twice on opposite sides. They're shown as they are (`PHOTO_STYLE: 'Original'`). ⚠️ **To change a photo, give it a NEW file name and update `index.html`.** Also bump `?v=` on the CSS/JS links whenever you change them. Browsers and GitHub's CDN keep the old copies under an old name, so reusing a name looks like nothing changed.

## Run locally
```
python3 -m http.server 8765    # then open http://127.0.0.1:8765/
```

## Deploy
Push to `main`. GitHub Pages serves the repo root at `achupradeep.online/invitation/`. It uses the custom domain of the
`achupradeep3050.github.io` user site, so no DNS changes are needed. Every path is relative, so it works under `/invitation/`.
The page has `noindex` so it stays out of search results. The link is meant to be shared with guests directly.
