<script>
  import { requestedChanges, recordedChanges, committedChanges} from './stores.js';

  function change2Html(list) {
    let r = []
    for (let i=list.length-1; i>=0; i--) {
      let delta = list[i].delta
      let alt
      let sym = ""
      switch(delta.type) {
      case "Add":
        sym = "+"
        alt = `${delta.value[1]}@${delta.value[0]}`
        break;
      case "Delete":
        sym = "-"
        alt = `${list[i].deleted}@${delta.value[0]}`
        break;
      case "Title":
        sym = "T"
        alt = `${list[i].deleted}->${delta.value}`
        break;
      case "Meta":
        sym = "."
        alt = ""
      }
      r.push(`${sym}${alt}`)
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
    display: inline-block;
    border: 1px solid #ccc;
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
    overflow-x: scroll;
  }
</style>
<div class="history">
  History:
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
