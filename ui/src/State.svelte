<script>
  import { tick } from 'svelte';
  import {callZome, session, connection, arrayBufferToBase64} from './Holochain.svelte';
  import Holochain from './Holochain.svelte';
  import { onMount } from 'svelte';
  import { content } from './stores.js';

  let titleBeingTyped = '';

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
      console.log("WHOA, index didn't match pending deltas!")
      // TODO: merge
    }
    // add delta to the pending deltas and change state
    pendingDeltas = [...pendingDeltas, delta];
    applyDeltas([delta]);
    // notify all participants of the change
    const p = Object.values(participants).map(v=>v.pubkey)
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
      if (!(fromStr in participants)) {
        participants[fromStr] = {
          pubkey: from,
          meta: event.detail.meta
        }
        participants = participants
      } else if (event.detail.meta) {
        participants[fromStr].meta = event.detail.meta
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
    // any requested change is on top of last pending delta
    const index = pendingDeltas.length;
    if (session.scribeStr == connection.me) {
      addChangeAsScribe([index, delta])
    } else {
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
      const newContentHash = await callZome('hash_content', $content)
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
  function saveTitle() {
    if (editingTitle) {
      let delta = { type: 'Title', value: titleBeingTyped}
      requestChange(delta)
      titleBeingTyped = ''
      editingTitle = false
    } else {
      console.log("Can't saveTitle when it wasn't being edited!")
    }
  }

  let titleEl // variable to bind the
  async function beginEditTitle() {
    console.log("beginning edit title")
    titleBeingTyped = $content.title // fill the field with the current title
    editingTitle = true
    await tick() // wait for the title input element to be created
    titleEl.focus()
  }

  function handleTitleKeypress() {
    // console.log("Keypress in field detected!", event)
		if (event.key == "Enter") {
      saveTitle()
    } else if (event.key == "Escape") {
      // return to past
      console.log("test");
      // turn off editing
      editingTitle=false
    }
  }

  // keep track of whether the doc is untitled
  let untitled
  $: untitled = ($content.title === '')

  let titleHover // whether the title is being hovered


  function setStateFromSession(event) {
    $content = event.detail.content;
    lastCommitedContentHash = event.detail.contentHash;
    applyDeltas(event.detail.deltas);
  }

  let editor
  let loc = 0
  $: editor_content = $content.body.slice(0, loc) + "|" + $content.body.slice(loc)

  function handleInput(event) {
    const key = event.key
    if (key.length == 1) {
      requestChange({type:'Add', value:[loc, key]})
      loc += 1
    } else {
      switch (key) {
      case "ArrowRight":
        if (loc < $content.body.length){
          loc+=1
        }
        break;
      case "ArrowLeft":
        if (loc > 0){
          loc-=1
        }
        break;
      case "Enter":
        requestChange({type:'Add', value:[loc, "\n"]})
        loc += 1
        break;
      case "Backspace":
        if (loc>0) {
          requestChange({type:'Delete', value:[loc-1, loc]})
          loc -=1
        }
      }
    }
    console.log("input", event.key)
  }
  function handleClick(e) {
    const offset = window.getSelection().focusOffset;
    loc = offset > 0 ? offset -1 : 0

  }
</script>

<style>

  h1 {
    color: blue;
  }

  .title {
    /* min-width: 10em;
    min-height: 1em; */
    font-weight: bold;

    padding: 0.4em;
    -webkit-padding: 0.4em 0;
    margin: 0 0 0.5em 0;
  }

  .title-hover {
    border: 1px dashed #eee;
  }

  /* input has to be below hover so it overrides */
  .title-input {
  border: 1px solid #ccc;
  border-radius: 2px;
  }

  .untitled {
    color: lightgray;
  }

  editor {
    width:400px;
    border: 1px solid black;
    display: block;
    font-family: monospace;
    white-space: pre;
    margin: 1em 0;
    padding: 4px;
  }
</style>

<Holochain on:setStateFromSession={setStateFromSession} on:changeReq={changeReq} on:syncReq={syncReq} on:syncResp={syncResp} on:change={change} on:updateParticipants={updateParticipants}/>
<div>
  <div>
    Title:
    <div class="title" class:title-input={editingTitle} class:title-hover={titleHover} on:mouseenter={()=>{titleHover=true}} on:mouseleave={()=>{titleHover=false}} on:click={beginEditTitle}>
      {#if editingTitle}
        <input bind:value={titleBeingTyped} on:keydown={handleTitleKeypress} on:blur={saveTitle} bind:this={titleEl}/>
      {:else}
        <span class:untitled>
          {#if untitled}
            Untitled Document
          {:else}
            {$content.title}
          {/if}
        </span>
      {/if}
    </div>
  </div>
  <editor on:click={handleClick} on:keydown={handleInput} tabindex=0 start=0 bind:this={editor}>
    {editor_content}
  </editor>
</div>
<button on:click={commitChange}>Commit</button>
<div>
  <h4>Dev data:</h4>
  <li>lastCommitedContentHash: {lastCommitedContentHashStr}
  <li>pendingDeltas: {JSON.stringify(pendingDeltas)}
  <li>participants: {participantsPretty}
  <li>editingTitle: {editingTitle}
  <li>titleBeingTyped: {titleBeingTyped}
  <li>content.title: {$content.title}
    <li>editor: {loc} content:{JSON.stringify($content.body)}
</div>
