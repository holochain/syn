import { AppWebsocket } from '@holochain/client';
import { extractSlice } from '@holochain-syn/core';
import { textEditorGrammar } from '@holochain-syn/text-editor';

export const DocumentGrammar = {
  initialState() {
    return {
      title: '',
      body: textEditorGrammar.initialState(),
    };
  },
};

export function textSlice(sessionStore) {
  return extractSlice(
    sessionStore,
    state => state.body,
    eph => eph
  );
}

export async function createClient() {
  const client = await AppWebsocket.connect({});

  return client;
}
