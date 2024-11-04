import prisma from '../../../utils/db';

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { templateId } = req.query;

        // get all associated blog posts for a given code template id
        try {
            const template = await prisma.template.findUnique({
                where: {
                    id: Number(templateId),
                },
                // from gpt, asked how to generate associated blog posts of a given code template
                include: {
                    blogPosts: true,
                },
            });

            if (!template) {
                return res.status(404).json({ error: 'Template not found.' });
            }

            return res.status(200).json({ template });
        } catch {
            return res.status(500).json({ error: 'Error retrieving blog posts.' });
        }

    } else {
        return res.status(405).json({ error: 'Method not allowed.' });
    }
}