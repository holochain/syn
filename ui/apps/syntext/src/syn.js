import { AdminWebsocket, AppWebsocket } from '@holochain/conductor-api';
import { HolochainClient } from '@holochain-open-dev/cell-client';
import { SynStore } from '@syn/store';
import { applyTextEditorDelta } from '@syn/text-editor';

// definition of how to apply a delta to the content
// if the delta is destructive also returns what was
// destroyed for use by undo
function applyDelta(content, delta) {
  console.log(content, delta);
  switch (delta.type) {
    case 'Title': {
      const deleted = content.title;
      content.title = delta.value;
      return content;
    }
    case 'Meta': {
      const [tag, loc] = delta.value.setLoc;
      const deleted = [tag, content.meta[tag]];
      content.meta[tag] = loc;
      return content;
    }
    default:
      // Body change
      content.body = applyTextEditorDelta(content.body, delta);
      return content;
  }
}

// definition of how to undo a change, returns a delta that will undo the change
function undo(change) {
  const delta = change.delta;
  switch (delta.type) {
    case 'Title':
      return { type: 'Title', value: change.deleted };
      break;
    case 'Add':
      const [loc, text] = delta.value;
      return { type: 'Delete', value: [loc, loc + text.length] };
      break;
    case 'Delete':
      const [start, end] = delta.value;
      return { type: 'Add', value: [start, change.deleted] };
      break;
    case 'Meta':
      return { type: 'Meta', value: { setLoc: change.deleted } };
  }
}

export async function createStore() {
  const appWebsocket = await AppWebsocket.connect(
    `ws://localhost:${process.env.HC_PORT}`
  );

  const cellData = await appWebsocket.appInfo({
    installed_app_id: 'syn',
  });

  const client = new HolochainClient(appWebsocket, cellData.cell_data[0]);

  return new SynStore(client, { title: '', body: '', meta: {} }, applyDelta);
}
