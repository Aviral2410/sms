# Monitoring

This folder is focused on cluster health monitoring first.

Included:
- kube-prometheus-stack Helm values
- Prometheus alert rules for the `sms` namespace

Current visibility:
- cluster health
- workload availability
- pod restart and job failure alerts
- storage pressure alerts

Future improvement:
- add Micrometer Prometheus registry to services that need application-level dashboards
- add ServiceMonitor objects for app metrics endpoints
