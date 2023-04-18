# @holochain-syn/core

Core package to easily build `syn` Holochain applications.

## Installing

Install the necessary dependencies:

```bash
npm install @holochain-open-dev/profiles @holochain-syn/core
```

## Usage

First, you need to have instantiated a `SynStore` from [@holochain-syn/store](https://npmjs.com/package/@holochain-syn/store) and a `ProfilesStore` from [@holochain-open-dev/profiles](https://holochain-open-dev.github.io/profiles/guides/frontend/profiles-store/).

### Defining the Context Providers

```ts
// Define the <profiles-context> element
import '@holochain-open-dev/profiles/dist/elements/profiles-context.js';

// Define the <syn-context> element
import '@holochain-syn/core/dist/elements/syn-context.js';
```

Now define the <profiles-context> and the <syn-context> element and add it to your html wrapping the whole section of your page in which you are going to be placing the elements from @holochain-syn/elements:

```html
<profiles-context id="profiles-context"> 
  <syn-context>
    <!-- The rest of your application goes here -->
  </syn-context>
</profiles-context>
```

### Connect the Store to the Context Providers

Go to [this page](https://holochain-open-dev.github.io/reusable-modules/frontend/frameworks/), select the framework you are using, and follow its example in order to:

- Connect the `ProfilesStore` to the <profiles-context> with id="profiles-context".
- Connect the `SynStore` to the <syn-context>.