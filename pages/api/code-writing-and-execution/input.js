import { exec } from 'child_process'; 
import fs from 'fs'; 
import path from 'path'; 

export default async function handler(req, res) {

    // following similar structure to write-code.js
    if (req.method === 'POST') {
        const { code, language, input} = req.body;

        const languageConfig = {
            'c': { extension: '.c', compile: 'gcc', execute: './a.out' },
            'cpp': { extension: '.cpp', compile: 'g++', execute: './a.out' },
            'java': { extension: '.java', compile: 'javac', execute: 'java' },
            'python': { extension: '.py', execute: 'python3' },
            'javascript': { extension: '.js', execute: 'node' }
        };

        if (!code || !language || !languageConfig[language]) {
            return res.status(400).json({ error: 'Invalid input.' });
        }

        const { extension, compile, execute } = languageConfig[language];
        const fileName = `Main${extension}`;

        // create temporary file to write in
        const filePath = path.join('/tmp', fileName);

        // asked chat gpt to "modify try catch block to include standard input"
        try {
            // from copilot autofill
            await fs.promises.writeFile(filePath, code);

            // compile code if the language requires it
            if (compile) {
                exec(`${compile} ${filePath}`, (err, stderr) => {
                    if (err) {
                        return res.status(400).json({ error: `Compilation error: ${stderr}` });
                    }
                });
            } 

            // execute code 
            const child = exec(`${execute} ${filePath}`, async (err, stdout, stderr) => {
                if (err) {
                    res.status(500).json({ error: `Execution error: ${stderr}` });
                } else {
                    // if the code successfully compiles if necessary and executes, then return the output
                    res.status(200).json({ output: stdout, error: stderr });
                }

                await fs.promises.unlink(filePath).catch(console.error);
            });

            // converts user input to a string to write to stdin
            child.stdin.write(input.toString()); 

            // close stdin
            child.stdin.end(); 

        } catch (error) {
            res.status(500).json({ error: error.message });
        }

    } else {
        res.status(405).json({ error: 'Method not allowed.' });
    }
}