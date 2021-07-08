import { Base64 } from "js-base64";

export type Add = [number, string];
export type Delete = [number, number];
export type Title = string;

// Signal type definitions
export type Delta = {
  type: string;
  value: Add | Delete | Title;
};

export type Signal = {
  signal_name: string;
  signal_payload?;
};

export const delay = (ms) => new Promise((r) => setTimeout(r, ms));


export function serializeHash(hash: Uint8Array): string {
    return `u${Base64.fromUint8Array(hash, true)}`;
  }