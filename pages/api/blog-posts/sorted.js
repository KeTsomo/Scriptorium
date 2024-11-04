import prisma from '../../../utils/db';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed. Use GET.' });
  }

  try {
    //fetch blog posts with upvote and downvote counts, along with their associated comments
    const blogPosts = await prisma.blogPost.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        upvoteCount: true,
        downvoteCount: true,
        comments: {
          select: {
            id: true,
            content: true,
            upvoteCount: true,
            downvoteCount: true,
          },
        },
      },
    });

    //calculate rating scores and sort comments
    const sortedBlogPosts = blogPosts.map((post) => {
      const ratingScore = post.upvoteCount - post.downvoteCount;

      //sort comments for each post by rating score (upvotes - downvotes)
      const sortedComments = post.comments
        .map((comment) => ({
          ...comment,
          ratingScore: comment.upvoteCount - comment.downvoteCount,
        }))
        .sort((a, b) => b.ratingScore - a.ratingScore); // Sort by rating score descending

      //return the blog post with calculated rating score and sorted comments
      return {
        ...post,
        ratingScore,
        comments: sortedComments,
      };
    });

    //sort blog posts by rating score in descending order
    sortedBlogPosts.sort((a, b) => b.ratingScore - a.ratingScore);

    //return sorted blog posts with their sorted comments
    return res.status(200).json({
      message: 'Blog posts and comments sorted by rating retrieved successfully!',
      blogPosts: sortedBlogPosts,
    });
  } catch (error) {
    console.error('Error retrieving sorted blog posts and comments:', error);
    return res.status(500).json({ error: 'Error retrieving sorted content' });
  }
}
