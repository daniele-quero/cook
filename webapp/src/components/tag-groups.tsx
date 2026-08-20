import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Beef,
  CakeSlice,
  Carrot,
  ChefHat,
  Cherry,
  Coffee,
  createLucideIcon,
  Droplets,
  Egg,
  Feather,
  Fish,
  Flame,
  Leaf,
  Milk,
  Salad,
  Sandwich,
  Sparkles,
  Soup,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import { Tooltip } from "@/components/tooltip";

export type TaggableItem = {
  slug: string;
  tags: string[];
};

export type TagBucket<T extends TaggableItem> = {
  tag: string;
  count: number;
  items: T[];
  meta: TagMeta;
};

export type TagMeta = {
  icon: LucideIcon;
  surface: string;
  foreground: string;
  border: string;
  iconSurface: string;
  iconColor: string;
};

// Ogni voce copre sia il colore sia l'icona assegnata ai tag che non incontrano
// un pattern dedicato: prima di questa modifica tutti i tag "non riconosciuti"
// condividevano la stessa icona Sparkles, rendendo la griglia meno leggibile.
const tagPalette: TagMeta[] = [
  {
    icon: UtensilsCrossed,
    surface: "#fbe7d4",
    foreground: "#563522",
    border: "#efc099",
    iconSurface: "rgba(255, 255, 255, 0.88)",
    iconColor: "#8f3c1d",
  },
  {
    icon: Leaf,
    surface: "#eaf6eb",
    foreground: "#244b3b",
    border: "#b4d6c2",
    iconSurface: "rgba(255, 255, 255, 0.88)",
    iconColor: "#2b7554",
  },
  {
    icon: Droplets,
    surface: "#eaf1ff",
    foreground: "#1d4d73",
    border: "#bfd9f8",
    iconSurface: "rgba(255, 255, 255, 0.88)",
    iconColor: "#2369a5",
  },
  {
    icon: Flame,
    surface: "#f9e6e2",
    foreground: "#5d2d2c",
    border: "#e2b0aa",
    iconSurface: "rgba(255, 255, 255, 0.88)",
    iconColor: "#9a433f",
  },
  {
    icon: Wheat,
    surface: "#fff0d7",
    foreground: "#6d4a1f",
    border: "#ebd69c",
    iconSurface: "rgba(255, 255, 255, 0.9)",
    iconColor: "#9c6a26",
  },
  {
    icon: ChefHat,
    surface: "#f0ebff",
    foreground: "#45345e",
    border: "#d7c9f2",
    iconSurface: "rgba(255, 255, 255, 0.88)",
    iconColor: "#5c3d86",
  },
  {
    icon: CakeSlice,
    surface: "#ffe8da",
    foreground: "#7b3b1d",
    border: "#f3b892",
    iconSurface: "rgba(255, 255, 255, 0.9)",
    iconColor: "#b85b2b",
  },
  {
    icon: Soup,
    surface: "#edf7f8",
    foreground: "#234d60",
    border: "#badfe0",
    iconSurface: "rgba(255, 255, 255, 0.9)",
    iconColor: "#286d7a",
  },
  {
    icon: Carrot,
    surface: "#fff1ea",
    foreground: "#6e382a",
    border: "#f2c9b2",
    iconSurface: "rgba(255, 255, 255, 0.9)",
    iconColor: "#b86347",
  },
  {
    icon: Sparkles,
    surface: "#fef5dc",
    foreground: "#665327",
    border: "#e4cf86",
    iconSurface: "rgba(255, 255, 255, 0.9)",
    iconColor: "#997525",
  },
];

export const PotatoIcon = createLucideIcon("Potato", [
  ["path", { d: "M9.5 3.5c-2.3 1.2-3.9 3.2-4.4 5.6-.8 3.8.9 7.4 4.6 9.7 2.4 1.5 5.5 1.8 8.1.7 2.9-1.2 4.7-4 4.7-7.1 0-3.6-2.7-6.1-6.1-6.6-1.5-.2-3.2-.1-4.9.7Z" }],
  ["path", { d: "M9.5 8.8c1.4-.8 2.7-1.1 4.1-1.1" }],
  ["path", { d: "M8.8 12.4c1.5.8 3.1 1.1 4.9 1" }],
  ["path", { d: "M9.3 16.4c1.6.8 3.3 1 5 .6" }],
]);

export const ArtichokeIcon = createLucideIcon("Artichoke", [
  ["path", { d: "M12 3.5c-2.6 0-4.8 2.2-4.8 5.2 0 3.1 1.9 5 4.8 7.7 2.9-2.7 4.8-4.6 4.8-7.7 0-3-2.2-5.2-4.8-5.2Z" }],
  ["path", { d: "M12 4.4v7.9" }],
  ["path", { d: "M8.3 8.3c1.4-.9 2.7-1.3 3.7-1.3" }],
  ["path", { d: "M15.7 8.3c-1.4-.9-2.7-1.3-3.7-1.3" }],
  ["path", { d: "M8.8 13.5c1.1 1.8 2 3.2 3.2 5.2" }],
  ["path", { d: "M15.2 13.5c-1.1 1.8-2 3.2-3.2 5.2" }],
  ["path", { d: "M12 18.4v2.1" }],
]);

export const CerealIcon = createLucideIcon("Cereal", [
  ["path", { d: "M6.2 14.8c1.6-3.9 4.7-6.3 9.1-7.1 3.2-.6 6.1.3 8.2 2.4-2.7 2.1-5.9 3.4-9.8 4.5-2.5.7-5.1.8-7.5.2Z" }],
  ["path", { d: "M8.7 9.4c1.5 1.4 2.7 2.2 4.3 3.2" }],
  ["path", { d: "M8.8 13.1c1.7 1 3.4 1.6 5.2 2" }],
  ["path", { d: "M13.8 8c.6 1.7 1.3 3.1 2.5 4.7" }],
]);

export const LegumeIcon = createLucideIcon("Legume", [
  ["path", { d: "M12 5.2c-3.9 0-7 3.1-7 7.1 0 2.9 1.7 5.3 4.4 6.5 3.3 1.5 7.1.9 9.5-1.9 1.9-2.4 2.2-5.7 1-8.1-1.2-2.5-3.7-3.6-7.9-3.6Z" }],
  ["path", { d: "M10.7 9.2c1.6-.7 2.8-1 4.2-.9" }],
  ["path", { d: "M10.1 12.2c1.8.9 3.2 1.2 5.2 1" }],
  ["path", { d: "M12.2 15.2c1.4.8 2.7 1 4.3.8" }],
]);

export const MushroomIcon = createLucideIcon("Mushroom", [
  ["path", { d: "M12 4.8c-4.3 0-7.2 3.2-7.2 7.1 0 3.5 2.9 6.4 7.2 6.4 4.3 0 7.2-2.9 7.2-6.4 0-3.9-2.9-7.1-7.2-7.1Z" }],
  ["path", { d: "M9 13.8c1.1 1.6 2.1 2.4 3 2.9 1-.5 2-1.3 3-2.9" }],
  ["path", { d: "M12 10.5v6.4" }],
  ["path", { d: "M9.7 10.9h4.6" }],
]);

export const PressureCookerIcon = createLucideIcon("PressureCooker", [
  ["path", { d: "M9 5.5h6l1.4 3.2c1 .5 1.6 1.6 1.6 2.8v4.3c0 2.5-2.1 4.5-4.7 4.5H9.7c-2.6 0-4.7-2-4.7-4.5V11.5c0-1.2.6-2.3 1.6-2.8L9 5.5Z" }],
  ["path", { d: "M9.5 9.8h5" }],
  ["path", { d: "M10.2 17.1c1.1-1.1 2.1-1.8 3.5-1.8" }],
  ["path", { d: "M12 3.7v2" }],
  ["path", { d: "M8.6 3.7v2" }],
  ["path", { d: "M15.4 3.7v2" }],
]);

const tagPatterns: Array<{ matches: RegExp; meta: TagMeta }> = [
  {
    matches: /(patate|patata|patatine|patatina|potato|potatoes|patate al forno|patate arrosto|pommes de terre)/i,
    meta: {
      icon: PotatoIcon,
      surface: "#f7efd9",
      foreground: "#684620",
      border: "#e2ca90",
      iconSurface: "rgba(255, 255, 255, 0.82)",
      iconColor: "#9a6b2f",
    },
  },
  {
    matches: /(carciofi|carciofo|carciofini|carciofino|artichoke|artichokes|artichoke hearts|cardo|cardi|cynara)/i,
    meta: {
      icon: ArtichokeIcon,
      surface: "#edf8e9",
      foreground: "#254b2d",
      border: "#bfd9b4",
      iconSurface: "rgba(255, 255, 255, 0.82)",
      iconColor: "#3f7e48",
    },
  },
  {
    matches: /(cereali|cereale|farro|grano|avena|orzo|segale|quinoa|mais|cereal|cereals|grain|grains)/i,
    meta: {
      icon: CerealIcon,
      surface: "#fbe7d4",
      foreground: "#5e2c17",
      border: "#f4c89c",
      iconSurface: "rgba(255, 255, 255, 0.76)",
      iconColor: "#8f3d1d",
    },
  },
  {
    matches: /(legumi|legume|lenticchie|ceci|fagioli|fava|piselli|beans|bean|lentils|chickpeas|peas)/i,
    meta: {
      icon: LegumeIcon,
      surface: "#e7f4e7",
      foreground: "#234d3c",
      border: "#b7d9c1",
      iconSurface: "rgba(255, 255, 255, 0.78)",
      iconColor: "#2e6f4f",
    },
  },
  {
    matches: /(funghi|fungo|champignon|porcini|cardoncelli|mushroom|mushrooms)/i,
    meta: {
      icon: MushroomIcon,
      surface: "#efe6de",
      foreground: "#4a3b2c",
      border: "#d9c7b0",
      iconSurface: "rgba(255, 255, 255, 0.82)",
      iconColor: "#6e5334",
    },
  },
  {
    matches: /(pentola a pressione|pentola-pressione|pressure cooker|press cooker|cocotte minute|cocotte)/i,
    meta: {
      icon: PressureCookerIcon,
      surface: "#f4efe8",
      foreground: "#4e3b2f",
      border: "#d7c1b0",
      iconSurface: "rgba(255, 255, 255, 0.84)",
      iconColor: "#75543d",
    },
  },
  {
    matches: /(risotto|primo|primi|pasta|riso|gnocchi|lasagne|cuscus|orecchiette|tagliatelle|tortellini)/i,
    meta: {
      icon: UtensilsCrossed,
      surface: "#fbe7d4",
      foreground: "#5e2c17",
      border: "#f4c89c",
      iconSurface: "rgba(255, 255, 255, 0.76)",
      iconColor: "#8f3d1d",
    },
  },
  {
    matches: /(verdure|verdura|vegetariano|zucchine|cavolo|orti|ortaggi|contorni)/i,
    meta: {
      icon: Leaf,
      surface: "#e7f4e7",
      foreground: "#234d3c",
      border: "#b7d9c1",
      iconSurface: "rgba(255, 255, 255, 0.78)",
      iconColor: "#2e6f4f",
    },
  },
  {
    matches: /(insalata|insalate|verdure fresche|greens)/i,
    meta: {
      icon: Salad,
      surface: "#eef9f3",
      foreground: "#2d4d3d",
      border: "#c6e3d1",
      iconSurface: "rgba(255, 255, 255, 0.8)",
      iconColor: "#2c6f52",
    },
  },
  {
    matches: /(antipasti|stuzzichini|snack|finger food|sandwich)/i,
    meta: {
      icon: Sandwich,
      surface: "#fff2e9",
      foreground: "#6b3b1d",
      border: "#f3c4a2",
      iconSurface: "rgba(255, 255, 255, 0.8)",
      iconColor: "#b7653a",
    },
  },
  {
    matches: /(frutta|agrumi|mele|pere|mela|frutta fresca)/i,
    meta: {
      icon: Apple,
      surface: "#fff2d8",
      foreground: "#6c4a1f",
      border: "#efd79c",
      iconSurface: "rgba(255, 255, 255, 0.8)",
      iconColor: "#9b6a1a",
    },
  },
  {
    matches: /(uva|ciliegie|prugne|cocomero|bacca|berries)/i,
    meta: {
      icon: Cherry,
      surface: "#fff0ee",
      foreground: "#58333d",
      border: "#ecc4cd",
      iconSurface: "rgba(255, 255, 255, 0.8)",
      iconColor: "#8e3c4b",
    },
  },
  {
    matches: /(pesce|marino|gamberi|crostacei|sogliola|tonno|granchio|molluschi)/i,
    meta: {
      icon: Fish,
      surface: "#dfeff9",
      foreground: "#1c4563",
      border: "#b7d5eb",
      iconSurface: "rgba(255, 255, 255, 0.76)",
      iconColor: "#185a8a",
    },
  },
  {
    matches: /(carne|manzo|pollo|maiale|agnello|secondo|secondi|braciola|bistecca)/i,
    meta: {
      icon: Beef,
      surface: "#f9e2df",
      foreground: "#5d2d2d",
      border: "#e3b0a8",
      iconSurface: "rgba(255, 255, 255, 0.76)",
      iconColor: "#8a3e36",
    },
  },
  {
    matches: /(dolci|dessert|torte|biscotti|crostate|pasticceria|frutta)/i,
    meta: {
      icon: CakeSlice,
      surface: "#f9f0d7",
      foreground: "#6d4a19",
      border: "#e9d39a",
      iconSurface: "rgba(255, 255, 255, 0.76)",
      iconColor: "#8a5c1d",
    },
  },
  {
    matches: /(salse|salsa|emulsioni|condimenti|crema|olio|burro|mantecatura)/i,
    meta: {
      icon: Droplets,
      surface: "#ebf3ff",
      foreground: "#1a4c78",
      border: "#bfdaf8",
      iconSurface: "rgba(255, 255, 255, 0.76)",
      iconColor: "#1c5a8a",
    },
  },
  {
    matches: /(tecniche|sous-vide|temperatura|procedura|cottura|microonde|forno|griglia)/i,
    meta: {
      icon: ChefHat,
      surface: "#f4e8ff",
      foreground: "#4d366a",
      border: "#d9c5f2",
      iconSurface: "rgba(255, 255, 255, 0.8)",
      iconColor: "#5a3a87",
    },
  },
  {
    matches: /(pane|pizza|impasto|farina|grano|lievito|brioche)/i,
    meta: {
      icon: Wheat,
      surface: "#f8f0d4",
      foreground: "#695627",
      border: "#e7cf85",
      iconSurface: "rgba(255, 255, 255, 0.76)",
      iconColor: "#826319",
    },
  },
  {
    matches: /(zuppa|soup|minestre|brodo|stufato)/i,
    meta: {
      icon: Soup,
      surface: "#f1e9d9",
      foreground: "#52412d",
      border: "#d7c1a4",
      iconSurface: "rgba(255, 255, 255, 0.78)",
      iconColor: "#735d46",
    },
  },
  {
    matches: /(calore|fuoco|grill|arrosto|bruschette)/i,
    meta: {
      icon: Flame,
      surface: "#ffe6d9",
      foreground: "#7a2d00",
      border: "#f7b18d",
      iconSurface: "rgba(255, 255, 255, 0.8)",
      iconColor: "#b6511a",
    },
  },
  {
    matches: /(carote|cipolle|agrumi|frutta|insalate|antipasti)/i,
    meta: {
      icon: Carrot,
      surface: "#fff2df",
      foreground: "#75431d",
      border: "#f3cf9d",
      iconSurface: "rgba(255, 255, 255, 0.8)",
      iconColor: "#9a5c27",
    },
  },
  {
    matches: /(uova|uovo|egg|frittata)/i,
    meta: {
      icon: Egg,
      surface: "#fff8e6",
      foreground: "#6e4d16",
      border: "#f2dfa8",
      iconSurface: "rgba(255, 255, 255, 0.82)",
      iconColor: "#a97a1a",
    },
  },
  {
    matches: /(latticini|latte|formaggio|panna|yogurt|burrata|mozzarella|ricotta)/i,
    meta: {
      icon: Milk,
      surface: "#f5f7fb",
      foreground: "#33465e",
      border: "#c9d6e8",
      iconSurface: "rgba(255, 255, 255, 0.86)",
      iconColor: "#3f6d9e",
    },
  },
  {
    matches: /(bevanda|bevande|caffè|caffe|tisana|infuso|cold brew|drink)/i,
    meta: {
      icon: Coffee,
      surface: "#f3e7dd",
      foreground: "#4a2f1f",
      border: "#dcc0a8",
      iconSurface: "rgba(255, 255, 255, 0.82)",
      iconColor: "#6b4226",
    },
  },
  {
    matches: /(^light$|leggero|leggere|dietetico|dietetica)/i,
    meta: {
      icon: Feather,
      surface: "#eef7f4",
      foreground: "#2c554a",
      border: "#bfe0d4",
      iconSurface: "rgba(255, 255, 255, 0.82)",
      iconColor: "#2f7c67",
    },
  },
];

function getTagMeta(tag: string): TagMeta {
  const normalizedTag = tag.trim();
  const matchedPattern = tagPatterns.find(({ matches }) => matches.test(normalizedTag));

  if (matchedPattern) {
    return matchedPattern.meta;
  }

  const hash = [...normalizedTag].reduce((total, character) => total + character.charCodeAt(0), 0);

  return tagPalette[hash % tagPalette.length];
}

export function buildTagBuckets<T extends TaggableItem>(items: T[], selectedTag: string | null): TagBucket<T>[] {
  const buckets = new Map<string, Map<string, T>>();

  for (const item of items) {
    const normalizedTags = [...new Set(item.tags.map((tag) => tag.trim()).filter(Boolean))];

    if (selectedTag) {
      const selectedNormalized = selectedTag.trim();
      const hasSelectedTag = normalizedTags.some((tag) => tag.localeCompare(selectedNormalized, "it", { sensitivity: "base" }) === 0);

      if (!hasSelectedTag) {
        continue;
      }

      const existingBucket = buckets.get(selectedNormalized) ?? new Map<string, T>();
      existingBucket.set(item.slug, item);
      buckets.set(selectedNormalized, existingBucket);
      continue;
    }

    const tags = normalizedTags.length ? normalizedTags : ["Altro"];

    for (const tag of tags) {
      const normalizedTag = tag.trim() || "Altro";
      const existingBucket = buckets.get(normalizedTag) ?? new Map<string, T>();
      existingBucket.set(item.slug, item);
      buckets.set(normalizedTag, existingBucket);
    }
  }

  return [...buckets.entries()]
    .sort(([first], [second]) => first.localeCompare(second, "it"))
    .map(([tag, uniqueItems]) => {
      const orderedItems = [...uniqueItems.values()].sort((first, second) => first.slug.localeCompare(second.slug, "it"));
      return {
        tag,
        count: orderedItems.length,
        items: orderedItems,
        meta: getTagMeta(tag),
      };
    });
}

type TagBucketGridProps<T extends TaggableItem> = {
  buckets: TagBucket<T>[];
  selectedTag: string | null;
  onSelect: (tag: string) => void;
};

export function TagBucketGrid<T extends TaggableItem>({ buckets, selectedTag, onSelect }: TagBucketGridProps<T>) {
  return (
    <div className="tag-bucket-grid" aria-label="Raggruppamenti per tag">
      {buckets.map(({ tag, count, meta }) => {
        const Icon = meta.icon;
        const isSelected = selectedTag === tag;

        return (
          <Tooltip key={tag} content={isSelected ? `Rimuovi il filtro “${tag}”.` : `Mostra solo i contenuti con il tag “${tag}”.`}>
            <button
              type="button"
              className={isSelected ? "tag-bucket-card is-selected" : "tag-bucket-card"}
              style={
                {
                  "--tag-card-bg": meta.surface,
                  "--tag-card-border": meta.border,
                  "--tag-card-fg": meta.foreground,
                  "--tag-card-icon-bg": meta.iconSurface,
                  "--tag-card-icon-fg": meta.iconColor,
                } as CSSProperties
              }
              onClick={() => onSelect(tag)}
              aria-pressed={isSelected}
              aria-label={isSelected ? `Rimuovi filtro per ${tag}` : `Filtra per ${tag}`}
            >
              <span className="tag-bucket-card__icon" aria-hidden="true">
                <Icon size={30} />
              </span>
              <span className="tag-bucket-card__name">{tag}</span>
              <span className="tag-bucket-card__count">{count}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}
