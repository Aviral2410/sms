# Endpoints (Local kind)

## App (namespace `sms`)

- Frontend (NodePort): `http://localhost:30080`
- API Gateway (NodePort): `http://localhost:30000`
- MCP Server health (NodePort): `http://localhost:30084/health`

Other services are `ClusterIP` by default (reachable inside the cluster):
- `auth-service:8082`
- `school-onboarding-service:8081`
- `school-operations-service:8083`
- `finance-service:8085`
- `communication-service:8089`
- `subscription-service:8086`
- `ai-interaction-service:8090`

## Monitoring (namespace `monitoring`)

If installed via `infra/kubernetes/windows/install-monitoring.ps1`, the monitoring stack can be exposed as NodePorts (see `infra/kubernetes/operations/monitoring/kube-prometheus-stack-values.yaml`):

- Grafana: `http://localhost:30090`
- Prometheus: `http://localhost:30091`
- Alertmanager: `http://localhost:30093`

Grafana default admin password is set in the values file and should be rotated for any non-local environment.

