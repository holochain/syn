import path from 'path';
import { fileURLToPath } from 'url';
import { TextEditorDelta, textEditorGrammar, TextEditorState } from './grammar';
import { SynGrammar } from '@holochain-syn/store';
import Automerge from 'automerge';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const synDna = path.join(__dirname, '../../dna/workdir/dna/syn.dna');

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

export const delay = ms => new Promise(r => setTimeout(r, ms));


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
    doc.body = {text: new Automerge.Text()};
    textEditorGrammar.initState(doc.body);
  },
  applyDelta(delta: TextDelta, content: Content, eph: any, author: Uint8Array) {
    switch (delta.type) {
      case 'Title':
        content.title = delta.value;
        break;
      default:
        textEditorGrammar.applyDelta(delta, content.body, eph, author);
    }
  },
};
