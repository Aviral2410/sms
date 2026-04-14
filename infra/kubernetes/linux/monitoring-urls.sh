#!/usr/bin/env bash
set -euo pipefail

TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"
NAMESPACE="${1:-monitoring}"

echo "Grafana:    kubectl -n $NAMESPACE port-forward svc/monitoring-grafana 30090:80"
echo "Prometheus: kubectl -n $NAMESPACE port-forward svc/monitoring-kube-prometheus-prometheus 30091:9090"
echo "Alertmanager: kubectl -n $NAMESPACE port-forward svc/monitoring-kube-prometheus-alertmanager 30093:9093"
