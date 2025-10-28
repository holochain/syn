import * as Automerge from '@automerge/automerge'

export function elemIdToPosition(
  left: boolean,
  elemId: string,
  text: Automerge.Text
): number | undefined {
  for (let i = 0; i < text.length; i++) {
    if ((text as any).getElemId(i) === elemId) return left ? i : i + 1;
  }

  return undefined;
}
