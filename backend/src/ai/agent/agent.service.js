import { missionPlanner } from "../mission/missionPlanner.js";
import "../tools/index.js";
import { TaskGenerator } from "../tasks/taskGenerator.js";
import { TaskPlanner } from "../llm/planner.js";
import { TaskExecutor } from "../tasks/taskExecutor.js";
import { MissionVerifier } from "../mission/missionVerifier.js";
import { MissionReplanner } from "../mission/missionReplanner.js";
import { AnswerGenerator } from "../llm/answer.js";
import { Task } from "../tasks/task.model.js";

const DEFAULT_MAX_TASK_ITERATIONS = 8;
const DEFAULT_MAX_MISSION_TASKS = 12;

export class AgentService {
    constructor() {
        this.taskGenerator = new TaskGenerator();

        this.planner = new TaskPlanner();

        this.executor = new TaskExecutor();

        this.verifier = new MissionVerifier();

        this.replanner = new MissionReplanner();

        this.answerGenerator = new AnswerGenerator();
    }

    async run(question, options = {}) {

        const mission = await missionPlanner(question);

        const repositoryId =
            options.repositoryId ??
            process.env.CODEATLAS_REPOSITORY_ID;

        if (repositoryId) {
            mission.metadata.repositoryId = repositoryId;
            mission.remember("repositoryId", repositoryId);
        }

        const maxMissionTasks = Number(
            options.maxMissionTasks ??
            process.env.CODEATLAS_MAX_MISSION_TASKS ??
            DEFAULT_MAX_MISSION_TASKS
        );

        this.taskGenerator.populateQueue(mission);

        while (
            mission.tasks.hasPending() &&
            (
                mission.statistics.executedTasks +
                mission.statistics.failedTasks
            ) < maxMissionTasks
        ) {

            const task = mission.tasks.next();

            task.start();

            let taskIterations = 0;
            const maxTaskIterations = Number(
                options.maxTaskIterations ??
                process.env.CODEATLAS_MAX_TASK_ITERATIONS ??
                DEFAULT_MAX_TASK_ITERATIONS
            );

            while (true) {
                taskIterations++;

                if (taskIterations > maxTaskIterations) {
                    task.fail(
                        `Task exceeded ${maxTaskIterations} planning iterations.`
                    );

                    mission.incrementFailedTasks();

                    break;
                }

                mission.incrementPlannerIteration();

                const plan = await this.planner.plan({
                    mission,
                    task,
                });

                await this.executor.execute({
                    mission,
                    task,
                    plan,
                });

                const verification =
                    await this.verifier.verify({
                        mission,
                        task,
                    });

                if (verification.completed) {
                    task.complete({
                        confidence: verification.confidence,
                        reason: verification.reason,
                    });

                    mission.incrementExecutedTasks();

                    break;
                }

                const decision =
                    await this.replanner.replan({
                        mission,
                        task,
                        verification,
                    });

                if (decision.action === "CONTINUE") {
                    continue;
                }

                if (decision.action === "NEW_TASK") {

                    mission.addTask(
                        new Task(decision.task)
                    );

                    continue;
                }

                task.fail(decision.reason);
                mission.incrementFailedTasks();

                break;
            }

        }

        const answer =
            await this.answerGenerator.generate({
                mission,
            });

        mission.finish(answer);

        return {
            answer,
            mission,
        };
    }
}
