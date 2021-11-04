import type { SynWorkspace } from "./workspace";
export declare function initBackgroundTasks<CONTENT, DELTA>(workspace: SynWorkspace<CONTENT, DELTA>): {
    cancel: () => void;
};
