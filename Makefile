default: help

.PHONY: help test .get-version .check-env-file .setup .lint .build

SHELL=/bin/bash -eu -o pipefail

EXECUTABLES = npm yarn
K := $(foreach exec,$(EXECUTABLES), $(if $(shell $(exec) --version || echo $?),some string,$(error "Unable to check $(exec) --version in PATH. Please install.")))

PATCH_VERSION := $(if $(CI_PIPELINE_IID),$(CI_PIPELINE_IID),0)

.clean:
	rm -rf node_modules
	rm -rf dist
	rm -rf .yarn/unplugged/ .yarn/build-state.yml .yarn/install-state.gz .pnp.js
	rm -rf reports/

.setup:
	yarn husky install

.install:
	yarn install --frozen-lockfile --prefer-offline

.fmt:
	yarn run fmt

.lint:
	yarn run lint

.test-unit:
	yarn run test:unit

.test-unit-coverage:
	yarn run test:unit:coverage

.audit:
	yarn run audit
	yarn run security-scan

help:
	@echo "Commands"
	@echo "========"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2, $$3, $$4, $$5, $$6, $$7, $$8, $$9, $$10, $$11, $$12, $$13, $$14, $$15, $$16, $$17, $$18, $$19, $$20, $$21, $$22, $$23, $$24}'

# main scripts
clean: .clean ## Clean temp folders in workspace

install: .install ## Sets up private registry references and installs dependencies

setup: .install .setup ## Install pipenv and npm packages

fmt: .fmt ## Run prettier

lint: .lint ## Linting test

test-unit: .test-unit ## Unit testing using Jest

test-unit-coverage: .test-unit-coverage ## Unit testing coverage using Jest

test: ## Run all the main local lint, unit and browser test. Useful to run before checking in code
	yarn run test

audit: .audit ## Performs audit on installed packages, throwing error if packages with level=high found
