<script>
  import SortSelector from './SortSelector.svelte'

  export let setSortOption
  export let sortOption

</script>

<style>
  .toolbar {
    display: flex;
    align-items: center;
  }
</style>

<div class='toolbar'>
  <h1>Talking Stickies</h1>
  <SortSelector setSortOption={setSortOption} sortOption={sortOption} />
</div>
