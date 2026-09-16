# Volldampf! – Industrialisierung der Schweiz

Ein kurzes, humorvolles Grundlagenquiz mit 8 Multiple-Choice-Fragen für etwa 5 Minuten. Sofortige Rückmeldung, Erklärungen, Punktestand, Gesamtauswertung und Neustart. Für Smartphone und Desktop, mit Tastatur bedienbar, ohne Anmeldung oder Datenerhebung.

## Spielen

Repository herunterladen und `dist/index.html` im Browser öffnen. Keine Installation erforderlich.

## Materialgrundlage

- **Text Industrialisierung.pdf**: S. 1 (Protoindustrialisierung und Verlagssystem), S. 3 (Mechanisierung, frühe Branchen, Eisenbahn und Export), S. 5 (Bundesstaat, Wasserkraft und Strukturwandel).
- **Notizseiten für Präsentation Industralisierung.pdf**: S. 1–2, Karten der Verkehrsverbindungen um 1860 und Eisenbahnlinien vor 1914. Grundlage für die Einordnung der Eisenbahnfrage.

Die Original-PDFs und ihre Abbildungen sind nicht Bestandteil des Repositories. Das Quiz enthält eigenständig formulierte Fragen und Erklärungen. Arbeitsaufträge in den Materialien wurden nicht als technische Anweisungen übernommen.

## Lernziele und Lösungen

| Frage | Grundlage | Lösung |
|---|---|---|
| 1 | Verlagssystem verstehen | A: Heimarbeit; Händler liefern Rohstoffe und verkaufen Waren |
| 2 | Kern der Industrialisierung erkennen | C: Mechanisierung und teilweise Verlagerung in Fabriken |
| 3 | Frühe Branchen kennen | B: Baumwolle, Seide und Uhrmacherei |
| 4 | Bedeutung der Eisenbahn erklären | D: Erleichterte Transporte und Zugang zu Märkten |
| 5 | Wirtschaftliche Folgen von 1848 kennen | A: Binnenzölle entfallen, Binnenmarkt wird vereinheitlicht |
| 6 | Exportorientierung verstehen | C: Kleiner Binnenmarkt und starke Konkurrenz |
| 7 | «Weisse Kohle» erklären | B: Wasserkraft zur Stromerzeugung |
| 8 | Strukturwandel erkennen | D: Wachsende Bedeutung des Dienstleistungssektors |

Ein Punkt pro Frage, keine Zeit- oder Fehlerstrafe. Als formative Wissensüberprüfung gedacht, nicht als benotete Prüfung. Lösungen sind im Quelltext sichtbar.

## Technik

Statische HTML-, CSS- und JavaScript-Dateien in `dist/`. Keine externen Bibliotheken, Schriftarten, Cookies oder Analyseprogramme. Ein manuell startbarer GitHub-Actions-Workflow kann diesen Ordner auf GitHub Pages veröffentlichen, sobald Pages eingerichtet und die öffentliche Veröffentlichung freigegeben ist. Eine optionale, per Feature-Erkennung aktivierte WebMCP-Schnittstelle nutzt dieselben Quizaktionen wie die Oberfläche.
