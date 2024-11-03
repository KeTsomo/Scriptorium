import prisma from "../../../utils/db";
import { executeCode } from '../../../utils/codeRunner'; 

export default async function handler(req, res) {
    // restrict to POST requests only
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query, action, templateId, input, userId } = req.body;

    // handle search functionality if no action is specified
    if (!action) {
        // validate search query presence
        if (!query) {
            return res.status(400).json({ error: 'Search query cannot be empty.' });
        }

        try {
            // fetch blog posts that match the search query in title, description, tags, or template title
            const blogPosts = await prisma.blogPost.findMany({
                where: {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } },
                        {
                            tags: {
                                some: { name: { contains: query, mode: 'insensitive' } }
                            }
                        },
                        {
                            templates: {
                                some: { title: { contains: query, mode: 'insensitive' } }
                            }
                        }
                    ]
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    user: {
                        select: { firstName: true, lastName: true }
                    },
                    tags: { select: { name: true } },
                    templates: {
                        select: {
                            id: true,
                            title: true,
                            code: true,
                        }
                    }
                }
            });

            // add a link field to each template to allow viewing via URL
            const response = blogPosts.map(post => ({
                ...post,
                templates: post.templates.map(template => ({
                    ...template,
                    link: `/api/templateActions?id=${template.id}&action=view`
                }))
            }));

            return res.status(200).json({ blogPosts: response });
        } catch (error) {
            console.error('Error retrieving blog posts:', error.message);
            return res.status(500).json({ error: 'Error retrieving blog posts' });
        }
    } else {
        // if an action (view, run, fork) is specified, process the action on a template
        if (!templateId) {
            return res.status(400).json({ error: 'Template ID is required for this action.' });
        }

        try {
            // retrieve the template based on templateId
            const template = await prisma.template.findUnique({
                where: { id: Number(templateId) },
                select: {
                    id: true,
                    title: true,
                    explanation: true,
                    code: true,
                    userId: true,
                }
            });

            // if the template does not exist, return an error
            if (!template) {
                return res.status(404).json({ error: 'Template not found.' });
            }

            // handle each specified action
            if (action === 'view') {
                // return template details for viewing
                return res.status(200).json({ template });
            } else if (action === 'run') {
                // run the code using executeCode utility and return the result
                const result = await executeCode(template.code, input);
                return res.status(200).json({ result });
            } else if (action === 'fork') {
                // create a forked version of the template
                const forkedTemplate = await prisma.template.create({
                    data: {
                        title: `${template.title} (Forked)`,
                        explanation: template.explanation,
                        code: template.code,
                        isFork: true,
                        forkedFromId: template.id,
                        userId: userId || null
                    }
                });

                return res.status(201).json({
                    message: 'Template forked successfully',
                    template: forkedTemplate,
                    link: `/api/templateActions?id=${forkedTemplate.id}&action=view`
                });
            } else {
                // handle invalid actions
                return res.status(400).json({ error: 'Invalid action. Use "view", "run", or "fork" as the action.' });
            }
        } catch (error) {
            console.error(`Error processing action ${action} on template:`, error.message);
            return res.status(500).json({ error: `Error processing ${action} on template` });
        }
    }
}
