<script lang="ts">
  import { afterUpdate, getContext } from 'svelte'
  import { committed_changes_b, recorded_changes_b, requested_changes_b } from '@syn-ui/model'
  import HistoryEntry from './HistoryEntry.svelte'
  const ctx = getContext('ctx')
  const requested_changes = requested_changes_b(ctx)
  const recorded_changes = recorded_changes_b(ctx)
  const committed_changes = committed_changes_b(ctx)

  export let changeToTextFn

  // returns a list of historyEntry objects with some text
  // and a status (for styling)
  function changesToEntriesList(changes, status) {
      let entriesList = []
      for (let i = changes.length - 1; i >= 0; i--) {
          const text = changeToTextFn(changes[i])
          entriesList.push({ 'text': text, 'status': status })
      }
      return entriesList
  }

  let requestedH
  let recordedH
  let committedH
  let historyEntries = []
  $: {requestedH = changesToEntriesList($requested_changes, 'requested')}
  $: {recordedH = changesToEntriesList($recorded_changes, 'recorded')}
  $: {committedH = changesToEntriesList($committed_changes, 'committed')}
  $: {historyEntries = [...requestedH, ...recordedH, ...committedH]}

  // when updating the list, also scroll to the newest historyEntry
  afterUpdate(async ()=>{
      let entryElem = document.getElementsByClassName('history-entries')[0]
      if (entryElem.firstChild !== null) {
          entryElem.firstChild.scrollIntoView(false)
      }
  })

</script>
<style>
  .history {
    width: auto;
    border: 1px solid hsla(0, 0%, 0%, 0.25);
    border-radius: 4px;
    padding: .5em .5em 0;
    background-color: hsla(0, 0%, 100%, .25);
  }
  .history-entries {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 1em;
    overflow-x: scroll;
    padding: .5em 0 1.2em;
  }
</style>

<div class='history'>
  History:
  <div class='history-entries'>
    {#each historyEntries as historyEntry}
      <HistoryEntry status={historyEntry.status} text={historyEntry.text}/>
    {/each}
  </div>
</div>
