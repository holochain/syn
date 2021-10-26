<script>
  import SpeakingIcon from './icons/SpeakingIcon.svelte'
  import QuestionIcon from './icons/QuestionIcon.svelte'
  import StarIcon from './icons/StarIcon.svelte'

  export let setSortOption
  export let sortOption

  const handleClick = option => () => {
    if (option === sortOption) {
      setSortOption(null)
    } else {
      setSortOption(option)
    }
  }

</script>

<style>
  .sort-options {
    margin-left: auto;
    display: flex;
  }
  .wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: #E4E4E4;
    border: 5px solid white;
  }
  .selected {
    border: 5px solid black;
    background-color: transparent;
  }
</style>

<div class='sort-options'>
  <div on:click={handleClick('talk')} class='wrapper' class:selected={sortOption === 'talk'}>
    <SpeakingIcon  />
  </div>
  <div on:click={handleClick('star')} class='wrapper' class:selected={sortOption === 'star'}>
    <StarIcon on:click={handleClick('star')} />
  </div>
  <div on:click={handleClick('question')} class='wrapper' class:selected={sortOption === 'question'}>
    <QuestionIcon on:click={handleClick('question')} />
  </div>
</div>
