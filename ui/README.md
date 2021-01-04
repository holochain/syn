---

# syntext

A syn sample app for collaborative text editing.

This is UI is built using svelte from the standard svelte template for [Svelte](https://svelte.dev) apps. It lives at https://github.com/sveltejs/template.


## Get started

Install the dependencies...

```bash
cd ui
npm install
```

...then start [Rollup](https://rollupjs.org):

```bash
npm run dev
```

Navigate to [localhost:5000](http://localhost:5000). You should see the UI running.

Note: the syn happ must be running with the installed_app_id="syn" on port 8888.  Which will happen if you launch it with [holochain-run-dna](https://github.com/holochain-open-dev/holochain-run-dna)

For testing you can use `holochain-run-dna` spin up a conductor with two instances of the app like this:

``` bash
holochain-run-dna -c run-dna-config.yaml -m
```

Then open a second tab and change the port to 8887 and the appId to `syn` before you connect and you can start testing between the two instances.
