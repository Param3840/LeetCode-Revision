import { PROBLEMS_DB, EXTENDED_PROBLEMS_LOOKUP, LeetCodeProblem } from "./database";

// Helper to convert slug to title case (e.g. "two-sum" -> "Two Sum")
export function deriveTitleFromSlug(slug: string): string {
  if (!slug) return "Unknown Problem";
  return slug
    .split("-")
    .map((word) => {
      if (word.toLowerCase() === "ii") return "II";
      if (word.toLowerCase() === "iii") return "III";
      if (word.toLowerCase() === "iv") return "IV";
      if (word.toLowerCase() === "v") return "V";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

// Map extensions to programming languages
export function getLanguageFromExtension(ext: string): string {
  const mapping: Record<string, string> = {
    ".java": "Java",
    ".cpp": "C++",
    ".cc": "C++",
    ".py": "Python",
    ".js": "JavaScript",
    ".ts": "TypeScript",
    ".go": "Go",
    ".cs": "C#",
    ".kt": "Kotlin",
    ".rs": "Rust"
  };
  return mapping[ext.toLowerCase()] || "Unknown";
}

// Retrieve problem metadata with safe fallback
export function getProblemMetadata(id: number, slug: string): LeetCodeProblem {
  // 1. Try fully defined database (Blind 75 / popular)
  if (PROBLEMS_DB[id]) {
    return PROBLEMS_DB[id];
  }

  // 2. Try lightweight lookup database
  if (EXTENDED_PROBLEMS_LOOKUP[id]) {
    const lookup = EXTENDED_PROBLEMS_LOOKUP[id];
    return {
      id,
      title: deriveTitleFromSlug(slug),
      slug,
      difficulty: lookup.difficulty,
      topics: lookup.topics
    };
  }

  // 3. Fallback dynamically
  return {
    id,
    title: deriveTitleFromSlug(slug),
    slug,
    difficulty: "Medium", // Default difficulty
    topics: [] // Default topics
  };
}
