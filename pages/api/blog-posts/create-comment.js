import prisma from '../../../utils/db';
import { verifyToken } from '../../../utils/auth';

export default async function handler(req, res) {
    //check if user is authenticated
    const verifiedUser = verifyToken(req.headers.authorization);

    if (!verifiedUser) {
        return res.status(401).json({ error: 'Unauthorized or invalid token. Please log-in!' });
    }

    // get the id from the user that is logged in
    const userId = verifiedUser.userId;

    if (req.method === 'POST') {
        const { content, blogPostId, parentId, rating } = req.body;
        
        if (!content) {
            return res.status(400).json({ error: 'Please fill in content and userId.' });
        }

        try {
            const comment = await prisma.comment.create({
                data:{
                    content,
                    userId,
                    blogPostId,
                    parentId, // an optional parameter, will only exist if the comment being created is a reply
                    rating,
                },
                include: { blogPost: true, parent: true }  
            });

            return res.status(201).json({ message: 'Comment created successfully!', comment });
        } catch (error) {
            console.error("Error creating comment:", error);
            return res.status(500).json({ error: 'Error creating comment.' });
        }

    } else {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

}