// Pure parsing of LeetCode sync commits. No runtime imports so the same file
// runs in the edge function and under vitest in the app repo.

export interface ParsedSolve {
  title: string;
  slug: string;
  url: string;
  difficulty: "Easy" | "Medium" | "Hard" | null;
  language: string | null;
}

const EXT_LANG: Record<string, string> = {
  py: "Python",
  java: "Java",
  cpp: "C++",
  cc: "C++",
  c: "C",
  cs: "C#",
  js: "JavaScript",
  ts: "TypeScript",
  go: "Go",
  rs: "Rust",
  rb: "Ruby",
  kt: "Kotlin",
  swift: "Swift",
  php: "PHP",
  scala: "Scala",
  sql: "SQL",
};

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function slugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function build(slugOrTitle: { slug?: string; title?: string }, extras?: Partial<ParsedSolve>): ParsedSolve {
  const slug = slugOrTitle.slug ?? slugFromTitle(slugOrTitle.title ?? "");
  const title = slugOrTitle.title ?? titleFromSlug(slug);
  return {
    title,
    slug,
    url: `https://leetcode.com/problems/${slug}/`,
    difficulty: extras?.difficulty ?? null,
    language: extras?.language ?? null,
  };
}

// Try to read a problem out of a commit message. Returns null when the message
// carries no problem, like LeetHub's bare runtime messages, so the caller can
// fall back to file paths.
export function parseFromMessage(message: string): ParsedSolve | null {
  const firstLine = (message ?? "").split("\n")[0].trim();
  if (!firstLine) return null;

  // A leetcode.com problem link anywhere in the message is the strongest signal.
  const urlMatch = message.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
  if (urlMatch) return build({ slug: urlMatch[1].toLowerCase() });

  const cleaned = firstLine.replace(/\s*-\s*Leet(Hub|Code)( v\d+)?\s*$/i, "").trim();

  // Bare runtime stats carry no problem name.
  if (/^time:/i.test(cleaned) || /^runtime[: ]/i.test(cleaned)) return null;
  if (/^attach notes/i.test(cleaned)) return null;
  if (/^(create|update|delete)\s+readme/i.test(cleaned)) return null;

  // Directory style: 0001-two-sum or 1-two-sum.
  const numbered = cleaned.match(/^\[?(\d{1,5})[-.\s]+([a-z0-9]+(?:-[a-z0-9]+)+)\]?$/i);
  if (numbered) return build({ slug: numbered[2].toLowerCase() });

  // Verb prefixes like "Add solution - Two Sum" or "Solved: Two Sum".
  const verb = cleaned.match(
    /^(?:add(?:ed)?(?:\s+solution)?(?:\s+for)?|solved?|solution(?:\s+for)?|finish(?:ed)?)[:\-\s]+(.{3,80})$/i
  );
  if (verb) {
    const title = verb[1].replace(/\s*\(.*\)\s*$/, "").trim();
    if (title) return build({ title });
  }

  // Bracket style: [Two Sum] or [two-sum].
  const bracket = cleaned.match(/^\[([^\]]{3,80})\]/);
  if (bracket) {
    const inner = bracket[1].trim();
    if (/^[a-z0-9-]+$/.test(inner) && inner.includes("-")) return build({ slug: inner });
    return build({ title: inner });
  }

  // A lone slug like "two-sum".
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(cleaned)) return build({ slug: cleaned });

  return null;
}

// Read a problem out of a changed file path. LeetHub lays repos out as
// "two-sum/solution.py", "0001-two-sum/...", or "Easy/two-sum/...".
export function parseFromPath(path: string): ParsedSolve | null {
  const segments = (path ?? "").split("/").filter(Boolean);
  if (segments.length === 0) return null;

  let difficulty: ParsedSolve["difficulty"] = null;
  let slug: string | null = null;

  for (const seg of segments.slice(0, -1)) {
    const low = seg.toLowerCase();
    if (low === "easy" || low === "medium" || low === "hard") {
      difficulty = (low[0].toUpperCase() + low.slice(1)) as ParsedSolve["difficulty"];
      continue;
    }
    const m = low.match(/^(?:\d{1,5}[-.])?([a-z0-9]+(?:-[a-z0-9]+)+)$/);
    if (m) slug = m[1];
  }
  if (!slug) {
    // Single file repos: "two-sum.py" at the root.
    const file = segments[segments.length - 1];
    const base = file.replace(/\.[a-z0-9]+$/i, "").toLowerCase();
    const m = base.match(/^(?:\d{1,5}[-.])?([a-z0-9]+(?:-[a-z0-9]+)+)$/);
    if (m) slug = m[1];
  }
  if (!slug) return null;

  const ext = segments[segments.length - 1].split(".").pop()?.toLowerCase() ?? "";
  const language = EXT_LANG[ext] ?? null;
  return build({ slug }, { difficulty, language });
}
