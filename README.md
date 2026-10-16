# Quisqueya: a website about the Dominican Republic

Places to visit, culture, fun facts and four games. Built with plain HTML, CSS and JavaScript (no build step). English and Español.

## Run it
Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8765
```

Then visit http://localhost:8765

## Pages
- `index.html` Home
- `explore.html` Places, filters, search, interactive map
- `culture.html` Food, music, timeline slider, slang glossary
- `legends.html` Baseball Hall of Fame plaques, famous athletes, musicians and artists, "Who am I?" quiz
- `games.html` Merengue Rhythm, Map Challenge, Slang Quiz, Dominoes
- `facts.html` Country info, fun facts, true or false, photo credits

## Files
- `css/styles.css` all styling (light and dark themes)
- `js/main.js` site-wide features (language, theme, filters, modal, timeline)
- `js/homemap.js` the interactive island map on the home page
- `js/rhythm.js`, `js/mapgame.js`, `js/dominoes.js`, `js/games.js` the four games
- `js/legends.js` the Legends page
- `js/data.js` all content in English and Spanish

Photos are from Wikimedia Commons under open licenses; see the Facts page for credits. The Map Challenge uses Leaflet with Esri map tiles, and the Merengue Rhythm band is synthesized live with the Web Audio API.
