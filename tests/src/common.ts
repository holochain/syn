import { Base64 } from "js-base64";
import path from 'path'
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const synDna = path.join(__dirname, "../../dna/workdir/dna/syn.dna");

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

export const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export function serializeHash(hash: Uint8Array): string {
  return `u${Base64.fromUint8Array(hash, true)}`;
}

/*
  Fake UI functions
    - applyDeltas
      - takes a content and a list of deltas
      - returns the new content with those deltas applied
*/

export interface Content {
  title: string;
  body: string;
}

export const initialContent: Content = {
  title: "",
  body: "",
};

export type TextDelta =
  | {
      type: "Title";
      value: string;
    }
  | {
      type: "Add";
      text: string;
      loc: number;
    }
  | {
      type: "Delete";
      start: number;
      end: number;
    };

export const applyDelta = (content: Content, delta: TextDelta): Content => {
  switch (delta.type) {
    case "Title":
      content.title = delta.value;
      break;
    case "Add":
      content.body =
        content.body.slice(0, delta.loc) +
        delta.text +
        content.body.slice(delta.loc);
      break;
    case "Delete":
      content.body =
        content.body.slice(0, delta.start) + content.body.slice(delta.end);
      break;
  }
  return content;
};

export function applyDeltas(content: Content, deltas: TextDelta[]): Content {
  for (const delta of deltas) {
    content = applyDelta(content, delta);
  }
  return content;
}
