export interface AddOperation {
  op: 'add';
  path: string;
  value: any;
}

export interface RemoveOperation {
  op: 'remove';
  path: string;
}

export interface ReplaceOperation {
  op: 'replace';
  path: string;
  value: any;
}

export interface MoveOperation {
  op: 'move';
  path: string;
  from: string;
}

export interface CopyOperation {
  op: 'copy';
  path: string;
  from: string;
}

export interface TestOperation {
  op: 'test';
  path: string;
  value: any;
}

export type Operation = AddOperation | RemoveOperation | ReplaceOperation | MoveOperation | CopyOperation | TestOperation;

export function apply_patch<D>(doc: D, patch: string | Array<Operation>): D;

export interface InvalidPatch extends Error {
  new (message: string): InvalidPatch;
}

export interface PatchApplyError extends Error {
  new (message: string): PatchApplyError;
}

export interface JSONPointer {
  new (pathStr: string): JSONPointer;
  add<D>(doc: D, value: any, mutate?: boolean): D;
  remove<D>(doc: D, mutate?: boolean): D;
  replace<D>(doc: D, value: any, mutate?: boolean): D;
  get<D>(doc: D): any;
  subsetOf(otherPointer: JSONPointer): boolean;
}

export interface JSONPatch {
  new (patch: string | Array<Operation>, mutate?: boolean): JSONPatch;
  apply<D>(doc: D): D;
}
