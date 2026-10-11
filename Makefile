# FlowSync — tareas de desarrollo.
#
#   make setup   instala dependencias, prepara .env, genera APP_KEY y migra la BD
#   make start   levanta backend (:3333) y frontend (:5173) a la vez (Ctrl+C para ambos)
#
# Funciona con GNU Make en macOS (incluido el 3.81 de Xcode), Linux y Windows vía WSL.
# Solo usa sh POSIX: nada de `sed -i`, `.ONESHELL`, `wait -n` ni extensiones de bash.

SHELL := /bin/sh

BACKEND  := backend
FRONTEND := frontend
PORTS    := 3333, 5173

# Vite 8 necesita Node >= 22.12. AdonisJS 7 (@adonisjs/core) declara >= 24 en
# sus engines, aunque funciona en 22: por debajo de 24 solo se avisa.
NODE_MIN         := 22.12
NODE_RECOMMENDED := 24

# Una APP_KEY "definida" tiene al menos un carácter que no sea espacio ni
# comilla: así `APP_KEY=`, `APP_KEY=""` y `APP_KEY=\r` (checkout CRLF en
# Windows) cuentan como vacías.
APP_KEY_SET := grep -Eq '^APP_KEY=["'"'"']?[^"'"'"'[:space:]]' $(BACKEND)/.env

.DEFAULT_GOAL := help

# Los pasos de setup dependen del orden; `make -j` (o MAKEFLAGS=-j) no debe
# reordenarlos. El paralelismo de `start` se hace dentro de su receta.
.NOTPARALLEL:

.PHONY: help setup start check-node check-setup check-ports install env key migrate

help:
	@echo "Uso:"
	@echo "  make setup   Instala dependencias, prepara .env, genera APP_KEY y corre migraciones"
	@echo "  make start   Levanta backend (http://localhost:3333) y frontend (http://localhost:5173)"

setup: check-node install env key migrate
	@echo ""
	@echo "Listo. Arranca todo con: make start"

# Ambos servidores corren en segundo plano dentro de la misma receta. Si uno
# termina (p. ej. puerto ocupado), o llega Ctrl+C / cierre de terminal, el trap
# manda SIGINT (como Ctrl+C) a todo el grupo de procesos: nunca queda medio
# stack levantado. SIGINT y no SIGTERM porque `node ace serve --hmr` ignora SIGTERM.
# Vite usa --strictPort para fallar en vez de saltar en silencio a otro puerto.
start: check-node check-setup check-ports
	@echo "Backend  -> http://localhost:3333"
	@echo "Frontend -> http://localhost:5173"
	@echo "Ctrl+C detiene los dos."
	@trap 'trap - INT TERM HUP; kill -INT 0 2>/dev/null' INT TERM HUP; \
	( cd $(BACKEND) && npm run dev; echo "El backend se ha detenido; parando el frontend."; kill -INT 0 ) & \
	( cd $(FRONTEND) && npm run dev -- --strictPort; echo "El frontend se ha detenido; parando el backend."; kill -INT 0 ) & \
	wait

check-setup:
	@if [ ! -d $(BACKEND)/node_modules ] || [ ! -d $(FRONTEND)/node_modules ] \
		|| [ ! -f $(BACKEND)/.env ] || [ ! -f $(BACKEND)/tmp/db.sqlite3 ] \
		|| ! $(APP_KEY_SET); then \
		echo "El proyecto no está preparado (faltan dependencias, .env, APP_KEY o base de datos)."; \
		echo "Ejecuta primero: make setup"; exit 1; \
	fi

# `node ace serve --hmr` no termina si el puerto está ocupado (sigue vigilando
# ficheros), así que el trap de `start` no saltaría: se comprueba antes.
check-ports:
	@node -e 'const net = require("net"), busy = []; Promise.all([$(PORTS)].map((p) => new Promise((done) => { const s = net.createServer().once("error", () => { busy.push(p); done() }).once("listening", () => s.close(done)).listen(p, "localhost") }))).then(() => { if (busy.length) { console.log("Puerto(s) ocupado(s): " + busy.join(", ") + ". ¿Hay otro make start o servidor en marcha?"); process.exit(1) } })'

# En WSL es fácil acabar usando el node/npm de Windows (vía /mnt/c/...): instala
# binarios nativos (better-sqlite3) para la plataforma equivocada y falla con
# rutas UNC. Se exige un Node instalado dentro de Linux.
check-node:
	@command -v node >/dev/null 2>&1 || { \
		echo "No se encuentra 'node'. Instala Node.js >= $(NODE_MIN) (recomendado $(NODE_RECOMMENDED)), p. ej. con nvm."; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "No se encuentra 'npm'."; exit 1; }
	@for bin in node npm; do \
		case "$$(command -v $$bin)" in \
			/mnt/[a-z]/*) echo "'$$bin' apunta a la instalación de Windows ($$(command -v $$bin))."; \
				echo "En WSL instala Node dentro de Linux (p. ej. con nvm) y vuelve a intentarlo."; exit 1;; \
		esac; \
	done
	@node -e 'const [a, b] = process.versions.node.split(".").map(Number), [r, m] = "$(NODE_MIN)".split(".").map(Number); if (a < r || (a === r && b < m)) { console.log("Node " + process.version + " es demasiado antiguo: hace falta >= $(NODE_MIN)."); process.exit(1) } if (a < $(NODE_RECOMMENDED)) console.log("Aviso: Node " + process.version + ". AdonisJS 7 recomienda >= $(NODE_RECOMMENDED).")'

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
# para no invalidar sesiones al repetir `make setup`.
key:
	@if $(APP_KEY_SET); then \
		echo "APP_KEY ya definida, se conserva."; \
	else \
		cd $(BACKEND) && node ace generate:key; \
	fi

migrate:
	cd $(BACKEND) && node ace migration:run
