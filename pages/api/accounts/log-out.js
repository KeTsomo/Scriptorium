import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const isLoggedIn = async(req) => {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
        where: {
            id: decoded.userId,
        }, 

    }); 
}
export const logOut = async(req, res) => {
    if (req.method === 'POST') {
        const user = await isLoggedIn(req);
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized.'});
            
        }
    }
}