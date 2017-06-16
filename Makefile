PROJECT=github.com/pulumi/lumi
PROJECT_PKGS=$(shell go list ./cmd/... ./pkg/... | grep -v /vendor/)
TESTPARALLELISM=10

.PHONY: default
default: banner lint_quiet vet test_short install

.PHONY: all
all: banner_all lint_quiet vet test_short install lumijs lumirtpkg lumijspkg lumipkg awspkg

.PHONY: nightly
nightly: banner_all lint_quiet vet test install lumijs lumirtpkg lumijspkg lumipkg awspkg_nightly examples

.PHONY: banner
banner:
	@echo "\033[1;37m============\033[0m"
	@echo "\033[1;37mLumi (Quick)\033[0m"
	@echo "\033[1;37m============\033[0m"
	@echo "\033[0;33mRunning quick build; to run full tests, run 'make all'\033[0m"
	@echo "\033[0;33mRemember to do this before checkin, otherwise your CI will fail\033[0m"

.PHONY: banner_all
banner_all:
	@echo "\033[1;37m============\033[0m"
	@echo "\033[1;37mLumi (Full)\033[0m"
	@echo "\033[1;37m============\033[0m"

.PHONY: install
install:
	@echo "\033[0;32mINSTALL:\033[0m"
	@go install ${PROJECT}/cmd/lumi
	@go install ${PROJECT}/cmd/lumidl

.PHONY: lint
lint:
	@echo "\033[0;32mLINT:\033[0m"
	@gometalinter pkg/...
	@gometalinter cmd/lumi/...
	@gometalinter cmd/lumidl/...

.PHONY: lint_quiet
lint_quiet:
	@echo "\033[0;32mLINT (quiet):\033[0m"
	@echo "`golint cmd/... | grep -v "or be unexported"`"
	@echo "`golint pkg/... | grep -v "or be unexported"`"
	@test -z "$$(golint cmd/... | grep -v 'or be unexported')"
	@test -z "$$(golint pkg/... | grep -v 'or be unexported')"
	@echo "\033[0;33mgolint was run quietly; to run with noisy errors, run 'make lint'\033[0m"

.PHONY: vet
vet:
	@echo "\033[0;32mVET:\033[0m"
	@go tool vet -printf=false cmd/ pkg/

.PHONY: test_short
test_short:
	@echo "\033[0;32mTEST:\033[0m"
	@go test -short -cover ${PROJECT_PKGS}

.PHONY: test
test:
	@echo "\033[0;32mTEST:\033[0m"
	@go test -cover -parallel ${TESTPARALLELISM} ${PROJECT_PKGS}

.PHONY: lumijs
lumijs:
	@cd ./cmd/lumijs && $(MAKE)

.PHONY: lumirtpkg
lumirtpkg:
	@cd ./lib/lumirt && $(MAKE)

.PHONY: lumijspkg
lumijspkg:
	@cd ./lib/lumijs && $(MAKE)

.PHONY: lumipkg
lumipkg:
	@cd ./lib/lumi && $(MAKE)

.PHONY: awspkg
awspkg:
	@cd ./lib/aws && $(MAKE)

.PHONY: awspkg_nightly
awspkg:
	@cd ./lib/aws && $(MAKE) nightly

.PHONY: verify
verify:
	@cd ./lib/aws && $(MAKE) verify

.PHONY: examples
examples:
	@echo "\033[0;32mTEST EXAMPLES:\033[0m"
	@go test -cover -timeout 1h -parallel ${TESTPARALLELISM} ./examples
