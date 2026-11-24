# figma-mcp-android Tools (BA subset)

MCP server: `figma-mcp-android` (`npx -y @impeterwayne/figma-mcp-android@latest`). It is a read-only bridge
to the document open in **Figma Desktop**: the server listens on `ws://127.0.0.1:1994` and the Figma plugin
(Plugins → Development → Import plugin from manifest, then run it in the file) connects to it. No Figma API
token is needed. Only one server can hold the port, so run it in one Antigravity workspace at a time.

## Tools a BA analysis uses

| Tool | Key parameters | Use it for |
| :--- | :--- | :--- |
| `get_metadata` | — | First call: confirms the bridge is connected and which file is open |
| `get_pages` | — | Finding the page that holds the flow ("App", "Mobile UI", …) |
| `get_selection` | `depth`, `detail` (optional) | Frames the user selected in Figma |
| `search_nodes` | `query`, `types`, `nodeId`, `limit` | Locating a screen by name when no node id is given |
| `get_design_context` | `depth` (default `2`), `detail` (`minimal` / `compact` / `full`), `dedupe_components` | Bounded tree of the current selection or active page (does **not** take `nodeId`) |
| `get_node` | `nodeId`, `depth` (default `2`), `detail` (`minimal` / `compact` / `full`) | Bounded subtree or exact properties of one node by ID |
| `get_nodes_info` | `nodeIds[]`, `depth`, `detail` | Several nodes in one call (variant sweep or batch frame skeletons) |
| `scan_text_nodes` | `nodeId` | Every string on a screen — labels, errors, dialogs |
| `scan_nodes_by_types` | `nodeId`, `types[]` | Interactive instances, components, frames |
| `get_local_components` | — | Component definitions and variant sets (states) |
| `get_reactions` | `nodeId` | Prototype interactions: trigger, action, destination |
| `get_annotations` | `nodeId` | Designer notes and Dev Mode annotations |
| `save_screenshots` | `items[{nodeId, outputPath, format, scale}]` | Reference PNGs on disk (absolute `outputPath`) |
| `get_screenshot` | `nodeIds[]`, `format`, `scale` | A quick look inside the conversation (not saved) |

## Tools a BA analysis does not use

| Tool | Why not |
| :--- | :--- |
| `get_document` | Whole file: exhausts the context window. Never call it. |
| `get_styles`, `get_variable_defs`, `export_tokens`, `get_fonts` | Visual design tokens — developer input, not requirements |
| `convert_svg_to_android_drawable` | Android asset conversion (AndroidHarnessAGY's pipeline) |
| `get_viewport` | Designer's viewport; not evidence |

## Call sequence (one frame)

```
get_metadata
get_node            {nodeId: "102:456", depth: 2, detail: "minimal"}
save_screenshots    {format: "PNG", scale: 2, items: [{nodeId: "102:456", outputPath: "<project>/docs/BA/figma/login/screens/01-login.png"}]}
get_node            {nodeId: "102:470", depth: 3, detail: "compact"}
scan_text_nodes     {nodeId: "102:456"}
get_reactions       {nodeId: "102:480"}
get_annotations     {nodeId: "102:456"}
```

(When exploring the current selection or active page without a `nodeId`, call `get_design_context {depth: 2, detail: "minimal", dedupe_components: true}`.)

## Errors

| Symptom | Meaning | Do |
| :--- | :--- | :--- |
| Connection refused / no plugin connected | Figma Desktop or the plugin is not running | Stop; ask the user to open the file and run the plugin |
| Node not found | Wrong file open, or the id was mis-converted | Check `get_metadata`; re-convert `-` / `%3A` to `:` |
| Tool not listed at all | The MCP server is not registered for this workspace | Ask the user to tick **Figma MCP** in BA Space (Agent Toolkit) and restart the agent |
| Response truncated / huge | `depth` or `detail` too high | Lower `depth`, use `minimal`, target a child container |
