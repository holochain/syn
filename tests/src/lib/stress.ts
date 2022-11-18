import { Scenario } from '@holochain/tryorama';

import { RootStore, SynGrammar, SynStore, WorkspaceStore } from '@holochain-syn/store';
import { Commit, SynClient, Workspace } from '@holochain-syn/client';

import { deserializeHash, EntryHashMap, EntryRecord, serializeHash } from "@holochain-open-dev/utils";
import { spawnSyn } from './spawn.js';
import { Dictionary, EntryHashB64 } from '@holochain-open-dev/core-types';
import { AgentPubKey, EntryHash } from '@holochain/client';
import { get, Readable, writable, Writable } from 'svelte/store';
import { delay } from '../common.js';
import { decode } from '@msgpack/msgpack';

process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});


export interface ThingState {
  name: string;
}

export type ThingDelta =
  | {
      type: "set-name";
      name: string;
    }

export type ThingGrammar = SynGrammar<
ThingDelta,
ThingState
>;

export const thingGrammar: ThingGrammar = {
  initState(state)  {
    state.name = "untitled"
  },
  applyDelta( 
    delta: ThingDelta,
    state: ThingState,
    _ephemeralState: any,
    _author: AgentPubKey
  ) {
    if (delta.type == "set-name") {
      state.name = delta.name
  }
}};


export const CommitTypeThing :string = "thing"

export class Thing {    
  constructor(public workspace: WorkspaceStore<ThingGrammar>) {
  }

  public static async Create(rootStore: RootStore<ThingGrammar>) {
      const workspaceHash = await rootStore.createWorkspace(
          `${new Date}`,
          rootStore.root.entryHash
         );
      const me = new Thing(await rootStore.joinWorkspace(workspaceHash));
      return me
  }

  hash() : EntryHash {
      return this.workspace.workspaceHash
  }
  hashB64() : EntryHashB64 {
      return serializeHash(this.workspace.workspaceHash)
  }
  close() {
      this.workspace.leaveWorkspace()
  }
  state(): ThingState {
    return get(this.workspace.state)
  }
  requestChanges(deltas: Array<ThingDelta>) {
      console.log("REQUESTING THING CHANGES: ", deltas)
      this.workspace.requestChanges(deltas)
  }
  participants()  {
      return this.workspace.participants
  }
  async commitChanges() {
      this.workspace.commitChanges()
  }
}

export const CommitTypeThingList :string = "thing-list"

export interface ThingRecord {
    hash: EntryHashB64
    name: string
}

export interface ThingListState {
    things: ThingRecord[];
}


export type ThingListDelta =
  | {
    type: "add-thing";
    hash: EntryHashB64;
    name: string;
    status?: string;
  }
  | {
    type: "set-name";
    hash: EntryHashB64;
    name: string;
  }

export type ThingListGrammar = SynGrammar<
ThingListDelta,
ThingListState
>;

export const thingListGrammar: ThingListGrammar = {
    initState(state)  {
        state.things = []
        console.log("INITIALIZING TO:", state)
    },
    applyDelta( 
        delta: ThingListDelta,
        state: ThingListState,
        _ephemeralState: any,
        _author: AgentPubKey
      ) {
        if (delta.type == "add-thing") {
            const record: ThingRecord = {
                name: delta.name,
                hash: delta.hash,
            }
            state.things.unshift(record)
        }
        if (delta.type == "set-name") {
            state.things.forEach((thing, i) => {
                if (thing.hash === delta.hash) {
                  state.things[i].name = delta.name;
                }
            });
        }
      }
  }


export class ThingList {
    public workspace: WorkspaceStore<ThingListGrammar> | undefined
    public things: Dictionary<Thing>
    activeThingHash: Writable<EntryHashB64| undefined> = writable(undefined)

    constructor(public rootStore: RootStore<ThingListGrammar>, public thingsRootStore: RootStore<ThingGrammar>) {
        this.things = {}
    }

    public static async Create(synStore: SynStore) {
        const rootStore = await synStore.createDeterministicRoot(thingListGrammar, {type: CommitTypeThingList})
        const thingsRootStore = await synStore.createDeterministicRoot(thingGrammar, {type: CommitTypeThing})
        const me = new ThingList(rootStore, thingsRootStore);
        const workspaceHash = await rootStore.createWorkspace(
            'main',
            rootStore.root.entryHash
           );
        me.workspace = await rootStore.joinWorkspace(workspaceHash)
        return me
    }
    public static async Join(synStore: SynStore, rootCommit: EntryRecord<Commit>, thingsRootCommit: EntryRecord<Commit>) {
        const rootStore = new RootStore(
            synStore.client,
            thingListGrammar,
            rootCommit
          );
          const thingsRootStore = new RootStore(
            synStore.client,
            thingGrammar,
            thingsRootCommit
          );
        const me = new ThingList(rootStore, thingsRootStore);
        const workspaces: EntryHashMap<Workspace> = get(await rootStore.fetchWorkspaces());
        // if there is no workspace then we have a problem!!
        me.workspace = await rootStore.joinWorkspace(workspaces.keys()[0]);
        return me
    }
    hash() : EntryHash {
        return this.rootStore.root.entryHash
    }
    close() {
        this.workspace!.leaveWorkspace()
    }
    stateStore() {
        return this.workspace!.state
    }
    state() {
        return get(this.workspace!.state)
    }
    requestChanges(deltas: Array<ThingListDelta>) {
        console.log("REQUESTING BOARDLIST CHANGES: ", deltas)
        this.workspace!.requestChanges(deltas)
    }
    participants()  {
        return this.workspace!.participants
    }
    async commitChanges() {
        this.workspace!.commitChanges()
    }

    async requestThingChanges(hash: EntryHashB64, deltas: ThingDelta[]) {
        const thing = await this.getThing(hash)
        if (thing) {
            thing.requestChanges(deltas)
        }
    }

    async requestAtiveThingChanges(deltas: ThingDelta[]) {
        this.requestThingChanges(get(this.activeThingHash)!, deltas)
    }

    getReadableThingState(hash: EntryHashB64 | undefined) : Readable<ThingState> | undefined {
        if (hash == undefined) return undefined
        return this.things[hash].workspace.state
    }
    
    async getThing(hash: EntryHashB64) : Promise<Thing | undefined> {
        let thing = this.things[hash]
        if (!thing) {
            const workspaceHash = deserializeHash(hash)
            thing = this.things[hash] = new Thing(await this.thingsRootStore.joinWorkspace(workspaceHash));
        }
        return thing
    }

    async setActiveThing(hash: EntryHashB64 | undefined) {
        let thing
        if (hash) {
            thing = await this.getThing(hash)
            if (thing) {
                this.activeThingHash.update((_n) => {return hash} )
            }
        }
        if (!thing) {
            this.activeThingHash.update((_n) => {return undefined} )
        }
    }


    closeActiveThing() {
        this.setActiveThing(undefined)
    }

    async makeThing(options: any, _fromHash?: EntryHashB64) : Promise<Thing> {
        const thing = await Thing.Create(this.thingsRootStore)
        const workspaceStore = thing.workspace
        const thingHash = thing.hashB64()
        this.things[thingHash] = thing 

        if (options !== undefined) {
            let changes: Array<ThingDelta>= []
            if (options.name) {
              let delta: ThingDelta = {
                type: "set-name",
                name: options.name
              }
              changes.push(delta)
            }
            if (changes.length > 0) {
                workspaceStore.requestChanges(changes)
                await workspaceStore.commitChanges()
            }

            this.requestChanges([{
                type: 'add-thing',
                name: thing.state().name,
                hash: thingHash,
                status: ""
            }])
        
        }
        return thing
    }
}

function getCommitType(commit: Commit) : string {
  //@ts-ignore
  const meta:any = decode(commit.meta)
  return meta.type
}

export default t => async (scenario: Scenario) => {
  const [aliceClient, bobClient] = await spawnSyn(scenario, 2);
  const aliceSyn = new SynStore(new SynClient(aliceClient));
  const bobSyn = new SynStore(new SynClient(bobClient));

  const aliceThingList = await ThingList.Create(aliceSyn);

  for (let i=0;i<10;i++) {
    await aliceThingList.makeThing({name:`Something ${i}`})
  }
  await aliceThingList.commitChanges()
  await delay(500)
  const rootsStore = await bobSyn.fetchAllRoots()
  const roots = get(rootsStore)
  let bobThingList : ThingList
  const entries = roots.entryMap.entries()
  if (entries.length == 0) { 
      console.log(`Found no root entries, creating`)
  } else {
      let thingListRoot
      let thingsRoot
              
      entries.forEach(async ([_hash, commit], i) => {
          const commitType = getCommitType(commit)
          const rootCommit = roots.entryRecords[i]
          if (commitType === CommitTypeThingList) {
              if (!thingListRoot) {
                  console.log("Found a thing list root:", serializeHash(rootCommit.entryHash))
                  thingListRoot = rootCommit
              } else {
                  console.log("Found a thing list root, but have allready joined:", serializeHash(thingListRoot.entryHash))
              }
          }
          if (commitType === CommitTypeThing) {
              if (!thingsRoot) {
                  console.log("Found a thing root:", serializeHash(rootCommit.entryHash))
                  thingsRoot = rootCommit
              } else {
                  console.log("Found a thing root, but have allread stored: ", serializeHash(thingsRoot.entryHash))
              }
          }
      });
      if (thingListRoot && thingsRoot) {
          bobThingList = await ThingList.Join(bobSyn, thingListRoot, thingsRoot)
          console.log("bobThingList", bobThingList.state())

      } else {
          console.log("Missing root, found: ", thingListRoot, thingsRoot )
      }
  }
  console.log("WAITING A Minute")
  await delay(1000*60)
  t.end();
};
