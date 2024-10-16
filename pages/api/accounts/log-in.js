import { PrismaClient } from '@prisma/client'
import { comparePassword, generateToken } from '@/utils/auth';
const prisma = new PrismaClient()

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Please fill all required fields.' });
        }

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (!user || !await comparePassword(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = generateToken({ userId: user.id, email: user.email });

        res.status(200).json( { token });
    } else {
        res.status(405).json({ message: 'Method not allowed.' });
    }
}