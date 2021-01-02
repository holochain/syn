<script>
  import { requestedChanges, recordedChanges} from './stores.js';

  function change2Html(change) {
    let html = ""
    const delta = change.delta
    switch(delta.type) {
    case "Add":
      html += `+${delta.value[1]}<br/>@${delta.value[0]}`
      break;
    case "Delete":
      html += `-${change.deleted}<br/>@${delta.value[0]}`
      break;
    case "Title":
      html += `T=${change.deleted}-><br/>${delta.value}`
      break;
    }
    return html
  }
</script>
<style>
  .change {
    display: inline-block;
    border: 1px solid #ccc
  }
  .requested {
    background-color: gray
  }
</style>
<div>
History:
{#each $recordedChanges as change}
  <div class="change">
    {@html change2Html(change)}
  </div>
{/each}
{#each $requestedChanges as change}
  <div class="change requested">
    {@html change2Html(change)}
  </div>
{/each}
</div>
