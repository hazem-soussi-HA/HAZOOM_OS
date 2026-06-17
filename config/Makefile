.PHONY: build serve stop restart status logs deploy test clean help unifi

ROOT := /mnt/d/AlphaPony
SCRIPTS := $(ROOT)/scripts

build:
	@bash $(SCRIPTS)/build.sh

serve:
	@bash $(SCRIPTS)/serve.sh start

stop:
	@bash $(SCRIPTS)/serve.sh stop

restart:
	@bash $(SCRIPTS)/serve.sh restart

status:
	@bash $(SCRIPTS)/serve.sh status

logs:
	@bash $(SCRIPTS)/serve.sh logs

deploy: build serve
	@echo "✅ Deployment complete! Verifying..."
	@sleep 3
	@curl -s http://localhost:8080/api/status | python3 -m json.tool 2>/dev/null || echo "   API starting up..."

# Unified Launch Point - ONE command to rule them all!
unifi:
	@echo "🚀 Launching Hazoom OS - Unified Entry Point..."
	@python3 $(ROOT)/unified_launch.py start

# Stop all via unified launcher
unifi-stop:
	@python3 $(ROOT)/unified_launch.py stop

# Status via unified launcher
unifi-status:
	@python3 $(ROOT)/unified_launch.py status

test:
	@pytest $(ROOT)/tests/

clean:
	rm -rf $(ROOT)/build/* $(ROOT)/logs/* $(ROOT)/temp/*

help:
	@echo "Hazoom OS - Unified Interface"
	@echo ""
	@echo "Commands:"
	@echo "  make build      - Compile Pascal + install Python deps"
	@echo "  make serve      - Start all services (port 8080)"
	@echo "  make stop       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make status     - Show service status"
	@echo "  make logs       - Tail service logs"
	@echo "  make deploy     - Full deployment (build + serve + verify)"
	@echo "  make unifi      - 🚀 ONE launch point for ALL services"
	@echo "  make unifi-stop - Stop all via unified launcher"
	@echo "  make test       - Run test suite"
	@echo "  make clean      - Remove build artifacts"
	@echo ""
	@echo "Access: http://localhost:8080/"
	@echo "Unified Dashboard: http://localhost:8080/unified-dashboard"
