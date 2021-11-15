export interface EphemeralEngine<EPHEMERAL_STATE, EPHEMERAL_CHANGE> {
  initialState: EPHEMERAL_STATE;

  applyEphemeral: (
    state: EPHEMERAL_STATE,
    change: EPHEMERAL_CHANGE
  ) => EPHEMERAL_STATE;
}

export interface SynEngine<
  CONTENT,
  DELTA,
  EPHEMERAL_STATE = any,
  EPHEMERAL_CHANGE = any
> {
  initialContent: CONTENT;

  applyDelta: (content: CONTENT, delta: DELTA) => CONTENT;

  ephemeral?: EphemeralEngine<EPHEMERAL_STATE, EPHEMERAL_CHANGE>;
}

export type EngineDelta<E extends SynEngine<any, any>> = Parameters<
  E['applyDelta']
>[1];
export type EngineContent<E extends SynEngine<any, any>> = E['initialContent'];

export type EngineEphemeralChanges<E extends SynEngine<any, any>> = Parameters<
  NonNullable<E['ephemeral']>['applyEphemeral']
>[1];

export type EngineEphemeralState<E extends SynEngine<any, any>> = Parameters<
  NonNullable<E['ephemeral']>['initialState']
>;

export type EngineApplyDeltaFn<E extends SynEngine<any, any>> = E['applyDelta'];
