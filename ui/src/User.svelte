<script>
  export let pubKeyStr = ""
  import { scribeStr } from './stores.js';
</script>
<style>
  .user {
    display: inline-block;
    padding: 3px;
  }
  .scribe {
    border: 2px solid red !important;
  }
  .participant {
    border: 2px solid black;
  }
</style>
<li class="user {pubKeyStr == $scribeStr ? 'scribe' : 'participant'}">
  {pubKeyStr.slice(-4)}
</li>
