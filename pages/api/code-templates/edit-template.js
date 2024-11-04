import prisma from "../../../utils/db";
import { verifyToken } from "../../../utils/auth";

export default async function handler(req, res) {
    let { id } = req.query;

    // decode and verify the token before allowing the user to edit code template
    const verifiedUser = verifyToken(req.headers.authorization);

    if (!verifiedUser) {
        return res.status(401).json({ message: 'Unauthorized.' });
    }

    if (req.method === 'PUT') {
        const { title, explanation, tags, code } = req.body;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: 'Please try again.' });
        }

        if (!title && !explanation && !tags && !code) {
            return res.status(400).json({ message: 'Please fill at least one field to update.' });
        }

        // find the code template by id and update it
        const template = await prisma.template.update({
            where: {
                id: Number(id),
            },
            data: {
                title,
                explanation,
                code,
                tags,
            },

        });

        if (!template){
            return res.status(404).json({ message: 'Code template not found.' });
        }

        // return updated code template
        return res.status(200).json({ message: 'Code template successfully updated.', template });
        
    // following similar structure from create-blog.js
    } else if (req.method === 'DELETE') {
        try {
            // delete associated tags before deleting the code template
            await prisma.templateTag.deleteMany({ 
                where: { 
                    templateId: Number(id) 
                } 
            });
    
            //deleting the code template
            await prisma.template.delete({
                where: { 
                    id: Number(id) 
                }
            });
    
            return res.status(200).json({ message: 'Code template deleted successfully!' });
        } catch (error) {
            console.error('Error deleting code template:', error);

            return res.status(500).json({ error: 'Error deleting code template' });
        }

    } else {
        return res.status(405).json({ messgae: 'Method not allowed.' });
    }
}
