# 10 — Paul, the COP24 chat assistant

The "Ask Paul" button sits at the bottom right of every screen. Paul has three jobs, and works out
which one a message is for, or the user picks it.

| Job | What Paul does | Grounding |
| --- | --- | --- |
| 1 · Using the app | Answers "how do I…", explains terms, links to the right screen or mission | The screen register (`src/core/ux/acceptance.ts`), the mission catalog, the glossary and the live status of the active plant |
| 2 · CoP legal consultant | Answers questions about the law for a CoP project and always cites the clause | `corpus/passages.json`: 3,322 passages from 30 in-force ERC sources, searched on the server |
| 3 · Feedback | Thanks the user, records the item, asks one clarifying question and proposes an improvement | Triage by category, severity, screen and related UX test. Items go to the browser register (`/feedback`) and, if configured, become GitHub issues |

## Connecting a language model

Paul uses the first provider whose key is set in Vercel (Project cop24 → Settings → Environment
Variables). See `.env.example`.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-5.5`) | OpenAI Responses API. Get a key at https://platform.openai.com/api-keys |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-opus-5-5`) | Claude Messages API. Get a key at https://console.anthropic.com/settings/keys |
| `PAUL_PROVIDER` | Forces `openai`, `anthropic` or `offline` when both keys exist |
| `GITHUB_FEEDBACK_TOKEN`, `GITHUB_FEEDBACK_REPO` | Forwards feedback as GitHub issues |

Without a key, Paul answers offline from the same grounding. Help comes from the app's own
register. Legal questions get the relevant clauses quoted and cited rather than summarised.
If the provider fails mid-answer, Paul falls back to the offline answer and says so.

`GET /api/paul` reports which provider is connected. It never returns the key.

## Safeguards

- **Legal answers:** the model is told to cite every statement, to say plainly when the passages
  don't answer the question, and never to invent clause numbers, deadlines, limits or fees.
  Every legal answer ends by saying it is guidance, not formal legal advice.
- **Help answers:** the model may only describe screens and missions that exist.
- **Data sent to the provider:** when a model is connected, the conversation and a status summary
  of the active plant go to the provider. The chat footer says so. Uploaded files are never sent.
- **Provider choice:** the provider is chosen on the server from environment variables, never by
  the request.

## Rebuilding the legal index

```bash
npm run corpus:passages
```

This reads `corpus/text/*.json`, which is local and created by `npm run corpus:ingest`. It keeps
in-force sources only, drops the example project report, and splits and de-duplicates the text.
Thai statutes, regulations and official notices are not copyright works (Copyright Act B.E. 2537
s.7), so the official text can be bundled.

## Tests

`src/core/__tests__/paul.test.ts` covers six areas:

- routing each message to the right job;
- index coverage;
- Thai and English retrieval of the governing regulation;
- citation and no-invention rules;
- app-help grounding;
- feedback triage.
