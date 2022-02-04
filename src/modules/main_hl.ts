import * as ast from '../ast/mod.ts';

const imports: ast.TopLevelNode[] = [
  ast.comment('Importing modules from the standard library'),
  new ast.ImportDeclarationGroup([
    new ast.ImportDeclaration(ast.path('core', 'io'), true),
  ]),
  ast.comment('Importing modules from third-party libraries'),
  new ast.ImportDeclarationGroup([
    new ast.ImportDeclaration(ast.path('geo2d', 'geo2d'), true),
    new ast.ImportDeclaration(ast.path('c_interop', 'sdl2d'), true),
    new ast.ImportDeclaration(ast.path('rust_interop', 'tokio'), true),
  ]),
  ast.comment('Importing local modules'),
  new ast.ImportDeclarationGroup([
    new ast.ImportDeclaration(ast.path('point')),
  ]),
];

const resultType: ast.TopLevelNode[] = [
  ast.docComment('A type with two constructors.'),
  new ast.ProductTypeDeclaration(
    ast.ident('Result'),
    [
      new ast.ConstructorDeclaration(ast.ident('Okay'), [
        ast.typedIdent('value', ast.ident('t')),
      ]),
      new ast.ConstructorDeclaration(ast.ident('Error'), [
        ast.typedIdent('reason', ast.ident('e')),
      ]),
    ],
    [ast.ident('t'), ast.ident('e')],
  ),
];

// const aliasRecord: ast.TopLevelNode[] = [
//   ast.docComment('Just a random type alias'),
//   new ast.TypeDeclaration(
//     ast.ident('MyAlias'),
//     ast.path('core', 'string', 'String'),
//   ),
// ];

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
      ast.comment('Constructing two points'),
      new ast.BindingDeclaration(
        ast.ident('p'),
        ast.inferredType(),
        new ast.ConstructorExpression(ast.path('point', 'Point'), [
          ast.labelledParam('x', ast.literal(1.0, true)),
          ast.labelledParam('y', ast.literal(2.0, true)),
        ]),
      ),
      new ast.BindingDeclaration(
        ast.ident('q'),
        ast.inferredType(),
        new ast.ConstructorExpression(ast.path('point', 'Point'), [
          ast.labelledParam('x', ast.literal(2.0, true)),
          ast.labelledParam('y', ast.literal(4.0, true)),
        ]),
      ),
      new ast.BindingDeclaration(
        ast.ident('distance'),
        ast.inferredType(),
        new ast.CallExpression(ast.path('point', 'distance_between'), [
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
      new ast.BlankLineNode(),
      ast.comment('Local imports'),
      new ast.ImportDeclaration(ast.path('core', 'random'), true),
      new ast.BindingDeclaration(
        ast.ident('random'),
        ast.inferredType(),
        new ast.CallExpression(ast.path('random', 'random_integer_between'), [
          ast.literal(0),
          ast.literal(11),
        ]),
      ),
      new ast.CallExpression(ast.path('io', 'println'), [
        new ast.InterpolatedStringExpression([
          'The number I chose was ',
          ast.ident('random'),
          '!',
        ]),
      ]),
    ]),
  ),
];

export default ast.module(imports, resultType, mainFunction);
