import { AppAgentWebsocket, AppWebsocket } from '@holochain/client';
import { SynStore, SynClient, extractSlice } from '@holochain-syn/core';
import { textEditorGrammar } from '@holochain-syn/text-editor';
import { Text } from '@automerge/automerge';

export const DocumentGrammar = {
  initState(state) {
    state.body = {};
    state.body.text = new Text();
  },
  applyDelta(delta, state, eph, author) {
    if (delta.type === 'SetTitle') {
      state.title = delta.value;
    } else {
      console.log(state.body.text.get(0));
      console.log(state.body.text);
      textEditorGrammar.applyDelta(
        delta.textEditorDelta,
        state.body,
        eph,
        author
      );
    }
  },
};

export function textSlice(workspaceStore) {
  return extractSlice(
    workspaceStore,
    change => ({
      type: 'TextEditorDelta',
      textEditorDelta: change,
    }),
    state => state.body,
    eph => eph
  );
}

export async function createClient() {
  //const url = `ws://localhost:${process.env.HC_PORT}`;

  const client = await AppAgentWebsocket.connect(undefined, 'syn');

  return client;
}
