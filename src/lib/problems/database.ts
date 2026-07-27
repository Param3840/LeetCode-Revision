export interface QuickRevision {
  description: string;
  example: string;
  coreIdea: string;
  observation: string;
  approaches: string[];
  timeComplexity: string;
  spaceComplexity: string;
}

export interface LeetCodeProblem {
  id: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topics: string[];
  quickRevision?: QuickRevision;
}

export const PROBLEMS_DB: Record<number, LeetCodeProblem> = {
  1: {
    id: 1,
    title: "Two Sum",
    slug: "two-sum",
    difficulty: "Easy",
    topics: ["Array", "Hash Table"],
    quickRevision: {
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\nConstraints:\n• 2 <= nums.length <= 10⁴\n• -10⁹ <= nums[i] <= 10⁹\n• -10⁹ <= target <= 10⁹\n• Only one valid answer exists.",
      example: "Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: Because nums[0] + nums[1] == 9, we return [0, 1].",
      coreIdea: "Use a hash map to store elements we've seen so far and their indices. For each element nums[i], check if (target - nums[i]) exists in the map.",
      observation: "Instead of searching for a pair from scratch, we look back at what we've already processed, turning a O(N^2) search into a O(N) lookup.",
      approaches: [
        "Brute Force: Check every pair. Time: O(N^2), Space: O(1).",
        "Two-Pass Hash Map: Build hash map, then lookup. Time: O(N), Space: O(N).",
        "One-Pass Hash Map (Optimal): Insert and lookup in a single traversal. Time: O(N), Space: O(N)."
      ],
      timeComplexity: "O(N)",
      spaceComplexity: "O(N)"
    }
  },
  3: {
    id: 3,
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    difficulty: "Medium",
    topics: ["Hash Table", "String", "Sliding Window"],
    quickRevision: {
      description: "Find the length of the longest substring without repeating characters.",
      example: "Input: s = \"abcabcbb\" -> Output: 3 (\"abc\")",
      coreIdea: "Maintain a sliding window of unique characters. Use a map to track the last seen index of each character to contract the window instantly.",
      observation: "When we see a duplicate character, we can jump the left pointer of our window directly to one index past the previous occurrence of that character.",
      approaches: [
        "Sliding Window with Set: Shrink window from the left one by one. Time: O(N), Space: O(min(M, N)).",
        "Optimized Map Sliding Window: Jump left pointer directly. Time: O(N), Space: O(min(M, N))."
      ],
      timeComplexity: "O(N)",
      spaceComplexity: "O(min(M, N)) where M is the size of the charset"
    }
  },
  4: {
    id: 4,
    title: "Median of Two Sorted Arrays",
    slug: "median-of-two-sorted-arrays",
    difficulty: "Hard",
    topics: ["Array", "Binary Search", "Divide and Conquer"],
    quickRevision: {
      description: "Find the median of two sorted arrays of sizes m and n in O(log(m+n)) time.",
      example: "Input: nums1 = [1,3], nums2 = [2] -> Output: 2.0",
      coreIdea: "Partition both arrays such that the left half has the same number of elements as the right half, and all elements in the left half are less than or equal to elements in the right half.",
      observation: "We only need to binary search the partition point in the smaller array. The partition point of the larger array is then uniquely determined.",
      approaches: [
        "Merge and Sort: Merge arrays and find median. Time: O(M+N), Space: O(M+N).",
        "Binary Search on Partitions (Optimal): Binary search partition index. Time: O(log(min(M, N))), Space: O(1)."
      ],
      timeComplexity: "O(log(min(M, N)))",
      spaceComplexity: "O(1)"
    }
  },
  5: {
    id: 5,
    title: "Longest Palindromic Substring",
    slug: "longest-palindromic-substring",
    difficulty: "Medium",
    topics: ["String", "Dynamic Programming"],
    quickRevision: {
      description: "Find the longest palindromic substring in a given string.",
      example: "Input: s = \"babad\" -> Output: \"bab\" or \"aba\"",
      coreIdea: "For each index, treat it as a center and expand outwards. A center can be odd-length (single character center) or even-length (between two characters).",
      observation: "There are 2N-1 possible centers for a string of length N. Expanding from a center takes O(N) time.",
      approaches: [
        "Dynamic Programming: State table DP[i][j] representing if s[i..j] is a palindrome. Time: O(N^2), Space: O(N^2).",
        "Expand Around Center (Optimal): Expand outwards. Time: O(N^2), Space: O(1).",
        "Manacher's Algorithm: Highly optimized linear scan. Time: O(N), Space: O(N)."
      ],
      timeComplexity: "O(N^2)",
      spaceComplexity: "O(1)"
    }
  },
  11: {
    id: 11,
    title: "Container With Most Water",
    slug: "container-with-most-water",
    difficulty: "Medium",
    topics: ["Array", "Two Pointers", "Greedy"],
    quickRevision: {
      description: "Find two lines that together with the x-axis form a container, such that the container contains the most water.",
      example: "Input: [1,8,6,2,5,4,8,3,7] -> Output: 49",
      coreIdea: "Place pointers at the start and end of the array. Calculate water capacity, then move the pointer that points to the shorter line inward.",
      observation: "Moving the pointer with the longer line will never increase the water container's capacity because the height is limited by the shorter line.",
      approaches: [
        "Brute Force: Check every pair of lines. Time: O(N^2), Space: O(1).",
        "Two Pointers (Optimal): Shrink window greedily. Time: O(N), Space: O(1)."
      ],
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)"
    }
  },
  15: {
    id: 15,
    title: "3Sum",
    slug: "3sum",
    difficulty: "Medium",
    topics: ["Array", "Two Pointers", "Sorting"],
    quickRevision: {
      description: "Find all unique triplets in the array that sum up to zero.",
      example: "Input: nums = [-1,0,1,2,-1,-4] -> Output: [[-1,-1,2],[-1,0,1]]",
      coreIdea: "Sort the array, then iterate through it. For each element, use two pointers (left and right) on the remaining suffix to find pairs that sum to the target negative of the current element.",
      observation: "To avoid duplicates, skip identical adjacent elements when moving the main loop index and the two pointers.",
      approaches: [
        "Brute Force: Three nested loops. Time: O(N^3), Space: O(1).",
        "Hash Map: Use Two Sum lookup. Time: O(N^2), Space: O(N).",
        "Sorting + Two Pointers (Optimal): Sort and shrink search space. Time: O(N^2), Space: O(log N) to O(N) depending on sorting."
      ],
      timeComplexity: "O(N^2)",
      spaceComplexity: "O(1) (excluding sorting space)"
    }
  },
  20: {
    id: 20,
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    difficulty: "Easy",
    topics: ["String", "Stack"],
    quickRevision: {
      description: "Determine if an input string containing parentheses characters is valid.",
      example: "Input: s = \"()[]{}\" -> Output: true",
      coreIdea: "Use a stack to store opening brackets. When a closing bracket is encountered, pop the top of the stack and check if it matches the current closing bracket.",
      observation: "Brackets must close in reverse-chronological order of their opening, which maps directly to a LIFO (Last In First Out) stack.",
      approaches: [
        "Stack: Push opening brackets, pop and match closing brackets. Time: O(N), Space: O(N)."
      ],
      timeComplexity: "O(N)",
      spaceComplexity: "O(N)"
    }
  },
  21: {
    id: 21,
    title: "Merge Two Sorted Lists",
    slug: "merge-two-sorted-lists",
    difficulty: "Easy",
    topics: ["Linked List", "Recursion"],
    quickRevision: {
      description: "Merge two sorted linked lists and return it as a new sorted list.",
      example: "Input: l1 = [1,2,4], l2 = [1,3,4] -> Output: [1,1,2,3,4,4]",
      coreIdea: "Use a dummy head node. Iterate through both lists, comparing nodes and appending the smaller one to the merged list.",
      observation: "A dummy node simplifies edge cases like initializing the head of the merged list.",
      approaches: [
        "Iterative (Optimal): Single pointer traversal. Time: O(M+N), Space: O(1).",
        "Recursive: Dynamic recursive merges. Time: O(M+N), Space: O(M+N) call stack."
      ],
      timeComplexity: "O(M + N)",
      spaceComplexity: "O(1)"
    }
  },
  33: {
    id: 33,
    title: "Search in Rotated Sorted Array",
    slug: "search-in-rotated-sorted-array",
    difficulty: "Medium",
    topics: ["Array", "Binary Search"],
    quickRevision: {
      description: "Search for a target value in a sorted array that has been rotated.",
      example: "Input: nums = [4,5,6,7,0,1,2], target = 0 -> Output: 4",
      coreIdea: "Apply binary search. In any rotated sorted array, one half is always normally sorted. Determine which half is sorted and check if target lies in its range.",
      observation: "If nums[left] <= nums[mid], the left half is sorted. Otherwise, the right half is sorted.",
      approaches: [
        "Linear Scan: O(N) scan. Time: O(N), Space: O(1).",
        "Modified Binary Search (Optimal): Identify sorted half. Time: O(log N), Space: O(1)."
      ],
      timeComplexity: "O(log N)",
      spaceComplexity: "O(1)"
    }
  },
  49: {
    id: 49,
    title: "Group Anagrams",
    slug: "group-anagrams",
    difficulty: "Medium",
    topics: ["Array", "Hash Table", "String", "Sorting"],
    quickRevision: {
      description: "Group an array of strings such that anagrams are in the same sub-array.",
      example: "Input: [\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"] -> Output: [[\"bat\"],[\"nat\",\"tan\"],[\"ate\",\"eat\",\"tea\"]]",
      coreIdea: "Use a hash map where the key is the sorted version of a string (or character count array) and the value is the list of anagram strings.",
      observation: "All anagrams share the exact same sorted string and character count signature.",
      approaches: [
        "Sort Key Grouping: Sort each word to use as hash key. Time: O(N * K log K), Space: O(N * K).",
        "Char Count Key Grouping: Use count array of size 26 as key. Time: O(N * K), Space: O(N * K)."
      ],
      timeComplexity: "O(N * K) where K is the max string length",
      spaceComplexity: "O(N * K)"
    }
  },
  53: {
    id: 53,
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    difficulty: "Medium",
    topics: ["Array", "Dynamic Programming", "Divide and Conquer"],
    quickRevision: {
      description: "Find the contiguous subarray which has the largest sum and return its sum.",
      example: "Input: nums = [-2,1,-3,4,-1,2,1,-5,4] -> Output: 6 ([4,-1,2,1])",
      coreIdea: "Kadane's Algorithm: Iterate through the array. At each element, decide whether to add it to the current subarray sum or start a new subarray.",
      observation: "If the current subarray sum becomes negative, it is always better to discard it and start fresh from the current element.",
      approaches: [
        "Brute Force: Check all subarrays. Time: O(N^2), Space: O(1).",
        "Kadane's Algorithm (Optimal): Maintain local and global max. Time: O(N), Space: O(1).",
        "Divide and Conquer: Split array. Time: O(N log N), Space: O(log N)."
      ],
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)"
    }
  },
  70: {
    id: 70,
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    difficulty: "Easy",
    topics: ["Math", "Dynamic Programming", "Memoization"],
    quickRevision: {
      description: "Find the number of distinct ways to climb a staircase of n steps, taking 1 or 2 steps at a time.",
      example: "Input: n = 3 -> Output: 3 (1+1+1, 1+2, 2+1)",
      coreIdea: "To reach step n, you must have come from step n-1 or step n-2. Thus, ways(n) = ways(n-1) + ways(n-2), which is the Fibonacci recurrence.",
      observation: "We only need the last two values to calculate the current value, meaning we can optimize space to O(1).",
      approaches: [
        "Recursion: exponential time. Time: O(2^N), Space: O(N) call stack.",
        "DP Table: Store all values. Time: O(N), Space: O(N).",
        "Space Optimized DP (Optimal): Store last 2 steps. Time: O(N), Space: O(1)."
      ],
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)"
    }
  },
  74: {
    id: 74,
    title: "Search a 2D Matrix",
    slug: "search-a-2d-matrix",
    difficulty: "Medium",
    topics: ["Array", "Binary Search", "Matrix"],
    quickRevision: {
      description: "Search for a target value in an m x n matrix where integers in each row are sorted and the first integer of each row is greater than the last integer of the previous row.",
      example: "Input: matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3 -> Output: true",
      coreIdea: "Treat the 2D matrix as a virtual 1D sorted array of size m * n. Apply standard binary search. Map the virtual index back to 2D coordinates.",
      observation: "Virtual index `idx` maps to row `idx / n` and column `idx % n`.",
      approaches: [
        "Binary Search (Optimal): Virtual 1D binary search. Time: O(log(M * N)), Space: O(1).",
        "Step search from top-right: Time: O(M + N), Space: O(1)."
      ],
      timeComplexity: "O(log(M * N))",
      spaceComplexity: "O(1)"
    }
  },
  100: {
    id: 100,
    title: "Same Tree",
    slug: "same-tree",
    difficulty: "Easy",
    topics: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree"],
    quickRevision: {
      description: "Check if two binary trees are structurally identical and have the same node values.",
      example: "Input: p = [1,2,3], q = [1,2,3] -> Output: true",
      coreIdea: "Recursively check if the current nodes of both trees are equal, and then recursively call the same check on their left and right subtrees.",
      observation: "Base cases: if both are null, return true; if only one is null or values differ, return false.",
      approaches: [
        "Recursive DFS (Optimal): Simple pre-order traversal. Time: O(N), Space: O(H) where H is tree height.",
        "Iterative BFS: Level-order check using a queue. Time: O(N), Space: O(N)."
      ],
      timeComplexity: "O(N)",
      spaceComplexity: "O(H) where H is tree height due to recursion stack"
    }
  },
  104: {
    id: 104,
    title: "Maximum Depth of Binary Tree",
    slug: "maximum-depth-of-binary-tree",
    difficulty: "Easy",
    topics: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree"],
    quickRevision: {
      description: "Find the maximum depth (height) of a binary tree.",
      example: "Input: root = [3,9,20,null,null,15,7] -> Output: 3",
      coreIdea: "The height of a tree is 1 plus the maximum height of its left and right subtrees.",
      observation: "Base case: a null root has depth 0.",
      approaches: [
        "Recursive DFS (Optimal): Bottom-up height calculation. Time: O(N), Space: O(H).",
        "Iterative BFS: Count levels using a queue. Time: O(N), Space: O(W) where W is max width."
      ],
      timeComplexity: "O(N)",
      spaceComplexity: "O(H) where H is tree height"
    }
  },
  198: {
    id: 198,
    title: "House Robber",
    slug: "house-robber",
    difficulty: "Medium",
    topics: ["Array", "Dynamic Programming"],
    quickRevision: {
      description: "Determine the maximum amount of money you can rob tonight without alerting the police (cannot rob adjacent houses).",
      example: "Input: nums = [1,2,3,1] -> Output: 4 (rob house 1 and 3)",
      coreIdea: "For each house i, the maximum profit is either robbing the current house plus the profit from i-2, or skipping the current house and taking the profit from i-1.",
      observation: "Recurrence: dp[i] = max(dp[i-1], dp[i-2] + nums[i]). Since we only need dp[i-1] and dp[i-2], we can optimize space to O(1).",
      approaches: [
        "Recursive + Memoization: Time: O(N), Space: O(N).",
        "Tabulation DP: Table of size N. Time: O(N), Space: O(N).",
        "Space Optimized DP (Optimal): Two variables tracking last rob states. Time: O(N), Space: O(1)."
      ],
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)"
    }
  },
  322: {
    id: 322,
    title: "Coin Change",
    slug: "coin-change",
    difficulty: "Medium",
    topics: ["Array", "Dynamic Programming", "Breadth-First Search"],
    quickRevision: {
      description: "Find the fewest number of coins needed to make up a given amount. Return -1 if not possible.",
      example: "Input: coins = [1,2,5], amount = 11 -> Output: 3 (5 + 5 + 1)",
      coreIdea: "Build a DP table where dp[i] represents the minimum coins needed for amount i. For each coin, if coin <= i, dp[i] = min(dp[i], dp[i - coin] + 1).",
      observation: "Initialize the DP table with infinity (or amount + 1) to represent unreachability.",
      approaches: [
        "Top-Down DFS + Memoization: Recursion with cache. Time: O(A * N), Space: O(A).",
        "Bottom-Up Tabulation (Optimal): Compute smaller amounts first. Time: O(A * N), Space: O(A) where A is amount, N is coins count."
      ],
      timeComplexity: "O(Amount * Coins)",
      spaceComplexity: "O(Amount)"
    }
  }
};

// Lightweight lookup tables for basic details of other questions in the repo
export const EXTENDED_PROBLEMS_LOOKUP: Record<number, { difficulty: "Easy" | "Medium" | "Hard", topics: string[] }> = {
  7: { difficulty: "Medium", topics: ["Math"] },
  9: { difficulty: "Easy", topics: ["Math"] },
  14: { difficulty: "Easy", topics: ["String", "Trie"] },
  17: { difficulty: "Medium", topics: ["String", "Backtracking"] },
  19: { difficulty: "Medium", topics: ["Linked List", "Two Pointers"] },
  26: { difficulty: "Easy", topics: ["Array", "Two Pointers"] },
  27: { difficulty: "Easy", topics: ["Array", "Two Pointers"] },
  28: { difficulty: "Easy", topics: ["Two Pointers", "String", "String Matching"] },
  31: { difficulty: "Medium", topics: ["Array", "Two Pointers"] },
  34: { difficulty: "Medium", topics: ["Array", "Binary Search"] },
  35: { difficulty: "Easy", topics: ["Array", "Binary Search"] },
  37: { difficulty: "Hard", topics: ["Array", "Hash Table", "Backtracking", "Matrix"] },
  39: { difficulty: "Medium", topics: ["Array", "Backtracking"] },
  40: { difficulty: "Medium", topics: ["Array", "Backtracking"] },
  46: { difficulty: "Medium", topics: ["Array", "Backtracking"] },
  48: { difficulty: "Medium", topics: ["Array", "Math", "Matrix"] },
  50: { difficulty: "Medium", topics: ["Math", "Recursion"] },
  51: { difficulty: "Hard", topics: ["Array", "Backtracking"] },
  54: { difficulty: "Medium", topics: ["Array", "Matrix", "Simulation"] },
  59: { difficulty: "Medium", topics: ["Array", "Matrix", "Simulation"] },
  61: { difficulty: "Medium", topics: ["Linked List", "Two Pointers"] },
  62: { difficulty: "Medium", topics: ["Math", "Dynamic Programming", "Combinatorics"] },
  63: { difficulty: "Medium", topics: ["Array", "Dynamic Programming", "Matrix"] },
  66: { difficulty: "Easy", topics: ["Array", "Math"] },
  69: { difficulty: "Easy", topics: ["Math", "Binary Search"] },
  72: { difficulty: "Hard", topics: ["String", "Dynamic Programming"] },
  73: { difficulty: "Medium", topics: ["Array", "Hash Table", "Matrix"] },
  75: { difficulty: "Medium", topics: ["Array", "Two Pointers", "Sorting"] },
  78: { difficulty: "Medium", topics: ["Array", "Backtracking", "Bit Manipulation"] },
  81: { difficulty: "Medium", topics: ["Array", "Binary Search"] },
  83: { difficulty: "Easy", topics: ["Linked List"] },
  84: { difficulty: "Hard", topics: ["Array", "Stack", "Monotonic Stack"] },
  90: { difficulty: "Medium", topics: ["Array", "Backtracking", "Bit Manipulation"] },
  92: { difficulty: "Medium", topics: ["Linked List"] },
  94: { difficulty: "Easy", topics: ["Stack", "Tree", "Depth-First Search", "Binary Tree"] },
  101: { difficulty: "Easy", topics: ["Tree", "Depth-First Search", "Breadth-First Search", "Binary Tree"] },
  102: { difficulty: "Medium", topics: ["Tree", "Breadth-First Search", "Binary Tree"] },
  103: { difficulty: "Medium", topics: ["Tree", "Breadth-First Search", "Binary Tree"] },
  105: { difficulty: "Medium", topics: ["Array", "Hash Table", "Divide and Conquer", "Tree", "Binary Tree"] },
  108: { difficulty: "Easy", topics: ["Array", "Divide and Conquer", "Tree", "Binary Search Tree", "Binary Tree"] },
  109: { difficulty: "Medium", topics: ["Linked List", "Divide and Conquer", "Tree", "Binary Search Tree", "Binary Tree"] },
  110: { difficulty: "Easy", topics: ["Tree", "Depth-First Search", "Binary Tree"] },
  112: { difficulty: "Easy", topics: ["Tree", "Depth-First Search", "Binary Tree"] },
  113: { difficulty: "Medium", topics: ["Tree", "Backtracking", "Depth-First Search", "Binary Tree"] },
  114: { difficulty: "Medium", topics: ["Stack", "Tree", "Depth-First Search", "Linked List", "Binary Tree"] },
  121: { difficulty: "Easy", topics: ["Array", "Dynamic Programming"] },
  125: { difficulty: "Easy", topics: ["Two Pointers", "String"] },
  128: { difficulty: "Medium", topics: ["Array", "Hash Table", "Union Find"] }
};
