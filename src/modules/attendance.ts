import * as ast from '../ast/mod.ts';

export default ast.module(
  [
    new ast.ImportDeclarationGroup([
      new ast.ImportDeclaration(ast.path('core', 'map'), { external: true }),
      new ast.ImportDeclaration(ast.path('core', 'option'), { external: true }),
    ]),
  ],
  [
    ast.docComment(
      'The student ID type, internally represented as a `String`.',
    ),
    new ast.TypeAliasDeclaration(
      ast.typeIdent('Student_Id'),
      ast.typeIdent('String'),
    ),
  ],
  [
    ast.docComment('A student to mark attendance for.'),
    new ast.SumTypeDeclaration(ast.typeIdent('Student'), [
      ast.identWithType('id', ast.typeIdent('Student_Id')),
      ast.identWithType('full_name', ast.typeIdent('String')),
    ]),
  ],
  [
    ast.docComment('A mapping of student IDs and their attendance statuses.'),
    new ast.TypeAliasDeclaration(
      ast.typeIdent('Attendance_Record'),
      ast.typeIdent('Map', ['Student_Id', 'Student']),
    ),
  ],
  [
    ast.docComment('Mark the given student as attendance.'),
    new ast.FunctionDeclaration(
      ast.ident('mark_present'),
      [
        ast.identWithType('record', ast.typeIdent('Attendance_Record')),
        ast.identWithType('student', ast.typeIdent('Student')),
      ],
      ast.type(ast.typeIdent('Attendance_Record')),
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
      [ast.identWithType('student', ast.typeIdent('Student'))],
      ast.type(ast.typeIdent('Bool')),
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
