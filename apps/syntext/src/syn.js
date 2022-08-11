import { AdminWebsocket, AppWebsocket } from '@holochain/client';
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client';
import { SynStore, SynClient } from '@holochain-syn/core';
import { textEditorGrammar } from '@holochain-syn/text-editor';

export const DocumentGrammar = {
  initState(state) {
    state.title = '';
    state.body = {};
    textEditorGrammar.initState(state.body);
  },
  applyDelta(delta, state, author) {
    if (delta.type === 'SetTitle') {
      state.title = delta.title;
    } else {
      textEditorGrammar.applyDelta(delta.textEditorDelta, state.body, author);
    }
  },
};

export function textSlice(workspaceStore) {
  return extractSlice(
    workspaceStore,
    change => ({
      type: 'TextEditorDelta',
    }),
    state => state.body,
    eph => eph
  );
}

export async function createStore() {
  const url = `ws://localhost:${process.env.HC_PORT}`;

  const appWebsocket = await AppWebsocket.connect(url);

  const appInfo = await appWebsocket.appInfo({ installed_app_id: 'syn' });

  const client = new HolochainClient(appWebsocket);

  const cellData = appInfo.cell_data.find(c => c.role_id === 'syn-test');
  const cellClient = new CellClient(client, cellData);

  return new SynStore(new SynClient(cellClient));
}
