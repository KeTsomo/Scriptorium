import prisma from '../../../utils/db';

export default async function handler(req, res) {
    // Only accept POST requests for searching
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get the search query from the request body
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Search query cannot be empty.' });
    }

    try {
        // Search for blog posts where title, description, tags, or related template titles match the query
        const blogPosts = await prisma.blogPost.findMany({
            where: {
                OR: [
                    { title: { contains: query } },
                    { description: { contains: query } },
                    {
                        tags: {
                            some: {
                                name: { contains: query }
                            }
                        }
                    },
                    {
                        templates: {
                            some: {
                                title: { contains: query }
                            }
                        }
                    }
                ]
            },
            select: {
                id: true,
                title: true,
                description: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                tags: {
                    select: { name: true }
                },
                templates: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        });

        return res.status(200).json({ blogPosts });
    } catch (error) {
        console.error('Error retrieving blog posts:', error);
        return res.status(500).json({ error: 'Error retrieving blog posts' });
    }
}
