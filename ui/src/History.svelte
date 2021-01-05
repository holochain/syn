<script>
  import { requestedChanges, recordedChanges, committedChanges} from './stores.js';
  export let changeToTextFn

  function change2Html(list) {
    let r = []
    for (let i=list.length-1; i>=0; i--) {
      const text = changeToTextFn(list[i])
      r.push(text)
    }
    return r
  }
  let recordedH
  let committedH
  let requestedH
  $: {requestedH = change2Html($requestedChanges)}
  $: {recordedH = change2Html($recordedChanges)}
  $: {committedH = change2Html($committedChanges)}
</script>
<style>
  .change {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 1px;
    width: 10%;
    height: 75px;
    flex-grow: 0;
    flex-shrink: 0;
    flex-basis: auto;
  }
  .recorded {
    background-color: lightyellow;
  }
  .committed {
    background-color: lightgreen;
  }
  .requested {
    background-color: lightcoral;
  }
  .history {
    width: auto;
    border: 1px solid lightgrey;
    border-radius: 4px;
    padding: .5em;
  }
  .changes {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 1em;
    overflow-x: scroll;
    padding: 1em 0 1em;
  }
</style>
<div class="history">
  History:
  <div class="changes">
    {#each requestedH as change}
      <div class="change requested">{change}</div>
    {/each}
    {#each recordedH as change}
      <div class="change recorded">{change}</div>
    {/each}
    {#each committedH as change}
      <div class="change committed">{change}</div>
    {/each}
    </div>
</div>
