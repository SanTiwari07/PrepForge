// B+ tree with unique integer keys, used by the B+ tree visualiser (and unit-tested against structural invariants).
//
// `maxKeys` is the largest number of keys a node may hold (a node with maxKeys + 1 keys splits).
//   leaf: splits into ceil((maxKeys + 1) / 2) and the rest; the first key of the right leaf is COPIED up.
//   internal: the middle key is MOVED up.
// Minimums for non-root nodes: leaf ceil(maxKeys / 2) keys, internal ceil((maxKeys + 1) / 2) - 1 keys.
// Deleting borrows from a sibling with a spare key, otherwise merges with a sibling.

export interface BNode {
  leaf: boolean;
  keys: number[];
  children: BNode[];
  next: BNode | null;
}

export interface BTreeLevels {
  levels: number[][][];
  height: number;
}

export interface OpResult {
  ok: boolean;
  steps: string[];
}

const mk = (leaf: boolean): BNode => ({ leaf, keys: [], children: [], next: null });
const fmt = (n: BNode) => `[${n.keys.join(' ')}]`;
// index of the child to follow: number of separator keys <= key
const route = (keys: number[], key: number) => {
  let i = 0;
  while (i < keys.length && keys[i] <= key) i++;
  return i;
};

export class BPlusTree {
  root: BNode = mk(true);

  constructor(readonly maxKeys: number) {
    if (!Number.isInteger(maxKeys) || maxKeys < 3 || maxKeys > 8) throw new Error('maxKeys must be an integer from 3 to 8');
  }

  get minLeaf() { return Math.ceil(this.maxKeys / 2); }
  get minInternal() { return Math.ceil((this.maxKeys + 1) / 2) - 1; }
  private minOf(n: BNode) { return n.leaf ? this.minLeaf : this.minInternal; }

  search(key: number): { found: boolean; path: string[] } {
    const path: string[] = [];
    let n = this.root;
    while (!n.leaf) {
      const i = route(n.keys, key);
      path.push(`${fmt(n)} → child ${i}`);
      n = n.children[i];
    }
    path.push(`leaf ${fmt(n)}`);
    return { found: n.keys.includes(key), path };
  }

  /** Sorted keys in [lo, hi] found by descending once and following the leaf chain. */
  range(lo: number, hi: number): { keys: number[]; leavesVisited: number } {
    let n = this.root;
    while (!n.leaf) n = n.children[route(n.keys, lo)];
    const keys: number[] = [];
    let leavesVisited = 0;
    for (let cur: BNode | null = n; cur; cur = cur.next) {
      leavesVisited++;
      let stop = false;
      for (const k of cur.keys) {
        if (k > hi) { stop = true; break; }
        if (k >= lo) keys.push(k);
      }
      if (stop) break;
    }
    return { keys, leavesVisited };
  }

  insert(key: number): OpResult {
    const steps: string[] = [];
    if (this.search(key).found) return { ok: false, steps: [`${key} is already in the tree (keys are unique)`] };
    const up = this.insertInto(this.root, key, steps);
    if (up) {
      const r = mk(false);
      r.keys = [up.key];
      r.children = [this.root, up.right];
      this.root = r;
      steps.push(`root split: new root ${fmt(r)}, tree height grows by 1`);
    }
    return { ok: true, steps };
  }

  private insertInto(n: BNode, key: number, steps: string[]): { key: number; right: BNode } | null {
    if (n.leaf) {
      let i = 0;
      while (i < n.keys.length && n.keys[i] < key) i++;
      n.keys.splice(i, 0, key);
      steps.push(`insert ${key} into leaf ${fmt(n)}`);
      if (n.keys.length <= this.maxKeys) return null;
      const cut = Math.ceil((this.maxKeys + 1) / 2);
      const right = mk(true);
      right.keys = n.keys.splice(cut);
      right.next = n.next;
      n.next = right;
      steps.push(`leaf overflow: split into ${fmt(n)} and ${fmt(right)}; copy ${right.keys[0]} up`);
      return { key: right.keys[0], right };
    }
    const i = route(n.keys, key);
    const up = this.insertInto(n.children[i], key, steps);
    if (!up) return null;
    n.keys.splice(i, 0, up.key);
    n.children.splice(i + 1, 0, up.right);
    if (n.keys.length <= this.maxKeys) return null;
    const mid = Math.floor(n.keys.length / 2);
    const moved = n.keys[mid];
    const right = mk(false);
    right.keys = n.keys.splice(mid + 1);
    n.keys.pop();
    right.children = n.children.splice(mid + 1);
    steps.push(`internal overflow: split into ${fmt(n)} and ${fmt(right)}; move ${moved} up`);
    return { key: moved, right };
  }

  delete(key: number): OpResult {
    const steps: string[] = [];
    if (!this.search(key).found) return { ok: false, steps: [`${key} is not in the tree`] };
    this.deleteFrom(this.root, key, steps);
    if (!this.root.leaf && this.root.keys.length === 0) {
      this.root = this.root.children[0];
      steps.push('root has a single child left: it becomes the new root, tree height shrinks by 1');
    }
    return { ok: true, steps };
  }

  private deleteFrom(n: BNode, key: number, steps: string[]) {
    if (n.leaf) {
      n.keys.splice(n.keys.indexOf(key), 1);
      steps.push(`remove ${key} from leaf, leaving ${fmt(n)}`);
      return;
    }
    const i = route(n.keys, key);
    const child = n.children[i];
    this.deleteFrom(child, key, steps);
    if (child.keys.length < this.minOf(child)) this.fix(n, i, steps);
  }

  private fix(parent: BNode, i: number, steps: string[]) {
    const child = parent.children[i];
    const left = i > 0 ? parent.children[i - 1] : null;
    const right = i < parent.children.length - 1 ? parent.children[i + 1] : null;
    const kind = child.leaf ? 'leaf' : 'internal node';
    if (left && left.keys.length > this.minOf(left)) {
      if (child.leaf) {
        child.keys.unshift(left.keys.pop()!);
        parent.keys[i - 1] = child.keys[0];
      } else {
        child.keys.unshift(parent.keys[i - 1]);
        child.children.unshift(left.children.pop()!);
        parent.keys[i - 1] = left.keys.pop()!;
      }
      steps.push(`${kind} underflow: borrow from the left sibling, separator becomes ${parent.keys[i - 1]}`);
      return;
    }
    if (right && right.keys.length > this.minOf(right)) {
      if (child.leaf) {
        child.keys.push(right.keys.shift()!);
        parent.keys[i] = right.keys[0];
      } else {
        child.keys.push(parent.keys[i]);
        child.children.push(right.children.shift()!);
        parent.keys[i] = right.keys.shift()!;
      }
      steps.push(`${kind} underflow: borrow from the right sibling, separator becomes ${parent.keys[i]}`);
      return;
    }
    const li = left ? i - 1 : i; // merge children[li] and children[li + 1]
    const a = parent.children[li];
    const b = parent.children[li + 1];
    const sep = parent.keys[li];
    if (a.leaf) {
      a.keys.push(...b.keys);
      a.next = b.next;
    } else {
      a.keys.push(sep, ...b.keys);
      a.children.push(...b.children);
    }
    parent.keys.splice(li, 1);
    parent.children.splice(li + 1, 1);
    steps.push(`${kind} underflow and no sibling to spare: merge into ${fmt(a)}${a.leaf ? '' : ` (pulling separator ${sep} down)`}`);
  }

  levels(): BTreeLevels {
    const levels: number[][][] = [];
    let row: BNode[] = [this.root];
    while (row.length) {
      levels.push(row.map((n) => [...n.keys]));
      row = row.flatMap((n) => n.children);
    }
    return { levels, height: levels.length };
  }

  leafKeys(): number[] {
    let n = this.root;
    while (!n.leaf) n = n.children[0];
    const out: number[] = [];
    for (let cur: BNode | null = n; cur; cur = cur.next) out.push(...cur.keys);
    return out;
  }

  /** Throws a descriptive error if a structural invariant is broken (used by tests). */
  check(): void {
    const leaves: BNode[] = [];
    let leafDepth = -1;
    const walk = (n: BNode, depth: number, lo: number, hi: number, isRoot: boolean) => {
      for (let i = 1; i < n.keys.length; i++) if (n.keys[i - 1] >= n.keys[i]) throw new Error('keys not strictly increasing');
      for (const k of n.keys) if (k < lo || k >= hi) throw new Error(`key ${k} outside bounds [${lo}, ${hi})`);
      if (n.keys.length > this.maxKeys) throw new Error('node over-full');
      if (!isRoot && n.keys.length < this.minOf(n)) throw new Error('node under-full');
      if (n.leaf) {
        if (leafDepth === -1) leafDepth = depth;
        else if (leafDepth !== depth) throw new Error('leaves at different depths');
        leaves.push(n);
        return;
      }
      if (n.children.length !== n.keys.length + 1) throw new Error('children/keys mismatch');
      n.children.forEach((c, i) => walk(c, depth + 1, i === 0 ? lo : n.keys[i - 1], i === n.keys.length ? hi : n.keys[i], false));
    };
    walk(this.root, 0, -Infinity, Infinity, true);
    leaves.forEach((l, i) => { if (l.next !== (leaves[i + 1] ?? null)) throw new Error('leaf chain broken'); });
  }
}
