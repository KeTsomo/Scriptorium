import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { query } = req.body;

    try {
      const codeTemplates = await prisma.template.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { explanation: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            {
              tags: {
                some: {
                  name: { contains: query, mode: 'insensitive' }
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
      return res.status(500).json({ message: "Error retrieving templates" });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed.' });
  }
}
