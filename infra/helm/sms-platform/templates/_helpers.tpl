{{- define "sms.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "sms.commonLabels" -}}
helm.sh/chart: {{ include "sms.chart" .root }}
app.kubernetes.io/managed-by: {{ .root.Release.Service }}
app.kubernetes.io/instance: {{ .root.Release.Name }}
{{- if .serviceName }}
app.kubernetes.io/name: {{ .serviceName }}
{{- else }}
app.kubernetes.io/name: {{ .root.Chart.Name }}
{{- end }}
{{- range $key, $value := .root.Values.global.commonLabels }}
{{ $key }}: {{ $value | quote }}
{{- end }}
{{- end -}}

{{- define "sms.selectorLabels" -}}
app.kubernetes.io/instance: {{ .root.Release.Name }}
app.kubernetes.io/name: {{ .serviceName }}
{{- end -}}

{{- define "sms.image" -}}
{{- $root := .root -}}
{{- $image := .image -}}
{{- if $root.Values.global.imageRegistry -}}
{{ printf "%s/%s:%s" $root.Values.global.imageRegistry $image.repository $image.tag }}
{{- else -}}
{{ printf "%s:%s" $image.repository $image.tag }}
{{- end -}}
{{- end -}}

{{- define "sms.secretName" -}}
{{- .Values.global.secrets.existingSecret -}}
{{- end -}}

{{- define "sms.imagePullSecrets" -}}
{{- if .Values.global.imagePullSecrets }}
imagePullSecrets:
{{- range .Values.global.imagePullSecrets }}
  - name: {{ . }}
{{- end }}
{{- end }}
{{- end -}}

{{- define "sms.podSettings" -}}
{{ include "sms.imagePullSecrets" . }}
{{- if .Values.global.priorityClassName }}
priorityClassName: {{ .Values.global.priorityClassName }}
{{- end }}
{{- if .Values.global.nodeSelector }}
nodeSelector:
{{ toYaml .Values.global.nodeSelector | nindent 2 }}
{{- end }}
{{- if .Values.global.tolerations }}
tolerations:
{{ toYaml .Values.global.tolerations | nindent 2 }}
{{- end }}
{{- if .Values.global.affinity }}
affinity:
{{ toYaml .Values.global.affinity | nindent 2 }}
{{- end }}
{{- if .Values.global.topologySpreadConstraints }}
topologySpreadConstraints:
{{ toYaml .Values.global.topologySpreadConstraints | nindent 2 }}
{{- end }}
{{- end -}}

{{- define "sms.initContainers" -}}
{{- if .service.initDependencies }}
initContainers:
{{- range .service.initDependencies }}
  - name: wait-for-{{ .name }}
    image: busybox:1.36
    command: ["sh", "-c", "until nc -z {{ .host }} {{ .port }}; do echo waiting for {{ .host }}; sleep 3; done"]
{{- end }}
{{- end }}
{{- end -}}

{{- define "sms.serviceDeployment" -}}
{{- $root := .root -}}
{{- $service := .service -}}
{{- $serviceName := .serviceName -}}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ $service.workloadName }}
  labels:
{{ include "sms.commonLabels" (dict "root" $root "serviceName" $service.workloadName) | indent 4 }}
spec:
{{- if not $service.autoscaling.enabled }}
  replicas: {{ $service.replicaCount }}
{{- end }}
  selector:
    matchLabels:
{{ include "sms.selectorLabels" (dict "root" $root "serviceName" $service.workloadName) | indent 6 }}
  template:
    metadata:
      labels:
{{ include "sms.selectorLabels" (dict "root" $root "serviceName" $service.workloadName) | indent 8 }}
{{- if $root.Values.global.podAnnotations }}
      annotations:
{{ toYaml $root.Values.global.podAnnotations | indent 8 }}
{{- end }}
    spec:
{{ include "sms.podSettings" $root | indent 6 }}
{{ include "sms.initContainers" (dict "service" $service) | indent 6 }}
      containers:
        - name: {{ $service.workloadName }}
          image: {{ include "sms.image" (dict "root" $root "image" $service.image) }}
          imagePullPolicy: {{ $service.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ $service.containerPort }}
{{- if $service.env }}
          env:
{{ tpl (toYaml $service.env) $root | indent 12 }}
{{- end }}
{{- if $service.probes.startup }}
          startupProbe:
{{ toYaml $service.probes.startup | indent 12 }}
{{- end }}
{{- if $service.probes.readiness }}
          readinessProbe:
{{ toYaml $service.probes.readiness | indent 12 }}
{{- end }}
{{- if $service.probes.liveness }}
          livenessProbe:
{{ toYaml $service.probes.liveness | indent 12 }}
{{- end }}
{{- if $service.resources }}
          resources:
{{ toYaml $service.resources | indent 12 }}
{{- end }}
{{- end -}}

{{- define "sms.serviceService" -}}
{{- $root := .root -}}
{{- $service := .service -}}
apiVersion: v1
kind: Service
metadata:
  name: {{ $service.workloadName }}
  labels:
{{ include "sms.commonLabels" (dict "root" $root "serviceName" $service.workloadName) | indent 4 }}
spec:
  type: {{ $service.service.type }}
  selector:
{{ include "sms.selectorLabels" (dict "root" $root "serviceName" $service.workloadName) | indent 4 }}
  ports:
    - name: http
      port: {{ $service.service.port }}
      targetPort: http
      {{- if and (eq $service.service.type "NodePort") $service.service.nodePort }}
      nodePort: {{ $service.service.nodePort }}
      {{- end }}
{{- end -}}

{{- define "sms.serviceHpa" -}}
{{- $service := .service -}}
{{- $root := .root -}}
{{- if $service.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ $service.workloadName }}
  labels:
{{ include "sms.commonLabels" (dict "root" $root "serviceName" $service.workloadName) | indent 4 }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ $service.workloadName }}
  minReplicas: {{ $service.autoscaling.minReplicas }}
  maxReplicas: {{ $service.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ $service.autoscaling.targetCPUUtilizationPercentage }}
{{- end }}
{{- end -}}

{{- define "sms.servicePdb" -}}
{{- $service := .service -}}
{{- $root := .root -}}
{{- if $service.pdb.enabled }}
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: {{ $service.workloadName }}
  labels:
{{ include "sms.commonLabels" (dict "root" $root "serviceName" $service.workloadName) | indent 4 }}
spec:
  minAvailable: {{ $service.pdb.minAvailable }}
  selector:
    matchLabels:
{{ include "sms.selectorLabels" (dict "root" $root "serviceName" $service.workloadName) | indent 6 }}
{{- end }}
{{- end -}}
