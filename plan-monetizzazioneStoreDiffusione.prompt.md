## Plan: Monetizzazione, store e lancio

Realizzare tre workstream coordinati: AdSense contestuale sul sito/PWA browser con CMP Google e policy complete; app Android/iOS Capacitor con ricette offline, preferiti, lista della spesa e condivisione nativa; diffusione organica misurabile prima di piccoli test paid. La release mobile iniziale resta senza annunci nativi: AdMob e tracking cross-app sono esclusi finché retention e ricavi web non ne giustificano la complessità.

**Prerequisiti e gate**
- Confermare il dominio di produzione (non ancora fornito), email privacy/support e nome legale del titolare persona fisica.
- Aprire/verificare account AdSense intestato al titolare, Google Play Console e Apple Developer Program. Procurare un Mac con Xcode 26+ per iOS.
- Verificare contratti, data location, subprocessor e retention di Netlify e AI Gateway prima di compilare policy o schede privacy store.
- Definire l’app come non rivolta specificamente ai minori; ogni modifica a questa scelta riapre targeting, consenso e rating.
- Far revisionare privacy/cookie policy e impostazione CMP da un professionista italiano: il piano è tecnico-operativo, non consulenza legale.

**Steps**

### Fase 1 — Governance, privacy e misurazione
1. Creare una data map verificabile di sito e app: dati tecnici/log e IP su Netlify, contenuto e cronologia inviati alla chat AI, cronologia/preferiti/lista salvati localmente, dati AdSense/CMP e futuri dati newsletter. Per ogni trattamento registrare titolare/responsabile, finalità, base giuridica, campi, durata, paese, subprocessor, trasferimenti extra SEE e procedura di cancellazione. Questo blocca i passi 3, 6 e 10.
2. Scegliere una misurazione privacy-first, raccomandata Plausible EU o Matomo cookieless, senza query di ricerca, contenuti chat, ricette relative a salute o identificatori persistenti. Definire eventi allowlist: `recipe_view`, `search_submitted` con solo conteggio risultati/categoria, `favorite_added`, `shopping_list_created`, `share_clicked`, `install_prompt_shown`, `pwa_installed`, `chat_opened`, `chat_completed`, `newsletter_signup`. Documentare UTM standard e retention aggregata. *Può procedere in parallelo con il passo 1, ma il deploy dipende dalla data map.*
3. Pubblicare pagine stabili `/privacy`, `/cookie`, `/termini` e `/supporto`, accessibili da footer, impostazioni, CMP e listing store. La privacy policy deve coprire identità/contatti del titolare, basi giuridiche, destinatari, retention, trasferimenti, diritti/Garante, Netlify, AI Gateway, Google ads e analytics; la cookie policy deve inventariare cookie/local storage per nome, fornitore, finalità, categoria e durata. Distinguere storage strettamente necessario (preferiti, lista, cronologia chat locale) da pubblicità/analytics.
4. Aggiungere un consenso esplicito al primo uso della chat prima di inviare contenuti all’AI di terze parti, con link alla privacy policy, possibilità di annullare, cancellare la cronologia locale e usare il resto dell’app senza chat. Non inviare contenuti chat agli analytics.

### Fase 2 — AdSense web/PWA e consenso cookie
5. Aprire AdSense direttamente a nome del titolare: selezionare correttamente paese pagamenti, completare identità, indirizzo/PIN, metodo di pagamento e dati fiscali; aggiungere e verificare il dominio; attendere l’approvazione del sito; conservare fuori dal repository credenziali e documenti. Nel repository entra solo il publisher/client ID pubblico `ca-pub-*` tramite configurazione pubblica e gli ID delle ad unit.
6. In AdSense Privacy & Messaging creare una CMP certificata Google per SEE/UK/CH con IAB TCF 2.3. Configurare scelte equivalenti “Accetta”, “Rifiuta” e “Personalizza”, finalità spente per default, revoca sempre disponibile e lista effettiva dei vendor. Anche gli annunci contestuali/non personalizzati possono usare storage: nella policy iniziale non caricare né richiedere ads dopo rifiuto; disattivare programmatic Limited Ads in attesa di validazione legale. Consent Mode v2 non sostituisce la CMP; introdurlo solo se viene aggiunto un tag Google.
7. Integrare CMP prima di qualsiasi tag pubblicitario, un comando persistente “Rivedi preferenze cookie” e uno stato di consenso centralizzato. Il banner non deve comparire nell’app Capacitor ad-free, dove restano solo storage funzionali e informativa privacy. Aggiornare il service worker affinché policy e configurazione consenso non restino servite da cache obsolete.
8. Creare un componente slot AdSense responsive con dimensioni stabili e caricamento solo dopo consenso. Inserire inizialmente massimo due slot: uno nell’archivio dopo il primo gruppo di ricette e uno nel dettaglio ricetta lontano da navigazione, pulsanti, ingredienti interattivi e chat. Evitare Auto Ads nella prima fase, clic involontari e layout shift. Escludere esplicitamente route sensibili (`salse-cotolette-reflusso`, `tisana-reflusso`) e qualsiasi futura categoria sanitaria dalla pubblicità/profilazione.
9. Pubblicare `/ads.txt` con la riga generata da AdSense, configurare CSP/security header compatibili solo con gli host effettivamente necessari e verificare lo stato Authorized/Ready. Non cliccare né chiedere di cliccare annunci propri. Stabilire dashboard mensile con page RPM, viewability, CLS, consenso/rifiuto e ricavi, senza ottimizzare tramite dark pattern.

### Fase 3 — Fondazione mobile Capacitor
10. Rendere il frontend esportabile staticamente per il `webDir` Capacitor: ricette, ricerca, immagini e pagine legali devono essere bundled e funzionare offline. Separare `/api/chat` in una Netlify Function/servizio HTTPS con endpoint assoluto configurabile, CORS ristretto e segreti solo server-side. Mantenere il deploy web/PWA e il build mobile dalla stessa sorgente.
11. Completare il valore nativo concordato: corpus ricette offline, preferiti persistenti, lista della spesa aggregabile/modificabile e condivisione tramite share sheet. Gestire safe area, tastiera, stato offline e fallback chat. Non introdurre login, sync cloud, notifiche, geolocalizzazione o contatti nel primo rilascio.
12. Aggiungere Capacitor, package ID/bundle ID definitivi, progetti `android/` e `ios/`, icone native senza testo, adaptive/monochrome Android, App Icon iOS, splash e deep link. La firma usa chiavi/certificati fuori dal repository; documentare backup e rotazione dell’upload key.
13. Aggiornare manifest PWA con `id`, `scope`, categorie, icona maskable, shortcut e screenshot; migliorare cache/versionamento per fresh install e offline reale. Il manifest serve il web, mentre i metadata nativi restano nei progetti Capacitor.

### Fase 4 — Privacy store e pubblicazione Android
14. In Play Console completare verifica account personale, contatti pubblici, eventuale verifica su dispositivo e DSA/trader status. Creare app con package ID definitivo, Play App Signing e AAB firmato; target Android 16/API 36 per submission dal 31 agosto 2026.
15. Compilare Data Safety sulla base della data map, includendo dati attraversati dalla WebView e dalla chat, log/IP e content retention effettiva; dichiarare privacy/support URL, target audience, content rating e accesso all’app. Per la release mobile ad-free selezionare “Contains ads: No”; modificare la dichiarazione prima di introdurre AdMob o altra inventory nativa.
16. Pubblicare prima su internal testing e risolvere il pre-launch report. Se l’account personale è stato creato dopo il 13 novembre 2023, eseguire closed test con almeno 12 tester opt-in per 14 giorni consecutivi e poi richiedere production access. Validare installazione, update, offline, deep link, share sheet, lista, chat, API 36 e assenza di cleartext traffic.

### Fase 5 — Privacy store e pubblicazione Apple
17. Iscrivere il titolare persona fisica all’Apple Developer Program, sapendo che il nome legale sarà visibile come seller; configurare App Store Connect, bundle ID, signing e provisioning. Compilare su macOS con Xcode 26 e SDK iOS 26 o requisiti successivi vigenti al momento dell’upload.
18. Compilare App Privacy usando la data map e includendo WebView/AI Gateway; valutare i prompt chat come `Other User Content` e dichiarare log/diagnostica secondo retention e collegamento all’identità reali. ATT non va richiesto nella release ad-free senza tracking cross-app/cross-site. Completare age rating, export compliance, DSA/trader status, privacy/support URL e note review che spieghino offline, preferiti, lista della spesa, condivisione e consenso AI.
19. Eseguire TestFlight interno, poi esterno con Beta App Review. Testare fresh install, modalità aereo, IPv6-only, safe area, tastiera, ripristino, link esterni, cancellazione dati locali e degradazione chat. Inviare a review solo quando le funzioni native sono evidenti e complete, riducendo il rischio della guideline Apple 4.2 sui wrapper minimali.

### Fase 6 — Diffusione e ciclo di crescita
20. Prima del lancio, completare discovery web: `metadataBase`, canonical, metadata per ricetta, Open Graph/social card, robots, sitemap, JSON-LD Recipe solo per campi realmente disponibili e pagine indicizzabili per tag/ingrediente. Registrare dominio in Search Console e Bing Webmaster. *Può procedere in parallelo con le fasi 2–3.*
21. Preparare ASO coordinata: nome “Danio Cooks”, sottotitolo Apple “Ricette tecniche e sous-vide”, descrizione breve Play “Ricette tecniche italiane, sous-vide, tempi chiari e assistente in cucina”; produrre icon 1024, Play icon 512, feature graphic 1024×500 e screenshot reali che mostrino ricerca, dettaglio, offline, preferiti, lista e chat. Localizzare inizialmente in italiano.
22. Lanciare una beta owned di 50–100 persone tramite contatti/social, con tre cluster editoriali (sous-vide, verdure, friggitrice ad aria), link UTM e feedback strutturato. Aggiungere condivisione web/nativa e, solo dopo scelta del provider e DPA, newsletter double opt-in con unsubscribe e retention documentata.
23. Misurare per 2–4 settimane: north star “sessioni settimanali con ricetta attivata”; baseline per landing→ricetta, engagement, install PWA, favorite/lista, D7 returning, store conversion e crash-free. Target iniziali da validare: landing→ricetta ≥35%, engagement ≥45%, install acceptance ≥8%, D7 ≥15%, store conversion ≥20%, crash-free >99,5%.
24. Solo dopo baseline e consenso verificato, eseguire piccoli test paid su keyword/landing specifiche, senza Meta/TikTok pixel nella prima fase. Usare UTM, Play Console e App Store Connect per attribution aggregata; definire budget, CAC massimo e regola di stop prima di spendere. Testare una variabile per volta: title/meta, CTA install, screenshot ASO, messaggio “offline” vs “lista della spesa”.
25. Riesaminare AdMob solo dopo 60–90 giorni: richiede SDK Mobile Ads, UMP, `app-ads.txt`, nuove Data Safety/App Privacy, possibile ATT se si introduce tracking e nuova review. Non riutilizzare automaticamente AdSense nella WebView Capacitor.

**Relevant files**
- `c:\Users\dquero\cook\webapp\src\app\layout.tsx` — metadata globali, CMP/ads bootstrap e footer legale.
- `c:\Users\dquero\cook\webapp\src\app\page.tsx` — home e superfici di discovery.
- `c:\Users\dquero\cook\webapp\src\app\recipes\[slug]\page.tsx` — metadata/JSON-LD e slot dettaglio con esclusioni sensibili.
- `c:\Users\dquero\cook\webapp\src\components\recipe-browser.tsx` — slot archivio, eventi aggregati e CTA install/share.
- `c:\Users\dquero\cook\webapp\src\components\chat-panel.tsx` — consenso AI, endpoint mobile, cancellazione locale e fallback offline.
- `c:\Users\dquero\cook\webapp\src\components\site-header.tsx` — impostazioni e riapertura preferenze.
- `c:\Users\dquero\cook\webapp\src\app\api\chat\route.ts` — comportamento da migrare verso funzione HTTPS separata.
- `c:\Users\dquero\cook\webapp\src\app\manifest.ts` — manifest PWA completo.
- `c:\Users\dquero\cook\webapp\public\sw.js` — cache offline, versionamento ed esclusione policy/consenso.
- `c:\Users\dquero\cook\webapp\src\lib\recipes.ts` — fonte dati per export, tassonomie e metadata.
- `c:\Users\dquero\cook\webapp\next.config.ts` — profilo static export mobile.
- `c:\Users\dquero\cook\webapp\package.json` — dipendenze e script Capacitor/build.
- `c:\Users\dquero\cook\netlify.toml` — deploy web e funzione chat.
- Nuovi: route legali/supporto, componente consenso/ads/analytics, `public/ads.txt`, `robots.ts`, `sitemap.ts`, `capacitor.config.ts`, progetti `android/`/`ios/`, funzione chat, moduli preferiti/lista/share e asset store.

**Verification**
1. Privacy/CMP: browser pulito in Italia/SEE, accetta/rifiuta/personalizza/revoca; DevTools deve mostrare zero richieste o storage Google Ads prima del consenso e nessuna richiesta ads dopo rifiuto. Ripetere su mobile web, PWA installata e route sensibili.
2. Ads: verificare `/ads.txt`, AdSense Policy Center/Ready, rendering responsive, CLS e assenza di slot vicino a controlli; usare test mode/strumenti provider, mai clic reali.
3. Web: eseguire lint/build, Lighthouse PWA/SEO/accessibilità, Rich Results, sitemap/robots e test offline con cache vuota e poi popolata.
4. Mobile: build/sync Capacitor riproducibile; test Android API 36 e iOS 26 su device reali per fresh install, update, offline, deep link, tastiera, safe area, preferiti, lista, share e chat.
5. Store: confrontare Data Safety e App Privacy riga per riga con data map e traffico osservato; Play pre-launch report, closed-test eligibility, TestFlight crash/feedback e review notes complete.
6. Crescita: dashboard senza PII, UTM riconciliati con store console, baseline 2–4 settimane e gate documentato prima di paid o AdMob.

**Decisions**
- Capacitor bundled per Android+iOS; TWA e wrapper remoto esclusi.
- MVP mobile: offline + preferiti + lista della spesa + condivisione; timer/notifiche, account e cloud sync esclusi.
- AdSense contestuale sul web/PWA browser, intestato al titolare; app store ad-free nella v1.
- CMP Google certificata TCF con comportamento prudente: nessuna ads dopo rifiuto e Limited Ads disattivato inizialmente.
- Route con contenuti sanitari escluse dagli annunci.
- Persona fisica come seller; dominio definitivo ancora da inserire prima di account/policy/listing.
- Diffusione organica/owned prima di paid; niente marketing pixel o tracking cross-app nella v1.

**Fonti operative da ricontrollare al momento dell’esecuzione**
- Google AdSense/CMP/ads.txt: https://support.google.com/adsense/answer/13554116, https://support.google.com/adsense/answer/16918505, https://support.google.com/adsense/answer/7532444
- Garante cookie: https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876
- GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Play target/signing/testing/Data Safety: https://developer.android.com/google/play/requirements/target-sdk, https://developer.android.com/studio/publish/app-signing, https://support.google.com/googleplay/android-developer/answer/14151465, https://support.google.com/googleplay/android-developer/answer/10787469
- Apple enrollment/review/privacy/ATT: https://developer.apple.com/programs/enroll/, https://developer.apple.com/app-store/review/guidelines/, https://developer.apple.com/app-store/app-privacy-details/, https://developer.apple.com/app-store/user-privacy-and-data-use/
