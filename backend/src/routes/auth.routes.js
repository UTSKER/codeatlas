import express from "express";
import passport from "../auth/passport.js";

const router = express.Router();

router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    return res.status(200).json({
      success: true,
      user: req.user.user,
      token: req.user.token,
    });
  }
);

export default router;