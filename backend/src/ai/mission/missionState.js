export const MissionState = Object.freeze({
    CREATED: "CREATED",

    ANALYZING: "ANALYZING",

    PLANNING: "PLANNING",

    EXECUTING: "EXECUTING",

    VERIFYING: "VERIFYING",

    REPLANNING: "REPLANNING",

    ANSWERING: "ANSWERING",

    COMPLETED: "COMPLETED",

    FAILED: "FAILED",
});

const allowedTransitions = {
    [MissionState.CREATED]: [
        MissionState.ANALYZING,
    ],

    [MissionState.ANALYZING]: [
        MissionState.PLANNING,
        MissionState.FAILED,
    ],

    [MissionState.PLANNING]: [
        MissionState.EXECUTING,
        MissionState.FAILED,
    ],

    [MissionState.EXECUTING]: [
        MissionState.VERIFYING,
        MissionState.FAILED,
    ],

    [MissionState.VERIFYING]: [
        MissionState.REPLANNING,
        MissionState.ANSWERING,
        MissionState.FAILED,
    ],

    [MissionState.REPLANNING]: [
        MissionState.PLANNING,
        MissionState.FAILED,
    ],

    [MissionState.ANSWERING]: [
        MissionState.COMPLETED,
        MissionState.FAILED,
    ],

    [MissionState.COMPLETED]: [],

    [MissionState.FAILED]: [],
};

export function canTransition(from, to) {
    return allowedTransitions[from]?.includes(to) ?? false;
}

export function assertTransition(from, to) {
    if (!canTransition(from, to)) {
        throw new Error(
            `Invalid mission state transition: ${from} -> ${to}`
        );
    }
}