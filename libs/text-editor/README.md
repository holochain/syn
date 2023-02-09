# @holochain-syn/text-editor

A `syn` text editor grammar and editor element, to easily build real-time collaborative text editors in Holochain.

You can use the text-editor and its grammar as the only state in your `syn` application, or use it as a subcomponent of a larger state in your application.

## Using the Grammar

### As the Standalone grammar in your Syn app

```ts
import { textEditorGrammar } from '@holochain-syn/text-editor';
import { SynStore } from '@holochain-syn/store';

// ... instantiate the client

const store = new SynStore(client, textEditorGrammar);
```

### Including the Grammar into your own Grammar

```ts
import { SynGrammar } from '@syn/store';
import { textEditorGrammar, TextEditorState } from '@holochain-syn/text-editor';

interface DocumentState {
  title: string;
  body: TextEditorState;
}

type DocumentState =
  | {
      type: 'SetTitle';
      title: string;
    }
  | {
      type: 'TextEditorDelta';
      textEditorDelta: TextEditorDelta;
    };

type DocumentGrammar = SynGrammar<CounterState, CounterDelta>;

const DocumentGrammar: DocumentGrammar = {
  initialState: {
    title: '',
    body: textEditorGrammar.initialState,
  },
  applyDelta(
    state: CounterState,
    delta: CounterDelta,
    author: AgentPubKeyB64
  ): CounterState {
    if (delta.type === 'SetTitle') {
      return {
        title: delta.title,
        ...state,
      };
    } else {
      return {
        body: textEditorGrammar.applyDelta(
          state.body,
          delta.textEditorDelta,
          author
        ),
        ...state,
      };
    }
  },
};
```

## Using the <syn-text-editor> element.

1. Attach the context as seen in [the context section of @holochain-syn/elements](https://npmjs.com/package/@holochain-syn/elements).
2. Define the element:

```ts
import { SynTextEditor } from '@holochain-syn/text-editor';
customElements.define('syn-text-editor', SynTextEditor);
```

3. Include it in your html:

```html
<syn-context>
  <context-provider>
    <syn-text-editor id="text-editor"></syn-text-editor>
  </context-provider>
</syn-context>
```

4. Instantiate and pass it its `SynSlice`:

```ts
import { TextEditorGrammar } from '@holochain-syn/text-editor';
import { derived } from 'svelte/store';

function textEditorSlice(
  store: SynStore<DocumentGrammar>
): SynSlice<TextEditorGrammar> {
  return {
    state: derived(this.sessionStore.state, document => document.body),
    requestChanges(deltas: TextEditorDelta[]) {
      const documentDeltas = deltas.map(d => ({
        type: 'TextEditorDelta',
        textEditorDelta: d,
      }));
      return this.sessionStore.requestChanges(documentDeltas);
    },
  };
}

const slice = textEditorSlice(store);

// Here you can also pass the slice as an input if you're using any JS framework
document.getElementById('text-editor').synSlice = slice;
```
