import prisma from '../../../utils/db';

export default async function handler(req, res) {
    // only accept POST requests for searching
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query } = req.body;

    // check if query is provided
    if (!query) {
        return res.status(400).json({ error: 'Search query cannot be empty.' });
    }

    try {
        // search for templates matching the query in title, explanation, code, or tags
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

        // return search results to client
        return res.status(200).json({ codeTemplates });
    } catch (error) {
        console.error('Error retrieving templates:', error);  
        return res.status(500).json({ error: 'Error retrieving templates' });
    }
}
