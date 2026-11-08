# QubitSemi Solutions — Website

Marketing website for **QubitSemi Solutions Private Limited**, an engineering-driven technology company in Hyderabad delivering semiconductor (VLSI) engineering services and collaborating across quantum technologies, AI/ML & data engineering and next-generation computing.

A static site: plain HTML, one stylesheet, one script. No build step, no framework, no dependencies beyond Google Fonts (Space Grotesk, JetBrains Mono).

## Files

```
.
├── index.html            Home (hero + 3D chip, scroll story, focus areas, approach, vision, capabilities, engagement models)
├── solutions.html        Solutions (research/collaboration/planning, VLSI, Quantum, AI/ML, engagement models)
├── training.html         Training (three tracks: AI, Data Engineering, Quantum; cohort details)
├── leadership.html       Leadership (VLSI, Quantum, AI/ML & data engineering, team roles)
├── contact.html          Contact (careers, business engagement, office + map, brief form)
├── 404.html              Not-found page (noindex, root-relative links)
├── styles.css            All styling (light + dark themes, design system, per-page blocks)
├── script.js             Theme toggle, nav drawer, scroll story, tabs, contact form, reveals
├── logo.png · logo-dark.png · favicon.png · apple-touch-icon.png   (client logo + icons)
├── icons.svg · og.png
├── sitemap.xml · robots.txt
├── _icon-system.html     Internal icon sheet (noindex, not linked — local only, git-ignored)
├── content/              Client-supplied copy (source of truth) — local only, git-ignored
└── .claude/              Local preview config — local only, git-ignored
```

## Design system

- **Look:** silicon-die / schematic language — the client's brand colours **blue #0A3EE4** and **green #A9D18E** (tokens `--brand-blue`, `--brand-green` in `styles.css`) on navy, mono labels, copper bond pads (no margin rail or dot markers beside section labels — the client found them confusing). Green is a pastel: use it on dark surfaces and the blue CTA panel only, never as text on white. Light and dark themes are equally polished; the theme is set before first paint from `localStorage` or the OS setting.
- **CSS layout** (all in `styles.css`): base + tokens → `HOME v2` → `SITE v2 · subpages` (shared `hv2-` components: page hero, cards, chips, datasheet tables, figures, CTA) → per-page blocks (`PAGE v2 · training`, `leav2-`, `conv2-`, `nfv2-`) → 3D chip, stack story, page transitions, opening scene, depth/texture.
- **3D:** CSS-3D only (no library). The chip appears on **Home** (with the scroll story) and **Solutions**. Keep it to those two pages.
- **Motion:** a once-per-visit opening scene, pointer tilt on the chip, a pinned scroll story ("Inside the stack"), cross-document page transitions (Chrome/Edge/Safari 18.2+), reveal-on-scroll. All of it respects `prefers-reduced-motion`; with JavaScript off the site renders as a normal static page.
- **Older devices:** the 3D chip skips its assemble animation without `@property` support, and the pinned "Inside the stack" story only runs where `overflow-x: clip` and `position: sticky` work — otherwise the stacked static layout shows (same as no-JS).
- **Accessibility:** skip link, landmarks, one `h1` per page, keyboard-operable drawer and tabs (arrow keys, `#ai` / `#de` / `#qt` deep links), visible focus, AA contrast in both themes.

## Content rules

- The client's own wording lives in `content/client-content.md` — check new copy against it, and keep the live-site additions section current.
- No unverifiable claims: no fake "live" data, countdowns, scores or invented clients. Remaining figures (chip stack, Contact pin-out, Training schematic, 404 pin-out) are labelled illustrative. Removed at the client's request: the AXI waveform, GHZ circuits, SystemVerilog sample, the Leadership clock-tree and Chip role portraits, and the Home DV pin-out — don't add them back. The AXI waveform and GHZ circuit examples were removed at the client's request — don't add them back.
- Missing content is marked in the HTML with `<!-- PLACEHOLDER: … -->` comments: registered CIN (footer), leadership names/titles/photos, training dates/duration/delivery mode/fees, client logos.

## Contact form

`contact.html` has no backend yet. A valid brief opens a small chooser (Gmail · Outlook · email app · copy) pre-filled for **sales@qubitsemisolutions.com** — every `mailto:` link on mouse/trackpad devices does the same, because laptops without a mail app ignore plain `mailto:` links (phones keep the native behaviour). Sales covers business and training enquiries; **careers@qubitsemisolutions.com** is for careers. To collect submissions instead, set `FORM_ENDPOINT` in `script.js` (Formspree, Zoho Forms, a Catalyst function, …).

## SEO

- One unique `<title>`, description, canonical, `og:*` and `twitter:*` per page; `hreflang="en-IN"`; Organization JSON-LD (address, geo, contact points) on Home.
- `sitemap.xml` lists the five indexable pages; `robots.txt` points to it and blocks the internal files.
- URLs assume **https://www.qubitsemisolutions.com/**. If the site is served from the apex domain (`qubitsemisolutions.com`) instead, change the canonical/`og:url`/sitemap/robots URLs to match, and redirect the other host.
- After launch: submit `sitemap.xml` in Google Search Console and re-check the share image (`og.png`, 1200×630).

## Preview

```sh
python3 -m http.server 8080
# then open http://localhost:8080
```

Serve from the site root. `404.html` uses root-relative links, so it only styles correctly when served from the domain root (not when opened as a file). Page transitions need a real server too.

## Deploy

Static hosting only (planned: Zoho Catalyst — Slate or Web Client Hosting — with the custom domain; a Node.js/Python/Java backend can be added later on the same project). Upload only:

`index.html solutions.html training.html leadership.html contact.html 404.html styles.css script.js logo.png logo-dark.png favicon.png apple-touch-icon.png icons.svg og.png sitemap.xml robots.txt`

Do **not** upload `_icon-system.html`, `content/`, `.claude/` or `README.md`. Serve the site from the domain root.
