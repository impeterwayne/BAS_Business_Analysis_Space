# Update Workflow — /ba-spec update

Apply confirmed changes to `docs/project-srs.md` without touching unaffected content.

1. **Identify the change:** new or changed Figma section, Feature Checklist change, new PO decision. List affected Use Cases, rules and diagrams in chat.
2. **New design?** Re-read it with `/ba-figma` (`diff` against the previous analysis when available).
3. **New hidden rules or conflicts?** Run the PO gate (`specs` §3) for those items only and wait for the answers.
4. **Edit in place.** Change only the affected Use Cases, rules, feature tree branches and diagrams. Keep IDs and anchors stable; a removed feature disappears from the tree and its Use Cases are deleted (the decisions file keeps the history). Bump `Cập nhật lần cuối` and `Phiên bản`.
5. **Re-render diagrams** with the render script; re-run the self-check on changed Use Cases.
6. **Report** in chat what changed. If a Word copy was exported earlier, remind the user it is now outdated and offer `/ba-export`.
