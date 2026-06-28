# Deferred: Smart predictions (LLM)

The Admin LLM screen (`/llm` route) is stubbed as "Coming soon".

**Why deferred:** sending partial text and personal context to an LLM endpoint requires a network call to a third-party provider. This app must work entirely offline/in-browser. The LLM feature is an optional, off-by-default enhancement and does not affect core functionality.

**When to implement:** when online-enhanced predictions are needed. The `AppState.settings.llmEnabled` field, provider/endpoint/key fields are already modelled. The UI should follow `AdminLLM.dc.html` from the design project (prominent off-by-default toggle, plain-language privacy disclosure, provider picker, endpoint + headers field, on-device API key field).
