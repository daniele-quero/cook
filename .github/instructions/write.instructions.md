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
- Front-matter YAML minimo obbligatorio: `title`, `main_ingredient`, `tags`, `prep_time`, `cook_time`, `total_time`, `difficulty`. Aggiungere se manca.
- `main_ingredient` identifica l'ingrediente dominante della ricetta. Inferirlo dal titolo, dalla sezione Ingredienti e dalla tecnica; quando il caso resta ambiguo, scegliere il componente che definisce il piatto e non un aroma o un condimento.
- **rimuovere** dal front-matter i campi `date`, `authors`, `servings`.
- Usare sempre il template canonico, usa read_file su: [`../../.github/templates/recipe-canonical-template.md`](../../.github/templates/recipe-canonical-template.md).
- Non cambiare il contenuto
- Applicare solo una ristrutturazione secondo il template. Se mancano sezioni, ometterle; non inventare dati di sicurezza.
- Titoli semplici e chiari, senza suffissi ridondanti (vedi [Suffissi Ridondanti da evitare](#suffissi-ridondanti-da-evitare)): riscrivi il titolo se non aderisce a questo standard. Sono ammesse indicazioni sul tipo di cottura se rilevanti (es. "Sous-vide", "Vasocottura", "Infusione a freddo").
- La ricetta **ri**scritta **DEVE** sempre sostituire completamente la versione precedente. Non aggiungere commenti o note di revisione nel file finale.
- Rimuovere riferimenti a date nel corpo della ricetta.

## Ingrediente principale e dosi proporzionali

- Nella tabella `Ingredienti`, racchiudere l'ingrediente principale con il tag esatto `<main>...</main>`. Il testo nel tag deve corrispondere semanticamente a `main_ingredient`.
- Per le tabelle verticali, il tag va nella cella della colonna Ingrediente; per tabelle con ingredienti in intestazione, va nell'intestazione del main ingredient. Non usare il tag in tabelle di temperature, sicurezza, conservazione, confronti o troubleshooting.
- Quando una sezione Ingredienti contiene più tabelle o profili, ogni tabella dosabile deve avere il proprio tag `<main>...</main>` per lo stesso ingrediente principale. Ogni tabella è scalata in modo indipendente; non marcare una tabella tecnica che precede o segue la sezione Ingredienti.
- Le proporzioni degli altri ingredienti sono calcolate dalla webapp come metadati invisibili rispetto alla quantità base del main ingredient. Non aggiungere rapporti tecnici visibili nel testo della ricetta soltanto per la UI.
- Sono scalabili solo quantità numeriche singole o intervalli con unità semplici: `g`, `kg`, `mg`, `ml`, `l`, `cl`, pezzi, spicchi, foglie, rametti, cucchiaini e cucchiai. `q.b.`, percentuali, rapporti con `per`, formule, spessori e testo libero restano invariati.
- Se il main ingredient non compare in una tabella Ingredienti oppure non ha una quantità affidabile, aggiungere comunque `main_ingredient` al frontmatter ma non inventare una riga o una dose per poterlo marcare.

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

<limits>

## Limiti di contenuto
Limitare il contenuto (tutto ciò che **NON** è frontmatter YAML) ad un massimo di 18000 caratteri. Se il contenuto supera questo limite, riduci la lunghezza del testo senza rimuovere informazioni essenziali:
- elimina le newline dopo i titoli:
  ```md
  # Titolo
  contenuto
  ```
- **massimo** una newline tra paragrafi
    ```md
  linea 1

  linea 2
  ```
- rimuovi eventuali spazi bianchi in eccesso
- limitare `---` a massimo 1 occorrenza consecutiva
- limitare `---` a massimo 4 occorrenza totali
- rimuovere la dicitura `(OBBLIGATORIA)` dai titoli di sezione come la Sicurezza Alimentare
- se prossimi a 18000 caratteri, riformulare frasi lunghe in più frasi brevi, senza rimuovere informazioni essenziali.

</limits>

<notes>

## Note finali
- la sezione Fattibilità è deprecata e da rimuovere ovunque.
- applica <rules> 

</notes>