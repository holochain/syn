<script>
  import {callZome, session, connection, arrayBufferToBase64} from './Holochain.svelte';
  import Holochain from './Holochain.svelte';
  let content = {
    title: 'loading session...',
    body: 'loading session',
  }
  let newTitle = '';
  let commitInProgress = false;
  let pendingDeltas = [];
  let currentCommitHeaderHash;
  $: currentCommitHeaderHashStr = arrayBufferToBase64(currentCommitHeaderHash)
  let lastCommitedContentHash;
  $: lastCommitedContentHashStr = arrayBufferToBase64(lastCommitedContentHash)
  let participants = {};
  $: participantsPretty =  JSON.stringify(Object.keys(participants))

  function addChangeAsScribe(change) {
    let [index, delta] = change;
    // if we can't apply delta immediately (i.e. index is our current index)
    // we must first merge this delta with any previous ones
    if (pendingDeltas.length != index) {
      // TODO: merge
    }
    // add delta to the pending deltas and change state
    pendingDeltas = [...pendingDeltas, delta];
    applyDeltas([delta]);
    // notify all participants of the change
    if (participants.length > 0) {
      console.log(`Sending change to ${participantsPretty}:`, delta);
      callZome("send_change", {participants: Object.keys(participants), deltas: [delta]})
    }
  }

  function applyDeltas(deltas) {
    if (commitInProgress) {
      //FIXME collect them up anyways and apply later?
      alert("WHOA attempt to apply deltas while commit in progress")
      return;
    }
    for (const delta of deltas) {
      switch(delta.type) {
      case "Title":
        content.title = delta.value
        break
      case "Add":
        const [loc, text] = delta.value
        content.body = content.body.slice(0, loc) + text + content.body.slice(loc)
        break
      case "Delete":
        const [start, end] = delta.value
        content.body = content.body.slice(0, start) + content.body.slice(end)
        break
      }
    }
  }

  // handler for the changeReq event
  function changeReq(event) {
    if (session.scribeStr == connection.me) {
      addChangeAsScribe(event.detail)
    } else {
      console.log("change requested but I'm not the scribe.")
    }
  }

  // handler for the change event
  function change(event) {
    if (session.scribeStr == connection.me) {
      console.log("change recevied but I'm the scribe, so I'm ignoring this!")
    } else {
      console.log("FIXME")
    }
  }

  // handler for the syncReq event
  function syncReq(event) {
    const fromStr = arrayBufferToBase64(event.detail.from);
    if (session.scribeStr == connection.me) {
      // update participants
      if (!(fromStr in participants) || event.detail.meta) {
        participants[fromStr] = event.detail.meta
        participants = participants
      }
      let state = {
        snapshot: session.snapshotHash,
        commit_content_hash: lastCommitedContentHash,
        deltas: pendingDeltas
      };
      if (currentCommitHeaderHash) {
        state["commit"] = currentCommitHeaderHash;
      }
      console.log(`sending SyncResp ${fromStr}:`, state)
      callZome("send_sync_response", {
        participant: event.detail.from,
        state
      })
    }
    else {
      console.log("syncReq received but I'm not the scribe!")
    }
  }

  // handler for the syncResp event
  function syncResp(event) {
    const stateForSync = event.detail;
    // Make sure that we are working off the same snapshot and commit
    if (
        arrayBufferToBase64(stateForSync.commit_content_hash) == lastCommitedContentHashStr
       ) {
      applyDeltas(stateForSync.deltas);
    } else {
      console.log("WHOA, sync response has different current state assumptions")
      // TODO: resync somehow
    }
  }

  // handler for the updateParticipants event
  function updateParticipants(event) {
    switch (event.detail.type) {
    case "set":
      participants[event.detail.key] = event.detail.data;
      break;
    case "del":
      delete participants[event.detail.key];
      break;
    }
  }

  // called when requesting a change to the content as a result of user action
  // If we are the scribe, no need to go into the zome
  function requestChange(delta) {
    if (session.scribeStr == connection.me) {
      addDeltaAsScribe(delta)
    } else {
      const index = 0;
      callZome('send_change_request', {scribe: session.scribe, index, delta});
    }
  }

  async function commitChange() {
    if (session.scribeStr == connection.me) {
      if (pendingDeltas.length == 0) {
        alert("No deltas to commit!");
        return;
      }
      commitInProgress = true
      const newContentHash = await callZome('hash_content', content)
      console.log("commiting from snapshot", session.snapshotHashStr);
      console.log("  prev_hash:", arrayBufferToBase64(lastCommitedContentHash));
      console.log("   new_hash:", arrayBufferToBase64(newContentHash));
      const commit = {
        snapshot: session.snapshotHash,
        change: {
          deltas: pendingDeltas,
          content_hash: newContentHash,
          previous_change: lastCommitedContentHash,
          meta: {
            contributors: [],
            witnesses: [],
            app_specific: null
          }
        }
      }
      try {
        currentCommitHeaderHash = await callZome('commit', commit)
        lastCommitedContentHash = newContentHash;
        pendingDeltas = []
      }
      catch (e) {
      }
      commitInProgress = false
    } else {
      alert("You ain't the scribe!")
    }
  }

  let editingTitle = false;
  function toggleEditingTitle() {
    if (editingTitle) {
      let delta = { type: 'Title', value: newTitle};
      requestChange(delta);
      newTitle = "";
    } else {
      newTitle = content.title;
    }
    editingTitle = !editingTitle;
  }

  function setStateFromSession(event) {
    content = event.detail.content;
    lastCommitedContentHash = event.detail.contentHash;
    applyDeltas(event.detail.deltas);
  }

</script>

<style>

  h1 {
    color: blue;
  }

</style>
<Holochain on:setStateFromSession={setStateFromSession} on:changeReq={changeReq} on:syncReq={syncReq} on:syncResp={syncResp} on:change={change} on:updateParticipants={updateParticipants}/>
<div>
  <div>
    Title:
    {#if editingTitle}
    <input bind:value={newTitle}/>
    {:else}
    {content.title}
    {/if}

    <button on:click={toggleEditingTitle} change>
    {#if editingTitle}
    save
    {:else}
    change
    {/if}
    </button>
  </div>
<textarea bind:value={content.body}/>
</div>
<button on:click={commitChange}>Commit</button>
<div>
  <h4>Dev data:</h4>
  <li>lastCommitedContentHash: {lastCommitedContentHashStr}
  <li>pendingDeltas: {JSON.stringify(pendingDeltas)}
  <li>participants: {participantsPretty}
</div>
but
