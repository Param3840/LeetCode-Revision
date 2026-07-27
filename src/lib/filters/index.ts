import { SolvedProblem } from "../github";

export interface FilterOptions {
  searchQuery: string;
  difficulty: "All" | "Easy" | "Medium" | "Hard";
  revisionStatus: "All" | "Revised" | "Not Revised";
  topic: string; // "All" or a specific topic like "Array"
  revisedIds: number[];
}

export function filterProblems(
  problems: SolvedProblem[],
  options: FilterOptions
): SolvedProblem[] {
  const query = options.searchQuery.trim().toLowerCase();

  return problems.filter((problem) => {
    // 1. Filter by Topic
    if (options.topic && options.topic !== "All Topics" && options.topic !== "All") {
      if (!problem.topics.includes(options.topic)) {
        return false;
      }
    }

    // 2. Filter by Difficulty
    if (options.difficulty && options.difficulty !== "All") {
      if (problem.difficulty !== options.difficulty) {
        return false;
      }
    }

    // 3. Filter by Revision Status
    if (options.revisionStatus && options.revisionStatus !== "All") {
      const isRevised = options.revisedIds.includes(problem.id);
      if (options.revisionStatus === "Revised" && !isRevised) {
        return false;
      }
      if (options.revisionStatus === "Not Revised" && isRevised) {
        return false;
      }
    }

    // 4. Filter by Search Query (ID, Title, Language, Topics)
    if (query) {
      const matchesId = problem.id.toString().includes(query);
      const matchesTitle = problem.title.toLowerCase().includes(query);
      const matchesTopic = problem.topics.some((t) => t.toLowerCase().includes(query));
      const matchesLanguage = problem.solutions.some((s) =>
        s.language.toLowerCase().includes(query)
      );

      if (!matchesId && !matchesTitle && !matchesTopic && !matchesLanguage) {
        return false;
      }
    }

    return true;
  });
}
