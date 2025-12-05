import * as Automerge from '@automerge/automerge'

export function elemIdToPosition(
  left: boolean,
  elemId: string,
  text: string[]
): number | undefined {
  for (let i = 0; i < text.length; i++) {
    if (Automerge.getObjectId(text, i) === elemId) return left ? i : i + 1;
  }

  return undefined;
}
