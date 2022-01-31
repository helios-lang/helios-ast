import * as fs from "https://deno.land/std@0.123.0/fs/mod.ts";

import * as ast from "./ast/mod.ts";

const imports: ast.TopLevelNode[] = [
  new ast.ImportDeclarationGroup([
    new ast.ImportDeclaration(ast.path("core", "io")),
    new ast.ImportDeclaration(ast.path("core", "list")),
    new ast.ImportDeclaration(ast.path("core", "math")),
  ]),
];

const pointRecord: ast.TopLevelNode[] = [
  ast.docComment("A representation of a point in two-dimensional space."),
  new ast.RecordTypeDeclaration(ast.ident("Point"), [
    ast.typedIdent("x", ast.type("Float")),
    ast.typedIdent("y", ast.type("Float")),
  ]),
];

const distanceFunction: ast.TopLevelNode[] = [
  ast.docComment(
    "Calculates the distance between this point and another point.",
    "",
    "## Examples",
    "",
    "```helios",
    "> let a = Point(x: 1.0, y: 2.0)",
    "> let b = Point(x: 2.0, y: 4.0)",
    "> distance_from(a, b) == ???",
    "True",
    "```"
    // "    > let a = Point(x: 1.0, y: 2.0)",
    // "    > let b = Point(x: 2.0, y: 4.0)",
    // "    > distance_from(a, b) == ???",
    // "    True",
    // ""
  ),
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
          ast.literal(2.0, true),
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
          ast.literal(2.0, true),
        ])
      ),
      new ast.CallExpression(ast.path("math", "sqrt"), [
        new ast.BinaryExpression("+", ast.ident("dx"), ast.ident("dy")),
      ]),
    ])
  ),
];

const coordSumFunction: ast.TopLevelNode[] = [
  ast.docComment(
    "This function accepts any value with `x`, `y` and `z` fields."
  ),
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
            ast.ident("xs"),
            ast.literal(0),
            new ast.LambdaExpression(
              [
                ast.optTypedIdent("acc", ast.inferType()),
                ast.optTypedIdent("cur", ast.inferType()),
              ],
              ast.inferType(),
              new ast.BinaryExpression("+", ast.ident("acc"), ast.ident("cur"))
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

const mainFunction: ast.TopLevelNode[] = [
  ast.comment("This is the entry point of the program."),
  new ast.FunctionDeclaration(
    ast.ident("__main__"),
    [],
    ast.inferType(),
    new ast.BlockExpression([
      new ast.CallExpression(ast.path("io", "println"), [
        ast.literal("Hello, world!"),
      ]),
    ])
  ),
];

const program: ast.Program = new Array<ast.TopLevelNode>().concat(
  imports,
  pointRecord,
  distanceFunction,
  coordSumFunction,
  mainFunction
);

const stringified = ast.stringify(program);
console.log(stringified);

const htmlified = ast.htmlify(program);
// console.log(htmlified);

const fileName = "source.hl.html";
const filePath = `./out/${fileName}`;
await fs.ensureFile(filePath);
await Deno.writeTextFile(filePath, htmlified);
console.log("Successfully written file to", await Deno.realPath(filePath));
