---
title: "Uovo Sous Vide in Guscio"
description: "Guida alla cottura sous-vide dell'uovo in guscio: profili di temperatura e tempi, pastorizzazione, consigli pratici di sicurezza e opzioni di conservazione."
thumbnail: "/gourmet/uova-gourmet.jpg"
main_ingredient: "Uovo"
tags: ["sous-vide","uova"]
prep_time: "PT05M"
cook_time: "PT01H15M"
total_time: "PT01H20M"
difficulty: "media"
---

# Uovo Sous Vide in Guscio

Ci sono ricette che funzionano perché riducono il margine di errore: un uovo, un bagno termico ben regolato e la possibilità di ottenere un risultato preciso senza approssimazioni. L’uovo sous-vide in guscio è proprio questo: mi permetteva di sognare un uovo in camicia facile e ripetibile, senza il fastidio di lavorare col metodo classico e senza la paura di sbagliare la consistenza. La parte bianca resta più soda, il rosso resta più fluido e mantiene la maggior parte dei suoi nutrienti, con una resa molto più controllata e più affidabile in cucina.

## 1. Preparazione

> **Per soggetti a rischio** (immunocompromessi, anziani, bambini, gravidanza): **sempre** pastorizzazione completa dell'uovo (57°C × 75 min, sezione 4).

✅ **Fattibile con circolatore sous vide domestico standard.**

L'uovo in guscio è un sistema multistrato (guscio CaCO₃ ~0.3 mm, membrane, albume, tuorlo Ø ~30 mm). Il guscio funge da barriera biologica all'ossigeno, riducendo l'ossidazione dei nutrienti rispetto a cottura in padella.

---

### Inserimento: sempre a bagno già a temperatura

Uova fredde da frigo, tabella riferita a uovo da 60 g a 5 °C; per altri pesi o temperature usare il calcolatore (sezione 4); bagno già alla T target.

- **Pastorizzazione**: il protocollo 57°C × 75 min è validato solo con bagno già a temperatura. Cold-start **MAI validato**.
- **Cotture brevi (< 15 min)**: la rampa variabile rende il risultato non replicabile.
- **Calo termico**: un bilancio istantaneo semplificato indicherebbe per 6 uova a 4 °C in 5 L un calo di circa 5 °C, ma l'uovo assorbe calore gradualmente mentre il circolatore recupera: il modello dinamico stima un calo reale inferiore a 1 °C se il roner ha almeno ~300 W di potenza oltre alle perdite del bagno. Nei profili brevi NON compensare il tempo (aggiungere minuti stracuocerebbe il tuorlo): al massimo 4 uova in almeno 5 L con contenitore coperto mantengono l'effetto sotto 5 s anche con un roner poco potente; per più uova aumentare l'acqua (circa 1.25 L per uovo). Il carico di riferimento per la pastorizzazione resta 6 uova in 5 L.

---

## 2. Tabella Riassuntiva: Temperature, Tempi e Risultati

Uovo di riferimento da 60 g, da frigo a 5 °C; bagno già a temperatura; timer avviato all'immersione; a fine cottura subito in acqua e ghiaccio per 1-6 minuti; tempi in minuti:secondi; per altri pesi o temperature di partenza vale il calcolatore.

<!-- recalc-table: sous-vide-egg-profiles -->
| # | Temperatura | Tempo (min:s) | Tuorlo | Albume | Uso culinario |
|---|---:|---:|---|---|---|
| 1 | 68.5 °C | 30:00–32:00 | Denso e cremoso in tutto il volume (fudge morbido), nessun nucleo liquido | Appena rappreso, tenero, gelatinoso | Ramen egg, insalata tiepida |
| 2 | 79 °C | 11:35–12:05 | Cremoso, cuore ancora fluido | Fermo, compatto | Uovo barzotto |
| 3 | 83 °C | 11:05–11:35 | Cremoso in tutto il volume, centro appena rappreso | Fermo, bianco perlaceo | Insalata, panino |
| 4 | 88.5 °C | 7:25–7:35 | Liquido al centro, corona cremosa 2–3 mm | Fermo, bianco, compatto | ⭐ Preferito |
| 5 | 90 °C | 9:50–10:20 | Cremoso-sodo (fudge) in tutto il volume | Fermo, quasi gommoso | Sodo rapido cremoso |

> ⚠️ Config 1: il tuorlo si avvicina all'equilibrio termico (centro a circa 67-68 °C), consistenza densa ovunque e tuorlo pastorizzato.
>
> Config 2-5: il tuorlo non raggiunge l'equilibrio, il risultato nasce dal gradiente termico; nelle config 2, 3 e 5 conta la temperatura massima raggiunta dal centro del tuorlo (circa 64, 66 e 68 °C, compreso il calore residuo durante il ghiaccio), nel ⭐ conta la profondità a cui il tuorlo supera circa 65 °C (corona di 2-3 mm); in queste config il tuorlo non è pastorizzato.

Nota di accuratezza: il ⭐ è tarato su prove reali (88.5 °C × 7:30, uova da frigo a 5 °C di 55-65 g, tutte con buon risultato: secondo il modello a 7:30 la corona va da circa 3.1 mm per 55 g a circa 1.8 mm per 65 g); a 88.5 °C ogni 0.5 °C del bagno vale circa 6 s e 10 s cambiano la corona di circa 0.3 mm. Le config 2, 3 e 5 sono calcolate dal modello (incertezza circa ±25 s) e vanno confermate con una prova di taratura (sezione 3); in particolare la config 5, il cui tempo è cambiato di più.

### Perché la config 4 ⭐ (88.5 °C × 7:30) funziona

Per un uovo da 60 g, il contenuto è equivalente a una sfera di 23.1 mm di raggio, con un tuorlo di 15.7 mm e uno strato di albume spesso circa 7.4 mm. Valori dal modello a due strati della sezione 4:

| Posizione | T a fine cottura (7:30) | T massima con il calore residuo in ghiaccio | Stato |
|---|---:|---:|---|
| Superficie dell'albume | 86.9 °C | — | Rappreso |
| Albume a metà spessore | 78.8 °C | — | Rappreso |
| Interfaccia albume/tuorlo | 69.6 °C | 70.9 °C dopo circa 20 s | Albume interno fermo |
| 2.35 mm dentro il tuorlo | 62.8 °C | 65.0 °C dopo circa 45 s | Bordo della corona cremosa |
| Centro del tuorlo | 36.8 °C | 56.1 °C dopo circa 3.7 min | Liquido, tiepido |

Il bordo della corona smette di avanzare circa 45 s dopo l'ingresso nel ghiaccio, quindi 1 o 6 minuti di ghiaccio danno la stessa corona, mentre il centro continua a intiepidirsi fino a circa 56 °C; ritardare il passaggio in ghiaccio prolunga il calore residuo e ispessisce la corona.

---

## 3. Procedimento Step-by-Step

### Fase Principale
1. Portare il bagno alla temperatura del profilo, coprendo il contenitore alle temperature alte.
2. Pesare l'uovo con una bilancia da cucina (risoluzione 1 g: strumento NON presente nell'inventario del progetto, va procurato; serve perché ogni grammo vale circa 4-5 s nel ⭐) e considerare la temperatura del frigo; se diversi da 60 g e 5 °C usare il calcolatore.
3. Inserire le uova solo a bagno stabile, tutte insieme con una schiumarola, e avviare il timer all'immersione.
4. Allo scadere trasferire subito, entro pochi secondi, in acqua e ghiaccio per 1-6 minuti, poi servire.

I tempi in tabella presuppongono il passaggio immediato in acqua e ghiaccio, che controlla la consistenza; servire senza raffreddare lascia proseguire la cottura del tuorlo. Il ghiaccio non riduce né compensa la pastorizzazione; per conservare seguire raffreddamento e refrigerazione della sezione 6, con guscio integro.

### Prova di taratura

Consigliata per le config 2, 3 e 5: usare 3 uova dello stesso lotto, pesate, nello stesso bagno; estrarle rispettivamente a t - 20 s, t e t + 20 s e applicare a tutte lo stesso passaggio in ghiaccio. Tagliarle a metà, confrontarle con i descrittori della tabella e usare il tempo migliore come riferimento personale.

### Freschezza dell'uovo

- Uova fresche (< 7 gg): albume denso, aderisce alla membrana. Migliore per il profilo 1.
- Uova vecchie (> 14 gg): albume acquoso, camera d'aria grande. Sgusciatura migliore ma texture meno omogenea.
- Config 2-5 (alta T/breve): freschezza meno critica.

---

## 4. Spiegazioni Tecniche e Scientifiche

### Ricalcolo per peso e temperatura di partenza dell'uovo

Il modello di riferimento è una sfera a due strati (tuorlo + albume), con proprietà dipendenti dalla temperatura misurate da Abbasnezhad et al. 2015 ([articolo](https://doi.org/10.1002/fsn3.257); [testo completo](https://pmc.ncbi.nlm.nih.gov/articles/PMC4708634/)); il guscio è trattato come resistenza termica. Lo scambio convettivo col bagno usa h circa 1000 W/m²K; nel bagno di acqua e ghiaccio a circa 1 °C usa h circa 400 W/m²K (parametro stimato). Si assumono il guscio al 10.5% e il tuorlo al 28% della massa dell'uovo.

Il criterio di cottura segue Williams (Università di Exeter: l'uovo è pronto quando si scalda il bordo del tuorlo, non il centro) e varia per profilo: config 4 ⭐ = corona del tuorlo oltre circa 65 °C spessa 2.35 mm; config 2, 3 e 5 = temperatura massima al centro del tuorlo; config 1 = tempo di riscaldamento del centro fino a 66.5 °C più un mantenimento fisso. La soglia di circa 65 °C è tarata sulla prova reale del ⭐ ed è coerente con l'intervallo di letteratura 63-70 °C.

La formula usata dal calcolatore è un'approssimazione locale del modello (errore massimo circa 1 s, 3 s per la config 1, nel dominio 45-75 g e 0-8 °C):

$$
t = t_{\mathrm{rif}} \cdot \left(\frac{m}{60\ \mathrm{g}}\right)^{p} \cdot e^{\,q\,(5 - T_0)}
$$

Qui m è il peso dell'uovo intero in g, T0 è la temperatura di partenza in °C e t_rif è il centro della finestra in tabella. Il calcolatore applica il fattore al centro della finestra e ne conserva l'ampiezza (il ⭐ resta largo 10 s).

| Config | T bagno | Criterio | p | q (1/°C) |
|---|---:|---|---:|---:|
| 1 | 68.5 °C | Centro fino a 66.5 °C + mantenimento | 0.525 | 0.0032 |
| 2 | 79 °C | Picco al centro circa 64 °C | 0.649 | 0.0071 |
| 3 | 83 °C | Picco al centro circa 66 °C | 0.649 | 0.0071 |
| 4 ⭐ | 88.5 °C | Corona oltre 65 °C di 2.35 mm | 0.579 | 0.0096 |
| 5 | 90 °C | Picco al centro circa 68 °C | 0.649 | 0.0073 |

Esempi per il ⭐: 55 g a 5 °C → 7:03–7:13; 65 g a 5 °C → 7:46–7:56; 60 g a 3 °C → 7:34–7:44.

La legge di scala cambia di 1-3 s al variare dei parametri incerti (h, frazione di tuorlo, proprietà, forma); il vecchio modello (sfera omogenea, temperatura al centro, esponente 2/3) sovrastimava l'effetto di peso e temperatura iniziale fino a circa 18 s sul ⭐. I tempi assoluti delle config 2, 3 e 5 hanno un'incertezza di circa ±25 s finché non sono confermati da una prova. Fuori da 45-75 g o 0-8 °C la webapp mostra i tempi di tabella. I tempi del protocollo di pastorizzazione 57-60 °C non sono ricalcolati da questo modello.

La storia termica pregressa dell'uovo (ad esempio una precedente pastorizzazione in guscio a 57°C seguita da refrigerazione) non è una variabile rilevante per questo modello: la denaturazione parziale delle proteine non altera in modo misurabile densità e diffusività termica del contenuto dell'uovo, e l'eventuale contributo di convezione interna residua — già minore nel modello a pura conduzione — risulta semmai ridotto, non aumentato, da una precedente gelificazione parziale. La differenza di tempo risultante resta stimata sotto pochi minuti anche sui profili più lunghi, comparabile alla normale variabilità di peso tra uova della stessa categoria. Il calcolatore non distingue quindi tra uovo fresco e uovo già pastorizzato a parità di peso e temperatura di partenza.

### Pastorizzazione (per uso crudo: maionese, tiramisù, carbonara)

### Protocollo di riferimento: 57°C × 75 min

Uovo visivamente crudo (albume appena opalescente, tuorlo liquido). Schuman et al. (1997) riportano, nelle condizioni sperimentali studiate, l'inattivazione di *Salmonella Enteritidis* entro 65–75 minuti in bagno a 57°C, con una fase iniziale di riscaldamento di 24–35 minuti. Il tempo complessivo non va confuso con il solo mantenimento dopo il riscaldamento.

Fonte: [Immersion heat treatments for inactivation of Salmonella enteritidis with intact eggs](https://doi.org/10.1046/j.1365-2672.1997.00253.x), abstract consultabile anche su [PubMed](https://pubmed.ncbi.nlm.nih.gov/9351225/). L'abstract non permette di stabilire come compensare il calo e il recupero di temperatura di un bagno domestico, né di fissare qui l'avvio del timer all'immersione o al recupero. La convenzione resta da verificare nel protocollo completo; questa precisazione non convalida la tabella seguente, gli altri profili o le indicazioni per persone vulnerabili.

| T bagno | Tempo raccomandato | Stato visivo |
|---:|---:|---|
| 56 °C | ❌ Non raccomandato | — |
| 57 °C | 75–80 min ✅ | Crudo |
| 58 °C | 55–60 min | Crudo (albume leggermente più opaco) |
| 59 °C | 40–45 min | Quasi crudo |
| 60 °C | 30–35 min | Albume inizia a rapprendere al bordo |

### Pastorizzazione implicita nelle config di cottura

| Config | Pastorizzazione? |
|---|---|
| 1 (68.5 °C × 30-32 min) | ✅ COMPLETA: oltre 6 log al centro del tuorlo anche nel caso peggiore (uovo 75 g a 0 °C, bagno -0.5 °C, tempo -1 min) |
| 2-5 (79-90 °C, tempi brevi) | ⚠️ SOLO ALBUME: tuorlo NON pastorizzato |

Nelle config 2-5 la consistenza voluta arriva molto prima dell'equilibrio termico: il centro del tuorlo resta a 56-68 °C solo per pochi minuti (nel caso peggiore 0.3-0.5 log contro i 6 richiesti); nella config 1 il tempo necessario per la consistenza basta anche per l'equilibrio. Il metodo di verifica è l'integrale di letalità al centro del tuorlo riferito a 57 °C, con D57 = 6.0 min e z circa 8 °C dai dati su uova intere di Schuman et al. 1997, obiettivo 6 log (36 minuti equivalenti a 57 °C), calore residuo in ghiaccio incluso. Il passaggio in acqua e ghiaccio non riduce la riduzione già ottenuta (il calore residuo la aumenta leggermente) e non compensa una pastorizzazione incompleta.

> Nota per soggetti a rischio: usare solo la config 1, oppure le config 2-5 previa pastorizzazione completa dell'uovo (57 °C × 75 min, sezione 4).

---

## 5. Consigli e Variazioni

### Preservazione dei nutrienti del tuorlo

### Soglie denaturazione proteica

| Proteina albume | T onset → T completa |
|---|---|
| Ovotransferrina (13%) | 57-60 → 65-70 °C |
| Ovoalbumina (54%) | 72-74 → 90-92 °C |

| Proteina tuorlo | T onset |
|---|---|
| Livetine | 63-70 °C |
| Lipovitelline | 65-68 °C |
| Fosvitina | 70-80 °C |

### Ritenzione nutrienti tuorlo

| Nutriente | 57°C/75min | 75°C/15min | 85°C/10min | 88.5°C/7.5min* |
|---|---:|---:|---:|---:|
| Colina | ~99% | ~99% | ~98% | ~98% |
| Vitamina A | ~97% | ~93% | ~88% | ≥95%* |
| Vitamina D₃ | ~97% | ~95% | ~93% | ≥96%* |
| Vitamina B₁₂ | ~95% | ~88% | ~82% | ≥92%* |
| Vitamina E | ~96% | ~92% | ~88% | ≥94%* |
| Luteina/Zeaxantina | ~93% | ~88% | ~82% | ≥90%* |
| DHA (omega-3) | ~96% | ~90% | ~84% | ≥93%* |
| Folati | ~92% | ~85% | ~78% | ≥88%* |

*\*Valori corretti per il gradiente termico: il tuorlo raggiunge al massimo 56-71 °C (dal centro al bordo, compreso il calore residuo in ghiaccio), degradazione reale molto inferiore a T uniforme di 88.5°C.*

> **Insight chiave**: la config 4 ⭐ (88.5 °C × 7:30) è paradossalmente una delle migliori per la preservazione dei nutrienti del tuorlo, perché il tuorlo non si scalda abbastanza da degradarli.

**Ferro**: unico nutriente che MIGLIORA. Sopra 70°C la fosvitina rilascia Fe³⁺ biodisponibile.

**Ossisteroli** (ossidazione colesterolo): il guscio protegge dall'O₂. In bagno termico: 1-5 μg/g (75-90°C) vs 50-500 μg/g in frittura. Profilo ossidativo ottimale.

**Anello verde (FeS)**: assente sotto 88.5°C con tempi ≤12 min. Si forma a ≥100°C per >10 min.

### Montare gli albumi pastorizzati a neve

Gli albumi pastorizzati con il protocollo di sezione 4 (57°C × 75 min) si possono montare a neve, ma con qualche adattamento rispetto all'albume crudo: il tempo di montaggio è più lungo, il volume massimo raggiungibile è probabilmente inferiore, e un acido lieve (succo di limone o cremor tartaro) aiuta la stabilità più che nell'albume non pastorizzato. Fare attenzione a non montare eccessivamente: la sineresi (separazione del liquido) è più rapida rispetto all'albume crudo. Questa indicazione non modifica il protocollo di pastorizzazione né i tempi di sicurezza indicati in sezione 4.

### Sgusciare le uova delle configurazioni 4-5

Per le configurazioni 4-5, una tecnica utile è: raffreddare l'uovo in acqua e ghiaccio, romperlo con un colpo deciso e sgusciarlo sott'acqua, partendo dalla camera d'aria. È un'ipotesi non confermata sperimentalmente sul perché riduca l'aderenza della membrana al guscio: va considerata un suggerimento pratico da provare, non una regola garantita.

---

## 6. Sicurezza Alimentare

- Config 1: pastorizzazione completa. Frigo max 5 giorni (guscio integro).
- Config 2-5: tuorlo NON pastorizzato. Frigo max 2-3 giorni.
- Il passaggio in acqua e ghiaccio previsto dalla tabella ferma la cottura ma non riduce la pastorizzazione già ottenuta e non compensa un trattamento incompleto. I limiti in giorni restano legati allo stato pastorizzato o non pastorizzato della config.
- Un uovo pastorizzato in guscio a 57°C × 75 min e lasciato crudo riduce drasticamente la carica interna di Salmonella (circa 5-6 log, in linea con i D-value riportati da Humphrey 1990 e Schuman & Sheldon), ma non prolunga la conservazione: non rafforza guscio e cuticola e l'immersione calda prolungata può ammorbidirla. In assenza di dati specifici sulla keeping-quality, si applica lo stesso limite conservativo di 5 giorni della config 1.
- Dopo la pastorizzazione raffreddare rapidamente in acqua e ghiaccio, poi conservare a ≤4°C con guscio integro e senza incrinature; gestire con cautela lo shock termico caldo→ghiaccio. Il protocollo a monte deve essere rispettato: la conservazione non ne compensa un'esecuzione incompleta. La ricontaminazione superficiale del guscio resta possibile e si limita con guscio integro e raffreddamento rapido in ghiaccio.
- Per usare le config 2-5 in sicurezza anche per soggetti a rischio o per una conservazione più lunga: pastorizzare prima l'uovo con il protocollo 57°C × 75 min (sezione 4), raffreddarlo a 4°C, poi ricuocerlo con la config scelta — la ricottura resta sopra soglia di pastorizzazione e non aggiunge rischio, ma l'albume risulta leggermente più compatto.
- Consumo immediato: entro 2 ore a T ambiente.
- Freezer: ❌ Non consigliato (il gelo rompe la struttura nel guscio).

---

## 7. Conservazione e Rigenerazione

- Configurazione 1: conservare in frigorifero, guscio integro, per massimo 5 giorni.
- Configurazioni 2–5: conservare in frigorifero per massimo 2–3 giorni; consumare preferibilmente subito.
- Uovo pastorizzato a 57°C × 75 min e lasciato crudo: raffreddare subito in acqua e ghiaccio, conservare a ≤4°C con guscio integro e consumare entro 5 giorni, prima dell'uso crudo (maionese, tiramisù) o della ricottura con le config 2-5. Per i dettagli sul razionale e sui limiti, vedere la sezione 6.
- Non congelare le uova nel guscio.

## 8. Altro

Per la scelta del profilo, fare riferimento alla tabella della sezione 2 e alle indicazioni di sicurezza della sezione 6.

```
INSERIMENTO: SEMPRE a bagno già a temperatura. Uova fredde da frigo.
             Mai cold-start per pastorizzazione.
             Timer all'immersione; max 4 uova in ≥5 L, contenitore coperto.
             Fine cottura: subito in acqua e ghiaccio 1-6 min.

COTTURA (uovo 60 g da frigo a 5 °C; altri pesi o temperature: calcolatore):
  Ramen egg:              68.5°C × 30:00-32:00
  Barzotto:               79°C × 11:35-12:05
  Insalata, panino:       83°C × 11:05-11:35
  ⭐ Preferito:            88.5°C × 7:25-7:35
  Sodo rapido cremoso:    90°C × 9:50-10:20

PASTORIZZAZIONE (uso crudo):
  Standard:               57°C × 75-80 min
  Rapida:                 60°C × 30-35 min

NUTRIENTI TUORLO: config 88.5°C/7:30 preserva ≥88-98% (gradiente termico)
                   config 57°C/75min preserva 92-99% (equilibrio ma T bassa)

SICUREZZA: config 1 pastorizza TUTTO; config 2-5 il tuorlo NO
```
