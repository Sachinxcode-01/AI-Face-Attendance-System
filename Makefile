# ==============================================================================
#  SmartFace Biometric Attendance & Security Suite — Master Developer Makefile
# ==============================================================================
#  "One Thing for All" Developer CLI orchestrating Backend, Frontend, and Mobile
#
#  Services & Port Mapping:
#    - Node.js API Gateway:      http://localhost:8000
#    - Python AI Microservice:   http://localhost:8001
#    - Next.js Web Portal:       http://localhost:3000
#    - Streamlit Admin Panel:    http://localhost:8501
# ==============================================================================

SHELL := cmd.exe
.PHONY: help dev backend api node ai frontend portal landing mobile preflight test stop clean

# Default Target
help:
	@echo ============================================================================
	@echo   SmartFace Biometric Suite - Developer Command Runner
	@echo ============================================================================
	@echo   make dev        - Spin up full local stack (Backend + Frontend Web)
	@echo   make backend    - Start Node.js API (8000) ^& Python AI Microservice (8001)
	@echo   make node       - Start Node.js API Gateway only (Port 8000)
	@echo   make ai         - Start Python FastAPI ArcFace AI service only (Port 8001)
	@echo   make frontend   - Start Next.js Modern Web Portal (Port 3000)
	@echo   make portal     - Start Next.js Web Portal (Port 3000)
	@echo   make landing    - Start Next.js Marketing Landing (Port 3000)
	@echo   make mobile     - Launch Flutter Mobile Client (with ADB reverse 8000/8001)
	@echo   make preflight  - Run pre-flight health ^& diagnostics check
	@echo   make test       - Execute Node.js and Python test suites
	@echo   make stop       - Gracefully terminate background services on 8000/8001
	@echo   make clean      - Clean temporary caches, logs, and pycache
	@echo ============================================================================

# Full Local Dev Environment
dev:
	@powershell -ExecutionPolicy Bypass -File ./scripts/run.ps1 dev

# Backend Services (Node.js API + Python FastAPI AI)
backend:
	@powershell -ExecutionPolicy Bypass -File ./scripts/run.ps1 backend

api: backend

node:
	@cd backend\api && npm run dev

ai:
	@powershell -Command "python -m uvicorn backend.ai.app.main:app --host 127.0.0.1 --port 8001 --reload"

# Frontend Services
frontend: portal

portal:
	@cd portal && npm run dev

landing:
	@cd landing && npm run dev

# Mobile Client
mobile:
	@powershell -ExecutionPolicy Bypass -File ./scripts/run.ps1 mobile

# Diagnostics & Tests
preflight:
	@powershell -ExecutionPolicy Bypass -File ./scripts/exam_preflight.ps1

test:
	@powershell -ExecutionPolicy Bypass -File ./scripts/run.ps1 test

# Service Shutdown
stop:
	@powershell -ExecutionPolicy Bypass -File ./scripts/stop_exam_demo.ps1

# Housekeeping
clean:
	@powershell -Command "Get-ChildItem -Path . -Include __pycache__,.pytest_cache,.ruff_cache -Recurse -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force; Write-Host '[PASS] Caches cleaned successfully.' -ForegroundColor Green"
