import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '@/utils/auth';

const prisma = new PrismaClient();
const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { templateId, modifiedCode, saveAsFork } = req.body;

    //verify the token. we will make it optional for running,
    //but if the user wants to save, they need to be logged in.

    //get the user id from the token
    const token = req.headers.authorization?.split(' ')[1];

    //verify the token.
    const decodedToken = token ? verifyToken(token) : null;

    //get the user id from the token
    const userId = decodedToken?.userId;

    //find the template by ID
    const template = await prisma.codeTemplate.findUnique({
        where: { id: templateId },
    });

    if(!template) {
        return res.status(404).json({ error: 'Template not found' });
    }

    //use modified code if its given, if not, use template code
    const codeToRun = modifiedCode || template.code;
    const language = 'javascript'; //test with javascript for now

    try {
        //write code to a temporary file, like in write-code.js
        const filePath = path.join('/tmp', `temp-${Date.now()}.js`);
        await writeFileAsync(filePath, codeToRun);

        //idk how to save the template yet

       
        }

        //return the output to the visitor
        return res.status(200).json({
            message: 'Code executed successfully.',
            stdout,
            stderr,
        });
    
}