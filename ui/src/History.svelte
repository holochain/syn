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
  }
  .changes {
    max-height: 33px;
    overflow-x: scroll;
    overflow-y: hidden;
    overflow-wrap: normal;  }
</style>
<div class="history">
  History:
  <div class="changes">
    {#each requestedH as change}
      <span class="change requested">{change}</span>
    {/each}
    {#each recordedH as change}
      <span class="change recorded">{change}</span>
    {/each}
    {#each committedH as change}
      <span class="change committed">{change}</span>
    {/each}
    </div>
</div>
