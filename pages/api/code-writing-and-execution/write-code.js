import { exec } from 'child_process'; //handles code execution by accepts commands
import fs from 'fs'; //handles file operations
import path from 'path'; //handles file paths
import { promisify } from 'util';

//promisify the exec and fs functions to use async/await
const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { code, language } = req.body;

    const languageConfig = {
        //handles the file extension, compile command and execute command for each language in an object. 
        'c': { extension: '.c', compile: 'gcc', execute: './a.out' },
        'cpp': { extension: '.cpp', compile: 'g++', execute: './a.out' },
        'java': { extension: '.java', compile: 'javac', execute: 'java' },
        'python': { extension: '.py', execute: 'python3' },
        'javascript': { extension: '.js', execute: 'node' }
    };

    if (!code || !language || !languageConfig[language]) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const { extension, compile, execute } = languageConfig[language];
    const fileName = `Main${extension}`;

    //write the code to a file
    const filePath = path.join('/tmp', fileName);

    //since we are a visitor, we write code to a temporary file.
    try {
        //write code to a temporary file
        await writeFileAsync(filePath, code);

        //compile the code if needed, since python and javascript don't need compilation.
        if (compile) {
            await execAsync(`${compile} ${filePath}`);
        }

        //execute the code
        const { stdout, stderr } = await execAsync(`${execute} ${filePath}`);

        //idk if needed here but send the output back to the client just to test it.
        res.status(200).json({ stdout, stderr });
    } catch (error) {
        res.status(500).json({ error: error.message });
    } finally {
        //delete the temporary file after execution since it's a visitor??
        await unlinkAsync(filePath).catch(() => {});
    }

}