# Keys and URLs (Local kind)

## URLs

- Frontend: `http://localhost:30080`
- API Gateway: `http://localhost:30000`
- MCP health: `http://localhost:30084/health`

### Argo CD

- Dashboard (after port-forward): `https://localhost:30443`
- Port-forward: `kubectl -n argocd port-forward svc/argocd-server 30443:443`
- Initial password: `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`

### Vault (dev)

- UI (after port-forward): `http://localhost:30200`
- Port-forward: `kubectl -n vault port-forward svc/vault-ui 30200:8200`
- Root token (local dev mode): `root`

### Ollama (local LLM planner)

- Port-forward: `kubectl -n sms port-forward svc/ollama 11434:11434`
- URL: `http://localhost:11434`

### Monitoring

- Grafana: `http://localhost:30090`
- Prometheus: `http://localhost:30091`
- Alertmanager: `http://localhost:30093`

## GHCR

This repo publishes images to GHCR using a **lowercase owner** (Docker requires lowercase repository names):

- `ghcr.io/aviral2410/sms-<service>:<git-sha>`

## Keys (Vault → Kubernetes Secret `Secret/sms-secrets`)

Canonical inventory (what gets synced into `Secret/sms-secrets`):
- `infra/helm/sms-platform/templates/secrets/external-secrets.yaml`
- `infra/kubernetes/windows/seed-vault.ps1` (dev defaults + example values)

Values shown below are the **current local/dev defaults used in this repo**. Replace them in Vault for any real environment.

| Key | Value (dev) |
|---|---|
| `POSTGRES_USER` | `sms_admin` |
| `POSTGRES_PASSWORD` | `change-me` |
| `JWT_SECRET_KEY` | `change_me_change_me_change_me_2026` |
| `INTERNAL_API_KEY` | `dev-internal-api-key` |
| `PLATFORM_CONFIG_ENCRYPTION_KEY` | `dev-platform-config-encryption-key` |
| `MCP_REQUIRE_AUTH` | `true` |
| `MCP_ENABLE_DOCKER_INSIGHTS` | `false` |
| `LLM_PROVIDER` |  |
| `OLLAMA_BASE_URL` |  |
| `OLLAMA_MODEL` |  |
| `OPENAI_API_KEY` |  |
| `OPENAI_MODEL` |  |
| `GEMINI_API_KEY` |  |
| `OPENROUTER_API_KEY` |  |
| `ANTHROPIC_API_KEY` |  |
| `EMQX_DASHBOARD_USERNAME` | `admin` |
| `EMQX_DASHBOARD_PASSWORD` |  |
| `AI_TOOL_RATE_LIMITS_JSON` |  |
| `BOOTSTRAP_SUPERADMIN_ENABLED` |  |
| `BOOTSTRAP_SUPERADMIN_EMAIL` | `superadmin@sms.local` |
| `BOOTSTRAP_SUPERADMIN_PASSWORD` |  |
| `BOOTSTRAP_SUPERADMIN_FULL_NAME` | `Platform Super Admin` |

## Internal URLs (Vault-managed)

These are injected into pods via `Secret/sms-secrets` so you can change routing centrally in Vault.

Defaults seeded by `infra/kubernetes/windows/seed-vault.ps1` (Kubernetes Service DNS):

| Key | Value (dev) |
|---|---|
| `ONBOARDING_SERVICE_URL` | `http://school-onboarding-service:8081` |
| `AUTH_SERVICE_URL` | `http://auth-service:8082` |
| `SCHOOL_OPERATIONS_SERVICE_URL` | `http://school-operations-service:8083` |
| `COMMUNICATION_SERVICE_URL` | `http://communication-service:8089` |
| `FINANCE_SERVICE_URL` | `http://finance-service:8085` |
| `SUBSCRIPTION_SERVICE_URL` | `http://subscription-service:8086` |
| `PLATFORM_CONFIG_SERVICE_URL` | `http://school-onboarding-service:8081` |
| `MCP_SERVER_URL` | `http://mcp-server:8084` |
| `AI_INTERACTION_SERVICE_URL` | `http://ai-interaction-service:8090` |
| `GATEWAY_BASE_URL` | `http://api-gateway:8080` |
| `GATEWAY_PUBLIC_BASE_URL` | `http://api-gateway:8080` |
| `MCP_PUBLIC_BASE_URL` | `http://mcp-server:8084` |

## `.env`

This repo no longer uses `.env` as a deployment input. Secrets are managed through Vault → External Secrets Operator → `Secret/sms-secrets`.
