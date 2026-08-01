const Submission = require('../models/Submission');
const Problem = require('../models/Problem');

// Helper to query LeetCode GraphQL API for full problem content
async function fetchProblemFromLeetCodeGraphQL(slug) {
  try {
    const response = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        query: `
          query questionContent($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              questionId
              title
              titleSlug
              content
              difficulty
              topicTags {
                name
              }
              hints
              similarQuestions
            }
          }
        `,
        variables: {
          titleSlug: slug
        }
      })
    });

    if (!response.ok) return null;

    const json = await response.json();
    if (json && json.data && json.data.question) {
      const q = json.data.question;

      // Parse similar questions if present
      let relatedProblems = [];
      if (q.similarQuestions) {
        try {
          const parsed = JSON.parse(q.similarQuestions);
          relatedProblems = parsed.map((item) => ({
            problemNumber: item.questionId || item.titleSlug,
            title: item.title,
            slug: item.titleSlug,
            difficulty: item.difficulty || 'Medium'
          }));
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      // Default tech companies tag list
      const companies = ["Google", "Amazon", "Meta", "Microsoft", "Apple"];

      return {
        problemNumber: String(q.questionId),
        title: q.title,
        slug: q.titleSlug,
        difficulty: q.difficulty || 'Medium',
        tags: q.topicTags ? q.topicTags.map((t) => t.name) : [],
        companies,
        description: q.content || '',
        examples: [],
        constraints: [],
        hints: q.hints || [],
        relatedProblems,
        lastFetched: new Date()
      };
    }
  } catch (e) {
    console.error('[CodeRevise][Problem] GraphQL fetch failed:', e);
  }
  return null;
}

// @desc    Get detailed submission + problem metadata
// @route   GET /api/submissions/:problemNumber/details
// @access  Private
const getProblemDetails = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { problemNumber } = req.params;

    // 1. Find user's submission by problemNumber or slug
    let submission = await Submission.findOne({
      userId,
      $or: [{ problemNumber }, { slug: problemNumber }]
    });

    // 2. Find problem metadata in database
    let problem = await Problem.findOne({
      $or: [{ problemNumber }, { slug: problemNumber }]
    });

    // 3. If Problem is not cached in database, query LeetCode GraphQL
    if (!problem) {
      const targetSlug = submission ? submission.slug : problemNumber;
      console.log(`[CodeRevise][Problem] Problem metadata not cached. Fetching GraphQL for '${targetSlug}'...`);

      const gqlData = await fetchProblemFromLeetCodeGraphQL(targetSlug);

      if (gqlData) {
        try {
          problem = await Problem.findOneAndUpdate(
            { problemNumber: gqlData.problemNumber },
            gqlData,
            { upsert: true, new: true }
          );
          console.log(`[CodeRevise][Problem] Cached GraphQL problem metadata: #${problem.problemNumber} ${problem.title}`);
        } catch (e) {
          console.error(`[CodeRevise][Problem] Failed to save problem cache:`, e);
          problem = gqlData; // Fallback to memory object
        }
      }
    }

    // 4. Construct fallback submission if missing
    if (!submission && problem) {
      submission = {
        _id: null,
        userId,
        problemNumber: problem.problemNumber,
        title: problem.title,
        slug: problem.slug,
        url: `https://leetcode.com/problems/${problem.slug}/`,
        difficulty: problem.difficulty,
        tags: problem.tags,
        language: "CodeRevise",
        solution: "// No accepted solution synced yet.\n// Solve this problem on LeetCode to automatically capture your code.",
        submittedAt: problem.lastFetched,
        favorite: false,
        notes: "",
        revisionStatus: "New",
        lastReviewed: null,
        reviewCount: 0
      };
    }

    if (!submission && !problem) {
      return res.status(404).json({
        success: false,
        message: `Problem or submission details for #${problemNumber} not found.`
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        submission,
        problem
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProblemDetails
};
