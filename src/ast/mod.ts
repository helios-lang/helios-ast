import * as common from "./common.ts";
import * as strings from "./strings.ts";

export * from "./common.ts";
export * from "./expr.ts";
export * from "./decl.ts";

function indent(times: number) {
  return strings.SP.repeat(Math.max(0, times));
}

function* processIndentsGenerator(tokens: string[], indentationCount: number) {
  let currIndent = 0;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token.startsWith("<@@")) {
      yield token;
    } else {
      if (token === strings.SKIP_NL) continue;
      else yield strings.NL;

      switch (token) {
        case strings.BEGIN:
          currIndent += indentationCount;
          yield indent(currIndent);
          continue;
        case strings.CONT:
          yield indent(currIndent);
          continue;
        case strings.END:
          currIndent = Math.max(0, currIndent - indentationCount);
          yield indent(currIndent);
          continue;
        case strings.RESET:
          currIndent = 0;
          continue;
        default:
          yield token;
      }
    }
  }
}

function processIndents(decl: common.Declaration, indentationCount: number) {
  const tokens = decl
    .stringify()
    .filter((token): token is string => Boolean(token));

  const processedTokens: string[] = [];
  for (const token of processIndentsGenerator(tokens, indentationCount)) {
    processedTokens.push(token);
  }

  return processedTokens;
}

type StringifyOptions = {
  indentationCount?: number;
  stripComments?: boolean;
};

export function stringify(
  program: common.Program,
  options: StringifyOptions = {}
) {
  return (
    options.stripComments
      ? program.filter((item) => !(item instanceof common.Comment))
      : program
  )
    .flatMap((decl) => [
      ...processIndents(decl, options.indentationCount ?? 2),
      strings.NL,
    ])
    .flat()
    .join("")
    .trim();
}
