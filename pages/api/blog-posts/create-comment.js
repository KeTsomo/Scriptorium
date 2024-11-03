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

        if (!blogPostId || isNaN(blogPostId)) {
            return res.status(400).json({ error: 'Invalid blogPostId.' });
        }

        try {
            const blogPost = await prisma.blogPost.findUnique({
                where: { 
                    id: Number(blogPostId)
                }
            });

            // from gpt, "modify the if statement to allow a blog post author to view hidden posts"
            if (blogPost) {
                if (blogPost.isHidden && blogPost.userId !== userId) {
                    return res.status(404).json({ error: 'Blog post not found.' });
                }
            } else {
                return res.status(404).json({ error: 'Blog post not found.' });
            }

            if (parentId) {
                if (isNaN(parentId)) {
                    return res.status(400).json({ error: 'Invalid parentId.' });
                }

                const parent = await prisma.comment.findUnique({
                    where: { 
                        id: Number(parentId)
                    }
                });
    
                // only allow the author of the hidden parent comment to view it
                if (parent) {
                    if (parent.isHidden && parent.userId !== userId) {
                        return res.status(404).json({ error: 'Blog post not found.' });
                    }
                } else {
                    return res.status(404).json({ error: 'Blog post not found.' });
                }

            }

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