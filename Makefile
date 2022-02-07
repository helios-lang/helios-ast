BIN := ./bin
OUT := ./out
SRC := ./src

PROGRAM := $(BIN)/ast
MAIN := $(SRC)/main.ts

.PHONY: build run clean

build:
	@deno compile --allow-read --allow-write --unstable --output $(PROGRAM) $(MAIN)

run: build
	@$(PROGRAM)

clean:
	@rm -rf $(OUT)/*.html
