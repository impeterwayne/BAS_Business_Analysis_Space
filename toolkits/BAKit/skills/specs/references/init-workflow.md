# Init Workflow — /ba-spec init

Create `docs/project-srs.md` for the app.

1. **Read inputs.** Feature Checklist (latest), APK evidence (if any), existing Figma analyses, existing decisions files, project config. If `docs/project-srs.md` already exists, switch to `update` and tell the user.
2. **Skeleton.** Write the header table, section 1 (one sentence; ask the PO in chat if the purpose is unclear), section 2 (feature tree from the in-scope checklist rows, from Home onward) and section 3 (global rules already confirmed in decisions files; empty table row removed if none). Run the render script for the feature tree.
3. **Use Cases section by section.** For every Figma section the PO sends, run `analyze-workflow.md`. Never write Use Cases for a feature whose Figma section has not been read and whose PO gate has not passed.
4. **Report** in chat (Vietnamese): file path, sections written, Use Cases still waiting for a Figma section or PO answers.
