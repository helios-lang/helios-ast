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
      new ast.ConstructorDeclaration(ast.ident('Win'), []),
      new ast.ConstructorDeclaration(ast.ident('Too_Low'), []),
      new ast.ConstructorDeclaration(ast.ident('Too_High'), []),
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
          new ast.BlockExpression([
            new ast.CaseExpression(
              new ast.CallExpression(ast.path('ordering', 'compare'), [
                new ast.DotExpression([ast.ident('game'), ast.ident('answer')]),
                ast.ident('number'),
              ]),
              [
                [
                  new ast.ConstructorExpression(ast.path('ordering', 'Eq')),
                  new ast.ConstructorExpression(ast.ident('Win')),
                ],
                [
                  new ast.ConstructorExpression(ast.path('ordering', 'Lt')),
                  new ast.ConstructorExpression(ast.ident('Too_Low')),
                ],
                [
                  new ast.ConstructorExpression(ast.path('ordering', 'Gt')),
                  new ast.ConstructorExpression(ast.ident('Too_High')),
                ],
              ],
            ),
          ]),
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
      new ast.BlockExpression([
        new ast.CallExpression(ast.path('io', 'print'), [
          new ast.InterpolatedStringExpression([
            'Enter your guess (0 to ',
            new ast.DotExpression([ast.ident('game'), ast.ident('highest')]),
            '): ',
          ]),
        ]),
        new ast.BindingDeclaration(
          ast.ident('result'),
          ast.inferredType(),
          new ast.BinaryExpression(
            '|>',
            new ast.CallExpression(ast.path('io', 'readline')),
            new ast.BinaryExpression(
              '|>',
              new ast.CallExpression(ast.path('result', 'map'), [
                new ast.DotExpression([ast.ident('string'), ast.ident('trim')]),
              ]),
              new ast.BinaryExpression(
                '|>',
                new ast.CallExpression(ast.path('result', 'map'), [
                  new ast.DotExpression([ast.ident('int'), ast.ident('parse')]),
                ]),
                new ast.CallExpression(ast.ident('check_number'), [
                  ast.ident('game'),
                  ast.ident('_'),
                ]),
              ),
            ),
          ),
        ),
        new ast.CaseExpression(ast.ident('result'), [
          [
            new ast.ConstructorExpression(ast.ident('Okay'), [
              ast.labelledParam(
                'value',
                new ast.ConstructorExpression(ast.ident('Win')),
              ),
            ]),
            ast.placeholder(),
          ],
          [
            new ast.ConstructorExpression(ast.ident('Okay'), [
              ast.labelledParam(
                'value',
                new ast.ConstructorExpression(ast.ident('Too_Low')),
              ),
            ]),
            ast.placeholder(),
          ],
          [
            new ast.ConstructorExpression(ast.ident('Okay'), [
              ast.labelledParam(
                'value',
                new ast.ConstructorExpression(ast.ident('Too_High')),
              ),
            ]),
            ast.placeholder(),
          ],
          [
            new ast.ConstructorExpression(ast.ident('Okay'), [
              ast.labelledParam(
                'value',
                new ast.ConstructorExpression(ast.ident('Quit')),
              ),
            ]),
            ast.placeholder(),
          ],
          [
            new ast.ConstructorExpression(ast.ident('Error'), [
              ast.labelledParam('reason', ast.placeholder()),
            ]),
            ast.placeholder(),
          ],
        ]),
      ]),
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
          ast.literal(100),
        ),
        new ast.BindingDeclaration(
          ast.ident('answer'),
          ast.inferredType(),
          new ast.CallExpression(ast.path('random', 'random_integer_between'), [
            ast.literal(0),
            new ast.BinaryExpression('+', ast.ident('highest'), ast.literal(1)),
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
