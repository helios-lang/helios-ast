import * as ast from '../ast/mod.ts';

export default ast.module(
  [
    new ast.ImportDeclarationGroup([
      new ast.ImportDeclaration(ast.path('core', 'map'), true),
    ]),
  ],
  [
    ast.docComment('A student to mark attendance for.'),
    new ast.SumTypeDeclaration(ast.ident('Student'), [
      ast.typedIdent('id', ast.ident('String')),
      ast.typedIdent('full_name', ast.ident('String')),
    ]),
  ],
  [
    ast.docComment('A mapping of student IDs and their attendance statuses.'),
    new ast.TypeAliasDeclaration(
      ast.ident('AttendanceRecord'),
      ast.ident('Map'),
    ),
  ],
  [
    new ast.BlankLineNode(),
    ast.docComment('Mark the given student as attendance.'),
    new ast.FunctionDeclaration(
      ast.ident('mark_present'),
      [
        ast.typedIdent('record', ast.ident('AttendanceRecord')),
        ast.typedIdent('student', ast.ident('Student')),
      ],
      ast.type(ast.ident('AttendanceRecord')),
      new ast.BlockExpression([
        new ast.BinaryExpression(
          '|>',
          ast.ident('record'),
          new ast.CallExpression(ast.path('map', 'insert'), [
            new ast.DotExpression([ast.ident('student'), ast.ident('id')]),
            ast.literal(true),
          ]),
        ),
      ]),
    ),
  ],
  [
    ast.docComment(
      'Determines whether or not the provided student has attended class.',
    ),
    new ast.FunctionDeclaration(
      ast.ident('is_present'),
      [ast.typedIdent('student', ast.ident('Student'))],
      ast.type(ast.ident('Bool')),
      new ast.BlockExpression([
        new ast.BinaryExpression(
          '|>',
          new ast.CallExpression(ast.path('map', 'get'), [
            new ast.DotExpression([ast.ident('student'), ast.ident('id')]),
          ]),
          new ast.CallExpression(ast.path('option', 'or_else'), [
            ast.literal(false),
          ]),
        ),
      ]),
    ),
  ],
);
