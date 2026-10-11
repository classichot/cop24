import { triageFeedback } from "@/core/paul/paul";
import { requireAuth } from "@/lib/auth/token";

/**
 * POST /api/paul/feedback — forwards a feedback item to the team's GitHub issues so it can be
 * acted on, when GITHUB_FEEDBACK_TOKEN (fine-grained, Issues: read & write) and
 * GITHUB_FEEDBACK_REPO ("owner/repo") are set. Otherwise it returns forwarded: false and the
 * item stays in the browser's feedback register.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body { text: string; route?: string; lang?: "th" | "en"; role?: string; conversation?: string }

export async function POST(req: Request) {
  const denied = await requireAuth(req);
  if (denied) return denied;
  let body: Body;
  try { body = (await req.json()) as Body; } catch { return Response.json({ error: "invalid JSON" }, { status: 400 }); }
  const text = String(body.text ?? "").trim().slice(0, 4000);
  if (!text) return Response.json({ error: "text is required" }, { status: 400 });
  const route = String(body.route ?? "/").slice(0, 80);
  const triage = triageFeedback(text, route);
  const token = process.env.GITHUB_FEEDBACK_TOKEN, repo = process.env.GITHUB_FEEDBACK_REPO;
  if (!token || !repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) return Response.json({ forwarded: false, triage });

  const issue = {
    title: `[${triage.category}] ${triage.summary.slice(0, 90)}`,
    body: [
      `**Feedback via Paul** · screen \`${triage.route}\` (${triage.screen}) · severity **${triage.severity}**${triage.uxTest ? ` · UX test: ${triage.uxTest}` : ""} · role ${String(body.role ?? "-").slice(0, 20)}`,
      "",
      "> " + text.replace(/\n/g, "\n> "),
      body.conversation ? `\n<details><summary>Conversation</summary>\n\n${String(body.conversation).slice(0, 6000)}\n</details>` : "",
    ].join("\n"),
    labels: ["feedback", `feedback:${triage.category}`],
  };
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/issues`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "content-type": "application/json", "x-github-api-version": "2022-11-28" },
      body: JSON.stringify(issue),
    });
    if (!r.ok) return Response.json({ forwarded: false, triage, error: `GitHub ${r.status}` });
    const j = (await r.json()) as { html_url?: string; number?: number };
    return Response.json({ forwarded: true, triage, url: j.html_url, number: j.number });
  } catch {
    return Response.json({ forwarded: false, triage, error: "GitHub unreachable" });
  }
}
