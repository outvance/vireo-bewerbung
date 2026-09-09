# VIREO Bewerbungsseite

Statische Bewerbungsseite (Bewerberfunnel Physiotherapeut/in) für VIREO, das Gesundheitszentrum, Berlin-Mahlsdorf.

Zwei Fassungen derselben Bewerbung, beide gegen dasselbe Formular-Backend:

- **Landingpage** `index.html` + `styles.css` + `app.js`: eine lange Seite zum Scrollen, Kurzbewerbung in 3 Schritten am Ende.
- **Funnel** `funnel.html` + `funnel.css` + `funnel.js`: Vollbild-Strecke im Stil eines Perspective-Funnels, ein Schritt pro Bildschirm, 8 Schritte, Antwort tippen springt automatisch weiter.
- `tokens.css`: gemeinsame VIREO-Tokens und Schriften, von beiden Fassungen genutzt.

Welche Fassung eine Bewerbung erzeugt hat, steht in Spalte „Variante" des Sheets (`landingpage` / `funnel`), der Tab „Reporting" zählt beide gegeneinander.
- `impressum.html`, `datenschutz.html`: Rechtstexte (offene Angaben sind mit `.todo` markiert)
- `assets/`: Logo, Fotos (WebP), selbst gehostete Poppins-Schriften
- Formular-Backend: Google Apps Script „VIREO Bewerbungsformular Backend" (luis@outvance.co), Endpunkt in `app.js` (`CONFIG.ENDPOINT`)
- Reporting: Google Sheet „VIREO Bewerbungen"
- Meta-Pixel: `CONFIG.META_PIXEL_ID` in `app.js` eintragen, Consent-Streifen erscheint dann automatisch

Deploy: Coolify (Static) auf dem Hetzner-Server. Echte Domain bewerbung.vireo-gesundheit.de (A-Record auf 159.69.82.164), vireo.outvance.co nur als Demo-Adresse.
