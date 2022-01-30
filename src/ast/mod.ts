import * as common from "./common.ts";
import * as $g from "./sigils.ts";
import { StringifyResult, StringifyVisitor } from "./visitors.ts";

export * from "./common.ts";
export * from "./decl.ts";
export * from "./expr.ts";

function indent(times: number) {
  return $g.SP.repeat(Math.max(0, times));
}

function* processIndentsGenerator(tokens: string[], indentationCount: number) {
  let currIndent = 0;

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token.startsWith("<@@")) {
      yield token;
    } else {
      if (token === $g.SKIP_NL) continue;
      else yield $g.NL;

      switch (token) {
        case $g.BEGIN:
          currIndent += indentationCount;
          yield indent(currIndent);
          continue;
        case $g.CONT:
          yield indent(currIndent);
          continue;
        case $g.END:
          currIndent = Math.max(0, currIndent - indentationCount);
          yield indent(currIndent);
          continue;
        case $g.RESET:
          currIndent = 0;
          continue;
        default:
          yield token;
      }
    }
  }
}

type StringifyOptions = {
  indentationCount?: number;
  stripComments?: boolean;
};

export function stringify(
  program: common.Program,
  options: StringifyOptions = {}
) {
  let _program = program;
  if (options.stripComments) {
    _program = program.filter((item) => !(item instanceof common.Comment));
  }

  const processTopLevelNodes = (node: common.TopLevelNode) => [
    ...processIndents(node, options.indentationCount ?? 2),
    $g.NL,
  ];

  return _program.flatMap(processTopLevelNodes).join("").trim();
}

function processIndents(node: common.TopLevelNode, indentationCount: number) {
  const visitor = new StringifyVisitor();
  const tokens = node
    .accept<StringifyResult, typeof visitor>(visitor)
    .filter((token): token is string => Boolean(token));

  const processedTokens: string[] = [];
  for (const token of processIndentsGenerator(tokens, indentationCount)) {
    processedTokens.push(token);
  }

  return processedTokens;
}
