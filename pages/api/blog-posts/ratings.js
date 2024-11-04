import prisma from '../../../utils/db';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  const { method } = req;

  if (method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Verify user authentication
  const verifiedUser = verifyToken(req.headers.authorization);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Unauthorized or invalid token' });
  }

  const userId = verifiedUser.userId;
  const { blogPostId, commentId, isUpvote } = req.body;

  // Ensure only one of blogPostId or commentId is provided
  if ((blogPostId && commentId) || (!blogPostId && !commentId)) {
    return res.status(400).json({ error: 'Please provide either a blog post ID or a comment ID, not both.' });
  }

  // Validate input for isUpvote
  if (typeof isUpvote !== 'boolean') {
    return res.status(400).json({ error: 'Please provide a valid rating (true for upvote, false for downvote).' });
  }

  try {
    if (blogPostId) {
      // Handle rating for blog post
      const existingRating = await prisma.rating.findUnique({
        where: { userId_blogPostId: { userId, blogPostId } }
      });

      if (existingRating) {
        // If rating already exists and differs, adjust counts
        if (existingRating.isUpvote !== isUpvote) {
          await prisma.blogPost.update({
            where: { id: blogPostId },
            data: {
              upvoteCount: { increment: isUpvote ? 1 : -1 },
              downvoteCount: { increment: isUpvote ? -1 : 1 }
            }
          });
          await prisma.rating.update({
            where: { id: existingRating.id },
            data: { isUpvote }
          });
        }
      } else {
        // If no rating exists, create a new one and increment the appropriate count
        await prisma.rating.create({
          data: { isUpvote, userId, blogPostId }
        });
        await prisma.blogPost.update({
          where: { id: blogPostId },
          data: {
            upvoteCount: { increment: isUpvote ? 1 : 0 },
            downvoteCount: { increment: isUpvote ? 0 : 1 }
          }
        });
      }

      // Retrieve updated counts for the response
      const updatedPost = await prisma.blogPost.findUnique({
        where: { id: blogPostId },
        select: { upvoteCount: true, downvoteCount: true }
      });

      return res.status(200).json({
        message: 'Blog post rating updated successfully!',
        upvotes: updatedPost.upvoteCount,
        downvotes: updatedPost.downvoteCount
      });
    }

    if (commentId) {
      // Handle rating for comment
      const existingRating = await prisma.rating.findUnique({
        where: { userId_commentId: { userId, commentId } }
      });

      if (existingRating) {
        // If rating already exists and differs, adjust counts
        if (existingRating.isUpvote !== isUpvote) {
          await prisma.comment.update({
            where: { id: commentId },
            data: {
              upvoteCount: { increment: isUpvote ? 1 : -1 },
              downvoteCount: { increment: isUpvote ? -1 : 1 }
            }
          });
          await prisma.rating.update({
            where: { id: existingRating.id },
            data: { isUpvote }
          });
        }
      } else {
        // If no rating exists, create a new one and increment the count
        await prisma.rating.create({
          data: { isUpvote, userId, commentId }
        });
        await prisma.comment.update({
          where: { id: commentId },
          data: {
            upvoteCount: { increment: isUpvote ? 1 : 0 },
            downvoteCount: { increment: isUpvote ? 0 : 1 }
          }
        });
      }

      // Retrieve updated counts for the response
      const updatedComment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: { upvoteCount: true, downvoteCount: true }
      });

      return res.status(200).json({
        message: 'Comment rating updated successfully!',
        upvotes: updatedComment.upvoteCount,
        downvotes: updatedComment.downvoteCount
      });
    }
  } catch (error) {
    console.error("Error updating rating:", error);
    return res.status(500).json({ error: 'Error updating rating' });
  }
}
