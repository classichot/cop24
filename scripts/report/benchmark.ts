/**
 * Report-model benchmark (Report Generation Quality Standard §9).
 *
 *   npm run report:benchmark                  # show the plan and estimated cost, spend nothing
 *   npm run report:benchmark -- --yes         # run the held-out CoP cases on the configured model
 *   npm run report:benchmark -- --approve "Name, role" --editorial 4.5
 *                                             # a human reviewer signs off the latest passing run
 *
 * Needs OPENAI_API_KEY or ANTHROPIC_API_KEY in the environment (e.g. `npx vercel env pull .env.local`
 * then `node --env-file=.env.local ...`). Outputs go to benchmarks/report/ for the reviewer to read.
 * A model is approved only by a passing run plus a named human reviewer — never automatically.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { BENCHMARK, BENCHMARK_VERSION, gradeSection, sectionPrompt, summarise, type Grade } from "../../src/core/report/benchmark";
import { meetsFloor, registered } from "../../src/core/report/models";
import { configuredReportModel, generate } from "../../src/lib/llm/server";
import { MODEL_EVALUATIONS } from "../../src/data/model-evaluations";

const ROOT = resolve(import.meta.dirname, "../..");
const OUT = join(ROOT, "benchmarks/report");
const args = process.argv.slice(2);
const flag = (k: string) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };

const cfg = configuredReportModel();
if (!cfg) { console.error("No OPENAI_API_KEY or ANTHROPIC_API_KEY in the environment."); process.exit(1); }
const model = flag("--model") ?? cfg.modelId;
const latest = join(OUT, `${model}-latest.json`);

if (flag("--approve")) {
  if (!existsSync(latest)) { console.error(`No run found for ${model}. Run the benchmark first.`); process.exit(1); }
  const run = JSON.parse(readFileSync(latest, "utf8")) as { passed: boolean; factual: number; date: string; dataset: string };
  if (!run.passed) { console.error(`The latest run for ${model} did not pass (factual ${run.factual}). It cannot be approved.`); process.exit(1); }
  const editorial = Number(flag("--editorial") ?? NaN);
  if (!(editorial >= 4)) { console.error("Give the reviewer's editorial score out of 5 with --editorial (approval needs ≥ 4)."); process.exit(1); }
  const evaluations = [...MODEL_EVALUATIONS, { modelId: model, evaluation: { category: "authority-th", task: "drafting", datasetVersion: run.dataset, date: run.date, factual: run.factual, editorial, longDocument: 0, passed: true, reviewers: [flag("--approve")!] } }];
  const file = join(ROOT, "src/data/model-evaluations.ts");
  const head = readFileSync(file, "utf8").split("export const MODEL_EVALUATIONS")[0];
  writeFileSync(file, `${head}export const MODEL_EVALUATIONS: { modelId: string; evaluation: ModelEvaluation }[] = ${JSON.stringify(evaluations, null, 2)};\n`);
  console.log(`Recorded: ${model} approved for authority-th drafting by ${flag("--approve")} (editorial ${editorial}/5). Commit src/data/model-evaluations.ts.`);
  process.exit(0);
}

const m = registered(model);
if (!m) { console.error(`${model} is not in the report model registry (src/core/report/models.ts).`); process.exit(1); }
if (!meetsFloor(m, "authority-th", "drafting")) { console.error(`${model} is a "${m.tier}" model — below the frontier floor for authority reports.`); process.exit(1); }

console.log(`Benchmark ${BENCHMARK_VERSION} · model ${model} (${cfg.provider}) · ${BENCHMARK.length} held-out cases at high reasoning effort`);
console.log("Estimated cost: about 5 calls × ~3k input + ~6k reasoning/output tokens — a few US cents to well under a dollar, depending on pricing.");
if (!args.includes("--yes")) { console.log("Nothing was sent. Re-run with --yes to spend and run."); process.exit(0); }

async function main() {
mkdirSync(OUT, { recursive: true });
const grades: Grade[] = [];
const md: string[] = [`# ${model} — ${BENCHMARK_VERSION}`, ""];
for (const c of BENCHMARK) {
  const { system, user } = sectionPrompt(c);
  const t0 = Date.now();
  let text = "";
  try { text = await generate(cfg!.provider, model, system, user); } catch (e) { text = `[error] ${String(e)}`; }
  const g = gradeSection(text, c);
  grades.push(g);
  console.log(`${g.passed ? "✔" : "✖"} ${c.id.padEnd(20)} factual ${g.factual} · ${g.checks.filter((x) => !x.pass).map((x) => `${x.id}: ${x.detail}`).join(" · ") || "all checks pass"} · ${Math.round((Date.now() - t0) / 1000)}s`);
  md.push(`## ${c.title.en}`, "", `**Task:** ${c.task}`, "", text, "", `Checks: ${g.checks.map((x) => `${x.pass ? "✔" : "✖"} ${x.id} (${x.detail})`).join(" · ")}`, "");
}
const s = summarise(grades);
const date = new Date().toISOString().slice(0, 10);
const result = { model, dataset: BENCHMARK_VERSION, date, factual: s.factual, passed: s.passed, cases: BENCHMARK.map((c, i) => ({ id: c.id, ...grades[i] })) };
writeFileSync(latest, JSON.stringify(result, null, 2));
writeFileSync(join(OUT, `${model}-latest.md`), md.join("\n"));
console.log(`\n${s.passed ? "PASSED" : "NOT PASSED"} · mean factual ${s.factual} · outputs for the reviewer: benchmarks/report/${model}-latest.md`);
console.log(s.passed ? `A qualified reviewer now reads the outputs and, if satisfied, runs:\n  npm run report:benchmark -- --approve "Name, role" --editorial <1-5>` : "The model stays a candidate; report drafting remains evidence-only.");
process.exit(s.passed ? 0 : 1);
}

void main();
