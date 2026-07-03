import simpleGit from "simple-git";
import fs from "fs-extra";
import path from "path";

const git = simpleGit();

export const cloneRepository = async (repository) => {
    const clonePath = path.join(
        process.cwd(),
        "tmp",
        "repositories",
        repository.id
    );

    // Remove old clone if it exists
    await fs.remove(clonePath);

    // Recreate directory
    await fs.ensureDir(clonePath);

    // Clone repository
    await git.clone(repository.cloneUrl, clonePath);

    return clonePath;
};