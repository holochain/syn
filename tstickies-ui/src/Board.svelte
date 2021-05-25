<script>
  import { createEventDispatcher } from 'svelte'
  import { content } from './stores.js'
  import StickyEditor from './StickyEditor.svelte'
  import PlusIcon from './icons/PlusIcon.svelte'
  import SpeakingIcon from './icons/SpeakingIcon.svelte'
  import QuestionIcon from './icons/QuestionIcon.svelte'
  import StarIcon from './icons/StarIcon.svelte'
  import { v1 as uuidv1 } from 'uuid';

  const dispatch = createEventDispatcher()

//   $: stickies = $content.body.length === 0 ? [{
//     id: '1',
//     text: 'A retro item',
//     votes: {
//           talk: 0, star: 0, question: 0
//         }
//   },{
//     id: '2',
//     text: 'Improve awesomeness',
//     votes: {
//           talk: 0, star: 0, question: 0
//         }
//   }, {
//     id: '3',
//     text: 'An unusually long sticky to test what happens with unusually long stickies. But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system, and expound the actual teachings of the great explorer of the truth, the master-builder of human happiness. No one rejects, dislikes, or avoids pleasure itself, because it is pleasure, but because those who do not know how to pursue pleasure rationally encounter consequences that are extremely painful. Nor again is there anyone who loves or pursues or desires to obtain pain of itself, because it is pain, but because occasionally circumstances occur in which toil and pain can procure him some great pleasure. To take a trivial example, which of us ever undertakes laborious physical exercise, except to obtain some advantage from it? But who has any right to find fault with a man who chooses to enjoy a pleasure that has no annoying consequences, or one who avoids a pain that produces no resultant pleasure?',
//     votes: {
//           talk: 0, star: 0, question: 0
//         }
//   },
//   {
//     id: '4',
//     text: 'Fix small absence of awesomeness',
//     votes: {
//           talk: 0, star: 0, question: 0
//         }
//   }
// ] : JSON.parse($content.body)

  $: stickies = $content.body.length === 0 ? [] : JSON.parse($content.body)

  let creating = false

  const newSticky = () => {
    creating = true
  }

  let editingStickyId

  const editSticky = id => () => {
    editingStickyId = id
  }

  const cancelEdit = () => {
    creating = false
    editingStickyId = null
  }

  const addSticky = text => {
    dispatch('requestChange', [
      {type: 'add-sticky', value: {
        id: uuidv1(),
        text,
        votes: {
          talk: 0, star: 0, question: 0
        }
      }}
    ])
    creating = false
  }

  const deleteSticky = id => () => {
    dispatch('requestChange', [
      {type: 'delete-sticky', value: {id}}
    ])
    editingStickyId = null
  }

  const updateSticky = id => text => {
    const sticky = stickies.find(sticky => sticky.id === id)
    if (!sticky) {
      console.error("Failed to find sticky with id", id)
      return
    }

    dispatch('requestChange', [
      {type: 'update-sticky', value: {
        ...sticky,
        text
      }}
    ])
    editingStickyId = null
  }

  const voteOnSticky = (id, type) => {
    const sticky = stickies.find(sticky => sticky.id === id)
    if (!sticky) {
      console.error("Failed to find sticky with id", id)
      return
    }

    const votes = {
      ...sticky.votes,
      [type]: (sticky.votes[type] + 1) % 4
    }

    dispatch('requestChange', [
      {type: 'update-sticky', value: {
        ...sticky,
        votes
      }}
    ])
  }

</script>

<style>
  .board {
    display: flex;
    flex-direction: column;
    min-height: 500px;
    padding: 30px 60px;
    background-color: white;
    box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.25);
    border-radius: 3px;
    flex: 1;
  }
  .stickies {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  .sticky {
    background-color: #D4F3EE;
    flex-basis: 212px;
    min-height: 100px;
    margin: 25px;
    padding: 20px;
    box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.5);
    font-size: 12px;
    line-height: 16px;
    text-align: center;
    color: #000000;
    display: flex;
    flex-direction: column;
  }
  .add-sticky {
    display: flex;
    align-items: center;
    max-height: 30px;
    margin-left: 25px;
  }
  .add-sticky :global(svg) {
    margin-right: 6px;
  }
  .votes {
    display: flex;
    align-items: center;
    justify-content: space-around;
    margin-top: auto;
  }
  .vote {
    display: flex;
    align-items: center;
    background: #C9C9C9;
    border: 1px solid #000000;
    border-radius: 5px;
    flex-basis: 26px;
    height: 25px;
    padding: 0 5px;
  }
  .vote :global(svg) {
    margin-right: auto;
  }
</style>

<div class='board'>
  <div class='add-sticky' on:click={newSticky}>
    <PlusIcon  />Add Sticky
  </div>
  <div class='stickies'>
    {#each stickies as { id, text, votes } (id)}
      {#if editingStickyId === id}
        <StickyEditor handleSave={updateSticky(id)} handleDelete={deleteSticky(id)} {cancelEdit} {text} />
      {:else}
        <div class='sticky' on:click={editSticky(id)}>
          {text}
          <div class='votes'>
            <div class='vote' on:click|stopPropagation={() => voteOnSticky(id, 'talk')}>
              <SpeakingIcon /> {votes.talk}
            </div>
            <div class='vote' on:click|stopPropagation={() => voteOnSticky(id, 'star')}>
              <StarIcon /> {votes.star}
            </div>
            <div class='vote' on:click|stopPropagation={() => voteOnSticky(id, 'question')}>
              <QuestionIcon /> {votes.question}
            </div>
          </div>
        </div>
      {/if}
    {/each}
    {#if creating}
      <StickyEditor handleSave={addSticky} {cancelEdit} />
    {:else if stickies.length > 0}
      <div on:click={newSticky}>
        <PlusIcon  />
      </div>
    {/if}
  </div>
</div>