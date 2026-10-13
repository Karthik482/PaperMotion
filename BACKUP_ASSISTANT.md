# OpenCode backup assistant

Installed on this Windows account:

- OpenCode 1.18.35 (`opencode-ai` npm package)
- FreeLLMAPI desktop 0.13.6 (official Windows installer, SHA256 verified)
- FreeLLMAPI configuration CLI 0.8.0

Codex's extension and configuration were left unchanged.

## Use it in any project

Launch FreeLLMAPI from the Windows Start menu or tray. Its desktop gateway is
at **http://127.0.0.1:31415**, with the API at `/v1`. PaperMotion continues to
use port 3001. The desktop dashboard automatically signs you into its local
account; open it from the tray if a browser asks you to log in.

Open a terminal in the project you want to work on and run:

```powershell
opencode
```

If an existing VS Code terminal cannot find the command, restart VS Code to
refresh its PATH, or use `& "$env:APPDATA\npm\opencode.cmd"`.

The global configuration lives at `%USERPROFILE%\.config\opencode\opencode.json`.
Its default model is `freellmapi/auto`. The gateway key is referenced from a
separate file in that directory, restricted to your Windows account; no key
needs to be pasted into a command or added to this project.

Switching from Codex to OpenCode is manual. FreeLLMAPI controls routing inside
OpenCode. A project-specific OpenCode configuration can override global defaults.

## Configured coding chain

FreeLLMAPI's active profile is `coding-backup`, with priority routing and
automatic exploration disabled. The original Default chain is preserved.
The coding chain contains only models marked as supporting tool calls:

1. Google: `gemini-3.5-flash-lite`
2. Google: `gemini-3.8-flash`
3. OpenRouter: `cohere/north-mini-code:free`

The first and third entries returned successful live responses during
verification. Gemini 3.8 Flash returned a successful small response but also a
503 high-demand error during the coding task, so it is a secondary choice.
Groq is excluded from this coding profile at your request. Its saved key is
retained in FreeLLMAPI for future use.

Provider credentials are stored by FreeLLMAPI. Do not paste keys into chat.
Check each provider's current free-tier limits in its own dashboard.
Automatic routing does not create provider accounts or supply provider keys.
This profile is active gateway-wide for requests using `auto`.

## Verify fallback

1. Send a small prompt using `auto` in the Playground; check the request's
   served provider/model in the dashboard.
2. Temporarily disable that provider's key and send another prompt using `auto`.
3. Confirm a different provider successfully responds, then restore the first key.

Verified on October 9, 2026:

- OpenCode read and edited an isolated JavaScript function; all six checks passed
  for stable deduplication, empty input, strings, input preservation, NaN/zero,
  and repeated object references. No PaperMotion application files were edited.
- The coding request encountered Gemini 3.8 Flash's 503 high-demand error and
  automatically moved to Gemini 3.5 Flash Lite, which completed the task.
- With Gemini temporarily disabled, OpenCode returned the requested JavaScript
  function through Groq's `openai/gpt-oss-120b` (request 15, successful).
- A separate controlled gateway test with Gemini disabled returned code through
  OpenRouter's free `cohere/north-mini-code` model (request 14, successful).
- After restricting the coding chain to Gemini and OpenRouter at your request,
  OpenCode itself returned the requested JavaScript function through OpenRouter
  with Gemini temporarily disabled (request 16, successful).
- Gemini's original enabled state was restored after both tests. All configured
  provider keys remain enabled. No credentials were printed or committed.

These checks demonstrate model fallback and provider failover when a provider
is unavailable. They do not simulate an actual exhausted provider quota.

Initially, the older Gemini 2.5 models returned 404 for this account and Groq
returned 401 on inference. The chain was updated to current Gemini models;
Groq subsequently succeeded in a live OpenCode test, but is now excluded from
the coding profile according to your preference.

## Official references

- [OpenCode installation](https://opencode.ai/docs/)
- [OpenCode global configuration](https://opencode.ai/docs/config/)
- [FreeLLMAPI Windows releases](https://github.com/tashfeenahmed/freellmapi/releases)
- [FreeLLMAPI coding-agent integration](https://github.com/tashfeenahmed/freellmapi/blob/main/docs/en/clients/01-agent-clients.md)

Only `setup-opencode` was used. Do not run `setup-codex` if you want to preserve
your existing Codex configuration.
