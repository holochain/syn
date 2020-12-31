<script>
  export let pubKeyStr = ""
  export let pubKey
  export let me = false
  import { scribeStr } from './stores.js';
</script>
<style>
  .user {
    display: grid;
    width: 60px;
    height: 52px;
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    place-items: center;
    color: white;
    text-shadow: 0 0 5px hsla(0, 100%, 0%, 1);
    cursor: pointer;
  }
  .user-color {
    z-index: -1;
    content: '';
    width: 56px;
    height: 48px;
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    background-color: green;
    position: absolute;
  }

  .scribe {
    background-color: red;
  }
  .participant {
    background-color: black;
  }
  .me {
    background-color: blue;
  }
</style>
<div class="user {pubKeyStr == $scribeStr ? 'scribe' : 'participant'}" class:me>
  <div class="user-color"></div>
  {pubKeyStr.slice(-4)}
</div>
