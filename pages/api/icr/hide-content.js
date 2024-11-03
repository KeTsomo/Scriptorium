import prisma from '../../../utils/db';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
    // from chat gpt "verify admin with verifyToken"
    const verifiedUser = verifyToken(req.headers.authorization);

    if (!verifiedUser) {
        return res.status(401).json({ error: 'Unauthorized or invalid token.' });
    }

    // check that the user is an admin
    if (verifiedUser.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized. You must be an admin!' });
    }

    // from gpt and copilot autofill "generate a try catch block that hides content"
    if (req.method === 'PUT') {
        const { blogPostId, commentId } = req.body;
        
        if (!blogPostId && !commentId) {
            return res.status(400).json({ error: 'Please provide the ID of either a blog post or comment to hide.' });
        }

        try {
            if (blogPostId) {
                // find the inappropriate blog post
                const blogPost = await prisma.blogPost.update({
                    where: {
                        id: Number(blogPostId)
                    },
                    data: {
                        isHidden: true
                    }
                });

                if (!blogPost) {
                    return res.status(404).json({ error: 'Blog post not found.' });
                }
            } 

            if (commentId) {
                // find the inappropriate comment
                const comment = await prisma.comment.update({
                    where: { 
                        id: Number(commentId) 
                    },
                    data: {
                        isHidden: true
                    }
                });

                if (!comment) {
                    return res.status(404).json({ error: 'Comment not found.' });
                }
            }
            return res.status(200).json({ message: 'Content hidden successfully!' });

        } catch (error) {
            console.error("Error hiding content:", error);
            return res.status(500).json({ error: 'Error hiding content.' });
        }

    } else {
        res.status(405).json({ error: 'Method not allowed.' });
    }

}