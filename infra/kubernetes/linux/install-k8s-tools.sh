#!/usr/bin/env bash
set -euo pipefail

TOOLS_ROOT="${TOOLS_ROOT:-/opt/sms-k8s/tools}"
DOWNLOADS_DIR="$TOOLS_ROOT/downloads"
BIN_DIR="$TOOLS_ROOT/bin"

mkdir -p "$BIN_DIR" "$DOWNLOADS_DIR"

curl -fsSL https://dl.k8s.io/release/stable.txt -o "$DOWNLOADS_DIR/kubectl-version.txt"
KUBECTL_VERSION="$(tr -d '\n' < "$DOWNLOADS_DIR/kubectl-version.txt")"
curl -fsSL "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" -o "$BIN_DIR/kubectl"
chmod +x "$BIN_DIR/kubectl"

curl -fsSL https://kind.sigs.k8s.io/dl/v0.23.0/kind-linux-amd64 -o "$BIN_DIR/kind"
chmod +x "$BIN_DIR/kind"

curl -fsSL https://get.helm.sh/helm-v3.15.4-linux-amd64.tar.gz -o "$DOWNLOADS_DIR/helm.tar.gz"
tar -xzf "$DOWNLOADS_DIR/helm.tar.gz" -C "$DOWNLOADS_DIR"
cp "$DOWNLOADS_DIR/linux-amd64/helm" "$BIN_DIR/helm"
chmod +x "$BIN_DIR/helm"

echo "Tools installed under $BIN_DIR"
echo "Add this to PATH: export PATH=$BIN_DIR:\$PATH"
