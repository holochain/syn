# @holochain-syn/elements

Collection of custom elements to easily build `syn` applications.

This package is using the modular pattern described in https://holochain-open-dev.github.io.

These elements depend on having a [syn store](https://npmjs.com/package/@holochain-syn/store) and a [profiles store](https://holochain-open-dev.github.io/profiles/guides/frontend/profiles-store/) defined.

## Installing

Install the necessary dependencies:

```bash
npm install @holochain-open-dev/profiles @holochain-open-dev/context @holochain-syn/elements
```

## Usage

First, you need to have instantiated a `SynStore` from [@holochain-syn/store](https://npmjs.com/package/@holochain-syn/store) and a `ProfilesStore` from [@holochain-open-dev/profiles](https://holochain-open-dev.github.io/profiles/guides/frontend/profiles-store/).

### Defining the Context Providers

```ts
// Define the <context-provider> element
import '@holochain-open-dev/context/context-provider';

// Define the <syn-context> element
import { SynContext } from '@holochain-syn/elements';
customElements.define('syn-context', SynContext);
```

Now define the <context-provider> and the <syn-context> element and add it to your html wrapping the whole section of your page in which you are going to be placing the elements from @holochain-syn/elements:

```html
<context-provider id="profiles-context"> 
  <syn-context>
    <syn-sessions> </syn-sessions>
  </syn-context>
</context-provider>
```

### Connect the Store to the Context Providers

Go to [this page](https://holochain-open-dev.github.io/reusable-modules/frontend/frameworks/), select the framework you are using, and follow its example in order to:

- Connect the `ProfilesStore` to the <context-provider> with id="profiles-context".
- Connect the `SynStore` to the <syn-context>.