<script>
  import Editor from './Editor.svelte';
  import Title from './Title.svelte';
  import Users from './Users.svelte';
  import {callZome, session, arrayBufferToBase64} from './Holochain.svelte';
  import Holochain from './Holochain.svelte';
  import { onMount } from 'svelte';
  import { content, pendingDeltas, participants, conn } from './stores.js';

  $: connection = $conn

  let commitInProgress = false;
  let currentCommitHeaderHash;
  $: currentCommitHeaderHashStr = arrayBufferToBase64(currentCommitHeaderHash)
  let lastCommitedContentHash;
  $: lastCommitedContentHashStr = arrayBufferToBase64(lastCommitedContentHash)
  $: participantsPretty =  JSON.stringify(Object.keys($participants))

  // called when requesting a change to the content as a result of user action
  // If we are the scribe, no need to go into the zome
  function requestChange(delta) {
    // any requested change is on top of last pending delta
    const index = $pendingDeltas.length;
    if (session.scribeStr == connection.me) {
      addChangeAsScribe([index, delta])
    } else {
      callZome('send_change_request', {scribe: session.scribe, index, delta});
    }
  }

  function addChangeAsScribe(change) {
    let [index, delta] = change;
    // if we can't apply delta immediately (i.e. index is our current index)
    // we must first merge this delta with any previous ones
    if ($pendingDeltas.length != index) {
      console.log("WHOA, index didn't match pending deltas!")
      // TODO: merge
    }
    // add delta to the pending deltas and change state
    $pendingDeltas = [...$pendingDeltas, delta];
    applyDeltas([delta]);
    // notify all participants of the change
    const p = Object.values($participants).map(v=>v.pubkey)
    if (p.length > 0) {
      console.log(`Sending change to ${participantsPretty}:`, delta);
      callZome("send_change", {participants: p, deltas: [delta]})
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
        $content.title = delta.value
        break
      case "Add":
        const [loc, text] = delta.value
        $content.body = $content.body.slice(0, loc) + text + $content.body.slice(loc)
        break
      case "Delete":
        const [start, end] = delta.value
        $content.body = $content.body.slice(0, start) + $content.body.slice(end)
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
      console.log("change arrived:", event.detail)
      applyDeltas(event.detail)
    }
  }

  // handler for the syncReq event
  function syncReq(event) {
    const from = event.detail.from
    const fromStr = arrayBufferToBase64(from);
    if (session.scribeStr == connection.me) {
      // update participants
      if (!(fromStr in $participants)) {
        $participants[fromStr] = {
          pubkey: from,
          meta: event.detail.meta
        }
        $participants = $participants
      } else if (event.detail.meta) {
        $participants[fromStr].meta = event.detail.meta
        $participants = $participants
      }
      let state = {
        snapshot: session.snapshotHash,
        commit_content_hash: lastCommitedContentHash,
        deltas: $pendingDeltas
      };
      if (currentCommitHeaderHash) {
        state["commit"] = currentCommitHeaderHash;
      }
      console.log(`sending SyncResp ${fromStr}:`, state)
      callZome("send_sync_response", {
        participant: from,
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
      $participants[event.detail.key] = event.detail.data;
      break;
    case "del":
      delete $participants[event.detail.key];
      break;
    }
  }

  async function commitChange() {
    if (session.scribeStr == connection.me) {
      if ($pendingDeltas.length == 0) {
        alert("No deltas to commit!");
        return;
      }
      commitInProgress = true
      const newContentHash = await callZome('hash_content', $content)
      console.log("commiting from snapshot", session.snapshotHashStr);
      console.log("  prev_hash:", arrayBufferToBase64(lastCommitedContentHash));
      console.log("   new_hash:", arrayBufferToBase64(newContentHash));
      const commit = {
        snapshot: session.snapshotHash,
        change: {
          deltas: $pendingDeltas,
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
        $pendingDeltas = []
      }
      catch (e) {
      }
      commitInProgress = false
    } else {
      alert("You ain't the scribe!")
    }
  }

  function setStateFromSession(event) {
    $content = event.detail.content;
    lastCommitedContentHash = event.detail.contentHash;
    applyDeltas(event.detail.deltas);
  }
  $: disconnected = !connection
</script>

<style>
  .disconnected {
  pointer-events: none;
  position: relative;
  }

  .disconnected:after {
  content: " ";
  z-index: 10;
  display: block;
  position: absolute;
  height: 100%;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.7);
}
</style>

<Users />
<div class:disconnected>
  <Title on:requestChange={(event) => requestChange(event.detail)}/>
  <Editor on:requestChange={(event) => requestChange(event.detail)}/>
</div>
<button class:disconnected on:click={commitChange}>Commit</button>
<hr/>
<Holochain on:setStateFromSession={setStateFromSession} on:changeReq={changeReq} on:syncReq={syncReq} on:syncResp={syncResp} on:change={change} on:updateParticipants={updateParticipants}/>

<div>
  <h4>Dev data:</h4>
  <ul>
    <li>lastCommitedContentHash: {lastCommitedContentHashStr}
    <li>pendingDeltas: {JSON.stringify($pendingDeltas)}
    <li>participants: {participantsPretty}
    <li>content.title: {$content.title}
  </ul>
</div>
