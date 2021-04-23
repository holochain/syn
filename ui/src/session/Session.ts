import type { HoloHash } from '@holochain/conductor-api'
import { content_b, Content } from '../content'
import {
  requestedChanges_b, recordedChanges_b, committedChanges_b, ApplyDelta, applyDelta_T, Delta
} from '../delta'
import { ApiResponse, bufferToBase64, encodeJson } from '../utils'
import { getFolkColors } from '../colors'
import {
  FOLK_GONE, FOLK_SEEN, FOLK_UNKNOWN, PubKeyToFolkRecord, FolkStatus, folks_b, folks_T, FolkI
} from '../folk'
import type { Syn } from '../Syn'
import type { Commit } from '../Commit'
import type { Zome } from '../Zome'
import type { SessionInfo } from './SessionInfo'
import { scribeStr_b } from '../scribe'

// const outOfSessionTimout = 30 * 1000
const outOfSessionTimout = 8 * 1000 // testing code :)

// const heartbeatInterval = 15 * 1000 // 15 seconds
const heartbeatInterval = 30 * 1000 // for testing ;)
let reqTimeout = 1000

export class Session {
  zome:Zome
  applyDeltaFn:applyDelta_T
  _content:Content
  me:string
  myTag:string
  others:PubKeyToFolkRecord
  folks:folks_T

  constructor(protected ctx, syn:Syn, public sessionInfo:SessionInfo) {
    this.zome = syn.zome
    this.applyDeltaFn = syn.applyDeltaFn
    this.me = syn.zome.me
    this.myTag = syn.zome.me.slice(-4)
    const others = {} as PubKeyToFolkRecord
    this.others = others
    this.folks = folks_b(ctx)
    this.folks.set(others)
    this.initState(this.sessionInfo)
    this.initTimers(syn)
    console.log('session joined:', this.sessionInfo)
  }
  heart:ReturnType<typeof setInterval>
  requestChecker:ReturnType<typeof setInterval>
  scribe:HoloHash
  _scribeStr:string
  requested:any[]
  sessionHash:HoloHash
  snapshot_content:Content
  snapshot_hash:HoloHash
  content_hash:HoloHash
  currentCommitHeaderHash:HoloHash
  deltas:Delta[]
  snapshotHashStr:string
  contentHashStr:string
  reqCounter:number
  committed:ApplyDelta[]
  recorded:ApplyDelta[]
  commitInProgress:boolean

  // set up the svelte based state vars
  content = content_b(this.ctx)
  recordedChanges = recordedChanges_b(this.ctx)
  requestedChanges = requestedChanges_b(this.ctx)
  committedChanges = committedChanges_b(this.ctx)
  scribeStr = scribeStr_b(this.ctx)

  initTimers(syn) {
    const self = this
    // Send heartbeat to scribe every [heartbeat interval]
    this.heart = setInterval(async ()=>{
      if (self._scribeStr == self.me) {
        // examine folks last seen time and see if any have crossed the session out-of-session
        // timeout so we can tell everybody else about them having dropped.
        let gone = self.updateRecentlyTimedOutFolks()
        if (gone.length > 0) {
          self.sendFolkLore(self.folksForScribeSignals(), { gone })
        }
      } else {
        // I'm not the scribe so send them a heartbeat
        await self.sendHeartbeat('Hello')
      }
    }, heartbeatInterval)

    this.requestChecker = setInterval(async ()=>{
      if (self.requested.length > 0) {
        if ((Date.now() - self.requested[0].at) > reqTimeout) {
          // for now let's just do the most drastic thing!
          /*
            console.log('requested change timed out! Undoing all changes', $requestedChanges[0])
            // TODO: make sure this is transactional and no requestChanges squeak in !
            while ($requestedChanges.length > 0) {
            requestedChanges.update(changes => {
            const change = changes.pop()
            console.log('undoing ', change)
            const undoDelta = undoFn(change)
            console.log('undoDelta: ', undoDelta)
            applyDeltaFn(undoDelta)
            return changes
            })
            }*/

          // and send a sync request incase something just got out of sequence
          // TODO: prepare for shifting to new scribe if they went offline

          this.initState(await syn.getSession(self.sessionHash))
          console.log('HERE')
          syn.sendSyncReq()
        }
      }
    }, reqTimeout / 2)

  }

  initState(sessionInfo:SessionInfo) {
    this.sessionHash = sessionInfo.session
    this.scribe = sessionInfo.scribe
    this.snapshot_content = sessionInfo.snapshot_content
    this.snapshot_hash = sessionInfo.snapshot_hash
    this.content_hash = sessionInfo.content_hash

    this.deltas = sessionInfo.deltas.map(d=>JSON.parse(d))
    this.snapshotHashStr = bufferToBase64(sessionInfo.snapshot_hash)
    this.contentHashStr = bufferToBase64(sessionInfo.content_hash)
    this._scribeStr = bufferToBase64(sessionInfo.scribe)
    this.scribeStr.set(this._scribeStr)

    this.recorded = []
    this.requested = []
    this.requestedChanges.set(this.requested)
    this.recordedChanges.set(this.recorded)
    this.committedChanges.set([])
    this.reqCounter = 0

    this.committed = []
    let newContent = { ...sessionInfo.snapshot_content } // clone so as not to pass by ref
    newContent.meta = {}
    newContent.meta[this.myTag] = 0

    for (const delta of this.deltas) {
      const [c, change] = this.applyDeltaFn(newContent, delta)
      newContent = c
      this.committed.push(change)
    }
    this.committedChanges.set(this.committed)

    this._content = newContent
    this.content.set(this._content)
  }

  _recordDelta(delta) {
    // apply the deltas to the content which returns the undoable change
    const undoableChange = this._runApplyDelta(delta)
    // append changes to the recorded history
    this.recorded.push(undoableChange)
    this.recordedChanges.set(this.recorded)
  }

  _recordDeltas(deltas) {
    // apply the deltas to the content which returns the undoable change
    for (const delta of deltas) {
      this._recordDelta(delta)
    }
  }

  // apply changes confirmed as recorded by the scribe while reconciling
  // and possibly rebasing our requested changes
  recordDeltas(_index:number, deltas:Delta[]) {
    console.log('recordDeltas REQUESTED', this.requested)
    for (const delta of deltas) {
      if (this.requested.length > 0) {
        // if this change is our next requested change then remove it
        if (JSON.stringify(delta) == JSON.stringify(this.requested[0].delta)) {
          this.recorded.push(this.requested.shift())
          this.recordedChanges.set(this.recorded)
          this.requestedChanges.set(this.requested)
        } else {
          // TODO rebase?
          console.log('REBASE NEEDED?')
          console.log('requested ', this.requested[0].delta)
          console.log('to be recorded ', delta)
        }
      } else {
        // no requested changes so this must be from someone else so we don't have
        // to check our requested changes
        // TODO: do we need to check if this is a change that we did send and have already
        // integrated somehow and ignore if so.  (Seems unlikely?)
        this._recordDelta(delta)
      }
    }
  }

  nextIndex() {
    return this.recorded.length
  }

  _runApplyDelta(delta) {
    const [newContent, undoableChange] = this.applyDeltaFn(this._content, delta)
    this._content = newContent
    this.content.set(this._content)
    return undoableChange
  }

  // called when requesting a change to the content as a result of user action
  // If we are the scribe, no need to go into the zome
  // TODO: prevent reentry
  requestChange(deltas) {
    // any requested made by the scribe should be recorded immediately
    if (this._scribeStr == this.me) {
      const index = this.nextIndex()
      this._recordDeltas(deltas)
      this.sendChange(index, deltas)
    } else {
      // otherwise apply the change and queue it to requested changes for
      // confirmation later and send request change to scribe

      // create a unique id for each change
      // TODO: this should be part of actual changeReqs
      const changeId = this.myTag + '.' + this.reqCounter
      const changeAt = Date.now()

      // we want to apply this to current nextIndex plus any previously
      // requested changes that haven't yet be recorded
      const index = this.nextIndex() + this.requested.length

      for (const delta of deltas) {
        const undoableChange = this._runApplyDelta(delta)
        undoableChange.id = changeId
        undoableChange.at = changeAt
        // append changes to the requested queue
        this.requested.push(undoableChange)
        this.requestedChanges.set(this.requested)
      }
      console.log('REQUESTED', this.requested)
      this.sendChangeReq(index, deltas)
      this.reqCounter += 1
    }
  }

  addChangeAsScribe(change) {
    let [index, deltas] = change
    const nextIndex = this.nextIndex()
    if (nextIndex != index) {
      console.log('Scribe is receiving change out of order!')
      console.log(`nextIndex: ${nextIndex}, changeIndex:${index} for deltas:`, deltas)

      if (index < nextIndex) {
        // change is too late, nextIndex has moved on
        // TODO: rebase? notify sender?
        return
      } else {
        // change is in the future, possibly some other change was dropped or is slow in arriving
        // TODO: wait a bit?  Ask sender for other changes?
        return
      }
    }

    this.recordDeltas(index, deltas)

    // notify all participants of the change
    this.sendChange(index, deltas)
  }

  async commitChange() {
    if (this._scribeStr == this.me) {
      if (this.recorded.length == 0) {
        alert('No changes to commit!')
        return
      }
      this.commitInProgress = true

      const newContentHash = await this.hashContent(this._content)
      console.log('commiting from snapshot', this.snapshotHashStr)
      console.log('  prev_hash:', this.contentHashStr)
      console.log('   new_hash:', bufferToBase64(newContentHash))
      const commit:Commit = {
        snapshot: this.snapshot_hash,
        change: {
          deltas: this.recorded.map(c=>JSON.stringify(c.delta)),
          content_hash: newContentHash,
          previous_change: this.content_hash,
          meta: {
            contributors: [],
            witnesses: [],
            app_specific: null
          }
        },
        participants: this.folksForScribeSignals()
      }
      try {
        this.currentCommitHeaderHash = await this.zome.call('commit', commit)
        // if commit successfull we need to update the content hash and its string in the session
        this.content_hash = newContentHash
        this.contentHashStr = bufferToBase64(this.content_hash)
        this.committed = this.committed.concat(this.recorded)
        this.recorded = []
        this.recordedChanges.set(this.recorded)
        this.committedChanges.set(this.committed)
      } catch (e) {
        console.log('Error:', e)
      }
      this.commitInProgress = false
    } else {
      alert('You ain\'t the scribe!')
    }
  }

  // Folks --------------------------------------------------------

  _newOther(pubKeyStr:string, pubKey:HoloHash) {
    if (!(pubKeyStr in this.others)) {
      const colors = getFolkColors(pubKey)
      this.others[pubKeyStr] = { pubKey, colors } as FolkI
    }
  }

  updateOthers(pubKey:HoloHash, status:FolkStatus, meta?:number) {
    const pubKeyStr = bufferToBase64(pubKey)
    if (pubKeyStr == this.me) {
      return
    }

    // if we don't have this key, create a record for it
    // including the default color
    this._newOther(pubKeyStr, pubKey)

    if (meta) {
      this.others[pubKeyStr]['meta'] = meta
    }

    switch (status) {
      case FOLK_SEEN:
        this.others[pubKeyStr]['inSession'] = true
        this.others[pubKeyStr]['lastSeen'] = Date.now()
        break
      case FOLK_GONE:
      case FOLK_UNKNOWN:
        this.others[pubKeyStr]['inSession'] = false
    }

    this.folks.set(this.others)
  }

  folksForScribeSignals() {
    return Object.values(this.others).filter(v=>v.inSession).map(v=>v.pubKey)
  }

  // updates folks in-session status by checking their last-seen time
  updateRecentlyTimedOutFolks() {
    let result = []
    for (const [pubKeyStr, folk] of Object.entries(this.others)) {
      if (folk.inSession && (Date.now() - this.others[pubKeyStr].lastSeen > outOfSessionTimout)) {
        folk.inSession = false
        result.push(this.others[pubKeyStr].pubKey)
      }
    }
    if (result.length > 0) {
      this.folks.set(this.others)
    }
    return result
  }

  async hashContent(content) {
    return this.zome.call('hash_content', content)
  }

  // senders ---------------------------------------------------------------------
  // These are the functions that send signals in the context of a session

  async sendHeartbeat(data) {
    data = encodeJson(data)
    return this.zome.call('send_heartbeat', { scribe: this.scribe, data })
  }

  async sendChangeReq(index, deltas) {
    deltas = deltas.map(d=>JSON.stringify(d))
    return this.zome.call('send_change_request', { scribe: this.scribe, change: [index, deltas] })
  }

  async sendChange(index, deltas) {
    const participants = this.folksForScribeSignals()
    if (participants.length > 0) {
      deltas = deltas.map(d=>JSON.stringify(d))
      return this.zome.call('send_change', { participants, change: [index, deltas] })
    }
  }

  async sendFolkLore(participants, data) {
    if (participants.length > 0) {
      data = encodeJson(data)
      return this.zome.call('send_folk_lore', { participants, data })
    }
  }

  async sendSyncResp(to, state) {
    state.deltas = state.deltas.map(d=>JSON.stringify(d))
    return this.zome.call('send_sync_response', {
      participant: to,
      state
    })
  }

  // signal handlers ------------------------------------------

  // handler for the changeReq event
  changeReq(change) {
    if (this._scribeStr == this.me) {
      this.addChangeAsScribe(change)
    } else {
      console.log('change requested but I\'m not the scribe.')
    }
  }

  // handler for the change event
  change(index, deltas) {
    if (this._scribeStr == this.me) {
      console.log('change received but I\'m the scribe, so I\'m ignoring this!')
    } else {
      console.log(`change arrived for ${index}:`, deltas)
      if (this.nextIndex() == index) {
        this.recordDeltas(index, deltas)
      } else {
        console.log(`change arrived out of sequence nextIndex: ${this.nextIndex()}, change index:${index}`)
        // TODO either call for sync, or do some waiting algorithm
      }
    }
  }

  // handler for the syncReq event
  syncReq(request) {
    const from = request.from
    if (this._scribeStr == this.me) {
      this.updateOthers(from, FOLK_SEEN, request.meta)
      let state = {
        snapshot: this.snapshot_hash,
        commit_content_hash: this.content_hash,
        deltas: this.recorded.map(c=>c.delta)
      }
      if (this.currentCommitHeaderHash) {
        state['commit'] = this.currentCommitHeaderHash
      }
      // send a sync response to the sender
      this.sendSyncResp(from, state)
      // and send everybody a folk lore p2p message with new participants
      let p = { ...this.others }
      p[this.me] = {
        pubKey: this.zome.agentPubKey
      }
      const data = {
        participants: p
      }
      this.sendFolkLore(this.folksForScribeSignals(), data)
    } else {
      console.log('syncReq received but I\'m not the scribe!')
    }
  }

  // handler for the syncResp event
  syncResp(stateForSync) {
    // Make sure that we are working off the same snapshot and commit
    const commitContentHashStr = bufferToBase64(stateForSync.commit_content_hash)
    if (commitContentHashStr == this.contentHashStr) {
      this._recordDeltas(stateForSync.deltas)
    } else {
      console.log('WHOA, sync response has different current state assumptions')
      // TODO: resync somehow
    }
  }

  // handler for the heartbeat event
  heartbeat(from, data) {
    console.log('got heartbeat', data, 'from:', from)
    if (this._scribeStr != this.me) {
      console.log('heartbeat received but I\'m not the scribe.')
    } else {
      // I am the scribe and I've recieved a heartbeat from a concerned Folk
      this.updateOthers(from, FOLK_SEEN)
    }
  }

  // handler for the folklore event
  folklore(data:ApiResponse) {
    console.log('got folklore', data)
    if (this._scribeStr == this.me) {
      console.log('folklore received but I\'m the scribe!')
    } else {
      if (data.gone) {
        Object.values(data.participants).forEach(
          pubKey=>{
            this.updateOthers(pubKey, FOLK_GONE)
          }
        )
      }
      // TODO move last seen into p.meta so that we can update that value
      // as hearsay.
      if (data.participants) {
        Object.values(data.participants).forEach(
          p=>{
            this.updateOthers(p.pubKey, FOLK_UNKNOWN, p.meta)
          }
        )
      }
    }
  }

  // handler for the commit notice event
  commitNotice(commitInfo) {
    // make sure we are at the right place to be able to just move forward with the commit
    if (this.contentHashStr == bufferToBase64(commitInfo.previous_content_hash) &&
      this.nextIndex() == commitInfo.deltas_committed) {
      this.contentHashStr = bufferToBase64(commitInfo.commit_content_hash)
      this.committed = this.committed.concat(this.recorded)
      this.recorded = []
      this.committedChanges.set(this.committed)
      this.recordedChanges.set(this.recorded)
    } else {
      console.log('received commit notice for beyond our last commit, gotta resync')
      console.log('commit.commit_content_hash:', bufferToBase64(commitInfo.commit_content_hash))
      console.log('commit.previous_content_hash:', bufferToBase64(commitInfo.previous_content_hash))
      console.log('commit.deltas_committed:', commitInfo.deltas_committed)
      console.log('my $session.contentHashStr', this.contentHashStr)
      console.log('my nextIndex', this.nextIndex())
      // TODO resync
    }
  }
}
