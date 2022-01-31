import * as ast from "./ast/mod.ts";

const pointRecord: ast.TopLevelNode[] = [
  ast.comment("A representation of a point in two-dimensional space."),
  new ast.RecordTypeDeclaration(ast.ident("Point"), [
    ast.typedIdent("x", ast.type("Float")),
    ast.typedIdent("y", ast.type("Float")),
  ]),
];

const coordSumFunction: ast.TopLevelNode[] = [
  ast.comment("This function accepts any value with `x`, `y` and `z` fields."),
  new ast.FunctionDeclaration(
    ast.ident("coord_sum"),
    [ast.optTypedIdent("values", ast.inferType())],
    ast.inferType(),
    new ast.BlockExpression([
      new ast.BindingDeclaration(
        ast.ident("sum"),
        ast.inferType(),
        new ast.LambdaExpression(
          [ast.optTypedIdent("xs", ast.inferType())],
          ast.inferType(),
          new ast.CallExpression(ast.path("list", "reduce"), [
            new ast.IdentifierExpression(ast.ident("xs")),
            new ast.LiteralExpression({ kind: "integer", value: 0 }),
            new ast.LambdaExpression(
              [
                ast.optTypedIdent("acc", ast.inferType()),
                ast.optTypedIdent("cur", ast.inferType()),
              ],
              ast.inferType(),
              new ast.BinaryExpression(
                "+",
                new ast.IdentifierExpression(ast.ident("acc")),
                new ast.IdentifierExpression(ast.ident("cur"))
              )
            ),
          ])
        )
      ),
      new ast.CallExpression(ast.ident("sum"), [
        new ast.ListExpression([
          new ast.DotExpression([ast.ident("value"), ast.ident("x")]),
          new ast.DotExpression([ast.ident("value"), ast.ident("y")]),
          new ast.DotExpression([ast.ident("value"), ast.ident("z")]),
        ]),
      ]),
    ])
  ),
];

const distanceFunction: ast.TopLevelNode[] = [
  ast.comment("Calculates the distance between this point and another point."),
  ast.comment(""),
  ast.comment("# Example"),
  ast.comment(""),
  ast.comment("```helios"),
  ast.comment("#? import point"),
  ast.comment("let a = point::Point(x: 1.0, y: 2.0)"),
  ast.comment("let b = point::Point(x: 2.0, y: 4.0)"),
  ast.comment("assert::eq(point::distance_from(a, b), ???)"),
  ast.comment("```"),
  new ast.FunctionDeclaration(
    ast.ident("distance"),
    [
      ast.optTypedIdent("a", ast.inferType()),
      ast.optTypedIdent("b", ast.inferType()),
    ],
    ast.inferType(),
    new ast.BlockExpression([
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
    ])
  ),
];

// const program: ast.Program = new Array<ast.TopLevelNode>().concat(
//   pointRecord
//   distanceFunction,
//   coordSumFunction
// );

// const stringified = ast.stringify(program);
// console.log(stringified);

const program: ast.Program = [
  new ast.BindingDeclaration(
    ast.ident("foo"),
    ast.inferType(),
    new ast.LiteralExpression({ kind: "integer", value: 1 })
  ),
];

const htmlified = ast.htmlify(program);
console.log(htmlified);
