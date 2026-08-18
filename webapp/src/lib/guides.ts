import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { getRecipe } from "@/lib/recipes";

export type GuideSummary = {
  slug: string;
  title: string;
  description?: string;
  thumbnail?: string;
  mainIngredient?: string;
  date?: string;
  tags: string[];
  difficulty?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  excerpt: string;
};

export type Guide = GuideSummary & {
  content: string;
};

export type ContentKind = "recipe" | "guide";

export type ResolvedContent = {
  kind: ContentKind;
  slug: string;
  title: string;
  content: string;
};

const guidesDirectory = path.join(process.cwd(), "guides");

function guideSource(source: string) {
  if (source.startsWith("---")) {
    return source;
  }

  const frontMatterStart = source.indexOf("\n---\n");
  return frontMatterStart === -1 ? source : source.slice(frontMatterStart + 1);
}

function titleFromContent(content: string) {
  return content.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

function excerptFromContent(content: string) {
  return content
    .replace(/^#{1,6}\s+.+$/gm, "")
    .replace(/\*\*|__|`|\[|\]/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 155);
}

export function getGuideContextContent(content: string): string {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return normalized;

  const lines = normalized.split("\n");
  const titleIndex = lines.findIndex((line) => /^#\s+/.test(line.trim()));
  if (titleIndex === -1) return normalized;

  const firstHeadingAfterTitle = lines.findIndex(
    (line, index) => index > titleIndex && /^#{1,6}\s+/.test(line.trim()),
  );
  if (firstHeadingAfterTitle === -1) return normalized;

  let noteStart = titleIndex + 1;
  while (noteStart < lines.length && lines[noteStart].trim() === "") {
    noteStart += 1;
  }

  if (noteStart >= firstHeadingAfterTitle || /^#{1,6}\s+/.test(lines[noteStart].trim())) {
    return normalized;
  }

  let noteEnd = noteStart;
  while (noteEnd < firstHeadingAfterTitle) {
    const currentLine = lines[noteEnd].trim();
    if (currentLine === "" && noteEnd + 1 < firstHeadingAfterTitle && /^#{1,6}\s+/.test(lines[noteEnd + 1].trim())) {
      break;
    }
    if (/^#{1,6}\s+/.test(currentLine)) {
      break;
    }
    noteEnd += 1;
  }

  return [...lines.slice(0, titleIndex + 1), ...lines.slice(noteEnd)].join("\n").trim();
}

function guideFromFile(fileName: string): Guide {
  const source = fs.readFileSync(path.join(guidesDirectory, fileName), "utf8");
  const parsed = matter(guideSource(source));
  const slug = fileName.replace(/\.md$/, "");
  const title =
    typeof parsed.data.title === "string"
      ? parsed.data.title
      : titleFromContent(parsed.content) ?? slug.replaceAll("-", " ");

  return {
    slug,
    title,
    description: typeof parsed.data.description === "string" ? parsed.data.description : undefined,
    thumbnail: typeof parsed.data.thumbnail === "string" ? parsed.data.thumbnail : undefined,
    mainIngredient:
      typeof parsed.data.main_ingredient === "string" ? parsed.data.main_ingredient : undefined,
    date: typeof parsed.data.date === "string" ? parsed.data.date : undefined,
    tags: Array.isArray(parsed.data.tags)
      ? parsed.data.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    difficulty: typeof parsed.data.difficulty === "string" ? parsed.data.difficulty : undefined,
    prepTime: typeof parsed.data.prep_time === "string" ? parsed.data.prep_time : undefined,
    cookTime: typeof parsed.data.cook_time === "string" ? parsed.data.cook_time : undefined,
    totalTime: typeof parsed.data.total_time === "string" ? parsed.data.total_time : undefined,
    excerpt: typeof parsed.data.description === "string" ? parsed.data.description : excerptFromContent(parsed.content),
    content: parsed.content,
  };
}

export function getAllGuides(): GuideSummary[] {
  return fs
    .readdirSync(guidesDirectory)
    .filter((fileName) => fileName.endsWith(".md"))
    .map(guideFromFile)
    .sort((first, second) => first.title.localeCompare(second.title, "it"))
    .map(({ slug, title, description, thumbnail, mainIngredient, date, tags, difficulty, prepTime, cookTime, totalTime, excerpt }) => ({
      slug,
      title,
      description,
      thumbnail,
      mainIngredient,
      date,
      tags,
      difficulty,
      prepTime,
      cookTime,
      totalTime,
      excerpt,
    }));
}

export function getGuide(slug: string): Guide | undefined {
  const fileName = `${slug}.md`;
  if (!fs.existsSync(path.join(guidesDirectory, fileName))) {
    return undefined;
  }

  return guideFromFile(fileName);
}

export function normalizeContentKind(value: unknown): ContentKind {
  return value === "guide" ? "guide" : "recipe";
}

export function resolveContent(slug: string, kind: ContentKind = "recipe"): ResolvedContent | undefined {
  if (kind === "guide") {
    const guide = getGuide(slug);
    if (!guide) return undefined;
    return { kind: "guide", slug: guide.slug, title: guide.title, content: guide.content };
  }

  const recipe = getRecipe(slug);
  if (!recipe) return undefined;
  return { kind: "recipe", slug: recipe.slug, title: recipe.title, content: recipe.content };
}
