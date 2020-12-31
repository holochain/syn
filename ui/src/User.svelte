<script>
  export let pubKeyStr = ""
  export let pubKey
  export let me = false
  import { scribeStr } from './stores.js';



</script>
<style>
  :global(:root) {
    --user-hex-width: 60px;
    --user-hex-height: calc(var(--user-hex-width) * .8666);
    --user-hex-border: 2px;
  }
  .user {
    display: grid;
    width: var(--user-hex-width);
    height: var(--user-hex-height);
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    place-items: center;
    color: white;
    text-shadow: 0 0 5px hsla(0, 100%, 0%, 1);
    cursor: pointer;
  }
  .user-color {
    z-index: -1;
    content: '';
    width: calc(var(--user-hex-width) - (var(--user-hex-border)) * 2);
    height: calc(var(--user-hex-height) - (var(--user-hex-border)) * 2);
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
    background-color: yellow;
    position: absolute;
  }

  .scribe {
    background-color: skyblue;
  }
  .participant {
    background-color: purple;
  }
  .me {
    background-color: magenta;
  }
</style>
<div class="user {pubKeyStr == $scribeStr ? 'scribe' : 'participant'}" class:me>
  <div class="user-color"></div>
  {pubKeyStr.slice(-4)}
</div>
