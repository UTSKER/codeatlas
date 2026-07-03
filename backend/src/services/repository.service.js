import prisma from "../config/prisma.js";

export const syncRepositories = async (repositories, userId) => {
    for (const repo of repositories) {
        await prisma.repository.upsert({
            where: {
                githubRepoId: repo.id,
            },
            update: {
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                private: repo.private,
                defaultBranch: repo.default_branch,
                language: repo.language,
                cloneUrl: repo.clone_url,
                htmlUrl: repo.html_url,
                owner: repo.owner.login,
            },
            create: {
                githubRepoId: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                description: repo.description,
                private: repo.private,
                defaultBranch: repo.default_branch,
                language: repo.language,
                cloneUrl: repo.clone_url,
                htmlUrl: repo.html_url,
                owner: repo.owner.login,
                userId,
            },
        });
    }
};