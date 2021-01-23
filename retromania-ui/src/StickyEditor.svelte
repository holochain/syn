<script>
  export let saveSticky
  export let cancelSticky  

  let text
</script>

<style>
  .sticky-editor {
    display: flex;
    background-color: #C5FFFD;
    width: 200px;
    height: 100px;
    margin: 20px;
    padding: 20px;
    box-shadow: 4px 5px 13px 0px rgba(0,0,0,0.38);
  }  
  .textarea {
    background-color: #C5FFFD;
    width: 100%;
    height: 100%;
  }
  .controls {
    display: flex;
    flex-direction: column;
  }
  button {
    background-color: #FFBFB7;
    border-radius: 4px;
    border: none;
    font-size: 12px;
    margin-left: 3px;
  }
</style>

<div class='sticky-editor'>
  <textarea class='textarea' bind:value={text} />
  <div class='controls'>
    <button on:click={() => saveSticky(text)}>Save</button>
    <button on:click={cancelSticky}>Cancel</button>
  </div>
</div>
