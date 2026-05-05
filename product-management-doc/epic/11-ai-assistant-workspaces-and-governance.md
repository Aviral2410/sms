# Epic 11: AI Assistant, Workspaces, and Governance

## Epic Intent

Provide an AI copilot layer for public and authenticated users with safe action execution, conversation memory, workspaces, streaming, and governance controls.

## Primary Users

- Platform admin
- School admin
- Teacher
- Student
- Parent
- Public visitor

## Current Implementation Requirements

- AI chat must support synchronous and streaming interaction.
- Action confirmation must be supported through confirmation tokens.
- Tool catalog retrieval must be role-aware.
- Workspace management must support:
  list, create, rename, and delete.
- Chat management must support:
  list all chats, list workspace chats, create workspace chat, delete chat, move chat, and list chat messages.
- Compatibility streaming chat API and conversation clearing endpoints are present.
- Frontend must expose:
  public assistant, authenticated AI assistant, Aura workspace, AI briefing, AI governance, AI copilot panels, and learning/visualization surfaces.
- School-ops AI endpoints must support:
  lesson plan, feedback, visualize, visualize stream, example generation, and risk analysis.

## Current Product Notes

- AI is already integrated as a platform capability rather than a single feature.
- This makes governance and role-boundary clarity especially important because AI touches multiple records and actions.
- Test coverage is visibly strongest in this area, which is a relative advantage.

## Known Gaps / Stabilization Needs

- Validate tool authorization boundaries with real role journeys.
- Strengthen observability for failed action confirmations and streaming interruptions.
- Ensure workspace/chat lifecycle remains stable under concurrent or repeated use.
- Separate “insight generation” from “record-changing action” very clearly in UX and analytics.

## Success Metrics

- AI chat completion success rate
- action confirmation acceptance rate
- unauthorized tool attempt count
- workspace/chat data integrity incidents
