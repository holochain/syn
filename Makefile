#
# Test and build syn DNA
#
# This Makefile is primarily instructional; you can simply enter the Nix environment for
# holochain development (supplied by holonix; see pkgs.nix) via `nix-shell` and run
# `make test` directly, or build a target directly eg. `nix-build -A syn`

SHELL		= bash
DNANAME		= syn
DNA		= $(DNANAME).dna
HAPP		= $(DNANAME).happ
WASM		= target/wasm32-unknown-unknown/release/syn.wasm

# External targets; Uses a nix-shell environment to obtain Holochain runtimes, run tests, etc.
.PHONY: all FORCE
all: nix-test

# nix-test, nix-install, ...
nix-%:
	nix-shell --pure --run "make $*"

# Internal targets; require a Nix environment in order to be deterministic.
# - Uses the version of `hc`, `holochain` on the system PATH.
# - Normally called from within a Nix environment, eg. run `nix-shell`
.PHONY:		rebuild install build build-cargo build-dna
rebuild:	clean build

install:	build

build:	build-cargo build-dna

build:		$(DNA)

# Package the DNA from the built target release WASM
$(DNA):		$(WASM) FORCE
	@echo "Packaging DNA:"
	@hc dna pack . -o $(DNA)
	@hc app pack . -o $(HAPP)
	@ls -l $@

# Recompile the target release WASM
$(WASM): FORCE
	@echo "Building  DNA WASM:"
	@RUST_BACKTRACE=1 CARGO_TARGET_DIR=target cargo build \
	    --release --target wasm32-unknown-unknown

.PHONY: test test-all test-unit test-debug test-dna test-dna-debug test-stress test-node
test-all:	test

test:		test-unit test-e2e # test-stress # re-enable when Stress tests end reliably

test-unit:
	RUST_BACKTRACE=1 cargo test \
	    -- --nocapture

test-dna:
	@echo "Starting Scenario tests in $$(pwd)..."; \
	    cd tests && ./node_modules/.bin/pnpm test

test-dna-debug:
	@echo "Starting Scenario tests in $$(pwd)..."; \
	    cd tests && ./node_modules/.bin/pnpm run test-debug

test-e2e:	test-node test-dna

test-node:
	@echo "Setting up Scenario/Stress test Javascript..."; \
	    cd tests && ./node_modules/.bin/pnpm install && cd ..

# Generic targets; does not require a Nix environment
.PHONY: clean
clean:
	rm -rf \
	    tests/node_modules \
	    .cargo \
			Cargo.lock \
	    target \
	    $(DNA)
