<script>
  import ExIcon from './icons/ExIcon.svelte'
  import TrashIcon from './icons/TrashIcon.svelte'
  import CheckIcon from './icons/CheckIcon.svelte'

  export let handleSave
  export let handleDelete = undefined
  export let cancelEdit
  export let text = ''

  // let text = textA
</script>

<style>
  .sticky-editor {
    display: flex;
    background-color: #D4F3EE;
    flex-basis: 270px;
    height: 140px;
    margin: 20px;
    padding: 10px;
    box-shadow: 4px 5px 13px 0px rgba(0,0,0,0.38);
    font-style: normal;
    font-weight: 600;
    font-size: 12px;
    line-height: 16px;
    color: #000000;
  }
  .textarea {
    background-color: rgba(255, 255, 255, 0.72);
    border: 1px solid #C9C9C9;
    box-sizing: border-box;
    border-radius: 3px;
    width: 100%;
    height: 100%;
  }
  .controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding-left: 7px;
    padding-top: 5px;
  }
</style>

<div class='sticky-editor'>
  <textarea class='textarea' bind:value={text} />
  <div class='controls'>
    <div on:click={cancelEdit}>
      <ExIcon />
    </div>
    <div on:click={() => handleSave(text)}>
      <CheckIcon />
    </div>
    {#if handleDelete}
      <div on:click={handleDelete}>
        <TrashIcon />
      </div>
    {/if}
  </div>
</div>