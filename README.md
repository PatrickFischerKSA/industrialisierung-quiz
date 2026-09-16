# Volldampf! – Industrialisierung der Schweiz

[Quiz spielen](https://patrickfischerksa.github.io/industrialisierung-quiz/) · [Lehrerdashboard](https://patrickfischerksa.github.io/industrialisierung-quiz/lehrer.html)

Acht kurze Grundlagenfragen für ungefähr fünf Minuten, mit Rückmeldung und Erklärungen.

## Klassenmodus

1. Lehrerdashboard öffnen und den separat bereitgestellten Lehrerschlüssel eingeben.
2. Eine Klasse oder Durchführung anlegen.
3. Teilnahmelink oder Klassencode teilen.
4. Lernende treten mit einem frei gewählten Kürzel bei. Es sind keine Schülerkonten nötig.
5. Jede Antwort wird an den Server übertragen. Laufende Versuche sind bereits sichtbar.

Das Dashboard aktualisiert sich alle zehn Sekunden. Es zeigt jeden Versuch mit allen Antworten, Antwortverteilungen und Fehlerquoten je Frage sowie den Durchschnitt der abgeschlossenen Versuche. Ein CSV-Export enthält jede Frage jedes Versuchs einschliesslich offener Antworten, Lösungskorrektheit und Zeitpunkten. Ein erneuter Beitritt erzeugt einen neuen Versuch, auch bei gleichem Kürzel. Neue Teilnahmen können gesperrt werden; bereits gestartete Versuche dürfen weiter antworten. Klassen samt Antworten können nach Bestätigung gelöscht werden.

## Daten und Zugang

- Ohne Klassenbeitritt bleibt das Quiz ein lokales Übungsquiz ohne zentrale Antworterfassung.
- Im Klassenmodus speichert Cloudflare D1 Klassencode, Kürzel, Versuch-ID, Antworten und Zeitpunkte. Keine vollständigen Namen verwenden.
- Antworten werden beim Auswählen gespeichert. Bei Netzfehlern bleiben nicht übertragene Antworten im aktuellen Browser-Tab; «Erneut speichern» sendet sie nach. Ein Neuladen setzt diesen Versuch fort. Beim Schliessen des Tabs können noch nicht übertragene Antworten verloren gehen.
- Der Lehrerschlüssel ist ein zufällig erzeugtes Servergeheimnis und liegt **nicht im Repository**. Das Dashboard speichert ihn nur für den aktuellen Tab. Alle Lehrer-API-Endpunkte prüfen ihn serverseitig. Der gemeinsame Schlüssel gewährt Zugriff auf sämtliche Klassen dieses Dashboards.
- Schüler erhalten nur Zugriff auf ihren eigenen Versuch. Ihre Zugangstoken werden in der Datenbank gehasht gespeichert. Bereits abgegebene Antworten sind unveränderlich.
- Daten bleiben bis zum Löschen einer Klasse gespeichert. CSV-Exporte liegen anschliessend lokal bei der Lehrperson.
- Kein benotetes Prüfungswerkzeug: Lösungen sind wie zuvor im öffentlichen Quizcode sichtbar.

## Materialgrundlage

- **Text Industrialisierung.pdf**: S. 1 (Verlagssystem), S. 3 (Mechanisierung, Branchen, Eisenbahn, Export), S. 5 (Bundesstaat, Wasserkraft, Strukturwandel).
- **Notizseiten für Präsentation Industralisierung.pdf**: Karten um 1860 und vor 1914, S. 1–2, als Grundlage der Eisenbahnfrage.

Original-PDFs und Abbildungen sind nicht Bestandteil dieses Repositories. Die Lösungen der acht Fragen sind A, C, B, D, A, C, B, D. Ein Punkt je Frage; keine Zeit- oder Fehlerstrafe.

## Betrieb und Entwicklung

Die Oberfläche liegt in `dist/` und wird durch GitHub Actions auf GitHub Pages veröffentlicht. `server/worker.js` ist die zentrale Cloudflare-Workers-API mit D1-Datenbank. Die API-Adresse steht in `dist/config.js`. Datenbankmigrationen stehen unter `migrations/`.

```sh
npm ci
# .dev.vars nur lokal erstellen: TEACHER_KEY="local-test-key"
npx wrangler d1 migrations apply industrialisierung-quiz --local
npm run dev
```

In einem zweiten Terminal `npm test` ausführen. Der Test nutzt localhost:8787. Die Oberflächentests setzen ihre API-Adresse ausdrücklich auf localhost. Die Tests legen ausschliesslich eigene Testklassen an und löschen diese wieder.

Produktionsbereitstellung des Backends (separat von GitHub Pages):

```sh
npx wrangler d1 migrations apply industrialisierung-quiz --remote
npm run deploy:api
npx wrangler secret put TEACHER_KEY
```

Den Lehrerschlüssel nur über den Secret-Mechanismus verwalten, niemals in `dist/`, Git oder die Wrangler-Konfiguration schreiben. Lokale Geheimnisse, Testdaten und Abhängigkeiten sind über `.gitignore` ausgeschlossen.
