import * as fs from 'https://deno.land/std@0.123.0/fs/mod.ts';

import * as ast from './ast/mod.ts';

const imports: ast.TopLevelNode[] = [
  ast.comment('Importing modules from the standard library'),
  new ast.ImportDeclarationGroup([
    new ast.ImportDeclaration(ast.path('core', 'io'), true),
    new ast.ImportDeclaration(ast.path('core', 'list'), true),
    new ast.ImportDeclaration(ast.path('core', 'math'), true),
  ]),
  ast.comment('Importing modules from third-party libraries'),
  new ast.ImportDeclarationGroup([
    new ast.ImportDeclaration(ast.path('geo2d/geo2d'), true),
    new ast.ImportDeclaration(ast.path('c_interop', 'sdl2d'), true),
    new ast.ImportDeclaration(ast.path('rust_interop', 'tokio'), true),
  ]),
  ast.comment('Importing local modules'),
  new ast.ImportDeclarationGroup([
    new ast.ImportDeclaration(ast.path('foo')),
    new ast.ImportDeclaration(ast.path('bar', 'quux')),
    new ast.ImportDeclaration(ast.path('..', '..', 'my_module')),
  ]),
];

const pointRecord: ast.TopLevelNode[] = [
  ast.docComment('A representation of a point in two-dimensional space.'),
  new ast.SumTypeDeclaration(ast.ident('Point'), [
    ast.typedIdent('x', ast.ident('Float')),
    ast.typedIdent('y', ast.ident('Float')),
  ]),
];

// const aliasRecord: ast.TopLevelNode[] = [
//   ast.docComment('Just a random type alias'),
//   new ast.TypeDeclaration(
//     ast.ident('MyAlias'),
//     ast.path('core', 'string', 'String'),
//   ),
// ];

const distanceBetweenFunction: ast.TopLevelNode[] = [
  ast.docComment(
    'Calculates the distance between two `Point`s.',
    '',
    'Examples',
    '--------',
    '',
    '```helios',
    '> let a = Point(x: 1.0, y: 2.0)',
    '> let b = Point(x: 2.0, y: 4.0)',
    '> distance_from(a, b)',
    '2.23606797749979',
    '```',
  ),
  new ast.FunctionDeclaration(
    ast.ident('distance_between'),
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
        new ast.AnonymousConstructorNode([
          ast.typedIdent('x', ast.ident('Float')),
          ast.typedIdent('y', ast.ident('Float')),
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
      ast.comment('Bindings can optionally be annotated with their type'),
      new ast.BindingDeclaration(
        ast.ident('name'),
        ast.type(ast.ident('String')),
        ast.literal('Milky'),
      ),
      new ast.CallExpression(ast.path('io', 'println'), [
        new ast.InterpolatedStringExpression([
          'Hello, my name is ',
          ast.ident('name'),
          ' and I am ',
          new ast.BinaryExpression('-', ast.literal(2), ast.literal(1)),
          ' years old!',
        ]),
      ]),
      new ast.BlankLineNode(),
      ast.comment('Constructing two points.'),
      new ast.BindingDeclaration(
        ast.ident('p'),
        ast.inferredType(),
        new ast.ConstructorExpression(ast.ident('Point'), [
          ast.labelledParam('x', ast.LiteralExpression.Float(1.0)),
          ast.labelledParam('y', ast.LiteralExpression.Float(2.0)),
        ]),
      ),
      new ast.BindingDeclaration(
        ast.ident('q'),
        ast.inferredType(),
        new ast.ConstructorExpression(ast.path('geo2d', 'math', 'Point'), [
          ast.labelledParam('x', ast.LiteralExpression.Float(2.0)),
          ast.labelledParam('y', ast.LiteralExpression.Float(4.0)),
        ]),
      ),
      new ast.BindingDeclaration(
        ast.ident('distance'),
        ast.inferredType(),
        new ast.CallExpression(ast.ident('distance_between'), [
          ast.ident('p'),
          ast.ident('q'),
        ]),
      ),
      new ast.CallExpression(ast.path('io', 'println'), [
        new ast.InterpolatedStringExpression([
          'The distance between p and q is ',
          ast.ident('distance'),
        ]),
      ]),
    ]),
  ),
];

const program: ast.Program = new Array<ast.TopLevelNode>().concat(
  imports,
  pointRecord,
  // aliasRecord,
  distanceBetweenFunction,
  coordSumFunction,
  mainFunction,
);

async function main() {
  const options: ast.AstVisitorOptions = {
    stringImports: true,
    addFileExtensionToImports: true,
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
