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
  Sprout,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";

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

const tagPatterns: Array<{ matches: RegExp; meta: TagMeta }> = [
  {
    matches: /(risotto|primo|primi|pasta|riso|gnocchi|lasagne|cuscus|orecchiette|tagliatelle|tortellini|cereali|cereale)/i,
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
    matches: /(verdure|verdura|vegetariano|zucchine|cavolo|legumi|orti|ortaggi|contorni)/i,
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
    matches: /(funghi|fungo|champignon|porcini|cardoncelli)/i,
    meta: {
      icon: Sprout,
      surface: "#efe6de",
      foreground: "#4a3b2c",
      border: "#d9c7b0",
      iconSurface: "rgba(255, 255, 255, 0.82)",
      iconColor: "#6e5334",
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
          <button
            key={tag}
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
            <span className="tag-bucket-card__count">
              {count} {count === 1 ? "elemento" : "elementi"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
