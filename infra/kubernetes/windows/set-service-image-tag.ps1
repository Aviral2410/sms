param(
    [Parameter(Mandatory = $true)]
    [string]$Service,
    [Parameter(Mandatory = $true)]
    [string]$ImageRepository,
    [Parameter(Mandatory = $true)]
    [string]$Tag,
    [string]$Namespace = "sms",
    [string]$ToolsRoot = "D:\sms-k8s\tools"
)

$ErrorActionPreference = "Stop"
$kubectlExe = Join-Path $ToolsRoot "bin\kubectl.exe"
$fullImage = "$ImageRepository`:$Tag"

& $kubectlExe -n $Namespace set image deployment/$Service $Service=$fullImage
& $kubectlExe -n $Namespace rollout status deployment/$Service --timeout=300s
