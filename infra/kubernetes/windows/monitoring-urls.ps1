param(
    [string]$Namespace = "monitoring"
)

Write-Host "Grafana:      kubectl -n $Namespace port-forward svc/monitoring-grafana 30090:80"
Write-Host "Prometheus:   kubectl -n $Namespace port-forward svc/monitoring-kube-prometheus-prometheus 30091:9090"
Write-Host "Alertmanager: kubectl -n $Namespace port-forward svc/monitoring-kube-prometheus-alertmanager 30093:9093"
Write-Host "Grafana URL after port-forward: http://localhost:30090"
Write-Host "Prometheus URL after port-forward: http://localhost:30091"
Write-Host "Alertmanager URL after port-forward: http://localhost:30093"
