// pages/api/execute.js

import { exec } from 'child_process';
import { PrismaClient } from '@prisma/client';
import util from 'util';
const prisma = new PrismaClient();
const execPromise = util.promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const { code, language, input } = req.body;

  if (!code || !language) {
    return res.status(400).json({ message: 'Code and language are required' });
  }

  try {
    // Save the code in the database (optional)
    const savedExecution = await prisma.execution.create({
      data: {
        code,
        language,
        input,
        createdAt: new Date(),
      },
    });

    // Execute code in a Docker container
    const output = await executeCodeInDocker(code, language, input);
    
    // Return the output
    res.status(200).json({ output });
  } catch (error) {
    console.error('Execution error:', error);
    res.status(500).json({ message: 'Error executing code', error: error.message });
  }
}

async function executeCodeInDocker(code, language, input) {
  // Define the Docker command based on the language
  let command;
  if (language === 'python') {
    command = `docker run --rm -m 50m --memory-swap 50m -v $(pwd)/scripts:/scripts python:3.10 python /scripts/code.py`;
  } else if (language === 'javascript') {
    command = `docker run --rm -m 50m --memory-swap 50m -v $(pwd)/scripts:/scripts node:20 node /scripts/code.js`;
  } else if (language == 'java') {
    command = 'docker run --rm -m 50m --memory-swap 50m -v $(pwd)/scripts:/scripts openjdk:17 java -cp / scripts/code.java'; 
  } else if (language == 'c') {
    command = 'docker run --rm -m 50m --memory-swap 50m -v $(pwd)/scripts:/scripts gcc:11 gcc /scripts/code.c -o /scripts/code && /scripts/code';
  }
  
  // Write code to a temp file (e.g., `code.py` for Python)
  const fs = require('fs');
  const filePath = `./scripts/code.${language === 'python' ? 'py' : 'js'}`;
  fs.writeFileSync(filePath, code);

  // Run the code using Docker
  const { stdout, stderr } = await execPromise(command);

  // Cleanup temp file
  fs.unlinkSync(filePath);

  if (stderr) {
    throw new Error(stderr);
  }
  return stdout;
}
