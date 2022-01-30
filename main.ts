import * as ast from "./ast/mod.ts";

/*
const program = ast.prog(
  ast.decl.func(
    ast.ident("distance"),
    [],
    [
      ast.decl.bind(
        ast.ident("x"),
        ast.exp.call(ast.path("math", "pow"), [
          ast.expr.binary("-", ast.expr.dot("b", "x"), ast.expr.dot("a", "x")),
          ast.expr.float(2.0),
        ])
      ),
      ast.decl.bind(
        ast.ident("y"),
        ast.exp.call(ast.path("math", "pow"), [
          ast.expr.binary("-", ast.expr.dot("b", "y"), ast.expr.dot("a", "y")),
          ast.expr.float(2.0),
        ])
      ),
      ast.exp.call(ast.path("math", "sqrt"), [
        ast.ident("dx"),
        ast.ident("dy"),
      ]),
    ]
  )
);
*/

const program: ast.Program = [
  new ast.FunctionDeclaration(
    ast.ident("distance"),
    [ast.param("a", ast.inferType()), ast.param("b", ast.inferType())],
    ast.inferType(),
    [
      new ast.BindingDeclaration(
        ast.ident("dx"),
        ast.inferType(),
        new ast.CallExpression(ast.path("math", "pow"), [
          new ast.BinaryExpression(
            "-",
            new ast.DotExpression([ast.ident("b"), ast.ident("x")]),
            new ast.DotExpression([ast.ident("a"), ast.ident("x")])
          ),
          new ast.LiteralExpression({ kind: "float", value: 2.0 }),
        ])
      ),
      new ast.BindingDeclaration(
        ast.ident("dy"),
        ast.inferType(),
        new ast.CallExpression(ast.path("math", "pow"), [
          new ast.BinaryExpression(
            "-",
            new ast.DotExpression([ast.ident("b"), ast.ident("y")]),
            new ast.DotExpression([ast.ident("a"), ast.ident("y")])
          ),
          new ast.LiteralExpression({ kind: "float", value: 2.0 }),
        ])
      ),
      new ast.CallExpression(ast.path("math", "sqrt"), [
        new ast.BinaryExpression(
          "+",
          new ast.IdentifierExpression(ast.ident("dx")),
          new ast.IdentifierExpression(ast.ident("dy"))
        ),
      ]),
    ]
  ),
];

const INDENTATION_COUNT = 2;

function indent(times: number) {
  return ast.SP.repeat(Math.max(0, times));
}

function processIndents(decl: ast.Declaration) {
  let currIndent = 0;
  return decl
    .stringify()
    .filter((token): token is string => Boolean(token))
    .flatMap((token) => {
      // Short-circuit the check to speed things up
      if (!token.startsWith("<")) return token;

      if (token === ast.BEGIN) {
        currIndent += INDENTATION_COUNT;
        return [ast.NL, indent(currIndent)];
      }

      if (token === ast.CONT) {
        return [ast.NL, indent(currIndent)];
      }

      if (token === ast.END) {
        currIndent = Math.max(0, currIndent - INDENTATION_COUNT);
        return [ast.NL, indent(currIndent)];
      }

      if (token === ast.RESET) {
        return [ast.NL];
      }

      return token;
    });
}

function stringify(program: ast.Program) {
  return program
    .map(processIndents)
    .flatMap((decl) => [...decl, ast.NL])
    .join("")
    .trim();
}

console.log(stringify(program));
