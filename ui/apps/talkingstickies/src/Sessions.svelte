<script>
  import { getContext } from 'svelte'

  const { getStore } = getContext('store');

  const store = getStore();

  const isActive = sessionHash => sessionHash === $activeSession.sessionHash

  const switchSession = sessionHash => () => {
    if (isActive(sessionHash)) return
    if (amScribe && !window.confirm('Are you sure? Switching sessions as scribe means losing all data in this session')) return
    store.joinSession(sessionHash)
  }

  $: knownSessions = store.knownSessions

  $: sessionHashes = Object.keys($knownSessions).sort()
  $: activeSession = store.activeSession

  $: amScribe = store.myPubKey === $activeSession.session.scribe
</script>

<div class='sessions'>
  <div class='scribe-wrapper'>
    <div class='scribe' class:amScribe>
      {#if amScribe} You're the scribe {:else} Someone else is the scribe {/if}
    </div>
  </div>
  {#each sessionHashes as sessionHash (sessionHash)}
  	<div class='session' class:active-session={isActive(sessionHash)} on:click={switchSession(sessionHash)}>
      {sessionHash.slice(-5)}
    </div>
  {/each}
</div>

<style>
  .sessions {
    padding: 20px;
    display: flex;
    font-size: 12px;
  }

  .scribe-wrapper {
    flex-basis: 180px;
  }

  .scribe {
    margin: 0 auto;
    width: fit-content;
    padding: 6px;
    border-radius: 4px;
    border: 2px solid transparent;
  }

  .amScribe {
    border-color: pink;
  }

  .session {
    cursor: pointer;
    padding: 6px;
    border-radius: 4px;
    border: 2px solid lightgray;
    margin-left: 10px;
  }

  .active-session {
    cursor: default;
    border-color: orange;
  }
</style>