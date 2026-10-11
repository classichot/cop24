import type { ModelEvaluation } from "@/core/report/types";

/**
 * Recorded report-benchmark results (written by `npm run report:benchmark`). A model is approved
 * for a category/task only by an entry that passed AND names at least one human reviewer.
 * Edit by running the benchmark, never by hand-typing a pass.
 */
export const MODEL_EVALUATIONS: { modelId: string; evaluation: ModelEvaluation }[] = [];
