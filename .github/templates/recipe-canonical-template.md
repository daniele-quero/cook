---
title: "[Titolo: ingrediente/piatto — tecnica]"
main_ingredient: "[Ingrediente principale]"
tags: ["sous-vide","verdura","pesce"]
prep_time: "PT10M"
cook_time: "PT01H00M"
total_time: "PT01H10M"
difficulty: "media"
---

# [Titolo completo e descrittivo]

## 1. Preparazione
- Note preliminari (spessori, temperatura ingrediente, congelato vs fresco).
- Attrezzatura necessaria (es. circolatore, sonda, friggitrice ad aria, padella ghisa).

### Ingredienti
| Ingrediente | Quantità | Note / funzione |
|---|---:|---|
| <main>[Ingrediente principale]</main> | [g/ml/pezzi] | [ancora della proporzione] |
| [Ingrediente 2] | [g/ml/pezzi] | [ruolo] |

Il valore di `main_ingredient` deve corrispondere al testo nel tag `<main>...</main>`. Il tag identifica solo la cella o l'intestazione principale della tabella Ingredienti: non usarlo in tabelle di temperature, sicurezza, conservazione o troubleshooting. La webapp calcola in modo invisibile la proporzione delle quantità scalabili rispetto alla dose del main ingredient.

Le quantità scalabili sono numeri singoli o intervalli con unità semplici (`g`, `kg`, `mg`, `ml`, `l`, `cl`, pezzi, spicchi, foglie, rametti, cucchiaini, cucchiai). Lasciare testualmente invariati `q.b.`, percentuali, rapporti `per`, formule, spessori e testo libero.

Se sono presenti più tabelle Ingredienti, per esempio profili o porzioni diverse, ogni tabella dosabile deve avere il proprio `<main>...</main>`. La webapp mantiene le proporzioni e lo scaling separati per ciascuna tabella.

---

## 2. Tabella Riassuntiva: Temperature, Tempi e Risultati
| Profilo | Temperatura (°C) | Tempo | Risultato atteso | Uso ideale |
|---|---:|---:|---|---|
| **Profilo 1** | 50 °C | 30–40 min | Morbido, cremoso | Servire freddo / tartare |
| **Profilo 2** | 55 °C | 45–60 min | Sodo-cremoso | Affettare / porzionare |
| **Profilo 3** | 60–85 °C | 20–120 min | Più sodo / sfaldante (aumenta il tempo) | Brasati / purée |

> Note: indicare sempre condizioni speciali (es. "da congelato: +45–90 min", "spessore 3–4 cm") e unità.

---

## 3. Procedimento Step-by-Step
### Fase Preliminare
1. [Esempio] Tamponare e misurare spessore.
2. Condire e imbustare (se sous‑vide) o preriscaldare apparecchiatura.

### Fase Principale
1. Impostare la temperatura e inserire il prodotto a bagno già a temperatura (se richiesto).
2. Controllare tempo e temperatura con sonda; annotare eventuali variazioni.

### Fase di Finitura (se applicabile)
1. Searing / Maillard: asciugare, scaldare padella/forno e scottare per colore.
2. Riposo e porzionatura.

---

## 4. Spiegazioni Tecniche e Scientifiche
- Breve box con la chimica rilevante (denaturazione proteica, gelatinizzazione amidi, Maillard) e fisica (trasferimento di calore, equilibri termici).

Esempio conciso:
- **Proteine:** la miosina denatura intorno a 50–55 °C → effetto X.
- **Amidi:** gelatinizzazione variabile per varietà; aggiustare temperatura/tempo.

Formula utile (tempo caratteristico):

$$\tau = \frac{r^2}{\alpha}$$

(Spiegare r = semispessore, α = diffusività termica). Inserire note su come stimare tempi di equilibrio quando necessario.

---

## 5. Consigli e Variazioni
- Suggerimenti pratici e alternative ingredienti.
- Versioni veloci o tecniche per scala professionale.

---

## 6. Sicurezza Alimentare (OBBLIGATORIA)
- Indicazioni precise su pastorizzazione (temperatura × tempo) per alimenti a rischio.
- Raccomandazioni di conservazione (frigorifero: temperatura e durata; freezer: temperatura e durata).
- Procedure di raffreddamento rapido (bagno di ghiaccio, porzionatura) e rigenerazione.
- Avviso: qualsiasi modifica ai valori di sicurezza richiede revisione umana dell'autore/maintainer.

Esempio di template per pastorizzazione:
- "Per uova crude: 63 °C × 75 min (verificare tabelle e condizioni)"
- "Per pesce: se non precongelato, seguire le linee guida per Anisakis e pastorizzazione"

---

## 7. Conservazione e Rigenerazione
- Durata in frigo (es. 2–4 °C): X giorni.
- Durata in freezer (es. -18 °C): X settimane/mesi.
- Metodo di rigenerazione consigliato (sous‑vide a Y °C, o forno a Z °C) e tempi consigliati.

---

## 8. Altro (Freeform)
- Link utili, riferimenti bibliografici, note su allergeni, varianti regionali.
- Spazio per note editoriali del maintainer (es. "non modificare la sezione Sicurezza senza approvazione").

---

<!-- Istruzioni per l'uso del template:
  - Copiare questo file e aggiornare il front‑matter.
  - Compilare sempre la sezione Sicurezza Alimentare.
  - Usare unità chiare (°C, min/h, g/ml) e specificare condizioni (da congelato, spessore).
 -->
