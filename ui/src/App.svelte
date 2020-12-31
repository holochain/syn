<script>
  import State from './State.svelte';
</script>

<style>
	main {
		padding: 1em;
    background: coral;
    grid-column: 1 / 2;
	}

  header {
    background: lightpink;
    padding: 2rem;
    grid-column: 1 / 2;
  }

  .participants-tray {
    background: yellow;
    grid-column: 2 / 3;
    grid-row: 1/4;
    padding: 1rem;
  }

  footer {
    background: wheat;
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

<header>
  <h1>SynText</h1>
  title should go up here!
</header>

<main>
  <State/>
</main>

<div class="participants-tray" contenteditable>Folks</div>

<footer>This is a footer that should be hideable and have debug</footer>
