# Helm Chart

This chart is now the primary production deployment source of truth for the full application stack.

It manages:
- platform services: PostgreSQL and EMQX
- optional local LLM: Ollama (for tool planning)
- application services: frontend, gateway, MCP, and all Spring Boot services
- operational bootstrap: DB repair job
- north-south routing: ingress
- safety controls: HPA and PDB for key workloads

## Production install

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\helm\scripts\windows\deploy.ps1 `
  -ReleaseName sms-platform `
  -Namespace sms `
  -ValuesFile infra\helm\sms-platform\values-production.yaml `
  -Registry ghcr.io/your-org
```

Ubuntu:

```bash
bash ./infra/helm/scripts/linux/deploy.sh sms-platform sms infra/helm/sms-platform/values-production.yaml ghcr.io/your-org
```

Direct Helm:

```powershell
helm upgrade --install sms-platform .\infra\helm\sms-platform `
  --namespace sms `
  --create-namespace `
  --atomic `
  --wait `
  --timeout 15m `
  -f .\infra\helm\sms-platform\values-production.yaml `
  --set-string global.imageRegistry=ghcr.io/your-org
```

## Change a single service image

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\helm\scripts\windows\set-service-image-tag.ps1 `
  -Service api-gateway `
  -Tag 2026-04-08.1 `
  -Registry ghcr.io/your-org
```

Override the repository too:

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\helm\scripts\windows\set-service-image-tag.ps1 `
  -Service api-gateway `
  -ImageRepository ghcr.io/your-org/sms-api-gateway `
  -Tag 2026-04-08.1
```

Ubuntu:

```bash
bash ./infra/helm/scripts/linux/set-service-image-tag.sh api-gateway 2026-04-08.1 "" ghcr.io/your-org
```

## Values files

- [values.yaml](D:\sms-1\infra\helm\sms-platform\values.yaml): shared baseline
- [values-staging.yaml](D:\sms-1\infra\helm\sms-platform\values-staging.yaml): staging ingress hosts
- [values-production.yaml](D:\sms-1\infra\helm\sms-platform\values-production.yaml): production ingress hosts

## Secrets

The chart expects one secret by default: `sms-secrets`.

You can either:
- create it externally through External Secrets Operator or a vault sync
- have Helm create it by setting `global.secrets.create=true` and populating `global.secrets.data`

The secret name is driven by `global.secrets.existingSecret`, so production can point to a vault-managed secret without editing templates.

### Ollama (free + open source)

To enable local LLM planning through Ollama inside the cluster:

- `services.ollama.enabled=true`
- Set these keys in `sms-secrets` (Vault-managed or Helm-created):
  - `LLM_PROVIDER=OLLAMA`
  - `OLLAMA_BASE_URL=http://ollama:11434`
  - `OLLAMA_MODEL=llama3.2:1b`

`ai-interaction-service` will call `OLLAMA_BASE_URL/api/chat` to plan which internal tool to run. The tool execution and all rendering stays inside the platform UI.
