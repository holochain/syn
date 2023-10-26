import {
  TextEditorDelta,
  textEditorGrammar,
  TextEditorState,
} from './grammar.js';
import { AgentPubKey } from '@holochain/client';
import { SessionStore, SynGrammar } from '@holochain-syn/store';

export const synHapp = process.cwd() + '/../workdir/syn-test.happ';

export type Add = [number, string];
export type Delete = [number, number];
export type Title = string;

// Signal type definitions
export type Delta = {
  type: string;
  value: Add | Delete | Title;
};

export type Signal = {
  sessionHash: string;
  message: {
    type: string;
    payload: any;
  };
};

export const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/*
  Fake UI functions
    - applyDeltas
      - takes a content and a list of deltas
      - returns the new content with those deltas applied
*/

export interface Content {
  title: string;
  body: TextEditorState;
}

export type TextDelta =
  | {
      type: 'Title';
      value: string;
    }
  | TextEditorDelta;

export const sampleGrammar: SynGrammar<TextDelta, Content> = {
  initState(doc) {
    doc.title = '';
    doc.body = {} as any;
    textEditorGrammar.initState(doc.body);
  },
  applyDelta(
    delta: TextDelta,
    content: Content,
    eph: any,
    author: AgentPubKey
  ) {
    switch (delta.type) {
      case 'Title':
        content.title = delta.value;
        break;
      default:
        textEditorGrammar.applyDelta(delta, content.body, eph, author);
    }
  },
};

export function waitForOtherParticipants(
  sessionStore: SessionStore<any>,
  otherParticipants: number,
  timeout = 600000
) {
  return new Promise((resolve, reject) => {
    sessionStore.participants.subscribe(p => {
      if (
        p.active.filter(p => p.toString() !== sessionStore.myPubKey.toString())
          .length >= otherParticipants
      ) {
        resolve(undefined);
      }
    });
    setTimeout(() => reject('Timeout'), timeout);
  });
}
