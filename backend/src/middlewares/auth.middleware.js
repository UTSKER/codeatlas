import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

         console.log("Authorization:", req.headers.authorization);

        const token23 = authHeader.split(" ")[1];

        console.log("Token:", token23);

        const decoded23 = jwt.verify(token23, process.env.JWT_SECRET);

        console.log("Decoded:", decoded23);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);


        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id,
            },
        });

        if (!user) {
            return res.status(401).json({
                message: "User not found",
            });
        }

        req.user = user;
        console.log("Authenticated user:", user.id);

        next();

    } catch (err) {
    console.error("STATUS:", err.response?.status);
    console.error("DATA:", err.response?.data);
    console.error("MESSAGE:", err.message);

    return res.status(500).json({
        success: false,
        message: err.message,
    });
    }
};

export default authMiddleware;