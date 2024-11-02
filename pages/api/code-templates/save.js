import { PrismaClient } from '@prisma/client';
import { getSession } from 'next-auth/react';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ message: 'You must be logged in to save a template' });
  }

  const { title, explanation, code, tags } = req.body;

  if (!title || !explanation || !code || !tags) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Create a new template in the database
    const newTemplate = await prisma.template.create({
      data: {
        title,
        explanation,
        code,
        tags,
        user: { connect: { email: session.user.email } },
      },
    });

    res.status(201).json({ template: newTemplate });
  } catch (error) {
    console.error('Error saving template:', error);
    res.status(500).json({ message: 'Error saving template' });
  }
}