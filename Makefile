# ─────────────────────────────────────────────
#  Disaster Relief — Smart Resource Allocator
#  Makefile: compile C++ and launch all services
# ─────────────────────────────────────────────

ENGINE_SRC = cpp-engine/engine.cpp
ENGINE_BIN = cpp-engine/engine

.PHONY: all engine backend frontend seed clean test-engine

# Compile C++ engine
engine:
	@echo "Compiling C++ engine..."
	g++ -std=c++17 -O2 -o $(ENGINE_BIN) $(ENGINE_SRC)
	@echo "Engine compiled: $(ENGINE_BIN)"

# Test engine with sample data
test-engine: engine
	@echo "Running engine test..."
	./$(ENGINE_BIN) < cpp-engine/test_input.json | python3 -m json.tool

# Install all dependencies
install:
	cd backend  && npm install
	cd frontend && npm install

# Seed database with sample data
seed:
	cd backend && node seed.js

# Start backend (requires MongoDB running)
backend:
	cd backend && npm run dev

# Start frontend dev server
frontend:
	cd frontend && npm run dev

# Build frontend for production
build:
	cd frontend && npm run build

# Clean compiled files
clean:
	rm -f $(ENGINE_BIN)
	rm -rf frontend/dist

# Full setup from scratch
setup: engine install seed
	@echo "✅ Setup complete. Run 'make backend' and 'make frontend' in separate terminals."
