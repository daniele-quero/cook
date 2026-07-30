import fs from "node:fs";
import path from "node:path";

const recipesDirectory = path.join(import.meta.dirname, "..", "recipes");

const recipes = {
  "agretti-sous-vide": ["Agretti", ["Agretti"]],
  "bietole-vasocottura": ["Bietole", ["Bietole"]],
  "cacio-e-pepe-sous-vide": ["Pecorino romano DOP", ["Pecorino romano DOP (grattugiato fine)", "Pecorino romano DOP"]],
  "calamaro-sous-vide-pasta": ["Calamaro", ["Calamaro"]],
  "cardoncelli-sous-vide": ["Cardoncelli", ["Cardoncelli"]],
  "carote-sous-vide": ["Carote", ["Carote"]],
  "champignon-sous-vide": ["Champignon", ["Champignon"]],
  "chips-croccanti-no-maillard": ["Verdure", ["Verdure (patata, patata dolce, carota, sedano rapa, zucca, rapa rossa, fagiolini)"]],
  "cold-brew-coffee": ["Caffè", ["Caffè (macinatura grossolana)"]],
  "congee-cereali-reishunger": ["Riso ribe", ["Riso ribe"]],
  "crema-carbonara-sous-vide": ["Tuorlo d'uovo", ["**Tuorlo d'uovo**"]],
  "fiorentina-sousvide-scaloppatura": ["Bistecca alla fiorentina", ["Bistecca alla fiorentina"]],
  "friggitelli-friarelli-blistering": ["Friggitelli", ["Friggitelli"]],
  "fusi-pollo-friggitrice-aria": ["Fusi di pollo", ["Fusi di pollo"]],
  "maionese-frullatore-immersione": ["Uovo", ["Uovo (g, senza guscio)"]],
  "melanzane-funghetto-friggitrice-aria": ["Melanzane", ["Melanzane lunghe o violette"]],
  "patate-puree-sous-vide": ["Patate", ["Patate"]],
  "peperoni-listarelle-blistering": ["Peperoni", ["Peperoni rossi e gialli"]],
  "pesto-rucola-frutta-secca": ["Rucola", ["Rucola fresca"]],
  "pollo-ruspante-sous-vide": ["Pollo ruspante", ["Pollo ruspante"]],
  "polpo-sous-vide": ["Polpo", ["Polpo (pulito)"]],
  "salmone-sous-vide": ["Salmone", ["Filetto di salmone"]],
  "salse-cotolette-reflusso": ["Cotolette", ["Cotolette"]],
  "tisana-reflusso": ["Radice di altea", ["Radice di altea (Althaea officinalis), secca"]],
  "tofu-legumi-fatto-in-casa-guida-pratica": ["Tofu", ["Tofu"]],
  "uovo-sous-vide": ["Uovo", ["Uovo"]],
  "zucca-sous-vide-crema-pasta": ["Zucca", ["Zucca"]],
};

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const [slug, [mainIngredient, tableLabels]] of Object.entries(recipes)) {
  const filePath = path.join(recipesDirectory, `${slug}.md`);
  let content = fs.readFileSync(filePath, "utf8");

  if (!/^main_ingredient:/m.test(content)) {
    content = content.replace(/^(title:.*)$/m, `$1\nmain_ingredient: "${mainIngredient}"`);
  }

  for (const tableLabel of tableLabels) {
    const label = escapePattern(tableLabel);
    content = content.replace(new RegExp(`<main>${label}</main>`, "g"), tableLabel);
  }

  const ingredientsStart = content.search(/^###\s+Ingredienti.*$/m);
  if (ingredientsStart !== -1) {
    const beforeIngredients = content.slice(0, ingredientsStart);
    const ingredientsAndAfter = content.slice(ingredientsStart);
    const nextSection = ingredientsAndAfter.search(/^##\s+/m);
    const ingredients = nextSection === -1 ? ingredientsAndAfter : ingredientsAndAfter.slice(0, nextSection);
    const afterIngredients = nextSection === -1 ? "" : ingredientsAndAfter.slice(nextSection);
    const markedIngredients = tableLabels.reduce((section, tableLabel) => {
      const label = escapePattern(tableLabel);
      const marker = new RegExp(`^(\\|\\s*)(${label})(\\s*\\|)`, "gm");
      return section.replace(marker, `$1<main>$2</main>$3`);
    }, ingredients);

    content = `${beforeIngredients}${markedIngredients}${afterIngredients}`;
  }

  fs.writeFileSync(filePath, content, "utf8");
}