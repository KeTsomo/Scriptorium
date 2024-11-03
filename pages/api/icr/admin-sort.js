import prisma from '../../../utils/db';
import { verifyToken } from "../../../utils/auth";

export default async function handler(req, res) {
    // from chat gpt "verify admin with verifyToken"
    const verifiedUser = verifyToken(req.headers.authorization);

    if (!verifiedUser) {
        return res.status(401).json({ error: "Unauthorized user or invalid token. Please log in!"});
    }
    if (!verifiedUser.role !== "admin") {
        return res.status(403).json({ error: "Unuthorized. You must be an admin!"});
    }
    // only allowed GET requests to fetch and sort the data
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed.'});
    }
    try {
        // fetch all blog posts based on the report order and sort them
        const blogPosts = await prisma.blogPost.findMany({
            select: {
                id: true,
                title: true,
                description: true,
                reports: true, // get all reports linked to each blog post
                _count: { // count the number of reports
                    select: {
                        reports: true
                    }
                },
            }, 
            orderBy: {
                reportCount: 'desc'
            }
        });
        // sort the comments based on the report count
        const comments = await prisma.comment.findMany({
            select: {
                id: true,
                content: true,
                reports: true, // get all reports linked to each blog post
                _count: {  // count the number of reports
                    select: {
                        reports: true
                    }
                },
            }, 
            orderBy: {
                reportCount: 'desc'
            }
        });
        
        // return the sorted lists of blog posts and comments
        return res.status(200).json({ blogPosts, comments});

    } catch (error) {
        return res.status(500).json({ error: 'Error retrieving sorted data.' });
    }
}