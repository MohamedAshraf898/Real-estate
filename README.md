# Linden Residences — real estate demo website

Static site (HTML, CSS, JavaScript) built from the Real Estate Design System in Figma.
No build step: open `index.html` through any web server, or publish with GitHub Pages.

## Pages
- `index.html` — Home (hero search, featured homes, layouts, amenities, location, payment plan)
- `properties.html` — Listings with filters, sorting, grid/list view and saved favourites
- `property.html?id=a-0712` — Property detail (gallery, key facts, floor plan, payment plan, mortgage estimate, viewing form)
- `project.html`, `location.html`, `contact.html`

## Make it yours
- Brand name, address, phone: `assets/data.js` → `BRAND` (and the text in each page's `<title>`)
- Properties: `assets/data.js` → `PROPERTIES`
- Colors, fonts, spacing: `assets/tokens.css` (generated from the Figma variables)
- Photos: Unsplash (free license) — replace with your own renders in `assets/data.js` → `IMG`

Forms are front-end only (demo); connect them to your CRM or a form service before launch.
