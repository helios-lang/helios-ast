import * as ast from '../ast/mod.ts';

const imports: ast.TopLevelNode[] = [
  ast.comment('Importing modules from the standard library'),
  new ast.ImportDeclarationGroup([
    new ast.ImportDeclaration(ast.path('core', 'list'), { external: true }),
    new ast.ImportDeclaration(ast.path('core', 'math'), { external: true }),
  ]),
];

const pointType: ast.TopLevelNode[] = [
  ast.docComment('A representation of a point in two-dimensional space.'),
  new ast.SumTypeDeclaration(ast.ident('Point'), [
    ast.typedIdent('x', ast.ident('Float')),
    ast.typedIdent('y', ast.ident('Float')),
  ]),
];

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
    '> distance_between(a, b)',
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
          ast.typedIdent('z', ast.ident('Float')),
        ]),
      ),
    ],
    ast.type(ast.ident('Float')),
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

export default ast.module(
  imports,
  pointType,
  distanceBetweenFunction,
  coordSumFunction,
);
