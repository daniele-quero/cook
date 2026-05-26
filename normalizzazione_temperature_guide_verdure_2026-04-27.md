# Normalizzazione Temperature Guide Verdure — 85°C Limite Massimo

Data: 27 aprile 2026

## Obiettivo
Uniformare tutte le guide di cottura sous vide/vasocottura per verdure, introducendo 85°C come temperatura massima. Le configurazioni ≤85°C sono rimaste inalterate; quelle >85°C sono state ricalcolate con cinetica di Arrhenius (Ea = 135-150 kJ/mol, β-eliminazione pectine).

## Modifiche apportate

### agretti_sousvide.md
| Profilo | Prima | Dopo |
|---|---|---|
| Molto tenero (fondente) | 88°C × 20-25 min | 85°C × 30-40 min |

Metodo: fattore Arrhenius f = 1.46-1.52 (ΔT = 3°C, T1=361.15K, T2=358.15K)

### bietole_vasocottura.md
| Profilo | Prima | Dopo |
|---|---|---|
| Coste e foglie fondenti | 90°C × 50-60 min | 85°C × 80-100 min |

Metodo: f = 1.87-2.00 (ΔT = 5°C). L'overhead vasetto Weck (~20 min) è costante e non scala; solo la quota attiva di cottura è stata moltiplicata.
Sezione sicurezza: "85-90°C" aggiornata a "85°C".

### carote_sous_vide.md
| Profilo | Prima | Dopo |
|---|---|---|
| Fondente / fine dining | 85-86°C × 60-90 min | 85°C × 70-90 min |
| Per purea | 88-90°C × 60-75 min | 85°C × 100-130 min |

Metodo: f = 1.13 per il profilo fondente (ΔT = 1°C da 86°C); f = 1.65-1.74 per purea (da mediana 89°C, ΔT = 4°C).

## Validazione sicurezza (cook-biosafety)
- Tutti i protocolli a ≥85°C garantiscono 6-log reduction di Listeria in <7 secondi: sicuro.
- Il rischio spore C. botulinum proteolitico (D85°C ≈ 17h) è invariato rispetto ai protocolli originali: né i vecchi né i nuovi parametri le inattivano (normale per cottura non sterile).
- Nessun rischio aggiuntivo introdotto dai tempi più lunghi a 85°C.
- Raffreddamento rapido obbligatorio: 85°C → <3°C in ≤90 min.

## File non modificati
- cardoncelli_sousvide.md: fungo (non verdura), tutte le config ≤80°C
- champignon_sousvide.md: fungo (non verdura), tutte le config ≤75°C
- Nessuna guida patate trovata nel workspace: eccezione non applicata.