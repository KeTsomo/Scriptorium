import prisma from '../../../utils/db';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
  const { method } = req;

  // Verify the method is POST
  if (method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed. Use POST.' });
  }

  //must be authenticated to report
  const verifiedUser = verifyToken(req.headers.authorization);
  if (!verifiedUser) {
    return res.status(401).json({ error: 'Unauthorized or invalid token. Please log in!' });
  }

  const userId = verifiedUser.userId;
  const { blogPostId, commentId, reason } = req.body;

  //check that only one of blogPostId or commentId is given
  if ((blogPostId && commentId) || (!blogPostId && !commentId)) {
    return res.status(400).json({ error: 'Please provide either a blog post ID or a comment ID, not both.' });
  }

  // Validate the reason for the report
  if (!reason || reason.trim() === '') {
    return res.status(400).json({ error: 'Please provide an additional explanation for reporting.' });
  }

  try {
    //make a report for a blog post
    if (blogPostId) {
      const report = await prisma.report.create({
        data: {
          reason,
          userId,
          blogPostId
        },
      });
      return res.status(201).json({ message: 'Report for blog post submitted successfully!', report });
    }

    //make a report for a comment
    if (commentId) {
      const report = await prisma.report.create({
        data: {
          reason,
          userId,
          commentId
        },
      });
      return res.status(201).json({ message: 'Report for comment submitted successfully!', report });
    }
  } catch (error) {
    console.error('Error creating report:', error);
    return res.status(500).json({ error: 'Error creating report.' });
  }
}
