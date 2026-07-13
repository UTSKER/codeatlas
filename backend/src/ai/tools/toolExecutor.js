// Re-export the canonical TaskExecutor.
// The old ToolExecutor in this file was a stale duplicate that did not store
// requirementId on evidence entries and used the wrong execute() interface.
// All callers should import from "../../tasks/taskExecutor.js".
export { TaskExecutor as ToolExecutor } from "../tasks/taskExecutor.js";
