import { Task } from "./task.model.js";

export class TaskGenerator {
    generate(mission) {
        const tasks = [];

        const requirements = mission.informationRequirements.filter(
            requirement => requirement.status === "PENDING"
        );

        let priority = 1;

        for (const requirement of requirements) {
            tasks.push(
                new Task({
                    title: requirement.description,
                    description: requirement.description,
                    requirementId: requirement.id,
                    priority: priority++,
                })
            );
        }

        return tasks;
    }

    populateQueue(mission) {
        const tasks = this.generate(mission);

        for (const task of tasks) {
            mission.addTask(task);
        }

        return tasks;
    }
}