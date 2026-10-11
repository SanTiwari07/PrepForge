import type { MCQ, Resource, Topic } from '../schema';
import { mcq } from '../helpers';

const MASTERY = { testSize: 6, testMinutes: 10, passPct: 80, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 7 };
const CMU: Resource = { title: 'CMU 15-445 Database Systems (course site)', url: 'https://15445.courses.cs.cmu.edu/', kind: 'course' };
const DBBOOK: Resource = { title: 'Database System Concepts (book site)', url: 'https://db-book.com/', kind: 'book' };
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
const dbmsTopic = (t: TopicInput): Topic => ({ moduleId: 'dbms', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
const q = (topic: string) => ({ topics: [topic], module: 'dbms' as const });

// ---------------------------------------------------------------------------------------
const KC = 'dbms.keys-constraints';
const keys = dbmsTopic({
  id: KC, title: 'Keys and Constraints', level: 'foundation', estMinutes: 35, prerequisites: ['dbms.relational-basics'],
  summary: 'Super, candidate, primary and foreign keys; integrity constraints.',
  objectives: ['Distinguish superkey, candidate key, primary key, alternate key and foreign key.', 'Explain entity and referential integrity and the ON DELETE options.', 'Choose between natural and surrogate keys.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'The key hierarchy', bodyMd: `- **Superkey:** any set of attributes that uniquely identifies a row ({id}, {id, name}, …).
- **Candidate key:** a *minimal* superkey: remove any attribute and it stops being unique. A table can have several ({id} and {email}).
- **Primary key:** the candidate key you choose as the main identifier. It must be unique and **NOT NULL** (entity integrity).
- **Alternate keys:** the other candidate keys (enforce them with UNIQUE).
- **Composite key:** a key with more than one attribute ({student_id, course_id} in an enrolment table).
- **Prime attribute:** an attribute that belongs to *some* candidate key.
- **Foreign key:** a column referencing a key in another table (referential integrity: the value must exist there, or be NULL if allowed).` },
    { id: 'constraints', kind: 'concept', title: 'Constraints and referential actions', bodyMd: `| Constraint | Guarantees |
|---|---|
| PRIMARY KEY | unique + not null |
| UNIQUE | no duplicates (NULLs are usually allowed, often multiple) |
| NOT NULL | a value must be present |
| CHECK | a row-level condition (\`price >= 0\`) |
| FOREIGN KEY | the referenced row exists |
| DEFAULT | a value when none is given |

What happens when a referenced (parent) row is deleted? \`ON DELETE RESTRICT/NO ACTION\` (reject), \`CASCADE\` (delete the children too), \`SET NULL\` (orphan children get NULL), \`SET DEFAULT\`. Choose based on meaning: order items should cascade with their order; employees should probably not be deleted when a department is removed.` },
    { id: 'surrogate', kind: 'comparison', title: 'Natural vs surrogate keys', bodyMd: `A **natural key** has business meaning (email, PAN number). A **surrogate key** is an artificial id (auto-increment, UUID). Surrogate keys are stable (emails change), compact and fast to join; keep the natural key as a UNIQUE constraint so duplicates are still prevented. UUIDs avoid coordination in distributed systems but are larger and, if random, fragment B-tree indexes.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Calling every superkey a candidate key (candidate keys must be minimal).
2. Thinking a table has only one candidate key.
3. Forgetting that a foreign key can be NULL unless declared NOT NULL.
4. Using CASCADE delete where silent data loss is dangerous.
5. Relying on application code instead of database constraints for integrity.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Superkey vs candidate key vs primary key?', answerMd: 'A superkey uniquely identifies rows. A candidate key is a minimal superkey. The primary key is the candidate key chosen as the main identifier, which must be NOT NULL; the others become alternate keys.' },
    { id: 'iq2', q: 'What does ON DELETE CASCADE do, and when is it appropriate?', answerMd: 'Deleting a parent row automatically deletes the referencing child rows. It is appropriate for owned data (order → order_items), and dangerous where children have independent meaning (department → employees).' },
    { id: 'iq3', q: 'Why use a surrogate key if a natural key exists?', answerMd: 'Natural keys can change or be reused, can be long, and may carry privacy concerns. A surrogate key is stable and compact. Keep a UNIQUE constraint on the natural key to prevent duplicates.' },
    { id: 'iq4', q: 'Can a UNIQUE column contain NULLs?', answerMd: 'In most engines yes, and usually several (NULL is not equal to NULL). SQL Server historically allowed only one NULL in a unique index. PRIMARY KEY columns can never be NULL.' },
  ],
  revision: { notesMd: `- Superkey ⊇ candidate key (minimal) ⊇ primary key (chosen; NOT NULL).
- Prime attribute = belongs to some candidate key.
- FK = referential integrity; ON DELETE CASCADE / SET NULL / RESTRICT.
- Surrogate id + UNIQUE natural key is a common design.`, flashcards: [
    { id: 'f1', front: 'Candidate key?', backMd: 'A minimal superkey.' },
    { id: 'f2', front: 'Entity integrity?', backMd: 'The primary key is unique and never NULL.' },
    { id: 'f3', front: 'Referential integrity?', backMd: 'Every foreign key value matches an existing key in the parent (or is NULL).' },
    { id: 'f4', front: 'ON DELETE SET NULL?', backMd: 'Children of a deleted parent keep existing with a NULL foreign key.' },
    { id: 'f5', front: 'Prime attribute?', backMd: 'An attribute that is part of at least one candidate key.' },
  ] },
  resources: [DBBOOK, { title: 'Foreign key support (SQLite docs)', url: 'https://www.sqlite.org/foreignkeys.html', kind: 'official-docs' }],
});

const kcMcqs: MCQ[] = [
  mcq({ ...q(KC), id: 'dbms.kc.q1', type: 'concept', difficulty: 'easy', stem: 'In `Users(id, email, name)` where both id and email are unique, which statement is true?', options: ['{id} and {email} are both candidate keys; {id, email} is a superkey but not a candidate key', ['Only {id} is a candidate key', 'email is also unique and minimal.'], ['{id, email} is a candidate key', 'It is not minimal.'], ['name is a prime attribute', 'name is not part of any candidate key.']], answer: 0, explanation: 'Each unique single attribute is a minimal superkey. Adding attributes keeps uniqueness but loses minimality.' }),
  mcq({ ...q(KC), id: 'dbms.kc.q2', type: 'scenario', difficulty: 'medium', stem: 'Deleting an `orders` row should also delete its `order_items`. Which foreign key option on order_items.order_id?', options: ['ON DELETE CASCADE', ['ON DELETE SET NULL', 'Items would remain as orphans.'], ['ON DELETE RESTRICT', 'The order delete would be rejected.'], ['No foreign key', 'You would lose integrity guarantees.']], answer: 0, explanation: 'Order items are owned by the order and have no meaning without it.' }),
  mcq({ ...q(KC), id: 'dbms.kc.q3', type: 'concept', difficulty: 'easy', stem: 'Which constraint is implied by PRIMARY KEY but not by UNIQUE?', options: ['NOT NULL', ['CHECK', 'Neither implies CHECK.'], ['FOREIGN KEY', 'Unrelated.'], ['DEFAULT', 'Unrelated.']], answer: 0, explanation: 'Entity integrity: primary key columns can never be NULL, while UNIQUE columns typically allow NULLs.' }),
  mcq({ ...q(KC), id: 'dbms.kc.q4', type: 'concept', difficulty: 'medium', stem: 'A relation R(A, B, C) has exactly one candidate key {A, B}. How many superkeys does it have?', options: ['2', ['1', '{A, B, C} is also a superkey.'], ['3', 'Only supersets of {A, B} qualify.'], ['4', 'Only supersets of {A, B}: {A,B} and {A,B,C}.']], answer: 0, explanation: 'Superkeys are supersets of a candidate key: {A, B} and {A, B, C}, that is 2^(3−2) = 2.' }),
  mcq({ ...q(KC), id: 'dbms.kc.q5', type: 'scenario', difficulty: 'medium', stem: 'Why do many teams use an auto-increment `id` as the primary key even when users have unique emails?', options: ['Emails can change and are long; a surrogate id is stable and compact (keep email UNIQUE)', ['Emails cannot be indexed', 'They can.'], ['Unique constraints are slow', 'They are normal indexes.'], ['Foreign keys cannot reference text', 'They can, but it is less efficient.']], answer: 0, explanation: 'Stability and join efficiency favour surrogate keys; the natural key still gets a UNIQUE constraint.' }),
  mcq({ ...q(KC), id: 'dbms.kc.q6', type: 'concept', difficulty: 'easy', stem: 'A foreign key column `manager_id` is declared without NOT NULL. Is a NULL value allowed?', options: ['Yes: NULL means "no referenced row" and does not violate the constraint', ['No: foreign keys must always match a row', 'NULL is allowed unless NOT NULL is declared.'], ['Only in MySQL', 'This is standard behaviour.'], ['Only if ON DELETE SET NULL is set', 'That option only controls deletions.']], answer: 0, explanation: 'Referential integrity checks non-NULL values; NULL simply means the reference is absent.' }),
];

// ---------------------------------------------------------------------------------------
const FD = 'dbms.functional-dependencies';
const fds = dbmsTopic({
  id: FD, title: 'Functional Dependencies and Keys', level: 'core', estMinutes: 60, prerequisites: [KC],
  summary: 'Attribute closure, candidate keys from FDs and superkey counting.',
  objectives: ['Read and apply FDs and Armstrong\'s axioms (with derived rules).', 'Compute an attribute closure step by step.', 'Find all candidate keys using the "never on the right-hand side" shortcut.', 'Count superkeys and identify prime attributes.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'What an FD says', bodyMd: `X → Y means: any two rows that agree on X must agree on Y (X **determines** Y). Example: roll_no → name.

**Armstrong's axioms** (sound and complete):
- Reflexivity: if Y ⊆ X then X → Y (trivial FDs).
- Augmentation: if X → Y then XZ → YZ.
- Transitivity: if X → Y and Y → Z then X → Z.

**Derived rules:** union (X → Y and X → Z give X → YZ), decomposition (X → YZ gives X → Y), pseudo-transitivity (X → Y and YW → Z give XW → Z).` },
    { id: 'closure', kind: 'dry-run', title: 'Attribute closure: the master tool', bodyMd: `X⁺ = every attribute determined by X. Start with X; repeatedly, for each FD whose left side is inside the current set, add its right side; stop when nothing changes.

Example: R(A, B, C, D, E) with A → B, BC → D, D → A.
- (AC)⁺: {A, C}; A → B adds B; BC → D adds D. Result {A, B, C, D}. E is missing, so AC is **not** a superkey.
- (ACE)⁺ = {A, B, C, D, E}, so ACE is a superkey.

**Uses:** X is a superkey iff X⁺ contains every attribute; X → Y holds iff Y ⊆ X⁺.` },
    { id: 'keys', kind: 'intuition', title: 'Finding candidate keys quickly', bodyMd: `1. Attributes that **never appear on any right-hand side** must be in every key (nothing can derive them). In the example: C and E.
2. Attributes that appear **only** on right-hand sides are never in a minimal key.
3. Start from the "must" set; if its closure is everything, it is the only candidate key. Otherwise add combinations of the remaining "both sides" attributes, smallest first, skipping supersets of keys already found.

Example: core {C, E} gives (CE)⁺ = {C, E}, not enough. Try adding one of A, B, D: ACE, BCE and CDE all reach every attribute. **Candidate keys: ACE, BCE, CDE.** Prime attributes: A, B, C, D, E.

**Counting superkeys:** supersets of the keys, using inclusion-exclusion when several keys exist. Here every superkey contains C and E plus at least one of A, B, D: 2³ − 1 = **7**.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Stopping the closure loop after one pass (keep going until nothing changes).
2. Reporting non-minimal sets as candidate keys.
3. Forgetting attributes that appear in no FD at all; they must be in every key.
4. Double counting superkeys when several candidate keys overlap (use inclusion-exclusion).
5. Reading an FD from a table instance as if it proves the FD; an instance can only *disprove* an FD (two rows with equal X and different Y).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you test whether an FD X → Y follows from a set of FDs?', answerMd: 'Compute X⁺ using the FDs; X → Y holds iff Y ⊆ X⁺. This is the standard membership test.' },
    { id: 'iq2', q: 'How do you find candidate keys from FDs?', answerMd: 'Attributes never on a right-hand side must be in every key. Start from that set; if its closure is not complete, add the fewest extra attributes (from those appearing on both sides) that make the closure complete, and keep only minimal sets.' },
    { id: 'iq3', q: 'Can a table instance prove that an FD holds?', answerMd: 'No. An instance can only show that an FD is violated (two rows agree on X but differ on Y). FDs are constraints on all legal instances, so they come from domain rules.' },
    { id: 'iq4', q: 'What is a prime attribute and why does it matter?', answerMd: 'An attribute that belongs to some candidate key. The 2NF and 3NF definitions treat prime and non-prime attributes differently.' },
  ],
  revision: { notesMd: `- X → Y: equal X implies equal Y.
- Closure: add the right side of every FD whose left side is covered; repeat until stable.
- Superkey iff closure = all attributes.
- Never on a right-hand side means in every key.
- Superkey count: supersets of the keys (inclusion-exclusion).`, flashcards: [
    { id: 'f1', front: 'Armstrong\'s three axioms?', backMd: 'Reflexivity, augmentation, transitivity.' },
    { id: 'f2', front: 'Test X → Y?', backMd: 'Compute X⁺; check Y ⊆ X⁺.' },
    { id: 'f3', front: 'Shortcut for keys?', backMd: 'Attributes never on any right-hand side must be in every candidate key.' },
    { id: 'f4', front: 'Pseudo-transitivity?', backMd: 'X → Y and YW → Z give XW → Z.' },
    { id: 'f5', front: 'Superkeys of R(A, B, C, D) with single key {A}?', backMd: '2³ = 8 (A plus any subset of B, C, D).' },
  ] },
  resources: [DBBOOK, CMU],
});

const fdMcqs: MCQ[] = [
  mcq({ ...q(FD), id: 'dbms.fd.q1', type: 'concept', difficulty: 'medium', stem: 'R(A, B, C, D, E) with FDs A → B, BC → D, D → A. What is (AC)⁺?', options: ['{A, B, C, D}', ['{A, B, C}', 'BC → D also applies once B is added.'], ['{A, B, C, D, E}', 'Nothing determines E.'], ['{A, C}', 'A → B applies immediately.']], answer: 0, explanation: 'Start {A, C}; A → B adds B; BC → D adds D; D → A adds nothing new. E is never derived.' }),
  mcq({ ...q(FD), id: 'dbms.fd.q2', type: 'concept', difficulty: 'hard', stem: 'Same relation and FDs (A → B, BC → D, D → A). Which set lists **all** candidate keys?', options: ['{ACE, BCE, CDE}', ['{ACE}', 'BCE and CDE are also minimal keys.'], ['{CE}', '(CE)⁺ = {C, E}; it is not a superkey.'], ['{ABCDE}', 'That is a superkey but not minimal.']], answer: 0, explanation: 'C and E never appear on a right-hand side, so they are in every key. Adding any one of A, B or D completes the closure.' }),
  mcq({ ...q(FD), id: 'dbms.fd.q3', type: 'concept', difficulty: 'hard', stem: 'How many superkeys does that relation have?', options: ['7', ['3', 'That counts only candidate keys.'], ['8', 'The set with only C and E is not a superkey.'], ['32', 'That is every subset of 5 attributes.']], answer: 0, explanation: 'A superkey must contain C and E and at least one of A, B, D: 2³ − 1 = 7.' }),
  mcq({ ...q(FD), id: 'dbms.fd.q4', type: 'concept', difficulty: 'medium', stem: 'Given X → Y and YZ → W, which FD follows by pseudo-transitivity?', options: ['XZ → W', ['X → W', 'Z is still needed.'], ['Y → W', 'Y alone does not determine W.'], ['XW → Z', 'The roles are reversed.']], answer: 0, explanation: 'Replace Y in YZ → W by something that determines it (X).' }),
  mcq({ ...q(FD), id: 'dbms.fd.q5', type: 'scenario', difficulty: 'medium', stem: 'A table instance has rows (Samosa, 20, Gupta) and (Samosa, 20, Roy) for (Dish, Price, Shop). What can you conclude?', options: ['{Dish, Price} → Shop does NOT hold', ['{Dish, Price} → Shop holds', 'Two rows agree on (Dish, Price) but differ on Shop.'], ['Shop → Price holds for all instances', 'An instance cannot prove an FD.'], ['Nothing at all', 'It disproves one FD.']], answer: 0, explanation: 'One counter-example disproves an FD; no instance can prove one.' }),
  mcq({ ...q(FD), id: 'dbms.fd.q6', type: 'concept', difficulty: 'easy', stem: 'X is a superkey of R exactly when:', options: ['X⁺ contains every attribute of R', ['X appears on the left of some FD', 'Being on a left side does not imply determining everything.'], ['X contains a prime attribute', 'Not sufficient.'], ['X never appears on a right-hand side', 'That is a hint for key membership, not the definition.']], answer: 0, explanation: 'By definition, a superkey functionally determines all attributes.' }),
];

// ---------------------------------------------------------------------------------------
const NF = 'dbms.normalisation';
const normalisation = dbmsTopic({
  id: NF, title: 'Normalisation', level: 'core', estMinutes: 60, prerequisites: [FD],
  summary: '1NF to BCNF, highest normal form, lossless joins, and when to denormalise.',
  objectives: ['State 1NF, 2NF, 3NF and BCNF precisely and test a relation against them.', 'Explain update, insert and delete anomalies with examples.', 'Check lossless-join and dependency preservation for a decomposition.', 'Discuss when denormalisation is the right engineering choice.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Why normalise: anomalies', bodyMd: `Storing \`(student_id, course_id, student_name, grade)\` repeats the student name for every course:
- **Update anomaly:** a name change must update many rows; miss one and the data is inconsistent.
- **Insert anomaly:** you cannot store a student who has no course yet (course_id is part of the key).
- **Delete anomaly:** deleting a student's last enrolment loses the student entirely.

Normalisation removes redundancy by decomposing relations so that each fact is stored once.` },
    { id: 'forms', kind: 'concept', title: 'The normal forms', bodyMd: `| Form | Condition |
|---|---|
| **1NF** | atomic values; no repeating groups |
| **2NF** | 1NF and no **partial dependency**: no non-prime attribute depends on a *proper subset* of a candidate key |
| **3NF** | for every non-trivial X → A: X is a superkey **or** A is prime (removes transitive dependencies) |
| **BCNF** | for every non-trivial X → A: X is a superkey |

**Finding the highest normal form:** compute all candidate keys and prime attributes, then check from the top: BCNF (every determinant is a superkey) → 3NF (failing FDs have a prime right side) → 2NF (no partial dependency of a non-prime attribute) → otherwise 1NF.

Every BCNF relation is in 3NF, every 3NF relation is in 2NF, and so on. 3NF can always be achieved with a lossless, dependency-preserving decomposition; BCNF is always lossless but may lose dependencies.` },
    { id: 'decomp', kind: 'concept', title: 'Lossless join and dependency preservation', bodyMd: `Decompose R into R1 and R2.
- **Lossless join** iff the common attributes R1 ∩ R2 form a superkey of R1 or of R2 (that is, (R1 ∩ R2)⁺ ⊇ R1 or ⊇ R2). Otherwise joining the pieces back produces spurious rows.
- **Dependency preserving** iff every original FD can be checked inside the individual tables (or derived from the FDs that hold within them).

Example: R(A, B, C) with A → B, B → C. Decomposing into (A, B) and (B, C): common attribute B, and B → C makes B a key of (B, C), so it is lossless; both FDs live inside one table each, so dependencies are preserved.

Try it in the **FD toolkit** (Tools page) with your own examples.` },
    { id: 'denorm', kind: 'comparison', title: 'When to denormalise', bodyMd: `Normalised schemas avoid anomalies but need joins. Read-heavy systems sometimes **denormalise deliberately**: copy a value (author name onto posts), keep counters (like_count) or build reporting tables, accepting the cost of keeping copies consistent (triggers, application code, async jobs). In interviews, say *what* you denormalise, *why* (a measured read bottleneck) and *how* you keep it consistent.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Checking 2NF against only the primary key; partial dependencies are judged against **all** candidate keys.
2. Forgetting the "A is prime" escape clause of 3NF.
3. Calling a relation BCNF without checking every FD's left side.
4. Assuming any decomposition is lossless.
5. Treating normalisation as always good; performance trade-offs matter in practice.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain 1NF, 2NF, 3NF and BCNF briefly.', answerMd: '1NF: atomic values. 2NF: no non-prime attribute depends on part of a candidate key. 3NF: every determinant of a non-prime attribute is a superkey (no transitive dependencies). BCNF: every non-trivial determinant is a superkey.' },
    { id: 'iq2', q: 'Give an example of a relation in 3NF but not in BCNF.', answerMd: 'R(Student, Course, Teacher) with {Student, Course} → Teacher and Teacher → Course (each teacher teaches one course). Keys: {Student, Course} and {Student, Teacher}. Teacher → Course violates BCNF (Teacher is not a superkey), but Course is prime, so 3NF holds.' },
    { id: 'iq3', q: 'When is a decomposition lossless?', answerMd: 'For a binary decomposition: when the common attributes are a superkey of at least one of the two resulting relations. Then the natural join reconstructs exactly the original relation.' },
    { id: 'iq4', q: 'When would you denormalise?', answerMd: 'When a read path is measurably bottlenecked by joins or aggregates, for example feed rendering or dashboards. Copy or precompute data and accept update complexity, with a clear mechanism (transactions, triggers, async jobs) to keep copies consistent.' },
  ],
  revision: { notesMd: `- Anomalies: update, insert, delete.
- 2NF: no partial dependency of a non-prime attribute (check all candidate keys).
- 3NF: X superkey OR A prime. BCNF: X superkey.
- Lossless: R1 ∩ R2 → R1 or R2.
- BCNF can lose dependencies; 3NF synthesis keeps them.`, flashcards: [
    { id: 'f1', front: '3NF condition for X → A?', backMd: 'X is a superkey or A is a prime attribute.' },
    { id: 'f2', front: 'BCNF condition for X → A?', backMd: 'X is a superkey.' },
    { id: 'f3', front: 'Partial dependency?', backMd: 'A non-prime attribute depends on a proper subset of a candidate key (a 2NF violation).' },
    { id: 'f4', front: 'Lossless binary decomposition test?', backMd: 'The common attributes determine all of R1 or all of R2.' },
    { id: 'f5', front: 'Three anomalies normalisation prevents?', backMd: 'Update, insert, delete.' },
  ] },
  resources: [DBBOOK, CMU],
});

const nfMcqs: MCQ[] = [
  mcq({ ...q(NF), id: 'dbms.nf.q1', type: 'concept', difficulty: 'medium', stem: 'R(S, C, N, G) with SC → G and S → N (key {S, C}). Highest normal form?', options: ['1NF', ['2NF', 'S → N is a partial dependency: N is non-prime and S is part of the key.'], ['3NF', 'It already fails 2NF.'], ['BCNF', 'S is not a superkey.']], answer: 0, explanation: 'The non-prime attribute N depends on S, a proper subset of the key {S, C}, which violates 2NF.' }),
  mcq({ ...q(NF), id: 'dbms.nf.q2', type: 'concept', difficulty: 'medium', stem: 'R(A, B, C) with A → B and B → C (key {A}). Highest normal form?', options: ['2NF', ['1NF', 'The key is a single attribute, so there are no partial dependencies.'], ['3NF', 'B → C: B is not a superkey and C is non-prime (transitive dependency).'], ['BCNF', 'B is not a superkey.']], answer: 0, explanation: 'No partial dependencies (single-attribute key), but A → B → C is transitive, which fails 3NF.' }),
  mcq({ ...q(NF), id: 'dbms.nf.q3', type: 'concept', difficulty: 'hard', stem: 'R(A, B, C, D, E) with A → B, BC → D, D → A (keys ACE, BCE, CDE). Highest normal form?', options: ['3NF', ['BCNF', 'A → B: A is not a superkey.'], ['2NF', 'Every right-hand side is prime, so 3NF holds.'], ['1NF', 'There is no partial dependency of a non-prime attribute: all attributes are prime.']], answer: 0, explanation: 'All attributes are prime, so the 3NF escape clause holds for every FD, but determinants such as A are not superkeys, so BCNF fails.' }),
  mcq({ ...q(NF), id: 'dbms.nf.q4', type: 'concept', difficulty: 'medium', stem: 'R(A, B, C) with A → B and B → C, decomposed into R1(A, C) and R2(B, C). Lossless?', options: ['No: the common attribute C determines neither R1 nor R2', ['Yes: every attribute appears in some table', 'Covering the attributes is necessary but not sufficient.'], ['Yes: B → C holds', 'B is not the common attribute.'], ['Only if A → C is added', 'A → C already follows; the issue is the shared attribute.']], answer: 0, explanation: 'R1 ∩ R2 = {C}, and C⁺ = {C}, which is not a superkey of either piece. Joining can create spurious tuples.' }),
  mcq({ ...q(NF), id: 'dbms.nf.q5', type: 'scenario', difficulty: 'easy', stem: 'Storing the customer\'s address on every order row causes which anomaly when a customer moves?', options: ['Update anomaly', ['Insert anomaly', 'That is about being unable to add data.'], ['Delete anomaly', 'That is about losing data on deletion.'], ['Phantom read', 'That is a concurrency anomaly.']], answer: 0, explanation: 'The same fact is stored in many rows; updating only some of them leaves inconsistent data.' }),
  mcq({ ...q(NF), id: 'dbms.nf.q6', type: 'concept', difficulty: 'medium', stem: 'Which statement is true?', options: ['Every relation can be decomposed into 3NF losslessly while preserving dependencies; BCNF may lose dependencies', ['BCNF decompositions always preserve dependencies', 'Not always; the Student-Course-Teacher example loses one.'], ['3NF decompositions can be lossy', 'The synthesis algorithm guarantees losslessness.'], ['2NF is stricter than 3NF', 'It is the other way round.']], answer: 0, explanation: 'This is the classic trade-off between 3NF and BCNF.' }),
];

// ---------------------------------------------------------------------------------------
const TX = 'dbms.transactions-acid';
const acid = dbmsTopic({
  id: TX, title: 'Transactions and ACID', level: 'core', estMinutes: 40, prerequisites: ['dbms.relational-basics'],
  summary: 'What each ACID property protects against, with concrete failures.',
  objectives: ['Define a transaction and its COMMIT/ROLLBACK lifecycle.', 'Explain each ACID property with a failure it prevents.', 'Describe how databases implement atomicity and durability (write-ahead logging).'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'A transaction is an all-or-nothing unit', bodyMd: `A transaction groups operations that must succeed or fail together. Transferring ₹500: debit A, credit B. If the system crashes between the two, money disappears unless both are in one transaction.

- **Atomicity:** all of the transaction or none of it. A crash or error rolls back partial work.
- **Consistency:** a transaction takes the database from one valid state to another (constraints, invariants such as "total money is unchanged").
- **Isolation:** concurrent transactions do not see each other's intermediate states (to a degree set by the isolation level).
- **Durability:** once committed, changes survive crashes.` },
    { id: 'how', kind: 'concept', title: 'How databases implement it', bodyMd: `- **Write-ahead logging (WAL):** changes are first appended to a log on disk; the data pages are written later. After a crash, recovery **redoes** committed changes from the log and **undoes** uncommitted ones. This gives both atomicity and durability.
- **Isolation** is implemented with locks (two-phase locking) and/or **MVCC** (multi-version concurrency control: readers see a snapshot while writers create new versions).
- Consistency is partly the application's job (correct logic) and partly the database's (constraints, foreign keys).` },
    { id: 'example', kind: 'example', title: 'Transfer in SQL', bodyMd: 'In practice, add a check that the balance is sufficient and lock or check the rows to avoid races.', code: [{ lang: 'sql', code: `BEGIN;
UPDATE accounts SET balance = balance - 500 WHERE id = 1 AND balance >= 500;
-- application checks that exactly 1 row was updated, else ROLLBACK
UPDATE accounts SET balance = balance + 500 WHERE id = 2;
COMMIT;` }] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Confusing ACID consistency with the "C" in CAP (CAP consistency means linearisability across replicas).
2. Assuming isolation means full serialisability by default (most databases default to READ COMMITTED or REPEATABLE READ).
3. Doing read-modify-write in application code without locking or a conditional update, which loses updates.
4. Keeping transactions open while waiting for user input or network calls (long locks).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain ACID with a bank transfer example.', answerMd: 'Atomicity: debit and credit both happen or neither does. Consistency: the total balance is preserved and constraints (no negative balance) hold. Isolation: another transaction never sees money debited but not yet credited. Durability: after COMMIT the transfer survives a crash.' },
    { id: 'iq2', q: 'How is durability achieved?', answerMd: 'With write-ahead logging: commit records are flushed (fsync) to the log before the commit is acknowledged; data pages can be written later, and recovery replays the log after a crash.' },
    { id: 'iq3', q: 'What is the difference between ACID consistency and CAP consistency?', answerMd: 'ACID consistency means a transaction preserves the database\'s integrity rules. CAP consistency means every read sees the latest write across distributed replicas (linearisability). They are different concepts that share a word.' },
    { id: 'iq4', q: 'How do you prevent lost updates when two users increment a counter?', answerMd: 'Use an atomic update (UPDATE t SET c = c + 1), a row lock (SELECT … FOR UPDATE), or optimistic concurrency with a version column checked in the UPDATE\'s WHERE clause.' },
  ],
  revision: { notesMd: `- A: all or nothing; C: valid state to valid state; I: no visible intermediate states; D: committed survives crashes.
- WAL gives atomicity and durability (redo/undo).
- Isolation comes from locks or MVCC; default levels are weaker than serializable.
- Avoid read-modify-write races: atomic UPDATE, FOR UPDATE, or versioning.`, flashcards: [
    { id: 'f1', front: 'What does atomicity guarantee?', backMd: 'All operations of a transaction take effect, or none do.' },
    { id: 'f2', front: 'Mechanism behind atomicity and durability?', backMd: 'Write-ahead logging with redo/undo recovery.' },
    { id: 'f3', front: 'ACID C vs CAP C?', backMd: 'Integrity constraints vs linearisable reads across replicas.' },
    { id: 'f4', front: 'Lost-update prevention (3 ways)?', backMd: 'An atomic UPDATE expression, SELECT … FOR UPDATE, or an optimistic version check.' },
    { id: 'f5', front: 'Common default isolation level?', backMd: 'READ COMMITTED (PostgreSQL, Oracle, SQL Server); REPEATABLE READ (MySQL InnoDB).' },
  ] },
  resources: [DBBOOK, { title: 'Write-Ahead Logging (PostgreSQL docs)', url: 'https://www.postgresql.org/docs/current/wal-intro.html', kind: 'official-docs' }],
});

const txMcqs: MCQ[] = [
  mcq({ ...q(TX), id: 'dbms.tx.q1', type: 'scenario', difficulty: 'easy', stem: 'The server crashes after debiting account A but before crediting B within one transaction. After restart, what does atomicity guarantee?', options: ['The debit is rolled back, as if the transaction never ran', ['The credit is applied automatically', 'Uncommitted work is undone, not completed.'], ['The data stays half-updated', 'That is exactly what atomicity prevents.'], ['The database refuses to start', 'Recovery handles it.']], answer: 0, explanation: 'Uncommitted changes are undone during recovery.' }),
  mcq({ ...q(TX), id: 'dbms.tx.q2', type: 'concept', difficulty: 'medium', stem: 'Which mechanism primarily provides durability?', options: ['Flushing the write-ahead log to disk before acknowledging COMMIT', ['Row-level locks', 'Locks provide isolation.'], ['Foreign keys', 'They support consistency.'], ['Indexes', 'They speed up access.']], answer: 0, explanation: 'Once the commit record is on stable storage, recovery can always redo the transaction.' }),
  mcq({ ...q(TX), id: 'dbms.tx.q3', type: 'scenario', difficulty: 'medium', stem: 'Two sessions run `SELECT stock` (both read 5), then each runs `UPDATE … SET stock = 4` (computed in the app). Final stock is 4 after two sales. What is this called, and what fixes it?', options: ['A lost update; use UPDATE … SET stock = stock − 1, or SELECT … FOR UPDATE', ['A dirty read; use READ UNCOMMITTED', 'Neither transaction read uncommitted data.'], ['A phantom read; add an index', 'No new rows appeared.'], ['A deadlock; retry', 'Nobody waited on anybody.']], answer: 0, explanation: 'Both read the same value and overwrote each other. An atomic decrement or a lock serialises the read-modify-write.' }),
  mcq({ ...q(TX), id: 'dbms.tx.q4', type: 'concept', difficulty: 'easy', stem: 'Which ACID property is about concurrent transactions not seeing each other\'s partial work?', options: ['Isolation', ['Atomicity', 'That is about all-or-nothing completion.'], ['Durability', 'That is about surviving crashes.'], ['Consistency', 'That is about valid states.']], answer: 0, explanation: 'Isolation controls the visibility of concurrent changes.' }),
  mcq({ ...q(TX), id: 'dbms.tx.q5', type: 'concept', difficulty: 'medium', stem: 'In a distributed-systems discussion, "consistency" in CAP refers to:', options: ['Every read returns the most recent write (linearisability)', ['Integrity constraints are preserved', 'That is ACID consistency.'], ['Transactions are atomic', 'That is atomicity.'], ['Data is normalised', 'Unrelated.']], answer: 0, explanation: 'CAP consistency is a property of replicated data, not of constraints.' }),
  mcq({ ...q(TX), id: 'dbms.tx.q6', type: 'scenario', difficulty: 'medium', stem: 'An endpoint opens a transaction, calls a slow external payment API, then commits. What is the main risk?', options: ['Locks are held for a long time, blocking other transactions and risking timeouts or deadlocks', ['The transaction becomes non-atomic', 'Atomicity is still guaranteed.'], ['Durability is lost', 'Commit still writes the log.'], ['Nothing; this is best practice', 'Keep transactions short.']], answer: 0, explanation: 'Do slow external work outside the transaction, or use an outbox or saga pattern.' }),
];

// ---------------------------------------------------------------------------------------
const IC = 'dbms.isolation-concurrency';
const isolation = dbmsTopic({
  id: IC, title: 'Isolation Levels and Concurrency Control', level: 'core', estMinutes: 55, prerequisites: [TX],
  summary: 'Read anomalies, isolation levels, locking, 2PL and MVCC.',
  objectives: ['Define dirty reads, non-repeatable reads, phantoms and lost updates.', 'Map isolation levels to the anomalies they allow.', 'Explain two-phase locking and MVCC at interview depth.', 'Choose optimistic vs pessimistic locking for a scenario.'],
  sections: [
    { id: 'anomalies', kind: 'concept', title: 'Read anomalies', bodyMd: `- **Dirty read:** reading another transaction's *uncommitted* change (which may roll back).
- **Non-repeatable read:** reading the same row twice and getting different committed values.
- **Phantom read:** re-running a range query and seeing new or removed rows that match.
- **Lost update:** two read-modify-write cycles overwrite each other.
- **Write skew:** two transactions read overlapping data, each writes a different row, and together they violate an invariant (two doctors both go off call). It is prevented only by SERIALIZABLE (or explicit locks).` },
    { id: 'levels', kind: 'comparison', title: 'Isolation levels (SQL standard)', bodyMd: `| Level | Dirty read | Non-repeatable read | Phantom |
|---|---|---|---|
| READ UNCOMMITTED | possible | possible | possible |
| READ COMMITTED | prevented | possible | possible |
| REPEATABLE READ | prevented | prevented | possible (standard) |
| SERIALIZABLE | prevented | prevented | prevented |

Real engines differ: MySQL InnoDB's default REPEATABLE READ uses MVCC snapshots plus next-key (gap) locks, which prevent most phantoms; PostgreSQL's REPEATABLE READ is snapshot isolation (no phantoms in snapshot reads, but write skew is possible). Higher isolation means more blocking or aborts, and lower throughput.` },
    { id: 'mechanisms', kind: 'concept', title: 'Locks, 2PL and MVCC', bodyMd: `- **Shared (S) locks** for reading, **exclusive (X) locks** for writing; S is compatible with S, X with nothing.
- **Two-phase locking (2PL):** a growing phase (acquire locks) and then a shrinking phase (release locks); never acquire after releasing. 2PL guarantees conflict-serializable schedules. **Strict 2PL** holds X locks until commit, which avoids cascading aborts. 2PL can deadlock.
- **MVCC:** each write creates a new row version; readers see a consistent snapshot and do not block writers (or vice versa). Used by PostgreSQL, MySQL InnoDB and Oracle.
- **Optimistic concurrency:** no lock while working; at write time check a version column (\`UPDATE … WHERE id = ? AND version = ?\`) and retry on conflict. Good when conflicts are rare.
- **Pessimistic:** lock up front (\`SELECT … FOR UPDATE\`). Good when conflicts are frequent or retries are expensive.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Assuming the default isolation level is SERIALIZABLE.
2. Treating MVCC as "no locks at all"; writers still lock rows they modify.
3. Forgetting write skew under snapshot isolation.
4. Using optimistic locking for hot rows with many conflicts (endless retries).
5. Locking rows in different orders in different code paths (deadlocks).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain the isolation levels and the anomalies each prevents.', answerMd: 'READ UNCOMMITTED allows dirty reads; READ COMMITTED prevents them; REPEATABLE READ also prevents non-repeatable reads; SERIALIZABLE also prevents phantoms and write skew, behaving as if transactions ran one at a time. Engines implement them differently (locks vs MVCC).' },
    { id: 'iq2', q: 'What is MVCC and why is it popular?', answerMd: 'Multi-version concurrency control keeps several versions of a row. Each transaction reads a snapshot consistent with its start (or statement start), so reads do not block writes and writes do not block reads. Old versions are cleaned up later (VACUUM, purge).' },
    { id: 'iq3', q: 'Optimistic vs pessimistic locking?', answerMd: 'Optimistic: read freely, then verify a version at write time and retry on conflict; best for low contention. Pessimistic: lock rows when reading (FOR UPDATE) to block others; best under high contention or when work cannot be retried cheaply.' },
    { id: 'iq4', q: 'What is two-phase locking?', answerMd: 'Each transaction acquires all its locks before releasing any (growing then shrinking phase). This ensures conflict-serializable schedules. Strict 2PL keeps exclusive locks until commit to avoid cascading aborts. Deadlocks are still possible.' },
  ],
  revision: { notesMd: `- Dirty read (uncommitted), non-repeatable read (value changed), phantom (rows appear), lost update, write skew.
- RU < RC < RR < SERIALIZABLE.
- 2PL: grow then shrink; strict 2PL holds X locks to commit.
- MVCC: snapshots; readers do not block writers.
- Optimistic = version check and retry; pessimistic = FOR UPDATE.`, flashcards: [
    { id: 'f1', front: 'Dirty read?', backMd: 'Reading another transaction\'s uncommitted change.' },
    { id: 'f2', front: 'Phantom read?', backMd: 'A repeated range query returns new or missing rows.' },
    { id: 'f3', front: 'Lowest standard level preventing non-repeatable reads?', backMd: 'REPEATABLE READ.' },
    { id: 'f4', front: '2PL guarantees?', backMd: 'Conflict serializability (but not freedom from deadlocks).' },
    { id: 'f5', front: 'Optimistic locking implementation?', backMd: 'A version column; UPDATE … WHERE id = ? AND version = ?; retry if 0 rows were updated.' },
  ] },
  resources: [{ title: 'Transaction Isolation (PostgreSQL docs)', url: 'https://www.postgresql.org/docs/current/transaction-iso.html', kind: 'official-docs' }, CMU],
});

const icMcqs: MCQ[] = [
  mcq({ ...q(IC), id: 'dbms.ic.q1', type: 'concept', difficulty: 'easy', stem: 'Transaction T1 reads a row that T2 updated but has not committed; T2 then rolls back. What happened to T1?', options: ['A dirty read', ['A phantom read', 'Phantoms are about new rows in a range.'], ['A non-repeatable read', 'That involves committed changes.'], ['A deadlock', 'No waiting occurred.']], answer: 0, explanation: 'Reading uncommitted data is a dirty read; READ COMMITTED and above prevent it.' }),
  mcq({ ...q(IC), id: 'dbms.ic.q2', type: 'concept', difficulty: 'medium', stem: 'Which is the weakest standard isolation level that prevents non-repeatable reads?', options: ['REPEATABLE READ', ['READ COMMITTED', 'It still allows a row\'s value to change between two reads.'], ['READ UNCOMMITTED', 'It even allows dirty reads.'], ['SERIALIZABLE', 'It prevents them, but it is not the weakest.']], answer: 0, explanation: 'REPEATABLE READ guarantees that rows already read keep their values within the transaction.' }),
  mcq({ ...q(IC), id: 'dbms.ic.q3', type: 'scenario', difficulty: 'hard', stem: 'Two on-call doctors each check "at least one other doctor is on call" and then mark themselves off. Under snapshot isolation both succeed, leaving no one on call. This anomaly is:', options: ['Write skew', ['Dirty read', 'Both read committed data.'], ['Lost update', 'They updated different rows.'], ['Phantom read only', 'The key issue is two disjoint writes based on a shared read.']], answer: 0, explanation: 'Each transaction reads the same snapshot and writes a different row; only SERIALIZABLE (or explicit locking of the checked rows) prevents it.' }),
  mcq({ ...q(IC), id: 'dbms.ic.q4', type: 'concept', difficulty: 'medium', stem: 'In two-phase locking, what is forbidden?', options: ['Acquiring a new lock after releasing any lock', ['Holding more than one lock', 'Multiple locks are normal.'], ['Releasing locks before commit', 'Plain 2PL allows it; strict 2PL does not.'], ['Reading without a lock', 'Not the defining rule.']], answer: 0, explanation: 'All acquisitions (growing phase) must precede all releases (shrinking phase).' }),
  mcq({ ...q(IC), id: 'dbms.ic.q5', type: 'scenario', difficulty: 'medium', stem: 'A wiki page is edited rarely and concurrently almost never. Which concurrency strategy fits best?', options: ['Optimistic locking with a version column', ['Pessimistic FOR UPDATE on every read', 'That blocks readers for no benefit.'], ['SERIALIZABLE on the whole database', 'Overkill and reduces throughput.'], ['No concurrency control', 'Concurrent edits would silently overwrite each other.']], answer: 0, explanation: 'Low contention means retries are rare, so optimistic checks are cheap and safe.' }),
  mcq({ ...q(IC), id: 'dbms.ic.q6', type: 'concept', difficulty: 'medium', stem: 'What is the main benefit of MVCC?', options: ['Readers see a consistent snapshot without blocking writers, and writers do not block readers', ['It eliminates all locks', 'Writers still lock the rows they modify.'], ['It removes the need for logging', 'Logs are still required for durability.'], ['It guarantees serializability by default', 'Snapshot isolation still allows write skew.']], answer: 0, explanation: 'Multiple row versions decouple readers from writers, improving concurrency.' }),
];

// ---------------------------------------------------------------------------------------
const IX = 'dbms.indexing';
const indexing = dbmsTopic({
  id: IX, title: 'Indexing and B+ Trees', level: 'core', estMinutes: 55, prerequisites: ['dbms.relational-basics'],
  summary: 'How indexes work, clustered vs secondary, composite and covering indexes.',
  objectives: ['Explain why B+ trees suit disks and range queries.', 'Distinguish clustered and secondary indexes (InnoDB specifics).', 'Apply the leftmost-prefix rule for composite indexes.', 'Recognise when an index is not used and the cost of indexes on writes.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'B+ trees in one picture', bodyMd: `A **B+ tree** is a balanced tree with a high fan-out (hundreds of keys per node, sized to a disk page). Internal nodes hold separator keys; **all values live in the leaves**, and the leaves are linked in sorted order.

- Lookup: O(log_f n) page reads, where the fan-out f is large; even a billion rows need only 3–4 levels.
- Range scan: find the start leaf, then follow leaf links.
- Inserts and deletes keep the tree balanced by splitting or merging nodes.

**B-tree vs B+ tree:** a B-tree stores values in internal nodes too; a B+ tree keeps them only in the leaves, which gives higher fan-out and efficient range scans. Most databases use B+ trees.

**Hash indexes** give O(1) equality lookups but cannot do ranges or ordering.` },
    { id: 'clustered', kind: 'comparison', title: 'Clustered vs secondary indexes', bodyMd: `- A **clustered index** determines the physical order of the table rows; there is at most one. In MySQL InnoDB the **primary key is the clustered index**: the leaves hold the full rows.
- A **secondary (non-clustered) index** has leaves holding the indexed columns plus a pointer to the row; in InnoDB that pointer is the **primary key value**. A secondary lookup therefore does two searches: the secondary index, then the clustered index (a "bookmark lookup").
- A **covering index** contains every column the query needs, so the second lookup is skipped ("Using index" in MySQL EXPLAIN).` },
    { id: 'composite', kind: 'intuition', title: 'Composite indexes and the leftmost prefix', bodyMd: `An index on (a, b, c) is sorted by a, then b, then c. It can serve:
- \`WHERE a = ?\`, \`WHERE a = ? AND b = ?\`, \`WHERE a = ? AND b = ? AND c > ?\`
- \`ORDER BY a, b\`

It **cannot** efficiently serve \`WHERE b = ?\` alone (b is not sorted globally). After a range condition on one column, the following columns cannot be used for further seeking.

**When an index is not used:** a function on the column (\`WHERE YEAR(created_at) = 2024\`; use a range instead), a leading wildcard (\`LIKE '%abc'\`), implicit type conversion, low selectivity (the optimiser prefers a full scan), or OR conditions across different columns.` },
    { id: 'cost', kind: 'mistakes', title: 'Costs and common mistakes', bodyMd: `1. Every index slows INSERT/UPDATE/DELETE and uses space. Index for real query patterns only.
2. Indexing every column separately instead of one composite index that matches the query.
3. Wrapping indexed columns in functions (not sargable).
4. Using random UUIDs as the clustered key, which causes page splits; prefer sequential keys or ordered UUIDs (UUIDv7).
5. Forgetting to check the plan with EXPLAIN.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Why do databases use B+ trees instead of binary search trees?', answerMd: 'Disk and page I/O dominates. A B+ tree node fills a page with hundreds of keys, so the tree is very shallow (3–4 levels for billions of rows), minimising page reads. Linked leaves make range scans sequential. Binary trees would need about 30 levels and many random reads.' },
    { id: 'iq2', q: 'Clustered vs non-clustered index?', answerMd: 'A clustered index defines the row storage order (one per table; the PK in InnoDB) and its leaves contain the rows. A secondary index stores keys plus a pointer (the PK in InnoDB), so queries may need a second lookup unless the index covers all needed columns.' },
    { id: 'iq3', q: 'An index on (country, city) exists. Does it help WHERE city = \'Pune\'?', answerMd: 'Not for seeking: the leftmost column (country) is not constrained, so the index is not ordered by city. The optimiser may still scan the whole index if it is narrower than the table. Add a separate index on city if this query is important.' },
    { id: 'iq4', q: 'Why might adding an index make the application slower?', answerMd: 'Writes must update every index (extra I/O and lock time); a large number of indexes also uses memory and cache. If the index is not selective, reads gain little. Always measure.' },
  ],
  revision: { notesMd: `- B+ tree: high fan-out, values in linked leaves, O(log_f n), good for ranges.
- InnoDB: the PK is the clustered index; secondary leaves store the PK.
- Covering index: no lookup back to the table.
- Composite (a, b, c): leftmost prefix rule.
- Not sargable: functions on columns, leading %, type casts.
- Indexes cost write time and space.`, flashcards: [
    { id: 'f1', front: 'Where are the values in a B+ tree?', backMd: 'Only in the leaves, which are linked for range scans.' },
    { id: 'f2', front: 'InnoDB secondary index leaf stores?', backMd: 'The indexed columns plus the primary key value.' },
    { id: 'f3', front: 'Covering index?', backMd: 'Contains all columns the query needs, so there is no table lookup.' },
    { id: 'f4', front: 'Index (a, b): does WHERE b = 1 use it for seeking?', backMd: 'No (leftmost prefix rule).' },
    { id: 'f5', front: 'Make `WHERE YEAR(d) = 2024` sargable?', backMd: "WHERE d >= '2024-01-01' AND d < '2025-01-01'." },
  ] },
  resources: [{ title: 'B+ tree (Wikipedia)', url: 'https://en.wikipedia.org/wiki/B%2B_tree', kind: 'article' }, { title: 'Query planning (SQLite docs)', url: 'https://www.sqlite.org/queryplanner.html', kind: 'official-docs' }, CMU],
});

const ixMcqs: MCQ[] = [
  mcq({ ...q(IX), id: 'dbms.ix.q1', type: 'concept', difficulty: 'medium', stem: 'Why does a B+ tree support range queries efficiently?', options: ['Leaves are sorted and linked, so after finding the start you scan sequentially', ['It hashes keys into buckets', 'That is a hash index, which cannot do ranges.'], ['Internal nodes store full rows', 'In a B+ tree, internal nodes store only separators.'], ['It is unbalanced towards recent keys', 'B+ trees are balanced.']], answer: 0, explanation: 'Descend once to the first matching leaf, then follow leaf pointers.' }),
  mcq({ ...q(IX), id: 'dbms.ix.q2', type: 'scenario', difficulty: 'medium', stem: 'An index exists on `orders(customer_id, created_at)`. Which query can use it best?', options: ["WHERE customer_id = 7 AND created_at >= '2024-01-01'", ["WHERE created_at >= '2024-01-01'", 'The leftmost column is not constrained.'], ['WHERE YEAR(created_at) = 2024', 'A function on the column blocks seeking, and the first column is missing.'], ["WHERE customer_id + 1 = 8", 'An expression on the column is not sargable.']], answer: 0, explanation: 'An equality on the first column followed by a range on the second matches the index order.' }),
  mcq({ ...q(IX), id: 'dbms.ix.q3', type: 'concept', difficulty: 'medium', stem: 'In MySQL InnoDB, what does a secondary index leaf entry point to?', options: ['The primary key value of the row', ['The physical disk address of the row', 'InnoDB uses the PK so rows can move without updating secondaries.'], ['The full row', 'Only clustered (PK) leaves store full rows.'], ['Nothing; it stores the row inline', 'Secondary indexes do not duplicate full rows.']], answer: 0, explanation: 'A secondary lookup finds the PK, then searches the clustered index.' }),
  mcq({ ...q(IX), id: 'dbms.ix.q4', type: 'concept', difficulty: 'easy', stem: 'What is a covering index for a query?', options: ['An index that contains every column the query needs, avoiding table lookups', ['An index on every column of the table', 'That is wasteful and not the definition.'], ['A clustered index', 'Not necessarily covering for a given query.'], ['An index with a UNIQUE constraint', 'Uniqueness is unrelated.']], answer: 0, explanation: 'The query is answered entirely from the index.' }),
  mcq({ ...q(IX), id: 'dbms.ix.q5', type: 'scenario', difficulty: 'medium', stem: 'Adding five indexes to a write-heavy logging table made inserts much slower. Why?', options: ['Every insert must also update all five index structures', ['Indexes lock the whole table', 'Index maintenance does not lock the whole table.'], ['Indexes disable the buffer pool', 'They do not.'], ['Inserts must re-sort the table', 'Only the index trees are maintained.']], answer: 0, explanation: 'Each index is an additional B+ tree to modify; index only what queries need.' }),
  mcq({ ...q(IX), id: 'dbms.ix.q6', type: 'concept', difficulty: 'medium', stem: 'A table has 10⁹ rows and a B+ tree with fan-out about 500. Roughly how many levels does a lookup traverse?', options: ['About 4', ['About 30', 'That is a binary tree (log₂ 10⁹).'], ['About 500', 'Fan-out is not depth.'], ['Exactly 1', 'A single page cannot index a billion rows.']], answer: 0, explanation: 'log₅₀₀(10⁹) ≈ 3.3, so 4 levels.' }),
];

export const topics: Topic[] = [keys, fds, normalisation, acid, isolation, indexing];
export const mcqs: MCQ[] = [...kcMcqs, ...fdMcqs, ...nfMcqs, ...txMcqs, ...icMcqs, ...ixMcqs];
