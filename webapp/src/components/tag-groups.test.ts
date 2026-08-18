import { Beef, Egg, Leaf, Milk, Coffee, Sparkles } from "lucide-react";
import { describe, expect, it } from "vitest";
import { buildTagBuckets } from "@/components/tag-groups";

describe("buildTagBuckets", () => {
  it("deduplicates items within each tag bucket and keeps counts accurate", () => {
    const items = [
      { slug: "risotto-ai-funghi", tags: ["Primi", "Vegetariano", "Primi"] },
      { slug: "pasta-al-limone", tags: ["Primi", "Vegetariano"] },
      { slug: "pollo-al-forno", tags: ["Secondi", "Carne"] },
      { slug: "frittata-di-zucca", tags: ["Secondi", "Vegetariano"] },
      { slug: "insalata", tags: [] },
    ];

    const buckets = buildTagBuckets(items, null);
    const primiBucket = buckets.find((bucket) => bucket.tag === "Primi");
    const vegetaleBucket = buckets.find((bucket) => bucket.tag === "Vegetariano");
    const altroBucket = buckets.find((bucket) => bucket.tag === "Altro");

    expect(primiBucket?.count).toBe(2);
    expect(primiBucket?.items.map((item) => item.slug)).toEqual(["pasta-al-limone", "risotto-ai-funghi"]);
    expect(vegetaleBucket?.count).toBe(3);
    expect(altroBucket?.count).toBe(1);
    expect(new Set(primiBucket?.items.map((item) => item.slug) ?? []).size).toBe(primiBucket?.items.length ?? 0);
  });

  it("supports a single selected tag while preserving the same filter semantics", () => {
    const items = [
      { slug: "risotto-ai-funghi", tags: ["Primi", "Vegetariano"] },
      { slug: "pollo-al-forno", tags: ["Secondi", "Carne"] },
      { slug: "frittata-di-zucca", tags: ["Secondi", "Vegetariano"] },
    ];

    const buckets = buildTagBuckets(items, "Primi");

    expect(buckets).toHaveLength(1);
    expect(buckets[0].tag).toBe("Primi");
    expect(buckets[0].count).toBe(1);
    expect(buckets[0].items[0].slug).toBe("risotto-ai-funghi");
  });

  it("assigns a dedicated icon to the real singular tag vocabulary used by recipes and guides", () => {
    const items = [
      { slug: "cottura-acciaio", tags: ["carne", "pesce", "uova", "secondo"] },
      { slug: "pizza-pane-raffermo", tags: ["cereali", "latticini", "uova", "impasto"] },
      { slug: "cold-brew-coffee", tags: ["bevanda"] },
      { slug: "risotto-mantecatura", tags: ["cereali", "primo", "funghi", "verdura"] },
    ];

    const buckets = buildTagBuckets(items, null);
    const findIcon = (tag: string) => buckets.find((bucket) => bucket.tag === tag)?.meta.icon;

    // Prima di questa modifica "verdura"/"primo"/"secondo" (forme singolari usate
    // realmente nel frontmatter) non incontravano nessun pattern (che copriva solo
    // le forme plurali "verdure"/"primi"/"secondi") e ricadevano tutte sulla stessa
    // icona di default: qui verifichiamo che ora ottengano un'icona dedicata e
    // distinta tra loro.
    expect(findIcon("uova")).toBe(Egg);
    expect(findIcon("latticini")).toBe(Milk);
    expect(findIcon("bevanda")).toBe(Coffee);
    expect(findIcon("verdura")).toBe(Leaf);
    expect(findIcon("carne")).toBe(Beef);

    const distinctIcons = new Set([
      findIcon("uova"),
      findIcon("latticini"),
      findIcon("bevanda"),
      findIcon("verdura"),
      findIcon("carne"),
    ]);
    expect(distinctIcons.size).toBe(5);
  });

  it("varies the icon (not just the color) for tags without a dedicated pattern", () => {
    const items = [
      { slug: "a", tags: ["tagsenzasenso-uno"] },
      { slug: "b", tags: ["tagsenzasenso-due"] },
      { slug: "c", tags: ["tagsenzasenso-tre"] },
      { slug: "d", tags: ["tagsenzasenso-quattro"] },
    ];

    const buckets = buildTagBuckets(items, null);
    const icons = buckets.map((bucket) => bucket.meta.icon);

    expect(new Set(icons).size).toBeGreaterThan(1);
    expect(icons.every((icon) => icon === Sparkles)).toBe(false);
  });
});
