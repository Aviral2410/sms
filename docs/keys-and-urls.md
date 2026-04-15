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

### Monitoring

- Grafana: `http://localhost:30090`
- Prometheus: `http://localhost:30091`
- Alertmanager: `http://localhost:30093`

## Keys (Vault → Kubernetes Secret `sms/sms-secrets`)

Canonical inventory: `infra/secrets/day0keyvaultseed.yaml`

### Required (must be set by you in Vault)

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `JWT_SECRET_KEY`
- `INTERNAL_API_KEY`
- `PLATFORM_CONFIG_ENCRYPTION_KEY`

### Optional (set if you use them)

- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `GEMINI_API_KEY`
- `OPENROUTER_API_KEY`
- `ANTHROPIC_API_KEY`
- `LLM_PROVIDER`
- `EMQX_DASHBOARD_USERNAME`, `EMQX_DASHBOARD_PASSWORD`
- `MCP_REQUIRE_AUTH`, `MCP_ENABLE_DOCKER_INSIGHTS`

### Dev-only bootstrap (don’t enable in prod)

- `BOOTSTRAP_SUPERADMIN_ENABLED`
- `BOOTSTRAP_SUPERADMIN_EMAIL`
- `BOOTSTRAP_SUPERADMIN_PASSWORD`
- `BOOTSTRAP_SUPERADMIN_FULL_NAME`

## Do we still need `.env`?

- For GitOps/Vault environments: **no** (Vault/ESO becomes the source of truth).
- For local quick dev without Vault: `.env` / `.env.example` is still a convenient fallback to create `sms-secrets`.

