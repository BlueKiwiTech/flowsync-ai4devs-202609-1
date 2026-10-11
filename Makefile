# FlowSync — tareas de desarrollo.
#
#   make setup   instala dependencias, prepara .env, genera APP_KEY y migra la BD
#   make start   levanta backend (:3333) y frontend (:5173) a la vez (Ctrl+C para ambos)
#
# Funciona con GNU Make en macOS (incluido el 3.81 de Xcode), Linux y Windows vía WSL.
# Solo usa sh POSIX: nada de `sed -i`, `.ONESHELL` ni extensiones de bash.

SHELL := /bin/sh

BACKEND  := backend
FRONTEND := frontend

# Mínimo que necesitan Vite 8 (>=22.12) y AdonisJS 7 (declara >=24, funciona en 22).
NODE_MIN_MAJOR         := 22
NODE_RECOMMENDED_MAJOR := 24

.DEFAULT_GOAL := help

.PHONY: help setup start check-node install env key migrate start-backend start-frontend

help:
	@echo "Uso:"
	@echo "  make setup   Instala dependencias, prepara .env, genera APP_KEY y corre migraciones"
	@echo "  make start   Levanta backend (http://localhost:3333) y frontend (http://localhost:5173)"

setup: check-node install env key migrate
	@echo ""
	@echo "Listo. Arranca todo con: make start"

start: check-node
	@if [ ! -d $(BACKEND)/node_modules ] || [ ! -d $(FRONTEND)/node_modules ] || [ ! -f $(BACKEND)/.env ]; then \
		echo "Falta preparar el proyecto. Ejecuta primero: make setup"; exit 1; \
	fi
	@echo "Backend  -> http://localhost:3333"
	@echo "Frontend -> http://localhost:5173"
	@echo "Ctrl+C detiene los dos."
	@$(MAKE) --no-print-directory -j2 start-backend start-frontend

start-backend:
	@cd $(BACKEND) && npm run dev

start-frontend:
	@cd $(FRONTEND) && npm run dev

# En WSL es fácil acabar usando el node/npm de Windows (vía /mnt/c/...): instala
# binarios nativos (better-sqlite3) para la plataforma equivocada y falla con
# rutas UNC. Se exige un Node instalado dentro de Linux.
check-node:
	@command -v node >/dev/null 2>&1 || { \
		echo "No se encuentra 'node'. Instala Node.js >= $(NODE_MIN_MAJOR) (recomendado $(NODE_RECOMMENDED_MAJOR)), p. ej. con nvm."; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "No se encuentra 'npm'."; exit 1; }
	@for bin in node npm; do \
		case "$$(command -v $$bin)" in \
			/mnt/*) echo "'$$bin' apunta a la instalación de Windows ($$(command -v $$bin))."; \
				echo "En WSL instala Node dentro de Linux (p. ej. con nvm) y vuelve a intentarlo."; exit 1;; \
		esac; \
	done
	@major=$$(node -p 'process.versions.node.split(".")[0]'); \
	if [ "$$major" -lt $(NODE_MIN_MAJOR) ]; then \
		echo "Node $$(node -v) es demasiado antiguo: hace falta >= $(NODE_MIN_MAJOR)."; exit 1; \
	elif [ "$$major" -lt $(NODE_RECOMMENDED_MAJOR) ]; then \
		echo "Aviso: Node $$(node -v). AdonisJS 7 recomienda >= $(NODE_RECOMMENDED_MAJOR)."; \
	fi

# `npm ci` reinstala desde el lockfile y compila los módulos nativos para la
# plataforma actual (útil si el repo se clonó o instaló antes desde otro SO).
install:
	cd $(BACKEND) && npm ci
	cd $(FRONTEND) && npm ci

# Nunca sobrescribe un .env existente.
env:
	@if [ -f $(BACKEND)/.env ]; then \
		echo "$(BACKEND)/.env ya existe, se conserva."; \
	else \
		cp $(BACKEND)/.env.example $(BACKEND)/.env && echo "Creado $(BACKEND)/.env"; \
	fi
	@if [ -f $(FRONTEND)/.env.example ] && [ ! -f $(FRONTEND)/.env ]; then \
		cp $(FRONTEND)/.env.example $(FRONTEND)/.env && echo "Creado $(FRONTEND)/.env"; \
	fi

# `generate:key` siempre reescribe la clave; solo se ejecuta si APP_KEY está vacía
# para no invalidar sesiones al repetir `make setup`. `[^[:space:]]` en vez de
# `.+` para que un `APP_KEY=\r` (checkout con CRLF en Windows) cuente como vacía.
key:
	@if grep -Eq '^APP_KEY=[^[:space:]]' $(BACKEND)/.env; then \
		echo "APP_KEY ya definida, se conserva."; \
	else \
		cd $(BACKEND) && node ace generate:key; \
	fi

migrate:
	cd $(BACKEND) && node ace migration:run
