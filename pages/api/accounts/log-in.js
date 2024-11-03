import prisma from "../../../utils/db";
import { comparePassword, generateAccessToken, generateRefreshToken } from "../../../utils/auth";

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Please fill all required fields.' });
        }

        // find the user through their email
        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        // compare their password to what's saved in the database
        if (!user || !await comparePassword(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials.', });
        }

        // generate tokens for the user if the password is correct
        const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
        const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

        return res.status(200).json( { accessToken, refreshToken });
    } else {
        res.status(405).json({ message: 'Method not allowed.' });
    }
}