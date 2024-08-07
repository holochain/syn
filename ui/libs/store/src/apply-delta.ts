export type ApplyDeltaFn<CONTENT, DELTA> = (
  content: CONTENT,
  delta: DELTA
) => CONTENT;
