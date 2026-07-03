import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import prisma from "../config/prisma.js";
import { generateToken } from "../utils/jwt.js";

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("GitHub User:", profile.username);
        console.log("Access Token:", accessToken);

        // Find existing user
        let user = await prisma.user.findUnique({
          where: {
            githubId: profile.id,
          },
        });

        // Create user if not exists
        if (!user) {
          user = await prisma.user.create({
            data: {
              githubId: profile.id,
              username: profile.username,
              email:
                profile.emails?.[0]?.value ||
                `${profile.id}@github.local`,
              avatarUrl: profile.photos?.[0]?.value,
            },
          });
        }

        // Create or update GitHub account
        await prisma.gitHubAccount.upsert({
          where: {
            userId: user.id,
          },
          update: {
            accessToken,
          },
          create: {
            userId: user.id,
            accessToken,
          },
        });

        // Generate JWT
        const token = generateToken(user);

        return done(null, {
          user,
          token,
        });
      } catch (err) {
        console.error(err);
        return done(err, null);
      }
    }
  )
);

export default passport;