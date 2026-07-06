import express from "express";
import cors from "cors";
import userRoutes from "../src/routes/user.routes.js";
import authRoutes from "../src/routes/auth.routes.js";
import passport from "../src/auth/passport.js";
import githubRoutes from "../src/routes/github.routes.js";
import indexRoutes from "../src/routes/index.routes.js";
import graphRoutes from "./routes/graph.routes.js";
import aiRoutes from "../src/routes/ai.routes.js";
const app = express();

app.use(cors());
app.use(express.json());
app.use(passport.initialize());


app.get("/health", (req, res) => {
    res.json({
        success: true,
    });
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/github", githubRoutes);
app.use("/api/v1/repositories", indexRoutes);
app.use("/api/v1/graph", graphRoutes);
app.use("/api/v1/ai", aiRoutes);

export default app;