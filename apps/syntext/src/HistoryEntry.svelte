<script>
  export let text
  export let status
</script>
<style>
  .history-entry {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: .3em;
    width: auto;
    height: 2.6em;
    flex-grow: 0;
    flex-shrink: 0;
    flex-basis: auto;
    white-space: pre-wrap;
    overflow-y: scroll;
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
</style>
<div class='history-entry {status}'>
  {text}
</div>
