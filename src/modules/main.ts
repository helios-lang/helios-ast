import * as ast from '../ast/mod.ts';

export default ast.module(
  [
    // Language name examples
    ast.comment('Helios [*.he]    | helios helios-ls helios-fmt vscode-helios'),
    ast.comment('Lipi   [*.lipi]  | lipi lipi-ls lipi-fmt vscode-lipi'),
    ast.comment('Mink   [*.mink]  | mink mink-ls mink-fmt vscode-mink'),
    ast.comment('Chalk  [*.chalk] | chalk chalk-ls chalk-fmt vscode-chalk'),
  ],
  [
    ast.comment('Importing modules from the standard library'),
    new ast.ImportDeclarationGroup([
      new ast.ImportDeclaration(ast.path('core', 'io'), { external: true }),
    ]),
  ],
  [
    ast.comment('Importing local modules'),
    new ast.ImportDeclarationGroup([
      new ast.ImportDeclaration(ast.path('attendance')),
      new ast.ImportDeclaration(ast.path('guess')),
      new ast.ImportDeclaration(ast.path('point')),
    ]),
  ],
  [
    ast.docComment('A type with two constructors.'),
    new ast.ProductTypeDeclaration(ast.typeIdent('Result', ['t', 'e']), [
      new ast.ConstructorDeclaration(ast.ident('Okay'), [
        ast.identWithType('value', ast.typeIdent('t')),
      ]),
      new ast.ConstructorDeclaration(ast.ident('Error'), [
        ast.identWithType('reason', ast.typeIdent('e')),
      ]),
    ]),
  ],
  [
    ast.comment('This is the entry point of the program.'),
    new ast.FunctionDeclaration(
      ast.ident('main'),
      [],
      ast.inferredType(),
      new ast.BlockExpression([
        ast.comment('Bindings can optionally be annotated with their type'),
        new ast.BindingDeclaration(
          ast.ident('name'),
          ast.type(ast.typeIdent('String')),
          ast.literal('Milky'),
        ),
        new ast.CallExpression(ast.path('io', 'println'), [
          new ast.InterpolatedStringExpression([
            'Hello, my name is ',
            ast.ident('name'),
            ' and I am ',
            new ast.BinaryExpression('-', ast.literal(12), ast.literal(10)),
            ' years old!',
          ]),
        ]),
        new ast.BlankLineNode(),
        ast.comment('Constructing two points'),
        new ast.BindingDeclaration(
          ast.ident('p'),
          ast.inferredType(),
          new ast.ConstructorExpression(ast.path('point', 'Point'), [
            ast.optLabelledParam('x', ast.literal(1.0, true)),
            ast.optLabelledParam('y', ast.literal(2.0, true)),
          ]),
        ),
        new ast.BindingDeclaration(
          ast.ident('q'),
          ast.inferredType(),
          new ast.ConstructorExpression(ast.path('point', 'Point'), [
            ast.optLabelledParam('x', ast.literal(2.0, true)),
            ast.optLabelledParam('y', ast.literal(4.0, true)),
          ]),
        ),
        new ast.BindingDeclaration(
          ast.ident('dist'),
          ast.inferredType(),
          new ast.CallExpression(ast.path('point', 'distance_between'), [
            ast.ident('p'),
            ast.ident('q'),
          ]),
        ),
        new ast.CallExpression(ast.path('io', 'println'), [
          new ast.InterpolatedStringExpression([
            'The distance between p and q is ',
            ast.ident('dist'),
          ]),
        ]),
        new ast.BlankLineNode(),
        ast.comment('Local imports'),
        new ast.ImportDeclaration(ast.path('core', 'random'), {
          external: true,
        }),
        new ast.BindingDeclaration(
          ast.ident('rand'),
          ast.inferredType(),
          new ast.CallExpression(ast.path('random', 'random_integer_between'), [
            ast.literal(0),
            ast.literal(11),
          ]),
        ),
        new ast.CallExpression(ast.path('io', 'println'), [
          new ast.InterpolatedStringExpression([
            'The number I chose was ',
            ast.ident('rand'),
            '!',
          ]),
        ]),
      ]),
    ),
  ],
);
