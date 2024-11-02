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
        // Search for templates where title, explanation, code, or tags match the query
        const codeTemplates = await prisma.template.findMany({
            where: {
                OR: [
                    { title: { contains: query } },
                    { explanation: { contains: query } },
                    { code: { contains: query } },
                    {
                        tags: {
                            some: {
                                name: { contains: query }
                            }
                        }
                    }
                ]
            },
            select: {
                id: true,
                title: true,
                explanation: true,
                code: true,
                tags: {
                    select: { name: true }
                }
            }
        });

        return res.status(200).json({ codeTemplates });
    } catch (error) {
        console.error('Error retrieving templates:', error);
        return res.status(500).json({ error: 'Error retrieving templates' });
    }
}