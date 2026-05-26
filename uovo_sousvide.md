# Uovo Sous Vide in Guscio — Guida Scientifica e Operativa

## Fattibilità

✅ **Fattibile con circolatore sous vide domestico standard.**

L'uovo in guscio è un sistema multistrato (guscio CaCO₃ ~0.3 mm, membrane, albume, tuorlo Ø ~30 mm). Il guscio funge da barriera biologica all'ossigeno, riducendo l'ossidazione dei nutrienti rispetto a cottura in padella.

---

## 1. INSERIMENTO: SEMPRE A BAGNO GIÀ A TEMPERATURA

**Uova fredde da frigo (4°C), bagno già alla T target.**

- **Pastorizzazione**: il protocollo 57°C × 75 min è validato solo con bagno già a temperatura. Cold-start **MAI validato**.
- **Cotture brevi (< 15 min)**: la rampa variabile rende il risultato non replicabile.
- **Calo termico**: 6 uova a 4°C in 5 L causano un calo di ~5°C; circolatore 1000 W recupera in 2–4 min. Per cotture brevi: usare ≥7-8 L o compensare +2-3 min.

---

## 2. CONFIGURAZIONI DI COTTURA — 7 PROFILI

Uova medie (55–65 g), fredde da frigo (4°C), bagno già a temperatura.

| # | Temperatura | Tempo | Tuorlo | Albume | Uso culinario |
|---|---:|---:|---|---|---|
| 1 | **62–65 °C** | **45–50 min** | Completamente liquido, bordo gelificato 2-3 mm | Trasparente, appena rappreso al bordo | Onsen tamago |
| 2 | **68–70 °C** | **30–35 min** | Liquido al centro, corona cremosa ~5 mm | Appena rappreso, gelatinoso | Ramen egg, insalata tiepida |
| 3 | **73–75 °C** | **20–23 min** | Liquido con ampia zona cremosa 7-10 mm | Fermo morbido, opalescente | Uovo poché alternativo |
| 4 | **78–80 °C** | **13–15 min** | Cremoso, cuore liquido ridotto 3-5 mm | Fermo, compatto | Uovo barzotto |
| 5 | **82–84 °C** | **11–12 min** | Prevalentemente cremoso, nucleo liquido 1-2 mm | Fermo, bianco perlaceo | Insalata, panino |
| 6 | **88–88.5 °C** | **7–7.5 min** | **Liquido al centro**, corona cremosa 2-3 mm | Fermo, bianco, compatto | ⭐ **Preferito** |
| 7 | **90 °C** | **6–7 min** | Cremoso, nucleo liquido 0-1 mm | Fermo, quasi gommoso | Sodo rapido cremoso |

> ⚠️ **Config 1-5**: il tuorlo raggiunge l'equilibrio termico (T_tuorlo ≈ T_bagno). Il tuorlo è liquido perché la T è sotto la soglia di gelificazione (65°C) o appena sopra.
> **Config 6-7**: il tuorlo **non raggiunge l'equilibrio** — resta liquido perché non si scalda mai abbastanza (gradiente termico).

### Perché la config 6 (88.5°C × 7.5 min) funziona

Tempo caratteristico dell'uovo: τ = R²/α ≈ 70 min. In 7.5 minuti (Fo = 0.107):

| Posizione | T stimata | Stato |
|---|---:|---|
| Superficie albume | **88.5 °C** | Coagulato |
| Interfaccia albume/tuorlo | **~65 °C** | Soglia gelificazione |
| Centro tuorlo | **~32 °C** | Liquido (non cotto) |

ΔT ≈ 56°C su 22.5 mm. La discontinuità cade all'interfaccia tuorlo/albume.

---

## 3. FRESCHEZZA DELL'UOVO

- **Uova fresche (< 7 gg)**: albume denso, aderisce alla membrana. Migliore per profili 1-3.
- **Uova vecchie (> 14 gg)**: albume acquoso, camera d'aria grande. Sgusciatura migliore ma texture meno omogenea.
- **Config 6-7** (alta T/breve): freschezza meno critica.

---

## 4. PASTORIZZAZIONE (per uso crudo: maionese, tiramisù, carbonara)

### Protocollo di riferimento: 57°C × 75 min

Uovo visivamente crudo (albume appena opalescente, tuorlo liquido). Tempo include ~25 min equilibrazione + ~35 min hold per 6-log *Salmonella* + margine 2×.

| T bagno | Tempo raccomandato | Stato visivo |
|---:|---:|---|
| 56 °C | ❌ Non raccomandato | — |
| **57 °C** | **75–80 min** ✅ | Crudo |
| 58 °C | **55–60 min** | Crudo (albume leggermente più opaco) |
| 59 °C | **40–45 min** | Quasi crudo |
| 60 °C | **30–35 min** | Albume inizia a rapprendere al bordo |

### Pastorizzazione implicita nelle config di cottura

| Config | Pastorizzazione? |
|---|---|
| 1-5 (62-84°C, tempi lunghi) | ✅ COMPLETA (tuorlo raggiunge equilibrio) |
| 6-7 (88-90°C, tempi brevi) | ⚠️ **SOLO ALBUME** — tuorlo al centro a ~32°C, NON pastorizzato |

> **Per soggetti a rischio** (immunocompromessi, anziani, bambini, gravidanza): usare solo config 1-5.

---

## 5. PRESERVAZIONE DEI NUTRIENTI DEL TUORLO

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
| **Colina** | ~99% | ~99% | ~98% | ~98% |
| Vitamina A | ~97% | ~93% | ~88% | ≥95%* |
| Vitamina D₃ | ~97% | ~95% | ~93% | ≥96%* |
| Vitamina B₁₂ | ~95% | ~88% | ~82% | ≥92%* |
| Vitamina E | ~96% | ~92% | ~88% | ≥94%* |
| Luteina/Zeaxantina | ~93% | ~88% | ~82% | ≥90%* |
| DHA (omega-3) | ~96% | ~90% | ~84% | ≥93%* |
| Folati | ~92% | ~85% | ~78% | ≥88%* |

*\*Valori corretti per il gradiente termico: il tuorlo raggiunge solo 32-65°C, degradazione reale molto inferiore a T uniforme di 88.5°C.*

> **Insight chiave**: la config 88.5°C × 7.5 min è paradossalmente una delle migliori per la preservazione dei nutrienti del tuorlo, perché il tuorlo non si scalda abbastanza da degradarli.

**Ferro**: unico nutriente che MIGLIORA. Sopra 70°C la fosvitina rilascia Fe³⁺ biodisponibile.

**Ossisteroli** (ossidazione colesterolo): il guscio protegge dall'O₂. In bagno termico: 1-5 μg/g (75-90°C) vs 50-500 μg/g in frittura. Profilo ossidativo ottimale.

**Anello verde (FeS)**: assente sotto 88.5°C con tempi ≤12 min. Si forma a ≥100°C per >10 min.

---

## 6. SICUREZZA ALIMENTARE

- **Config 1-5**: pastorizzazione completa. Frigo max 5 giorni (guscio integro).
- **Config 6-7**: tuorlo NON pastorizzato. Frigo max 2-3 giorni.
- **Consumo immediato**: entro 2 ore a T ambiente.
- **Freezer**: ❌ Non consigliato (il gelo rompe la struttura nel guscio).

---

## 7. RIEPILOGO OPERATIVO

```
INSERIMENTO: SEMPRE a bagno già a temperatura. Uova fredde da frigo.
             Mai cold-start per pastorizzazione.
             Cotture brevi: ≥7 L o compensare +2-3 min.

COTTURA (tuorlo liquido + albume fermo):
  Onsen tamago:           62-65°C × 45-50 min
  Ramen egg:              68-70°C × 30-35 min
  Poché alternativo:      73-75°C × 20-23 min
  Barzotto:               78-80°C × 13-15 min
  Sodo cremoso:           82-84°C × 11-12 min
  ⭐ Preferito:           88-88.5°C × 7-7.5 min
  Sodo rapido:            90°C × 6-7 min

PASTORIZZAZIONE (uso crudo):
  Standard:               57°C × 75-80 min
  Rapida:                 60°C × 30-35 min

NUTRIENTI TUORLO: config 88.5°C/7.5min preserva ≥88-98% (gradiente termico)
                   config 57°C/75min preserva 92-99% (equilibrio ma T bassa)

SICUREZZA: config 1-5 pastorizzano TUTTO; config 6-7 il tuorlo NO
```