BIN := ./bin
SRC := ./src

PROGRAM := $(BIN)/ast
MAIN := $(SRC)/main.ts

.PHONY: build run

build:
	@deno compile --allow-read --allow-write --unstable --output $(PROGRAM) $(MAIN)

run: build
	@$(PROGRAM)
