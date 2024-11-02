import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// store secret key in environment variable
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN;

// use bcrypt to compare password with hashed password
export async function comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

export function generateAccessToken(obj) {
    return jwt.sign(obj, JWT_SECRET, {
        expiresIn: JWT_ACCESS_EXPIRES_IN,
    });
}

export function generateRefreshToken(obj) {
    return jwt.sign(obj, JWT_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
}

export function verifyToken(token) {
    if (!token?.startsWith("Bearer ")) {
        return null;
    }

    token = token.split("Bearer ")[1];

    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return null;
    }
}