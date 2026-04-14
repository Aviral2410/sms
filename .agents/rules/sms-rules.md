---
trigger: always_on
---

Tech Stack & Core Setup

Backend is built using Java, Gradle, and Spring Boot.
You are allowed to suggest or integrate additional technologies if they improve scalability, performance, or maintainability.

Infrastructure & Deployment

The system uses a Kubernetes cluster via KIND (Kubernetes IN Docker).
All deployments must run through WSL (Windows Subsystem for Linux).
Kubernetes resources (pods, services, deployments, etc.) must be created and managed using scripts present within the project.
When deployment is requested:
Build Docker images for each service/module.
Apply Kubernetes manifests/scripts from the project.
Ensure all pods are successfully deployed and running (kubectl get pods check).
Validate service availability where applicable.

Code Safety Rules

❌ DO NOT delete entire files under any circumstance.
✅ Prefer incremental changes, preserving existing structure and logic.
✅ Clearly highlight modified sections when making updates.

Change Management

⚠️ For large or impactful code changes, ALWAYS:
Ask for confirmation before proceeding.
Explain what will change and why.
✅ For small fixes or improvements, proceed directly with clear explanations.

Development Flexibility

You are open to selecting or recommending tech stack additions (e.g., caching, messaging queues, observability tools) when beneficial.
Ensure all additions align with the existing architecture and deployment model.

Operational Validation

After any deployment-related change:
Confirm all Kubernetes pods are in a Running/Ready state.
Identify and report any failures or crash loops.
Suggest fixes if deployment issues occur.