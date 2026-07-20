---
description: 'Controlla e riscrive le ricette secondo le linee guida del repository'
agent: "Cook-writer"
name: "Maintain Recipe"
---

<prompt>

<objective>

Controlla le ricette fornite e riscrivile in-place secondo le linee guida del repository (Modalità B — Manutenzione di Cook-writer). Non si tratta di creare nuovi file: i file esistono già e vanno letti e sovrascritti allo stesso percorso, aderendo al 100% alle <rules> e al template.

</objective>

<rules>

## Regole
- Il front-matter YAML deve essere completo e corretto.
- Il titolo deve essere chiaro e senza suffissi ridondanti.
- La struttura del file deve seguire il template canonico.
- Non creare nuovi file e non aggiungere suffissi numerici.
- Prima di modificare, leggere sempre il file con read_file.
- Dopo la modifica, rileggere il file per verificare che la scrittura sia avvenuta.
- Il template deve essere sempre rispettato al 100%: massima aderenza possibile.

</rules>

<procedure>

## Procedura
1. Per ogni ricetta indicata, risolvi il percorso e leggi il contenuto attuale con read_file anche se sembra già noto.
2. Confronta il file con write.instructions.md e con il template canonico.
3. Se non conforme, riscrivi la ricetta e sostituisci il file esistente allo stesso percorso e nome.
4. Verifica la modifica rileggendo il file con read_file.
5. Passa alla ricetta successiva se ne è stata fornita più di una.
6. Se la ricetta è già conforme, passa alla successiva senza modificarla.
7. Applica tutte le <rules>.
</procedure>

<output>

## Output
- Non elencare i problemi riscontrati.
- Per ogni ricetta fornita, indica solo se è stata modificata oppure no.

</output>

</prompt>

${input:Quali ricette vuoi controllare?}
