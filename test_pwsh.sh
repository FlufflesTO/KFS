#!/bin/bash
docker run --rm -v $(pwd):/app -w /app mcr.microsoft.com/powershell:ubuntu-22.04 pwsh scripts/build-deploy-artifacts.ps1 portal
