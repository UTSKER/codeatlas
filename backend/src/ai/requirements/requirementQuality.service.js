class RequirementQualityService {

    validate(requirements = []) {

        if (!Array.isArray(requirements)) {
            throw new Error("Requirements must be an array.");
        }

        if (requirements.length === 0) {
            throw new Error("At least one requirement must be generated.");
        }

        const titles = new Set();

        for (const requirement of requirements) {

            if (!requirement.title?.trim()) {
                throw new Error("Requirement title is required.");
            }

            if (!requirement.description?.trim()) {
                throw new Error(
                    `Description missing for "${requirement.title}".`
                );
            }

            if (
                ![
                    "LOW",
                    "MEDIUM",
                    "HIGH",
                ].includes(requirement.priority)
            ) {
                throw new Error(
                    `Invalid priority for "${requirement.title}".`
                );
            }

            if (
                !Array.isArray(
                    requirement.acceptanceCriteria
                )
            ) {
                throw new Error(
                    `"${requirement.title}" must contain acceptance criteria.`
                );
            }

            if (
                requirement.acceptanceCriteria.length === 0
            ) {
                throw new Error(
                    `"${requirement.title}" must define at least one acceptance criterion.`
                );
            }

            if (
                titles.has(
                    requirement.title.toLowerCase()
                )
            ) {
                throw new Error(
                    `Duplicate requirement "${requirement.title}".`
                );
            }

            titles.add(
                requirement.title.toLowerCase()
            );

        }

        return true;

    }

}

export default new RequirementQualityService();