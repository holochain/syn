import { AdminWebsocket, AppWebsocket } from '@holochain/conductor-api';
import { HolochainClient } from '@holochain-open-dev/cell-client';
import { createSynStore } from '@syn/store';

  // definition of how to apply a delta to the content
  // if the delta is destructive also returns what was
  // destroyed for use by undo
  function applyDelta(content, delta) {
    switch(delta.type) {
    case 'add-sticky':
      {
        const stickies = content.body.length === 0
          ? []
          : JSON.parse(content.body)
        content.body = JSON.stringify([...stickies, delta.value])
        // return [content, {delta}]
        return content
      }
    case 'update-sticky':
      {
        const stickies = content.body.length === 0
          ? []
          : JSON.parse(content.body)
        const updatedStickies = stickies.map(sticky => {
          if (sticky.id === delta.value.id) {
            return delta.value
          } else {
            return sticky
          }
        })
        content.body = JSON.stringify(updatedStickies)
        // return [content, {delta, deleted: stickies.find(sticky => sticky.id === delta.value.id)}]
        return content
      }
    case 'delete-sticky':
      {
        const stickies = content.body.length === 0
          ? []
          : JSON.parse(content.body)
        content.body = JSON.stringify(stickies.filter(sticky => sticky.id !== delta.value.id))
        // return [content, {delta, deleted: stickies.find(sticky => sticky.id === delta.value.id)}]
        return content
      }
    }
  }

// definition of how to apply a delta to the content
// if the delta is destructive also returns what was
// destroyed for use by undo
function applyDeltaBoogie(content, delta) {
  console.log(content, delta);
  switch (delta.type) {
    case 'Title': {
      const deleted = content.title;
      content.title = delta.value;
      return content;
    }
    case 'Add': {
      const [loc, text] = delta.value;
      console.log(content.body.slice(0, loc) + text + content.body.slice(loc));
      content.body =
        content.body.slice(0, loc) + text + content.body.slice(loc);
      return content;
    }
    case 'Delete': {
      const [start, end] = delta.value;
      const deleted = content.body.slice(start, end);
      content.body = content.body.slice(0, start) + content.body.slice(end);
      return content;
    }
    case 'Meta': {
      const [tag, loc] = delta.value.setLoc;
      const deleted = [tag, content.meta[tag]];
      content.meta[tag] = loc;
      return content;
    }
  }
}

export async function createStore() {

  console.log('HC_PORT', process.env.HC_PORT)

  const appWebsocket = await AppWebsocket.connect(
    `ws://localhost:${process.env.HC_PORT}`
  );

  const cellData = await appWebsocket.appInfo({
    installed_app_id: 'syn',
  });

  const client = new HolochainClient(appWebsocket, cellData.cell_data[0]);

  return createSynStore(client, { title: '', body: '', meta: {} }, applyDelta);
}
