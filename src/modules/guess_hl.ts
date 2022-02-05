import * as ast from '../ast/mod.ts';

export default ast.module(
  [
    new ast.ImportDeclarationGroup([
      new ast.ImportDeclaration(ast.path('core', 'io'), { external: true }),
      new ast.ImportDeclaration(ast.path('core', 'ordering'), {
        external: true,
      }),
      new ast.ImportDeclaration(ast.path('core', 'random'), { external: true }),
      new ast.ImportDeclaration(ast.path('core', 'result'), { external: true }),
    ]),
  ],
  [
    new ast.SumTypeDeclaration(ast.typeIdent('Game'), [
      ast.identWithType('answer', ast.typeIdent('Int')),
      ast.identWithType('highest', ast.typeIdent('Int')),
      ast.identWithType('rounds', ast.typeIdent('Int')),
    ]),
  ],
  [
    new ast.ProductTypeDeclaration(ast.typeIdent('Guess_Result'), [
      new ast.ConstructorDeclaration(ast.ident('Too_Low'), []),
      new ast.ConstructorDeclaration(ast.ident('Too_High'), []),
      new ast.ConstructorDeclaration(ast.ident('Win'), []),
      new ast.ConstructorDeclaration(ast.ident('Quit'), []),
    ]),
  ],
  [
    new ast.FunctionDeclaration(
      ast.ident('check_number'),
      [
        ast.identWithType('game', ast.typeIdent('Game')),
        ast.identWithType('number', ast.typeIdent('Int')),
      ],
      ast.type(ast.typeIdent('Guess_Result')),
      new ast.BlockExpression([
        new ast.IfExpression(
          new ast.BinaryExpression(
            '=',
            ast.ident('number'),
            new ast.UnaryExpression('-', ast.literal(1)),
          ),
          new ast.BlockExpression([
            new ast.ConstructorExpression(ast.ident('Quit')),
          ]),
          new ast.BlockExpression([ast.placeholder()]),
        ),
      ]),
    ),
  ],
  [
    new ast.FunctionDeclaration(
      ast.ident('play_rounds'),
      [
        ast.identWithType('game', ast.typeIdent('Game')),
        ast.identWithType('round', ast.typeIdent('Int')),
      ],
      ast.type(ast.typeIdent('Guess_Result')),
      new ast.BlockExpression([ast.placeholder()]),
    ),
  ],
  [
    new ast.FunctionDeclaration(
      ast.ident('play'),
      [],
      null,
      new ast.BlockExpression([
        new ast.BindingDeclaration(
          ast.ident('highest'),
          ast.inferredType(),
          ast.literal(101),
        ),
        new ast.BindingDeclaration(
          ast.ident('answer'),
          ast.inferredType(),
          new ast.CallExpression(ast.path('random', 'random_integer_between'), [
            ast.literal(0),
            ast.ident('highest'),
          ]),
        ),
        new ast.BindingDeclaration(
          ast.ident('game'),
          ast.inferredType(),
          new ast.ConstructorExpression(ast.ident('Game'), [
            ast.labelledParam('answer', ast.ident('answer')),
            ast.labelledParam('highest', ast.ident('highest')),
            ast.labelledParam('rounds', ast.literal(0)),
          ]),
        ),
        new ast.BindingDeclaration(
          ast.ident('_'),
          ast.inferredType(),
          new ast.CallExpression(ast.ident('play_rounds'), [ast.ident('game')]),
        ),
      ]),
    ),
  ],
);
