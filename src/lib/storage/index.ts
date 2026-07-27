import { RepositoryDetails } from "../github";

const PREFIX = "coderevise";

// Keys
const currentRepoKey = `${PREFIX}:current_repo`;
const cacheKey = (owner: string, repo: string) => `${PREFIX}:cache:${owner}:${repo}`.toLowerCase();
const revisionKey = (owner: string, repo: string) => `${PREFIX}:revision:${owner}:${repo}`.toLowerCase();

// Safe localStorage checker to prevent server-side rendering crashes
function isStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && window.localStorage !== undefined;
  } catch {
    return false;
  }
}

// 1. Get and Set currently selected repository URL
export function getCurrentRepoUrl(): string | null {
  if (!isStorageAvailable()) return null;
  return localStorage.getItem(currentRepoKey);
}

export function saveCurrentRepoUrl(url: string): void {
  if (!isStorageAvailable()) return;
  localStorage.setItem(currentRepoKey, url.trim());
}

// 2. Get and Set repository parsed data cache (saves API hits)
export function getRepoCache(owner: string, repo: string): RepositoryDetails | null {
  if (!isStorageAvailable()) return null;
  const data = localStorage.getItem(cacheKey(owner, repo));
  if (!data) return null;
  try {
    return JSON.parse(data) as RepositoryDetails;
  } catch {
    return null;
  }
}

export function saveRepoCache(owner: string, repo: string, data: RepositoryDetails): void {
  if (!isStorageAvailable()) return;
  try {
    // Only cache minimal details: do not store full source codes (already followed)
    localStorage.setItem(cacheKey(owner, repo), JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save repo cache:", err);
  }
}

// 3. Get list of revised problem IDs for a repo
export function getRevisedProblems(owner: string, repo: string): number[] {
  if (!isStorageAvailable()) return [];
  const data = localStorage.getItem(revisionKey(owner, repo));
  if (!data) return [];
  try {
    return JSON.parse(data) as number[];
  } catch {
    return [];
  }
}

// 4. Save list of revised problem IDs for a repo
export function saveRevisedProblems(owner: string, repo: string, problemIds: number[]): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.setItem(revisionKey(owner, repo), JSON.stringify(problemIds));
  } catch (err) {
    console.error("Failed to save revision progress:", err);
  }
}

// 5. Mark a single problem as revised or not revised
export function markProblemRevision(
  owner: string,
  repo: string,
  problemId: number,
  isRevised: boolean
): number[] {
  const current = getRevisedProblems(owner, repo);
  let updated: number[];
  
  if (isRevised) {
    if (current.includes(problemId)) {
      updated = current;
    } else {
      updated = [...current, problemId];
    }
  } else {
    updated = current.filter((id) => id !== problemId);
  }
  
  saveRevisedProblems(owner, repo, updated);
  return updated;
}

// 6. Reset revision progress (marks everything as not revised, keeps repo cache intact)
export function resetRevisionProgress(owner: string, repo: string): void {
  if (!isStorageAvailable()) return;
  localStorage.removeItem(revisionKey(owner, repo));
}
