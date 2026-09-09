# VIREO Bewerbungsseite

Statische Bewerbungsseite (Bewerberfunnel Physiotherapeut/in) für VIREO, das Gesundheitszentrum, Berlin-Mahlsdorf.

- `index.html`, `styles.css`, `app.js`: Seite, VIREO-Design-Tokens, Formularlogik (3 Schritte)
- `impressum.html`, `datenschutz.html`: Rechtstexte (offene Angaben sind mit `.todo` markiert)
- `assets/`: Logo, Fotos (WebP), selbst gehostete Poppins-Schriften
- Formular-Backend: Google Apps Script „VIREO Bewerbungsformular Backend" (luis@outvance.co), Endpunkt in `app.js` (`CONFIG.ENDPOINT`)
- Reporting: Google Sheet „VIREO Bewerbungen"
- Meta-Pixel: `CONFIG.META_PIXEL_ID` in `app.js` eintragen, Consent-Streifen erscheint dann automatisch

Deploy: Coolify (Static) auf dem Hetzner-Server, Domain vireo.outvance.co, später bewerbung.vireo-gesundheit.de.
