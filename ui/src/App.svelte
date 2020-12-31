<script>
  import State from './State.svelte';
</script>

<style>
	main {
		padding: 1em;
    background: hsla(100, 20%, 50%, .2);
    grid-column: 1 / 2;
	}

  .toolbar {
    background: hsla(19, 20%, 50%, .2);
    padding: 2rem;
    grid-column: 1 / 2;
  }

  .participants-tray {
    background: hsla(255, 20%, 50%, .2);
    grid-column: 2 / 3;
    grid-row: 1/4;
    padding: 1rem;
  }

  .debug-drawer {
    background: hsla(180, 30%, 40%, .2);
    padding: 2rem;
    text-align: center;
    grid-column: 1 / 2;
  }

  body {
    font-family: system-ui, sans-serif;
  }

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
    margin: auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>

<div class="toolbar">
  <h1>SynText</h1>
  title should go up here!
</div>

<main>
  <State/>
</main>

<div class="participants-tray" contenteditable>Folks</div>

<div class="debug-drawer">This is a footer that should be hideable and have debug</div>
