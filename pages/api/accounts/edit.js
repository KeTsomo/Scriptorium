import prisma from "../../../utils/db";
import { verifyToken } from "../../../utils/auth";

export default async function handler(req, res) {
    if (req.method === 'PUT') {
        const { id } = req.query;
        const { firstName, lastName, email, avatar, phoneNumber } = req.body;
        
        // decode and verify the token before allowing the user to edit profile information
        const verifiedUser = verifyToken(req.headers.authorization);

        if (!verifiedUser) {
            return res.status(401).json({ message: 'Unauthorized.' });
        }

        // check for a valid user id
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({ message: 'Please try again.' });
        }

        // check if user filled any fields to update
        if (!firstName && !lastName && !email && !avatar && !phoneNumber) {
            return res.status(400).json({ message: 'Please fill at least one field to update.' });
        }

        const user = await prisma.user.update({
            where: {
                id: Number(id),
            },
            data: {
                firstName,
                lastName,
                email,
                avatar,
                phoneNumber,
            },

            // to return all up to date profile information
            select: {
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                phoneNumber: true
            }
        });

        // if provided user id doesn't exist
        if (!user) {
            return res.status(404).json({ message: 'User not found.'});
        }

        return res.status(200).json({ message: 'User updated successfully.', user });
    } else {
        res.status(405).json({ message: 'Method not allowed.' });
    }
}