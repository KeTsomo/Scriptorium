import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();

import bcrypt from 'bcrypt';


export default async function handler(req, res) {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { firstName, lastName, email, password, avatar, phoneNumber } = req.body;

    //left avatar and phoneNumber optional
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "Please fill all fields" });
    }

    //check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(400).json({ error: 'This email already exists' });
    }

    //create hashed password
    const hashedPassword = await bcrypt.hash(password, 10);

    //save user to the database:
    const user = await prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            avatar,
            phoneNumber
        },
        //return these fields for the user
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            phoneNumber: true
        }

    });


    return res.status(201).json({ message: "User created successfully", user });

}