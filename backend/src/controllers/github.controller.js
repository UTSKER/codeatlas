import prisma from "../config/prisma.js";
import { getRepositories } from "../services/github.service.js";
import { syncRepositories } from "../services/repository.service.js";

export const fetchRepositories = async (req, res) => {
    try {
        const github = await prisma.gitHubAccount.findUnique({
            where: {
                userId: req.user.id,
            },
        });

        if (!github) {
            return res.status(404).json({
                success: false,
                message: "GitHub account not found",
            });
        }

        const repos = await getRepositories(github.accessToken);

        const formattedRepos = repos.map((repo) => ({
            githubRepoId: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            private: repo.private,
            language: repo.language,
            defaultBranch: repo.default_branch,
            cloneUrl: repo.clone_url,
            htmlUrl: repo.html_url,
            owner: repo.owner.login,
            avatar: repo.owner.avatar_url,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            openIssues: repo.open_issues_count,
            size: repo.size,
            updatedAt: repo.updated_at,
        }));

        return res.status(200).json({
            success: true,
            count: formattedRepos.length,
            repositories: formattedRepos,
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch repositories",
        });
    }
};

export const syncGitHubRepositories = async (req, res) => {
    try {
        const github = await prisma.gitHubAccount.findUnique({
            where: {
                userId: req.user.id,
            },
        });

        if (!github) {
            return res.status(404).json({
                success: false,
                message: "GitHub account not found",
            });
        }

        const repositories = await getRepositories(github.accessToken);

        await syncRepositories(repositories, req.user.id);

        return res.status(200).json({
            success: true,
            message: "Repositories synchronized successfully",
            count: repositories.length,
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};