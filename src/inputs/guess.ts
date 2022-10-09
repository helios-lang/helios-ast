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
    ast.docComment(
      'A type that holds information about the game, such as the answer.',
    ),
    new ast.SumTypeDeclaration(ast.typeIdent('Game'), [
      ast.identWithType('answer', ast.typeIdent('Int')),
      ast.identWithType('highest', ast.typeIdent('Int')),
      ast.identWithType('rounds', ast.typeIdent('Int')),
    ]),
  ],
  [
    ast.docComment('The result of a game round.'),
    new ast.ProductTypeDeclaration(ast.typeIdent('Guess_Result'), [
      new ast.ConstructorDeclaration(ast.ident('Win'), []),
      new ast.ConstructorDeclaration(ast.ident('Too_Low'), []),
      new ast.ConstructorDeclaration(ast.ident('Too_High'), []),
      new ast.ConstructorDeclaration(ast.ident('Quit'), []),
    ]),
  ],
  [
    ast.docComment(
      'A pure function that checks whether or not the provided number is equal to',
      'the answer.',
      '',
      'This function will return `Too_Low` if `number` is lower than the answer, or',
      '`Too_High` if the number is higher than the answer. However, if the value is',
      'any negative integer, then `Quit` is returned.',
    ),
    new ast.FunctionDeclaration(
      ast.ident('check_number'),
      [
        ast.identWithType('game', ast.typeIdent('Game')),
        ast.identWithType('number', ast.typeIdent('Int')),
      ],
      ast.type(ast.typeIdent('Guess_Result')),
      new ast.BlockExpression([
        new ast.IfExpression(
          new ast.BinaryExpression('<', ast.ident('number'), ast.literal(0)),
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
    ast.docComment(
      'The main driver of the game.',
      '',
      'This function is responsible for getting the input provided from `stdin` and',
      'checking whether it is equal to, lower than or higher than the answer. If the',
      'value is not equal to the answer, a message is displayed and prompts for',
      'another input again. Otherwise, it will congratulate the user that they',
      'guessed the right number.',
      '',
      'This function will terminate if the input provided is a negative integer. If',
      'it fails to read from `stdin`, it will print an error and prompt again.',
    ),
    new ast.FunctionDeclaration(
      ast.ident('play_rounds'),
      [
        ast.identWithType('game', ast.typeIdent('Game')),
        ast.identWithType('round', ast.typeIdent('Int')),
      ],
      ast.inferredType(),
      new ast.BlockExpression([
        new ast.CallExpression(ast.path('io', 'print'), [
          ast.interpolated(
            'Enter your guess (0 to ',
            new ast.DotExpression([ast.ident('game'), ast.ident('highest')]),
            '): ',
          ),
        ]),
        new ast.BindingDeclaration(
          ast.ident('result'),
          ast.inferredType(),
          new ast.BlockExpression([
            new ast.ChainExpression(
              new ast.CallExpression(ast.path('io', 'read_line'), []),
              [
                '|>',
                new ast.CallExpression(ast.path('result', 'map'), [
                  new ast.CallExpression(ast.path('string', 'trim')),
                ]),
              ],
              [
                '|>',
                new ast.CallExpression(ast.path('result', 'map'), [
                  new ast.CallExpression(ast.path('int', 'parse')),
                ]),
              ],
              [
                '|>',
                new ast.CallExpression(ast.ident('check_number'), [
                  ast.ident('game'),
                  ast.ident('_'),
                ]),
              ],
            ),
          ]),
        ),
        new ast.CaseExpression(ast.ident('result'), [
          [
            new ast.ConstructorExpression(ast.ident('Okay'), [
              ast.optLabelledParam(
                undefined,
                new ast.ConstructorExpression(ast.ident('Win')),
              ),
            ]),
            new ast.BlockExpression([
              new ast.CallExpression(ast.path('io', 'println'), [
                ast.literal('You won!'),
              ]),
              new ast.CallExpression(ast.path('io', 'println'), [
                ast.interpolated(
                  'You made ',
                  new ast.BinaryExpression(
                    '+',
                    ast.ident('round'),
                    ast.literal(1),
                  ),
                  ' guess(es)',
                ),
              ]),
            ]),
          ],
          [
            new ast.ConstructorExpression(ast.ident('Okay'), [
              ast.optLabelledParam(
                undefined,
                new ast.ConstructorExpression(ast.ident('Too_Low')),
              ),
            ]),
            new ast.BlockExpression([
              new ast.CallExpression(ast.path('io', 'println'), [
                ast.literal('Too low! Try again...'),
              ]),
              new ast.CallExpression(ast.ident('play_rounds'), [
                ast.ident('game'),
                new ast.BinaryExpression(
                  '+',
                  ast.ident('round'),
                  ast.literal(1),
                ),
              ]),
            ]),
          ],
          [
            new ast.ConstructorExpression(ast.ident('Okay'), [
              ast.optLabelledParam(
                undefined,
                new ast.ConstructorExpression(ast.ident('Too_High')),
              ),
            ]),
            new ast.BlockExpression([
              new ast.CallExpression(ast.path('io', 'println'), [
                ast.literal('Too high! Try again...'),
              ]),
              new ast.CallExpression(ast.ident('play_rounds'), [
                ast.ident('game'),
                new ast.BinaryExpression(
                  '+',
                  ast.ident('round'),
                  ast.literal(1),
                ),
              ]),
            ]),
          ],
          [
            new ast.ConstructorExpression(ast.ident('Okay'), [
              ast.optLabelledParam(
                undefined,
                new ast.ConstructorExpression(ast.ident('Quit')),
              ),
            ]),
            new ast.BlockExpression([
              new ast.CallExpression(ast.path('io', 'println'), [
                ast.literal('Goodbye!'),
              ]),
            ]),
          ],
          [
            new ast.ConstructorExpression(ast.ident('Error'), [
              ast.optLabelledParam(undefined, ast.ident('error')),
            ]),
            new ast.BlockExpression([
              new ast.CallExpression(ast.path('io', 'eprintln'), [
                ast.interpolated('Failed to get input: ', ast.ident('error')),
              ]),
              new ast.CallExpression(ast.ident('play_rounds'), [
                ast.ident('game'),
                ast.ident('round'),
              ]),
            ]),
          ],
        ]),
      ]),
    ),
  ],
  [
    ast.docComment(
      'The entry point of the guessing game.',
      '',
      'The main objective of this simple game is to guess the random number the',
      'computer has chosen. You win the game if you guess the number. Otherwise, the',
      'program will keep telling you whether or not your guess is lower or higher',
      'until you guess the right number.',
    ),
    new ast.ExportedDeclarationNode(
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
            new ast.CallExpression(
              ast.path('random', 'random_integer_between'),
              [
                ast.literal(0),
                new ast.BinaryExpression(
                  '+',
                  ast.ident('highest'),
                  ast.literal(1),
                ),
              ],
            ),
          ),
          new ast.BindingDeclaration(
            ast.ident('game'),
            ast.inferredType(),
            new ast.ConstructorExpression(ast.ident('Game'), [
              ast.optLabelledParam(undefined, ast.ident('answer')),
              ast.optLabelledParam(undefined, ast.ident('highest')),
              ast.labelledParam('rounds', ast.literal(0)),
            ]),
          ),
          new ast.CallExpression(ast.ident('play_rounds'), [ast.ident('game')]),
        ]),
      ),
    ),
  ],
);
