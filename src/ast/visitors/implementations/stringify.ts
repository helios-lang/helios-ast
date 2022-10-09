import {
  AstVisitor,
  AstVisitorMaybeContent,
  AstVisitorNodeKind,
} from '../visitor.ts';

type StringifyVisitorResult = string[];

export class StringifyVisitor extends AstVisitor<StringifyVisitorResult> {
  protected override onYieldNode(
    kind: AstVisitorNodeKind,
    ...contents: AstVisitorMaybeContent[]
  ): StringifyVisitorResult {
    throw new Error('Method not implemented.');
  }
}

Deno.test('StringifyVisitor', (t) => {
  const visitor = new StringifyVisitor();
});
