import { getLanguageFromExtension, getProblemMetadata } from "../problems";

export interface SolutionFile {
  path: string;
  filename: string;
  extension: string;
  language: string;
}

export interface SolvedProblem {
  id: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  solutions: SolutionFile[];
}

export interface RepositoryDetails {
  owner: string;
  repo: string;
  defaultBranch: string;
  problems: SolvedProblem[];
}

// Custom error classes for clear user feedback
export class GitHubError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "GitHubError";
  }
}

// 1. Parse repository URL
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  try {
    const cleanUrl = url.trim().replace(/\.git$/, "");
    const parsed = new URL(cleanUrl);
    
    if (parsed.hostname !== "github.com") {
      throw new Error();
    }
    
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      throw new Error();
    }
    
    return { owner: parts[0], repo: parts[1] };
  } catch {
    throw new GitHubError("Invalid GitHub repository URL. Must be in the format: https://github.com/owner/repo", "INVALID_URL");
  }
}

// Supported file extensions for LeetCode solutions
const SUPPORTED_EXTENSIONS = new Set([
  ".java", ".cpp", ".cc", ".py", ".js", ".ts", ".go", ".cs", ".kt", ".rs"
]);

// 2. Analyze repository and return solved problems list
export async function analyzeRepository(url: string): Promise<RepositoryDetails> {
  const { owner, repo } = parseGitHubUrl(url);

  // Fetch repository details to get default branch and verify public status
  let repoData;
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    
    if (res.status === 404) {
      throw new GitHubError("Repository not found. Please ensure it is public and spelling is correct.", "REPO_NOT_FOUND");
    }
    
    if (res.status === 403) {
      const remaining = res.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        throw new GitHubError("GitHub API rate limit exceeded. Please try again later.", "RATE_LIMIT");
      }
    }

    if (!res.ok) {
      throw new Error();
    }

    repoData = await res.json();
  } catch (err) {
    if (err instanceof GitHubError) throw err;
    throw new GitHubError("Failed to fetch repository details. Check your network or GitHub status.", "API_FAILURE");
  }

  if (repoData.private) {
    throw new GitHubError("The repository is private. CodeRevise only supports public repositories in V1.", "PRIVATE_REPO");
  }

  const defaultBranch = repoData.default_branch || "main";

  // Fetch recursive tree
  let treeData;
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`);
    
    if (res.status === 403) {
      const remaining = res.headers.get("x-ratelimit-remaining");
      if (remaining === "0") {
        throw new GitHubError("GitHub API rate limit exceeded. Please try again later.", "RATE_LIMIT");
      }
    }

    if (!res.ok) {
      throw new Error();
    }

    treeData = await res.json();
  } catch (err) {
    if (err instanceof GitHubError) throw err;
    throw new GitHubError("Failed to read repository file structure from GitHub.", "TREE_FAILURE");
  }

  if (!treeData.tree || !Array.isArray(treeData.tree)) {
    throw new GitHubError("Empty repository or invalid repository structure.", "EMPTY_REPO");
  }

  // Parse files and group by problem ID
  const problemsMap: Record<number, SolvedProblem> = {};

  // Regex patterns
  // 1. Matches directories like 0001-two-sum
  const dirPattern = /^(\d+)-([a-zA-Z0-9-]+)$/;
  // 2. Matches files like 0001-two-sum.py
  const filePattern = /^(\d+)-([a-zA-Z0-9-]+)\.([a-zA-Z0-9]+)$/;

  for (const item of treeData.tree) {
    if (item.type !== "blob") continue; // We only care about files

    const path = item.path as string;
    const parts = path.split("/");
    const filename = parts[parts.length - 1];
    const extensionIndex = filename.lastIndexOf(".");
    
    if (extensionIndex === -1) continue;
    
    const ext = filename.substring(extensionIndex);
    if (!SUPPORTED_EXTENSIONS.has(ext.toLowerCase())) continue;

    let id: number | null = null;
    let slug: string | null = null;

    // Check if any of the parent directories match the LeetCode folder pattern
    // e.g. "0001-two-sum/0001-two-sum.java" or "LeetCode/0322-coin-change/Solution.py"
    for (let i = 0; i < parts.length - 1; i++) {
      const dirMatch = parts[i].match(dirPattern);
      if (dirMatch) {
        id = parseInt(dirMatch[1], 10);
        slug = dirMatch[2];
        break;
      }
    }

    // If no parent directory matched, check if the file itself matches the pattern
    // e.g. "0001-two-sum.py" or "LeetCode/0070-climbing-stairs.js"
    if (id === null || slug === null) {
      const fileMatch = filename.match(filePattern);
      if (fileMatch) {
        id = parseInt(fileMatch[1], 10);
        slug = fileMatch[2];
      }
    }

    // If we successfully identified a LeetCode problem, group it
    if (id !== null && slug !== null) {
      const solutionFile: SolutionFile = {
        path,
        filename,
        extension: ext,
        language: getLanguageFromExtension(ext)
      };

      if (problemsMap[id]) {
        // Avoid duplicate solution paths
        if (!problemsMap[id].solutions.some(s => s.path === path)) {
          problemsMap[id].solutions.push(solutionFile);
        }
      } else {
        const metadata = getProblemMetadata(id, slug);
        problemsMap[id] = {
          id,
          title: metadata.title,
          slug: metadata.slug,
          difficulty: metadata.difficulty,
          topics: metadata.topics,
          solutions: [solutionFile]
        };
      }
    }
  }

  const problems = Object.values(problemsMap).sort((a, b) => a.id - b.id);

  if (problems.length === 0) {
    throw new GitHubError("No recognizable LeetCode problems found in the repository. Please name folders or files in LeetCode-style (e.g. 0001-two-sum).", "NO_PROBLEMS_FOUND");
  }

  return {
    owner,
    repo,
    defaultBranch,
    problems
  };
}

// 3. Fetch solution code content (raw with API base64 fallback)
export async function fetchSolutionCode(
  owner: string,
  repo: string,
  branch: string,
  path: string
): Promise<string> {
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  
  try {
    const rawRes = await fetch(rawUrl);
    if (rawRes.ok) {
      return await rawRes.text();
    }
  } catch {
    // Ignore raw error and try API fallback
  }

  // Fallback to GitHub Contents API
  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    const apiRes = await fetch(apiUrl);
    
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.content && data.encoding === "base64") {
        // Decode base64 content
        // In browser/node environment, handling unicode chars in base64:
        return decodeURIComponent(
          atob(data.content.replace(/\s/g, ""))
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
      }
    }
  } catch {
    // Fallback to generic error
  }

  throw new Error("Failed to load solution source code from GitHub.");
}

// 4. Fetch README.md content from repository folder
export async function fetchReadmeContent(
  owner: string,
  repo: string,
  branch: string,
  solutionPath: string
): Promise<string> {
  const lastSlash = solutionPath.lastIndexOf('/');
  if (lastSlash === -1) {
    throw new Error("No parent directory for README.md");
  }
  const dirPath = solutionPath.substring(0, lastSlash);
  const readmePath = `${dirPath}/README.md`;
  
  // Try raw GitHub URL first
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${readmePath}`;
  try {
    const rawRes = await fetch(rawUrl);
    if (rawRes.ok) {
      return await rawRes.text();
    }
  } catch {
    // fallback
  }

  // Fallback to Contents API
  try {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${readmePath}?ref=${branch}`;
    const apiRes = await fetch(apiUrl);
    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.content && data.encoding === "base64") {
        return decodeURIComponent(
          atob(data.content.replace(/\s/g, ""))
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
      }
    }
  } catch {
    // fallback
  }

  throw new Error("Failed to load README.md");
}
