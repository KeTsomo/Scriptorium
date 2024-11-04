import prisma from "../../../utils/db";
import { verifyToken } from "../../../utils/auth";

export default async function handler(req, res) {
    // make sure it's a POST request
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // from chat gpt "verify admin with verifyToken"
    const verifiedUser = verifyToken(req.headers.authorization);

    if (!verifiedUser) {
        return res.status(401).json({ error: 'Unauthorized or invalid token.' });
    }

    const { title, explanation, code, tags, blogPostIds } = req.body;

    // validate required fields, tags are optional.
    if (!title || !explanation || !code) {
        return res.status(400).json({ error: 'Please provide a title, explanation, and code.' });
    }

    //try catch generated by ChatGPT, prompt was "write a try catch block to handle code as a template with a title, explanation, and tags".
    try {
        // save the template to the database
        const template = await prisma.template.create({
            data: {
                title,
                explanation,
                code,
                userId: verifiedUser.userId, // link the template to the authenticated user
                tags: {
                    create: tags.map(tag => ({ name: tag }))
                },
                blogPosts:{
                    connect: blogPostIds.map(id => ({ id })) // link to existing blog posts by ID
                }
            },
            include: { tags: true, blogPosts: true } // include tags in the response for confirmation
        });

        return res.status(201).json({ message: 'Template saved successfully', template });
    } catch (error) {
        console.error("Error saving template:", error);
        return res.status(500).json({ error: 'Error saving template' });
    }
}