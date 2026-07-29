---
applyTo: '**/recipes/*.md'
---

# Recipe Maintenance — Linee guida per il repository `cook`

Questo documento definisce le regole operative per la creazione, revisione e manutenzione delle ricette nel repository.

<objective>

## Scopo

Assicurare coerenza strutturale, sicurezza alimentare e facilità di pubblicazione (Notion-sync) per tutte le ricette.

</objective>

<rules>

## Regole di base

- Lingua: italiano.
- Nome file: kebab-case (minuscolo, parole-separate-da-trattini). Evitare date, numeri seriali e suffissi ridondanti (vedi [Suffissi Ridondanti da evitare](#suffissi-ridondanti-da-evitare)).
- Front-matter YAML minimo obbligatorio: `title`, `tags`, `prep_time`, `cook_time`, `total_time`, `difficulty`. Aggiungere se manca.
- **rimuovere** dal front-matter i campi `date`, `authors`, `servings`.
- Usare sempre il template canonico, usa read_file su: [`../../.github/templates/recipe-canonical-template.md`](../../.github/templates/recipe-canonical-template.md).
- Non cambiare il contenuto
- Applicare solo una ristrutturazione secondo il template. Se mancano sezioni, ometterle; non inventare dati di sicurezza.
- Titoli semplici e chiari, senza suffissi ridondanti (vedi [Suffissi Ridondanti da evitare](#suffissi-ridondanti-da-evitare)): riscrivi il titolo se non aderisce a questo standard. Sono ammesse indicazioni sul tipo di cottura se rilevanti (es. "Sous-vide", "Vasocottura", "Infusione a freddo").
- La ricetta **ri**scritta **DEVE** sempre sostituire completamente la versione precedente. Non aggiungere commenti o note di revisione nel file finale.
- Rimuovere riferimenti a date nel corpo della ricetta.

</rules>

<suffixes>

## Suffissi Ridondanti da evitare
- "guida ..."
- qualunque rimando a risultati ed effetti finali
- qualunque dettagliato riferimento a modelli o marchi di apparecchiature
- qualunque dettagliato riferimento a elenchi di ingredienti (es. "Pesto di rucola con olio, aglio e pinoli" → "Pesto di rucola")

</suffixes>

<title-nono>

### Esempi di contenuti da evitare e da rimuovere nei titoli:
- Metodo controllato
- Guida completa
- Ricetta passo passo
- Guida Completa per Fette da 0,6 cm
- Guida Scientifica e Pratica
- Guida Scientifica
- Russell Hobbs Satisfry 26520-56
- Weck
- Guida Scientifica e Operativa
- Guida agli Ingredienti Vegetali Secchi

</title-nono>

<naming-convention>

## Naming convention (esempi)
- `polpo-sous-vide.md`
- `maionese-frullatore.md`
- `cold-brew-coffee.md` (mantenere termini internazionali noti)

</naming-convention>

<checklist>

## PR checklist minima (da includere nella descrizione PR)
- [ ] Il file utilizza il template canonico.
- [ ] Front-matter YAML è completo.
- [ ] Presente la sezione `Sicurezza Alimentare`.
- [ ] Tabelle Temperature/Tempo/Texture presenti e chiare.
- [ ] Se sono stati rinominati file, i link interni sono aggiornati.
- [ ] Revisione umana richiesta per modifiche di sicurezza.

</checklist>

<tags>

## Tag principali ammessi
- verdura
- frutta
- carne
- pesce
- uova
- latticini
- cereali
- legumi
- pollo
- salsa
- sous-vide
- vasocottura
- bevanda
- dolce
- pasta
- patate
- funghi
- contorno
- secondo
- primo

</tags>

<notes>

## Note finali
- la sezione Fattibilità è deprecata e da rimuovere ovunque.
- applica <rules> 

</notes>