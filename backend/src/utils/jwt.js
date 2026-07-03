import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      githubId: user.githubId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};