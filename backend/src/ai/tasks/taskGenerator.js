import { Task } from "./task.model.js";

export class TaskGenerator {

    /**
     * Generate tasks for all pending requirements.
     */
    generate(mission) {

        const tasks = [];

        const requirements = mission.pendingRequirements();

        let priority = 1;

        for (const requirement of requirements) {

            const requirementTasks =
                this.generateTasksForRequirement(
                    requirement,
                    priority
                );

            tasks.push(...requirementTasks);

            priority += requirementTasks.length;

        }

        return tasks;

    }

    /**
     * Generate tasks for a single requirement.
     *
     * Currently one Requirement -> one Task.
     *
     * Later this will become:
     *
     * Requirement
     *      ↓
     * LLM
     *      ↓
     * Task[]
     */
    generateTasksForRequirement(
        requirement,
        startingPriority = 1
    ) {

        return [

            new Task({

                requirementId:
                    requirement.id,

                title:
                    requirement.title,

                description:
                    requirement.description,

                priority:
                    startingPriority,

            })

        ];

    }

    /**
     * Populate Mission Task Queue.
     */
    populateQueue(mission) {

        const tasks =
            this.generate(mission);

        for (const task of tasks) {

            mission.addTask(task);

        }

        return tasks;

    }

}