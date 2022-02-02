import * as fs from 'https://deno.land/std@0.123.0/fs/mod.ts';

import * as ast from './ast/mod.ts';

const imports: ast.TopLevelNode[] = [
  new ast.ImportDeclarationGroup([
    new ast.ImportDeclaration(ast.path('core', 'io')),
    new ast.ImportDeclaration(ast.path('core', 'list')),
    new ast.ImportDeclaration(ast.path('core', 'math')),
  ]),
];

const pointRecord: ast.TopLevelNode[] = [
  ast.docComment('A representation of a point in two-dimensional space.'),
  new ast.TypeDeclaration(
    ast.ident('Point'),
    new ast.AnonymousRecordNode([
      ast.typedIdent('x', ast.ident('Float')),
      ast.typedIdent('y', ast.ident('Float')),
    ]),
  ),
];

const aliasRecord: ast.TopLevelNode[] = [
  ast.docComment('Just a random type alias'),
  new ast.TypeDeclaration(
    ast.ident('MyAlias'),
    ast.path('core', 'string', 'String'),
  ),
];

const distanceFunction: ast.TopLevelNode[] = [
  ast.docComment(
    'Calculates the distance between this point and another point.',
    '',
    '## Examples',
    '',
    '```helios',
    '> let a = Point(x: 1.0, y: 2.0)',
    '> let b = Point(x: 2.0, y: 4.0)',
    '> distance_from(a, b) == ???',
    'True',
    '```',
    // "    > let a = Point(x: 1.0, y: 2.0)",
    // "    > let b = Point(x: 2.0, y: 4.0)",
    // "    > distance_from(a, b) == ???",
    // "    True",
    // ""
  ),
  new ast.FunctionDeclaration(
    ast.ident('distance'),
    [
      ast.optTypedIdent('a', ast.ident('Point')),
      ast.optTypedIdent('b', ast.ident('Point')),
    ],
    ast.type(ast.ident('Float')),
    new ast.BlockExpression([
      new ast.BindingDeclaration(
        ast.ident('dx'),
        ast.inferredType(),
        new ast.CallExpression(ast.path('math', 'pow'), [
          new ast.BinaryExpression(
            '-',
            new ast.DotExpression([ast.ident('b'), ast.ident('x')]),
            new ast.DotExpression([ast.ident('a'), ast.ident('x')]),
          ),
          ast.literal(2.0, true),
        ]),
      ),
      new ast.BindingDeclaration(
        ast.ident('dy'),
        ast.inferredType(),
        new ast.CallExpression(ast.path('math', 'pow'), [
          new ast.BinaryExpression(
            '-',
            new ast.DotExpression([ast.ident('b'), ast.ident('y')]),
            new ast.DotExpression([ast.ident('a'), ast.ident('y')]),
          ),
          ast.literal(2.0, true),
        ]),
      ),
      new ast.CallExpression(ast.path('math', 'sqrt'), [
        new ast.BinaryExpression('+', ast.ident('dx'), ast.ident('dy')),
      ]),
    ]),
  ),
];

const coordSumFunction: ast.TopLevelNode[] = [
  ast.docComment(
    'This function accepts any value with `x`, `y` and `z` fields and calculates',
    'their sum.',
  ),
  new ast.FunctionDeclaration(
    ast.ident('coord_sum'),
    [
      ast.optTypedIdent(
        'values',
        new ast.AnonymousRecordNode([
          ast.typedIdent('x', ast.ident('Float')),
          ast.typedIdent('y', ast.ident('Float')),
          ast.typedIdent('z', ast.ident('Float')),
        ]),
      ),
    ],
    ast.inferredType(),
    new ast.BlockExpression([
      new ast.BindingDeclaration(
        ast.ident('sum'),
        ast.inferredType(),
        new ast.LambdaExpression(
          [ast.optTypedIdent('xs')],
          ast.inferredType(),
          new ast.CallExpression(ast.path('list', 'reduce'), [
            ast.ident('xs'),
            ast.literal(0),
            new ast.LambdaExpression(
              [ast.optTypedIdent('acc'), ast.optTypedIdent('cur')],
              ast.inferredType(),
              new ast.BinaryExpression('+', ast.ident('acc'), ast.ident('cur')),
            ),
          ]),
        ),
      ),
      new ast.CallExpression(ast.ident('sum'), [
        new ast.ListExpression([
          new ast.DotExpression([ast.ident('value'), ast.ident('x')]),
          new ast.DotExpression([ast.ident('value'), ast.ident('y')]),
          new ast.DotExpression([ast.ident('value'), ast.ident('z')]),
        ]),
      ]),
    ]),
  ),
];

const mainFunction: ast.TopLevelNode[] = [
  ast.comment('This is the entry point of the program.'),
  new ast.FunctionDeclaration(
    ast.ident('__main__'),
    [],
    ast.inferredType(),
    new ast.BlockExpression([
      new ast.CallExpression(ast.path('io', 'println'), [
        new ast.InterpolatedStringExpression([
          'Hello, my name is ',
          ast.ident('name'),
          ' and I am ',
          new ast.BinaryExpression('+', ast.literal(20), ast.literal(2)),
          ' years old!',
        ]),
      ]),
    ]),
  ),
];

const program: ast.Program = new Array<ast.TopLevelNode>().concat(
  imports,
  pointRecord,
  aliasRecord,
  distanceFunction,
  coordSumFunction,
  mainFunction,
);

async function main() {
  const options: ast.AstVisitorOptions = {
    preferTrailingSeparators: true,
    symbols: {
      // pathSeparator: ".",
    },
  };

  const stringified = ast.stringify(program, options);
  console.log(stringified, '\n');

  const fileName = 'source.hl.html';
  const filePath = `./out/${fileName}`;
  const htmlified = ast.htmlify(program, options);
  await fs.ensureFile(filePath);
  await Deno.writeTextFile(filePath, htmlified);
  console.log('Successfully written file to', await Deno.realPath(filePath));
}

await main();
