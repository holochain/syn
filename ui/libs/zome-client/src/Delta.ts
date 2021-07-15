export type DeltaValue =
  | TitleDeltaValue
  | AddDeltaValue
  | DeleteDeltaValue
  | MetaDeltaValue;
export interface Delta {
  type: string;
  value: DeltaValue;
}
export type TitleDeltaValue = string;
export interface TitleDelta extends Delta {
  type: "Title";
  value: TitleDeltaValue;
}
export type AddDeltaValue = [number, string];
export interface AddDelta extends Delta {
  type: "Add";
  value: AddDeltaValue;
}
export type DeleteDeltaValue = [number, number];
export interface DeleteDelta extends Delta {
  type: "Delete";
  value: DeleteDeltaValue;
}
export interface MetaDeltaValue {
  setLoc: [string, number];
}
export interface MetaDelta extends Delta {
  type: "Meta";
  value: MetaDeltaValue;
}
