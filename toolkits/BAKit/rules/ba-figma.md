---
trigger: always_on
---

# BA Figma Rule (figma-mcp-android)

When a message carries a **Figma URL** (`https://www.figma.com/design/...`, `/file/...`, `/proto/...`), a
**node-id**, or asks to write a PRD, SRS, FSD, use case or user story "from the design", the design is read
through the `figma-mcp-android` MCP server before anything is written. Never describe a screen you have not
inspected, and never write requirements from a Figma link you could not open.

## Route, do not improvise

| Request | Entry point |
| :--- | :--- |
| Read a design into BA input (screens, fields, states, messages, flows) | `/ba-figma` → `figma-analyst` → skill `figma-ba-analysis` |
| FSD / use cases / user stories from a design | `/ba-figma` first, then `/ba-spec analyze` or `/ba-template user-stories` with the analysis as input |
| Compare a new design version with an earlier analysis | `/ba-figma <url> diff <previous analysis>` |

The steps, the MCP call budget and the output shape live in the `figma-ba-analysis` skill and the
`figma-analysis` template in `ba-templates`. They are not restated here.

## The things that are always true

1. **Figma Desktop must be running the bridge plugin** in the file the URL points to. The server reads the
   document open in Figma Desktop over `ws://127.0.0.1:1994`; it cannot open a URL by itself. If a call fails
   with a connection error, stop and ask the user to open the file and run the plugin.
2. **Convert the node-id.** URLs encode the colon as `%3A` or `-`: `node-id=123-456` is `123:456` in every call.
3. **Never call `get_document`.** A whole Figma file exhausts the context window and ends the task. Use
   bounded `get_design_context` only.
4. **`save_screenshots` takes absolute output paths** with forward slashes. The server's working directory is
   not the workspace.
5. **Figma is read-only input.** The design is evidence, not a decision: a requirement drawn from it stays a
   candidate (`FR-DSN-*`) until the user confirms it.
