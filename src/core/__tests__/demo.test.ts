/**
 * Demo mode, the app journey and the user manual stay in step with the app: every tour step and
 * journey stage points at a page that exists, every spotlight selector is a class the app renders,
 * and the journey runs from one start menu to one finish menu.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { TOUR } from "../ux/tour";
import { APP_JOURNEY, helperOf, journeyMarker } from "../ux/app-journey";
import { NAV_ORDER } from "../ux/nav";
import { MANUAL } from "../../data/manual";

const ROOT = resolve(import.meta.dirname, "../../..");
const APP = join(ROOT, "src/app");
const isPage = (route: string) => existsSync(join(APP, route === "/" ? "" : route.slice(1), "page.tsx"));
const tsx = (dir: string): string[] => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? tsx(p) : p.endsWith(".tsx") ? [p] : []; });
const SOURCE = [...tsx(join(ROOT, "src/app")), ...tsx(join(ROOT, "src/components"))].map((f) => readFileSync(f, "utf8")).join("\n");

test("demo tour: unique steps on real pages, spotlighting classes the app renders", () => {
  assert.equal(new Set(TOUR.map((s) => s.id)).size, TOUR.length, "tour step ids must be unique");
  for (const s of TOUR) {
    assert.ok(isPage(s.route), `${s.id} points at ${s.route}, which is not a page`);
    for (const cls of s.selector?.match(/\.[a-z][\w-]*/g) ?? []) assert.ok(SOURCE.includes(cls.slice(1)), `${s.id} spotlights ${cls}, which no page or component renders`);
    for (const f of [s.title, s.body]) assert.ok(f.th.trim() && f.en.trim(), `${s.id} is missing Thai or English text`);
  }
  assert.equal(TOUR[0].selector, undefined, "the tour opens on a centred welcome card");
});

test("app journey: one start menu first, one finish menu last, every stage a numbered menu", () => {
  assert.equal(APP_JOURNEY[0].kind, "start");
  assert.equal(APP_JOURNEY.at(-1)!.kind, "finish");
  assert.equal(APP_JOURNEY.filter((s) => s.kind === "start").length, 1);
  assert.equal(APP_JOURNEY.filter((s) => s.kind === "finish").length, 1);
  assert.equal(new Set(APP_JOURNEY.map((s) => s.route)).size, APP_JOURNEY.length, "a menu appears on the journey once");
  for (const s of APP_JOURNEY) {
    assert.ok(isPage(s.route) && NAV_ORDER.includes(s.route), `${s.route} must be a page in the left menu`);
    for (const h of s.helpers ?? []) {
      assert.ok(NAV_ORDER.includes(h), `helper ${h} must be in the left menu`);
      assert.ok(!APP_JOURNEY.some((x) => x.route === h), `${h} is on the path, so it cannot also be a helper`);
      assert.equal(helperOf(h)?.route, s.route, `${h} helps exactly one stage`);
    }
  }
  assert.deepEqual(APP_JOURNEY.map((s) => journeyMarker(s.route)), ["START", "2", "3", "4", "5", "6", "7", "FINISH"]);
  assert.equal(journeyMarker("/corpus"), "", "menus off the path carry no marker");
});

test("user manual: bilingual sections whose “Show me” buttons open real tour steps", () => {
  assert.equal(new Set(MANUAL.map((s) => s.id)).size, MANUAL.length);
  MANUAL.forEach((s, i) => {
    assert.ok(s.title.en.startsWith(`${i + 1}. `) && s.title.th.startsWith(`${i + 1}. `), `section ${s.id} is numbered ${i + 1}`);
    for (const f of [s.title, s.intro, ...(s.steps ?? []), ...(s.notes ?? [])]) assert.ok(f.th.trim() && f.en.trim(), `${s.id} is missing Thai or English text`);
    if (s.tour) assert.ok(TOUR.some((x) => x.id === s.tour), `${s.id} links to a tour step that does not exist: ${s.tour}`);
  });
  const md = readFileSync(join(ROOT, "docs/12-user-manual.md"), "utf8");
  for (const s of MANUAL) assert.ok(md.includes(s.title.en), `docs/12-user-manual.md is stale — run npm run manual:md (${s.id})`);
});
