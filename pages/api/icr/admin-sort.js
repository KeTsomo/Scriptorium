import prisma from '../../../utils/db';
import { verifyToken } from "../../../utils/auth";

export default async function handler(req, res) {
    // from chat gpt "verify admin with verifyToken"
    const verifiedUser = verifyToken(req.headers.authorization);

    if (!verifiedUser) {
        return res.status(401).json({ error: "Unauthorized user or invalid token. Please log in!" });
    }

    if (verifiedUser.role !== "admin") {
        return res.status(403).json({ error: "Unauthorized. You must be an admin!" });
    }

    // allow only GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    // try catch created with help of chatgpt and co-pilot autocompletness, prompt was "write a try catch block to handle sorting blog posts 
    // and comments based on the number of reports."
    try {
        // Fetch blog posts with report count in descending order
        const blogPosts = await prisma.blogPost.findMany({
            select: {
                id: true,
                title: true,
                description: true,
                _count: {
                    select: { reports: true }
                }
            },
            orderBy: {
                reports: {
                    _count: 'desc' // sort blog posts by report count in descending order
                }
            }
        });

        // Fetch comments with report count in descending order
        const comments = await prisma.comment.findMany({
            select: {
                id: true,
                content: true,
                _count: {
                    select: { reports: true }
                }
            },
            orderBy: {
                reports: {
                    _count: 'desc' // sort comments by report count in descending order
                }
            }
        });

        return res.status(200).json({ blogPosts, comments });

    } catch (error) {
        console.error("Error retrieving sorted data:", error);
        return res.status(500).json({ error: 'Error retrieving sorted data.' });
    }
}
