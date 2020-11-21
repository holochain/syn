#
# Test and build syn DNA
#
# This Makefile is primarily instructional; you can simply enter the Nix environment for
# holochain development (supplied by holonix; see pkgs.nix) via `nix-shell` and run `cargo
# test` directly, or build a target directly by running the following two commands:
#   1. `RUST_BACKTRACE=1 CARGO_TARGET_DIR=target cargo build \ --release --target wasm32-unknown-unknown`
#   2. `dna-util -c syn.dna.workdir`.

SHELL		= bash
DNANAME		= syn

# External targets; Uses a nix-shell environment to obtain Holochain runtimes, run tests, etc.
.PHONY: all FORCE
all: nix-test

# nix-test, nix-install, ...
nix-%:
	nix-shell --pure --run "make $*"

# Internal targets; require a Nix environment in order to be deterministic.
# - Uses the version of `dna-util`, `holochain` on the system PATH.
# - Normally called from within a Nix environment, eg. run `nix-shell`
.PHONY:		rebuild install build build-cargo build-dna
rebuild:	clean build

install:	build

build:	build-cargo build-dna

build-cargo:
	RUST_BACKTRACE=1 CARGO_TARGET_DIR=target cargo build \
	--release --target wasm32-unknown-unknown

build-dna:
	dna-util -c syn.dna.workdir

.PHONY: test test-all test-unit test-debug test-dna test-dna-debug test-stress test-node
test-all:	test

test:		test-unit test-e2e # test-stress # re-enable when Stress tests end reliably

test-unit:
	RUST_BACKTRACE=1 cargo test \
	    -- --nocapture

test-dna:
	@echo "Starting Scenario tests in $$(pwd)..."; \
	    cd tests && npm test

test-dna-debug:
	@echo "Starting Scenario tests in $$(pwd)..."; \
	    cd tests && npm run test-debug

test-e2e:	test-node test-dna

test-node:
	@echo "Setting up Scenario/Stress test Javascript..."; \
	    cd tests && npm install && cd ..

# Generic targets; does not require a Nix environment
.PHONY: clean
clean:
	rm -rf \
	    tests/node_modules \
	    .cargo \
			Cargo.lock \
	    target \
