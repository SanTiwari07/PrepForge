import type { MCQ, Topic } from '../schema';
import { mcq } from '../helpers';
import { CMU, DBBOOK, dbmsTopic, q } from './common';

// DBMS batch 2: relational basics, ER modelling, relational algebra, serialisability, deadlocks.
// Schedule answers are cross-checked with src/engine/tools/schedule.ts in tests/dbms-facts.test.ts.

// ---------------------------------------------------------------------------------------
const RB = 'dbms.relational-basics';
const relational = dbmsTopic({
  id: RB, title: 'Relational Model Basics', level: 'foundation', estMinutes: 30, prerequisites: [], related: ['dbms.keys-constraints', 'dbms.relational-algebra', 'sql.select-basics'],
  summary: 'Relations, tuples, schemas, and why databases exist.',
  objectives: ['Define relation, tuple, attribute, domain, degree and cardinality, and map them to tables, rows and columns.', 'Explain what a DBMS adds over flat files: data independence, integrity, concurrency, recovery, security.', 'Describe the three-schema architecture and the difference between logical and physical data independence.', 'State the properties of a relation (no duplicate tuples, no row or column order, atomic values).'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Vocabulary', bodyMd: `| Relational term | SQL term | Meaning |
|---|---|---|
| Relation | table | a set of tuples with the same attributes |
| Tuple | row | one fact |
| Attribute | column | a named property |
| Domain | data type + constraints | the set of allowed values for an attribute |
| Degree | number of columns | arity of the relation |
| Cardinality | number of rows | size of the relation (changes over time) |
| Schema | CREATE TABLE definition | relation name + attributes (+ constraints) |
| Instance | current contents | the tuples present at a moment |

**Properties of a relation (in theory):** it is a **set**, so there are no duplicate tuples and no order of rows; attributes have no order (they are referenced by name); every value is **atomic** (first normal form). SQL tables relax this: they are **bags** (duplicates allowed unless a key prevents them), and columns do have an order.` },
    { id: 'why', kind: 'concept', title: 'Why use a DBMS instead of files', bodyMd: `A file per entity (CSV, JSON) works for one program and one user. A database management system adds:

1. **Data independence:** programs query by meaning, not by file layout; storage can change without rewriting queries.
2. **Integrity:** constraints (keys, foreign keys, CHECK) are enforced centrally, not in every program.
3. **Concurrency control:** many users read and write safely at the same time (transactions, isolation).
4. **Recovery:** committed data survives crashes (logging), and failed operations are rolled back.
5. **Declarative querying and optimisation:** SQL says *what*; the optimiser decides *how* (indexes, join order).
6. **Security:** users, roles and permissions per table or column.
7. **Less redundancy and inconsistency** through a shared, normalised schema.` },
    { id: 'levels', kind: 'comparison', title: 'Three-schema architecture and data independence', bodyMd: `| Level | Describes | Example |
|---|---|---|
| External (view) | what one user or application sees | a view exposing only name and email |
| Conceptual (logical) | all entities, attributes, relationships and constraints | the full set of tables and keys |
| Internal (physical) | how data is stored | files, pages, B+ tree indexes, compression |

- **Physical data independence:** change the internal level (add an index, move to SSD, change file organisation) without changing the conceptual schema or applications. Easy to achieve and common.
- **Logical data independence:** change the conceptual schema (split a table, add a column) without changing external views and applications. Harder: views help, but not every change can be hidden.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Confusing **degree** (columns) with **cardinality** (rows).
2. Saying relations are ordered; only an ORDER BY in a query imposes order.
3. Saying SQL tables cannot contain duplicate rows; without a key they can.
4. Mixing up physical (storage) and logical (schema) data independence.
5. Calling a DBMS "just a big file": the value is in concurrency, recovery, integrity and optimisation.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What advantages does a DBMS offer over a file system?', answerMd: 'Data independence, centrally enforced integrity constraints, safe concurrent access through transactions, crash recovery, declarative queries with optimisation, security controls, and reduced redundancy and inconsistency.' },
    { id: 'iq2', q: 'What is the difference between logical and physical data independence?', answerMd: 'Physical independence: changing how data is stored (indexes, file organisation, storage devices) does not affect the logical schema or applications. Logical independence: changing the logical schema (adding or splitting tables) does not affect external views or applications. Physical independence is easier to achieve.' },
    { id: 'iq3', q: 'Define degree and cardinality.', answerMd: 'Degree is the number of attributes (columns) of a relation; cardinality is the number of tuples (rows). A table Students(id, name, email) with 500 rows has degree 3 and cardinality 500.' },
    { id: 'iq4', q: 'Is a SQL table exactly a mathematical relation?', answerMd: 'Not quite. A relation is a set (no duplicates, no order). A SQL table is a multiset (bag): it can contain duplicate rows unless a primary key or UNIQUE constraint prevents them, and SELECT results keep duplicates unless DISTINCT is used.' },
  ],
  revision: { notesMd: `- Relation = table, tuple = row, attribute = column, domain = allowed values.
- Degree = #columns; cardinality = #rows.
- Relations are sets (no duplicates, no order); SQL tables are bags.
- DBMS benefits: independence, integrity, concurrency, recovery, optimisation, security.
- External / conceptual / internal levels; physical vs logical data independence.`, flashcards: [
    { id: 'f1', front: 'Degree of a relation?', backMd: 'The number of attributes (columns).' },
    { id: 'f2', front: 'Cardinality of a relation?', backMd: 'The number of tuples (rows).' },
    { id: 'f3', front: 'Physical data independence?', backMd: 'Storage changes (indexes, files, devices) do not affect the logical schema or applications.' },
    { id: 'f4', front: 'Are SQL tables sets?', backMd: 'No, bags: duplicates are allowed unless a key prevents them.' },
    { id: 'f5', front: 'Three schema levels?', backMd: 'External (views), conceptual (logical), internal (physical).' },
  ] },
  resources: [DBBOOK, CMU],
});

const rbMcqs: MCQ[] = [
  mcq({ ...q(RB), id: 'dbms.rb.q1', type: 'concept', difficulty: 'easy', stem: 'A table Orders(id, customer_id, date, total) currently holds 1200 rows. What are its degree and cardinality?', options: ['Degree 4, cardinality 1200', ['Degree 1200, cardinality 4', 'Degree counts columns; cardinality counts rows.'], ['Degree 4, cardinality 4', 'Cardinality is the number of rows.'], ['Degree 1, cardinality 1200', 'There are four attributes.']], answer: 0, explanation: 'Degree = number of attributes; cardinality = number of tuples.' }),
  mcq({ ...q(RB), id: 'dbms.rb.q2', type: 'scenario', difficulty: 'medium', stem: 'The DBA adds a B+ tree index and moves a table to faster storage; no application query changes. Which property made this possible?', options: ['Physical data independence', ['Logical data independence', 'The logical schema did not change.'], ['Referential integrity', 'Unrelated to storage.'], ['Atomicity', 'A transaction property.']], answer: 0, explanation: 'Changes at the internal level are hidden from the conceptual schema and applications.' }),
  mcq({ ...q(RB), id: 'dbms.rb.q3', type: 'concept', difficulty: 'easy', stem: 'Which statement about relations in the relational model is true?', options: ['Tuples have no inherent order', ['Tuples are stored in insertion order', 'Order is only defined by ORDER BY in a query.'], ['Duplicate tuples are allowed', 'A relation is a set; SQL tables are bags.'], ['Attributes are identified by position only', 'Attributes are identified by name.']], answer: 0, explanation: 'A relation is a set of tuples; neither row order nor duplicates exist in the theory.' }),
  mcq({ ...q(RB), id: 'dbms.rb.q4', type: 'concept', difficulty: 'medium', stem: 'Which DBMS capability prevents two simultaneous bookings from both taking the last seat?', options: ['Concurrency control through transactions and isolation', ['Data independence', 'Unrelated to simultaneous updates.'], ['Normalisation', 'Removes redundancy, not races.'], ['Views', 'Views restrict what users see.']], answer: 0, explanation: 'Isolation (with locks or MVCC plus constraints) serialises conflicting updates so the seat count cannot go negative.' }),
  mcq({ ...q(RB), id: 'dbms.rb.q5', type: 'concept', difficulty: 'medium', stem: 'A view `active_users` hides that the users table was split into users and profiles. Which property is this?', options: ['Logical data independence', ['Physical data independence', 'The logical schema changed, not the storage.'], ['Durability', 'A transaction property.'], ['Entity integrity', 'About primary keys.']], answer: 0, explanation: 'The external level (the view) shields applications from a change in the conceptual schema.' }),
  mcq({ ...q(RB), id: 'dbms.rb.q6', type: 'concept', difficulty: 'easy', stem: 'What is a domain in the relational model?', options: ['The set of allowed values for an attribute', ['The set of all tables', 'That is the database schema.'], ['The primary key of a relation', 'Keys are attributes, not value sets.'], ['The number of rows', 'That is cardinality.']], answer: 0, explanation: 'For example, the domain of age might be integers from 0 to 150.' }),
];

// ---------------------------------------------------------------------------------------
const ER = 'dbms.er-modelling';
const erModelling = dbmsTopic({
  id: ER, title: 'ER Modelling and Schema Design', level: 'core', estMinutes: 50, prerequisites: ['dbms.keys-constraints'], related: ['dbms.normalisation', 'sql.dml-ddl', 'sd.databases'],
  summary: 'Entities, relationships, cardinality, and turning a feature into tables.',
  objectives: ['Model a feature as entities, attributes and relationships with cardinality (1:1, 1:N, M:N) and participation.', 'Map an ER diagram to tables: foreign keys for 1:N, junction tables for M:N, and weak entities with composite keys.', 'Handle multivalued, composite and derived attributes correctly.', 'Design a schema for a typical interview prompt (library, food delivery, hotel booking) and justify each choice.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Building blocks', bodyMd: `- **Entity set:** a kind of thing with independent existence (Customer, Restaurant, Order).
- **Attribute:** a property. *Composite* (address → street, city), *multivalued* (phone numbers), *derived* (age from date of birth), *key* (underlined).
- **Relationship set:** an association between entities (Customer *places* Order). It can have its own attributes (Enrolment has a grade).
- **Cardinality ratio:** how many entities on each side may participate: **1:1**, **1:N**, **M:N**.
- **Participation:** **total** (every Order must have a Customer) or **partial** (a Customer may have no Orders).
- **Weak entity:** cannot be identified by its own attributes alone; it depends on an owner (an OrderItem identified by (order_id, line_no)). Its key is the owner's key + a partial key.
- **Specialisation/generalisation:** Payment specialised into CardPayment and UpiPayment (ISA).` },
    { id: 'mapping', kind: 'example', title: 'ER to tables', bodyMd: `| ER construct | Tables |
|---|---|
| Strong entity | one table; key → PRIMARY KEY |
| 1:N relationship | FK on the **N** side (orders.customer_id → customers.id) |
| 1:1 relationship | FK on either side with UNIQUE (prefer the side with total participation) |
| M:N relationship | **junction table** with both FKs; PK = (fk1, fk2) or a surrogate id + UNIQUE(fk1, fk2); relationship attributes live here |
| Weak entity | table with the owner FK in its PK: (order_id, line_no), ON DELETE CASCADE |
| Multivalued attribute | separate table (customer_phones(customer_id, phone)) |
| Composite attribute | flatten into columns (street, city, pincode) |
| Derived attribute | usually not stored; compute it (or store it deliberately for performance) |
| ISA hierarchy | one table per subclass with a shared PK, a single table with a type column, or one table per concrete class |

**Example: food delivery.** customers(id, name), restaurants(id, name, city), menu_items(id, restaurant_id → restaurants, name, price), orders(id, customer_id → customers, restaurant_id → restaurants, placed_at, status), order_items(order_id → orders, menu_item_id → menu_items, qty, price_at_order, PK(order_id, menu_item_id)). Storing **price_at_order** keeps old orders correct after a menu price change.` },
    { id: 'comparison', kind: 'comparison', title: 'Design choices interviewers probe', bodyMd: `| Question | Typical answer |
|---|---|
| Where does a 1:N FK go? | On the many side. |
| How do you model tags on posts? | posts, tags, post_tags(post_id, tag_id) junction table. |
| Store a computed total on orders? | Optional denormalisation: faster reads, but it must be kept consistent (transaction or trigger). |
| Soft delete or hard delete? | Soft delete (deleted_at) keeps history and references valid; queries must filter it. |
| One table per user type or one table with a role column? | One users table with roles when the attributes mostly overlap; subtype tables when they differ a lot. |
| Enum column or lookup table? | Lookup table when values change or carry attributes; CHECK/enum for a small fixed set. |` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. **Putting the FK on the wrong side** of a 1:N relationship (customer.order_id would allow only one order).
2. **Comma-separated lists in a column** instead of a junction table (violates 1NF; cannot be indexed or joined properly).
3. **Forgetting relationship attributes** (quantity, grade, role) that belong on the junction table.
4. **Losing history** by referencing mutable data (current price) instead of copying it at the time of the event.
5. **Modelling an attribute as an entity** or vice versa without a reason (a city with no other attributes can be a column).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you implement a many-to-many relationship?', answerMd: 'With a junction (associative) table holding foreign keys to both entities, a composite primary key or unique constraint on the pair, and any attributes of the relationship itself (for example quantity or enrolled_on).' },
    { id: 'iq2', q: 'What is a weak entity? Give an example.', answerMd: 'An entity that cannot be uniquely identified by its own attributes and depends on an owner entity. OrderLine(order_id, line_no, …): line_no is unique only within an order, so the key is (order_id, line_no), and lines are deleted with their order.' },
    { id: 'iq3', q: 'Design the tables for a library (books, copies, members, loans).', answerMd: 'books(isbn PK, title, …), copies(id PK, isbn FK, shelf) since one book has many physical copies, members(id PK, name, …), loans(id PK, copy_id FK, member_id FK, borrowed_on, due_on, returned_on NULL). Constraint: at most one open loan per copy (a partial unique index where supported, or enforced in a transaction).' },
    { id: 'iq4', q: 'Why store price_at_order in order items instead of joining to the current price?', answerMd: 'Prices change. The order must reflect what the customer was charged, so the price is copied at order time. This is intentional redundancy that records history, not a normalisation mistake.' },
    { id: 'iq5', q: 'Where does the foreign key go in a 1:1 relationship?', answerMd: 'On either side with a UNIQUE constraint; usually on the side with total participation or the one that is optional/extension data (user_profiles.user_id UNIQUE referencing users.id), or the two can share the same primary key.' },
  ],
  revision: { notesMd: `- Entities, attributes (composite, multivalued, derived, key), relationships with cardinality and participation.
- 1:N → FK on the N side; M:N → junction table; 1:1 → FK + UNIQUE.
- Weak entity → owner key + partial key, cascade delete.
- Multivalued attribute → own table.
- Copy values that must stay historical (price at order time).`, flashcards: [
    { id: 'f1', front: '1:N relationship: where is the foreign key?', backMd: 'On the "many" side.' },
    { id: 'f2', front: 'How is M:N mapped?', backMd: 'A junction table with both foreign keys (and the relationship attributes).' },
    { id: 'f3', front: 'Weak entity key?', backMd: 'Owner\'s key + partial key (e.g. order_id, line_no).' },
    { id: 'f4', front: 'Total participation?', backMd: 'Every entity must take part in the relationship (e.g. every order has a customer: NOT NULL FK).' },
    { id: 'f5', front: 'Multivalued attribute mapping?', backMd: 'A separate table (owner_id, value).' },
  ] },
  resources: [DBBOOK, { title: 'Entity-relationship model (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Entity%E2%80%93relationship_model', kind: 'article' }],
});

const erMcqs: MCQ[] = [
  mcq({ ...q(ER), id: 'dbms.er.q1', type: 'design', difficulty: 'easy', stem: 'A customer can place many orders; each order belongs to one customer. Where does the foreign key go?', options: ['orders.customer_id → customers.id', ['customers.order_id → orders.id', 'That allows only one order per customer.'], ['A junction table customer_orders', 'Only needed for many-to-many.'], ['Both tables reference each other', 'Redundant and hard to keep consistent.']], answer: 0, explanation: 'In a 1:N relationship the many side holds the reference.' }),
  mcq({ ...q(ER), id: 'dbms.er.q2', type: 'design', difficulty: 'easy', stem: 'Students enrol in many courses and courses have many students; each enrolment has a grade. How do you model it?', options: ['A junction table enrolments(student_id, course_id, grade) with PK (student_id, course_id)', ['A course_ids column in students holding "1,4,7"', 'Violates 1NF and cannot be joined or constrained.'], ['A student_id column in courses', 'Allows one student per course.'], ['Put grade in the students table', 'A student has a different grade per course.']], answer: 0, explanation: 'M:N relationships become a table; attributes of the relationship (grade) live there.' }),
  mcq({ ...q(ER), id: 'dbms.er.q3', type: 'concept', difficulty: 'medium', stem: 'Hotel rooms are numbered 101, 102, … within each hotel. Room is therefore…', options: ['A weak entity identified by (hotel_id, room_number)', ['A strong entity with key room_number', 'Room 101 exists in many hotels.'], ['A multivalued attribute of hotel', 'Rooms have their own attributes (type, price).'], ['A derived attribute', 'Rooms are stored, not computed.']], answer: 0, explanation: 'The partial key room_number is unique only together with the owner hotel.' }),
  mcq({ ...q(ER), id: 'dbms.er.q4', type: 'design', difficulty: 'medium', stem: 'Why should order_items store the item price at order time rather than always joining to menu_items.price?', options: ['Prices change, and past orders must show what was actually charged', ['Joins are not allowed between these tables', 'They are allowed.'], ['To satisfy BCNF', 'It is deliberate historical data, not a normal-form rule.'], ['Prices are always NULL in menu_items', 'Not the case.']], answer: 0, explanation: 'Event data captures the values at the time of the event.' }),
  mcq({ ...q(ER), id: 'dbms.er.q5', type: 'concept', difficulty: 'easy', stem: 'A user can have several phone numbers. How is this multivalued attribute mapped?', options: ['A separate table user_phones(user_id, phone)', ['Columns phone1, phone2, phone3', 'Arbitrary limit and many NULLs.'], ['A comma-separated phones column', 'Violates 1NF.'], ['It cannot be represented', 'A separate table represents it.']], answer: 0, explanation: 'Each value becomes a row referencing the owner; add UNIQUE(user_id, phone).' }),
  mcq({ ...q(ER), id: 'dbms.er.q6', type: 'concept', difficulty: 'medium', stem: 'Every order must have exactly one customer. In ER terms, the participation of Order in the Places relationship is…', options: ['Total, enforced with a NOT NULL foreign key', ['Partial', 'Partial would allow orders without a customer.'], ['Many-to-many', 'That is a cardinality ratio, not participation.'], ['Weak', 'Orders have their own key.']], answer: 0, explanation: 'Total participation means every entity takes part; in tables it becomes NOT NULL on the FK.' }),
];

// ---------------------------------------------------------------------------------------
const RA = 'dbms.relational-algebra';
const algebra = dbmsTopic({
  id: RA, title: 'Relational Algebra', level: 'core', estMinutes: 45, prerequisites: ['dbms.relational-basics'], related: ['sql.joins', 'sql.set-operations', 'sql.patterns', 'dbms.query-processing'],
  summary: 'σ, π, joins and division at OA-MCQ depth.',
  objectives: ['Apply selection σ, projection π, rename ρ, union, difference, intersection and Cartesian product, and give each one\'s SQL equivalent.', 'Compute the number of tuples produced by products, joins and projections for small inputs.', 'Distinguish natural join, theta join, equi-join, outer joins and semi-joins.', 'Express "for all" queries with division (÷) and its SQL equivalents.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Operators and SQL equivalents', bodyMd: `| Operator | Symbol | SQL | Note |
|---|---|---|---|
| Selection | σ_cond(R) | WHERE | filters rows; cardinality ≤ |R| |
| Projection | π_A,B(R) | SELECT DISTINCT A, B | removes duplicates (relations are sets) |
| Rename | ρ_S(R) | AS | |
| Union | R ∪ S | UNION | union-compatible: same degree and domains |
| Difference | R − S | EXCEPT | not commutative |
| Intersection | R ∩ S | INTERSECT | = R − (R − S) |
| Cartesian product | R × S | CROSS JOIN | |R| · |S| rows, degree adds up |
| Theta join | R ⋈_θ S | JOIN … ON θ | = σ_θ(R × S) |
| Natural join | R ⋈ S | NATURAL JOIN | equality on all common attributes, common columns appear once |
| Division | R ÷ S | double NOT EXISTS / GROUP BY … HAVING COUNT | "for all" |

**Basic (primitive) set:** σ, π, ∪, −, ×, ρ. The others can be derived from them: ∩ via difference, joins via σ over ×, division via π, ×, −.

**Relational algebra is procedural** (it says which operations to apply in which order), while relational calculus and SQL are **declarative**. Query optimisers rewrite algebra expressions (push selections down, reorder joins).` },
    { id: 'counting', kind: 'example', title: 'Counting tuples (a favourite OA question)', bodyMd: `R has 3 tuples, S has 4.
- R × S: 12 tuples.
- R ⋈ S (natural join): between 0 and 12, depending on matching values.
- If the common attribute is a key of S and a foreign key in R (every R tuple matches exactly one S tuple), R ⋈ S has exactly |R| = 3 tuples.
- R ∪ S (union-compatible): between max(3, 4) = 4 and 7.
- R − S: between 0 and 3. R ∩ S: between 0 and 3.
- π_A(R): between 1 and 3 (duplicates removed).

**Division example.** Enrolled(student, course) ÷ Courses(course) returns the students enrolled in **every** course. If Courses = {db, os} and Enrolled = {(ana, db), (ana, os), (bo, db)}, the result is {ana}.

**Outer joins** keep unmatched tuples padded with NULLs (⟕ left, ⟖ right, ⟗ full). **Semi-join** R ⋉ S keeps tuples of R that have a match in S (SQL EXISTS); **anti-join** keeps those without (NOT EXISTS).` },
    { id: 'comparison', kind: 'comparison', title: 'Equivalence rules the optimiser uses', bodyMd: `- σ_c1∧c2(R) = σ_c1(σ_c2(R)) (cascade of selections).
- σ commutes with ⋈ when its condition refers to one side only: σ_c(R ⋈ S) = σ_c(R) ⋈ S. **Push selections down** to shrink inputs early.
- π can be pushed down too, keeping only the attributes needed above.
- ⋈ is commutative and associative: R ⋈ S ⋈ T can be evaluated in any order; the cost differs hugely, which is why join ordering matters.
- R − S ≠ S − R; R × S ≠ S × R as tuples (attribute order differs) but is equivalent up to reordering columns.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Forgetting that π removes duplicates (unlike SELECT without DISTINCT).
2. Assuming natural join on attributes with the same name but different meaning (two tables both having a "name" column).
3. Computing |R × S| as |R| + |S|.
4. Thinking difference is commutative.
5. Using a plain join for "for all" questions instead of division.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is the difference between a natural join and an equi-join?', answerMd: 'An equi-join compares specified columns with = and keeps both copies of the compared columns. A natural join automatically equates all columns with the same name and keeps one copy of each. Natural joins are risky in SQL because adding a same-named column changes the join.' },
    { id: 'iq2', q: 'Express "students enrolled in every course" in relational algebra and SQL.', answerMd: 'Algebra: Enrolled(student, course) ÷ π_course(Courses). SQL: SELECT student FROM enrolled GROUP BY student HAVING COUNT(DISTINCT course) = (SELECT COUNT(*) FROM courses), or a double NOT EXISTS ("there is no course the student is not enrolled in").' },
    { id: 'iq3', q: 'Which relational algebra operators are fundamental?', answerMd: 'Selection, projection, union, set difference, Cartesian product and rename. Intersection, the joins and division can be expressed with them.' },
    { id: 'iq4', q: 'Why does the optimiser push selections below joins?', answerMd: 'Filtering early reduces the number of tuples that reach the join, which is usually the most expensive operator. σ_c(R ⋈ S) = σ_c(R) ⋈ S when c involves only R.' },
  ],
  revision: { notesMd: `- σ = WHERE, π = SELECT DISTINCT, ρ = AS, ∪/−/∩ = UNION/EXCEPT/INTERSECT, × = CROSS JOIN.
- Fundamental: σ, π, ∪, −, ×, ρ.
- |R × S| = |R|·|S|; natural join 0..|R|·|S|; FK→key join = |R|.
- Division ÷ = "for all"; SQL via HAVING COUNT(DISTINCT) or double NOT EXISTS.
- Push selections and projections down.`, flashcards: [
    { id: 'f1', front: 'SQL equivalent of projection π?', backMd: 'SELECT DISTINCT on the listed attributes.' },
    { id: 'f2', front: '|R × S| when |R| = 5 and |S| = 6?', backMd: '30.' },
    { id: 'f3', front: 'Which operator answers "for all" questions?', backMd: 'Division (÷).' },
    { id: 'f4', front: 'Union compatibility?', backMd: 'Same number of attributes with compatible domains.' },
    { id: 'f5', front: 'Semi-join in SQL?', backMd: 'WHERE EXISTS (correlated subquery).' },
  ] },
  resources: [DBBOOK, { title: 'Relational algebra (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Relational_algebra', kind: 'article' }],
});

const raMcqs: MCQ[] = [
  mcq({ ...q(RA), id: 'dbms.ra.q1', type: 'concept', difficulty: 'easy', stem: 'R has 5 tuples and S has 6. How many tuples are in R × S?', options: ['30', ['11', 'That is a sum; the product pairs every tuple of R with every tuple of S.'], ['6', 'That is max(|R|, |S|).'], ['Between 0 and 30', 'That range describes a natural join, not a product.']], answer: 0, explanation: 'Each of the 5 tuples pairs with each of the 6: 5 × 6.' }),
  mcq({ ...q(RA), id: 'dbms.ra.q2', type: 'concept', difficulty: 'medium', stem: 'Orders(order_id, cust_id) has 100 tuples; cust_id is a foreign key to Customers(cust_id), the key of Customers (40 tuples), and is never NULL. How many tuples does Orders ⋈ Customers have?', options: ['100', ['4000', 'That is the Cartesian product.'], ['40', 'Every order matches exactly one customer, so the order count is preserved.'], ['Between 0 and 4000', 'The FK guarantees exactly one match per order.']], answer: 0, explanation: 'Each order joins with exactly one customer, so the result has one tuple per order.' }),
  mcq({ ...q(RA), id: 'dbms.ra.q3', type: 'concept', difficulty: 'medium', stem: 'Enrolled = {(ana, db), (ana, os), (bo, db), (cy, os), (cy, db)} and Courses = {db, os}. What is Enrolled ÷ Courses?', options: ['{ana, cy}', ['{ana}', 'cy is enrolled in both db and os.'], ['{ana, bo, cy}', 'bo is missing os.'], ['{db, os}', 'Division returns students, not courses.']], answer: 0, explanation: 'Division keeps the students paired with every course in the divisor.' }),
  mcq({ ...q(RA), id: 'dbms.ra.q4', type: 'concept', difficulty: 'easy', stem: 'Which relational algebra operator corresponds to SQL\'s WHERE clause?', options: ['Selection σ', ['Projection π', 'Projection corresponds to the SELECT list.'], ['Rename ρ', 'Rename corresponds to AS.'], ['Product ×', 'Product corresponds to CROSS JOIN.']], answer: 0, explanation: 'σ_condition(R) keeps the tuples that satisfy the condition.' }),
  mcq({ ...q(RA), id: 'dbms.ra.q5', type: 'concept', difficulty: 'medium', stem: 'R(A, B) has tuples (1, x), (2, x), (3, y). How many tuples does π_B(R) contain?', options: ['2', ['3', 'Projection removes duplicates in relational algebra.'], ['1', 'There are two distinct B values.'], ['6', 'Projection does not multiply tuples.']], answer: 0, explanation: 'π_B gives {x, y}. SQL\'s SELECT B without DISTINCT would return 3 rows.' }),
  mcq({ ...q(RA), id: 'dbms.ra.q6', type: 'concept', difficulty: 'medium', stem: 'Which equivalence lets the optimiser filter early?', options: ['σ_c(R ⋈ S) = σ_c(R) ⋈ S when c refers only to attributes of R', ['R − S = S − R', 'Difference is not commutative.'], ['π_A(R ∪ S) = π_A(R) − π_A(S)', 'Not an equivalence.'], ['R × S = R ⋈ S always', 'Only when R and S share no attributes.']], answer: 0, explanation: 'Pushing selections below joins shrinks the join inputs.' }),
];

// ---------------------------------------------------------------------------------------
const SR = 'dbms.serialisability';
const serialisability = dbmsTopic({
  id: SR, title: 'Schedules and Serialisability', level: 'core', estMinutes: 55, prerequisites: ['dbms.transactions-acid'], related: ['dbms.isolation-concurrency', 'dbms.deadlocks', 'dbms.transactions-acid'],
  summary: 'Precedence graphs, conflict serialisability and recoverability.',
  objectives: ['Identify conflicting operations (different transactions, same item, at least one write).', 'Draw the precedence graph and decide conflict serialisability; give an equivalent serial order.', 'Explain view serialisability and blind writes, and why conflict ⊂ view serialisable.', 'Classify schedules as recoverable, cascadeless or strict, and relate strict 2PL to them.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Schedules and conflicts', bodyMd: `A **schedule** interleaves the operations of several transactions, keeping each transaction's own order. Notation: R1(A) = T1 reads A, W2(B) = T2 writes B, C1 = T1 commits.

A schedule is **serial** if transactions run one after another with no interleaving; serial schedules are always correct. A schedule is **serialisable** if it is equivalent to some serial schedule.

Two operations **conflict** if they belong to **different transactions**, access the **same item**, and **at least one is a write**: R-W, W-R or W-W. Swapping two adjacent non-conflicting operations does not change the outcome; swapping conflicting ones can.

**Conflict serialisable:** can be turned into a serial schedule by swapping non-conflicting adjacent operations. Test: build the **precedence graph** (a node per transaction, an edge Ti → Tj for each conflict where Ti's operation comes first). The schedule is conflict serialisable **iff the graph is acyclic**; any topological order is an equivalent serial order.` },
    { id: 'dry-run', kind: 'dry-run', title: 'Worked example', bodyMd: `S = R1(A) R2(A) W1(A) W2(A) (the lost-update schedule).

Conflicts: R1(A) before W2(A) → T1 → T2; R2(A) before W1(A) → T2 → T1; W1(A) before W2(A) → T1 → T2.

The graph has edges T1 → T2 and T2 → T1: a cycle, so S is **not** conflict serialisable. Indeed, both read the old A and the second write overwrites the first update.

S' = R1(A) W1(A) R2(A) W2(A) R1(B) W1(B) R2(B) W2(B): every conflict goes T1 → T2, so S' is conflict serialisable and equivalent to T1 then T2.

Try your own schedules in **Tools → Schedule analyser**.` },
    { id: 'view', kind: 'concept', title: 'View serialisability and recoverability', bodyMd: `**View equivalence** requires the same reads-from relationships (each read sees the value written by the same transaction, or the initial value) and the same final writer of each item. Every conflict-serialisable schedule is view serialisable, but not vice versa: **blind writes** (writes without a prior read) create view-serialisable schedules with cyclic precedence graphs, e.g. R1(A) W2(A) W1(A) W3(A) is view-equivalent to T1, T2, T3. Testing view serialisability is NP-complete, so real systems enforce conflict serialisability.

**Recoverability** (about commits and aborts):
| Class | Rule | Prevents |
|---|---|---|
| Recoverable | if Tj reads from Ti, Ti commits before Tj commits | committing on data that may be rolled back |
| Cascadeless (ACA) | transactions read only committed data | cascading aborts |
| Strict | no read **or write** of an item until the last writer commits or aborts | needed for simple undo with before-images |

Strict ⊂ cascadeless ⊂ recoverable. **Strict two-phase locking** (hold write locks until commit) produces schedules that are both conflict serialisable and strict.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Counting R-R pairs as conflicts (two reads never conflict).
2. Adding edges between operations of the same transaction.
3. Drawing the edge in the wrong direction (it goes from the earlier operation's transaction to the later one's).
4. Thinking "not conflict serialisable" means "not serialisable" (it may still be view serialisable).
5. Confusing serialisability (about interleaving) with recoverability (about commit order).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How do you test whether a schedule is conflict serialisable?', answerMd: 'Build the precedence graph: one node per transaction and an edge Ti → Tj whenever an operation of Ti conflicts with a later operation of Tj (same item, different transactions, at least one write). The schedule is conflict serialisable iff the graph has no cycle; a topological sort gives an equivalent serial order.' },
    { id: 'iq2', q: 'What is the difference between conflict and view serialisability?', answerMd: 'Conflict serialisability requires the schedule to be transformable into a serial one by swapping non-conflicting operations (acyclic precedence graph). View serialisability requires only the same reads-from relation and final writes as some serial schedule. View is more permissive (blind writes) but NP-complete to test.' },
    { id: 'iq3', q: 'What is a cascading abort, and how do you prevent it?', answerMd: 'If T2 read data written by T1 and T1 aborts, T2 must also abort (and anyone who read from T2, and so on). Cascadeless schedules prevent this by only allowing reads of committed data, which strict 2PL guarantees by holding write locks until commit.' },
    { id: 'iq4', q: 'Is every serial schedule recoverable?', answerMd: 'Yes. In a serial schedule a transaction finishes (commits or aborts) before the next one starts, so nobody reads uncommitted data: serial schedules are strict, hence cascadeless and recoverable.' },
    { id: 'iq5', q: 'Give a schedule that is recoverable but not cascadeless.', answerMd: 'W1(A) R2(A) C1 C2: T2 reads A before T1 commits (a dirty read, so not cascadeless), but T1 commits before T2 does (recoverable).' },
  ],
  revision: { notesMd: `- Conflict: different transactions, same item, at least one write.
- Precedence graph edge Ti → Tj for each conflict with Ti first; acyclic ⇔ conflict serialisable.
- Conflict ⊂ view serialisable; difference = blind writes; view test NP-complete.
- Recoverable: writer commits before reader commits. Cascadeless: read only committed data. Strict: no read/write of uncommitted writes.
- Strict 2PL ⇒ conflict serialisable + strict.`, flashcards: [
    { id: 'f1', front: 'When do two operations conflict?', backMd: 'Different transactions, same data item, at least one is a write.' },
    { id: 'f2', front: 'Test for conflict serialisability?', backMd: 'The precedence graph is acyclic.' },
    { id: 'f3', front: 'What makes a schedule view but not conflict serialisable?', backMd: 'Blind writes.' },
    { id: 'f4', front: 'Recoverable schedule rule?', backMd: 'If Tj reads from Ti, Ti commits before Tj commits.' },
    { id: 'f5', front: 'Order of the recoverability classes?', backMd: 'Strict ⊂ cascadeless ⊂ recoverable.' },
  ] },
  resources: [DBBOOK, CMU, { title: 'Serializability (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Serializability', kind: 'article' }],
});

const srMcqs: MCQ[] = [
  mcq({ ...q(SR), id: 'dbms.sr.q1', type: 'concept', difficulty: 'easy', stem: 'Which pair of operations conflicts?', options: ['R1(A) and W2(A)', ['R1(A) and R2(A)', 'Two reads never conflict.'], ['R1(A) and W1(A)', 'Same transaction.'], ['W1(A) and W2(B)', 'Different items.']], answer: 0, explanation: 'Different transactions, same item, and one of them writes.' }),
  mcq({ ...q(SR), id: 'dbms.sr.q2', type: 'scenario', difficulty: 'medium', stem: 'Is S = R1(A) R2(A) W1(A) W2(A) conflict serialisable?', options: ['No: the precedence graph has edges T1 → T2 and T2 → T1', ['Yes, equivalent to T1 then T2', 'R2(A) before W1(A) forces T2 before T1.'], ['Yes, equivalent to T2 then T1', 'R1(A) before W2(A) forces T1 before T2.'], ['It cannot be determined without commits', 'Serialisability does not depend on commits.']], answer: 0, explanation: 'This is the lost-update pattern; the cycle proves no equivalent serial order exists.' }),
  mcq({ ...q(SR), id: 'dbms.sr.q3', type: 'scenario', difficulty: 'medium', stem: 'For S = R1(A) W1(A) R2(A) W2(A) R1(B) W1(B) R2(B) W2(B), what is the equivalent serial order?', options: ['T1 → T2', ['T2 → T1', 'Every conflict has T1\'s operation first.'], ['Not serialisable', 'The graph has only the edge T1 → T2.'], ['Either order', 'Only T1 → T2 respects all conflicts.']], answer: 0, explanation: 'All conflicts on A and on B go from T1 to T2, so the graph is acyclic with the single edge T1 → T2.' }),
  mcq({ ...q(SR), id: 'dbms.sr.q4', type: 'concept', difficulty: 'hard', stem: 'S = R1(A) W2(A) W1(A) W3(A). Which statement is correct?', options: ['It is view serialisable (as T1, T2, T3) but not conflict serialisable', ['It is conflict serialisable', 'R1(A)–W2(A) gives T1 → T2 and W2(A)–W1(A) gives T2 → T1: a cycle.'], ['It is neither', 'T1, T2, T3 has the same reads-from and the same final writer (T3).'], ['It is serial', 'The operations interleave.']], answer: 0, explanation: 'Blind writes by T2 and T3: T1 reads the initial A in both schedules and T3 writes A last in both, so they are view equivalent.' }),
  mcq({ ...q(SR), id: 'dbms.sr.q5', type: 'scenario', difficulty: 'medium', stem: 'W1(A) R2(A) C2 C1: which property does this schedule violate?', options: ['Recoverability: T2 commits after reading from T1, but before T1 commits', ['Conflict serialisability', 'Its precedence graph is just T1 → T2.'], ['Atomicity of T1', 'T1 itself is atomic; the problem is T2\'s commit.'], ['Nothing', 'If T1 later aborted, the committed T2 would have used a value that never existed.']], answer: 0, explanation: 'A recoverable schedule requires T1 to commit before T2 commits.' }),
  mcq({ ...q(SR), id: 'dbms.sr.q6', type: 'scenario', difficulty: 'medium', stem: 'W1(A) R2(A) C1 C2 is…', options: ['Recoverable but not cascadeless', ['Cascadeless', 'T2 reads A before T1 commits.'], ['Not recoverable', 'T1 commits before T2.'], ['Strict', 'Strict implies cascadeless.']], answer: 0, explanation: 'Commit order is fine (recoverable), but the dirty read means an abort of T1 would cascade to T2.' }),
  mcq({ ...q(SR), id: 'dbms.sr.q7', type: 'concept', difficulty: 'medium', stem: 'Why do real systems enforce conflict serialisability rather than view serialisability?', options: ['Testing view serialisability is NP-complete, while conflict serialisability is enforced cheaply (2PL, precedence graphs)', ['View serialisable schedules are incorrect', 'They are correct.'], ['Conflict serialisability allows more schedules', 'It allows fewer.'], ['View serialisability ignores writes', 'It considers reads-from and final writes.']], answer: 0, explanation: 'Locking protocols like strict 2PL guarantee conflict serialisability without analysing schedules.' }),
];

// ---------------------------------------------------------------------------------------
const DL = 'dbms.deadlocks';
const deadlocks = dbmsTopic({
  id: DL, title: 'Deadlocks in Databases', level: 'core', estMinutes: 40, prerequisites: ['dbms.isolation-concurrency'], related: ['os.deadlocks', 'dbms.isolation-concurrency', 'dbms.serialisability'],
  summary: 'How they arise, detection with wait-for graphs, and prevention.',
  objectives: ['Explain how lock-based concurrency control leads to deadlocks, with a two-transaction example.', 'Detect deadlocks with a wait-for graph and describe victim selection.', 'Compare prevention schemes (wait-die, wound-wait, lock ordering, timeouts).', 'Write application code that handles deadlock errors by retrying, and reduce deadlock frequency.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'How deadlocks happen', bodyMd: `With two-phase locking, a transaction acquires locks as it goes and holds them (until commit in strict 2PL). Two transactions that lock the same rows in **opposite orders** can wait for each other forever:

| Time | T1 | T2 |
|---|---|---|
| 1 | UPDATE accounts … WHERE id = 1 (X-lock row 1) | |
| 2 | | UPDATE accounts … WHERE id = 2 (X-lock row 2) |
| 3 | UPDATE … WHERE id = 2 → **waits** for T2 | |
| 4 | | UPDATE … WHERE id = 1 → **waits** for T1 |

All four Coffman conditions hold: mutual exclusion (exclusive locks), hold and wait, no preemption, circular wait.

Databases cannot assume applications are careful, so they **detect** deadlocks: maintain a **wait-for graph** (Ti → Tj when Ti waits for a lock Tj holds) and look for a cycle. When one is found, a **victim** is rolled back (InnoDB picks the transaction with the fewest rows modified; others consider age or work done) and gets an error such as MySQL error 1213 "Deadlock found when trying to get lock; try restarting transaction".` },
    { id: 'prevention', kind: 'comparison', title: 'Prevention schemes', bodyMd: `Timestamp-based schemes give each transaction a start timestamp (older = smaller). When Ti requests a lock held by Tj:

| Scheme | If Ti is older | If Ti is younger | Note |
|---|---|---|---|
| **Wait-die** (non-preemptive) | Ti waits | Ti dies (aborts, restarts with the same timestamp) | old transactions wait for young ones |
| **Wound-wait** (preemptive) | Ti wounds Tj (Tj aborts) | Ti waits | young transactions wait for old ones |

Both avoid cycles because waits only go in one direction of age, and restarting with the original timestamp prevents starvation.

Other approaches:
- **Lock ordering:** always lock rows in a global order (by primary key). Two transfers then lock min(id) first, so no cycle forms.
- **Timeouts:** abort a transaction that waits too long (simple, but may abort non-deadlocked transactions and is slow to react).
- **Lower contention:** short transactions, fewer rows locked, indexes on WHERE columns (so locking reads lock only the matching rows, not whole ranges).` },
    { id: 'example', kind: 'example', title: 'Handling deadlocks in application code', bodyMd: `Deadlocks are normal in busy OLTP systems. The application should:

1. Keep transactions short and lock rows in a consistent order:

\`\`\`sql
-- transfer between accounts 7 and 3: lock the smaller id first
SELECT * FROM accounts WHERE id IN (3, 7) ORDER BY id FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE id = 7;
UPDATE accounts SET balance = balance + 100 WHERE id = 3;
COMMIT;
\`\`\`

2. **Retry** the whole transaction when the database reports a deadlock (with a small random backoff and a retry limit). The victim's work was rolled back, so a retry is safe if the transaction is idempotent from the application's point of view.

3. Monitor: MySQL \`SHOW ENGINE INNODB STATUS\` shows the latest detected deadlock; PostgreSQL logs deadlocks with both queries.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Thinking deadlocks are bugs in the database; they are a consequence of locking, and applications must retry.
2. Confusing wait-die and wound-wait (in wait-die the **old** waits; in wound-wait the **old** wounds).
3. Restarting an aborted transaction with a **new** timestamp in these schemes, which can starve it.
4. Long transactions that hold locks while calling external services.
5. Missing indexes, so UPDATE … WHERE locks far more rows than needed.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How does a database detect deadlocks?', answerMd: 'It maintains a wait-for graph with an edge Ti → Tj when Ti waits for a lock held by Tj, and checks for cycles (on each wait or periodically). On a cycle it chooses a victim, rolls it back and returns a deadlock error so the application can retry.' },
    { id: 'iq2', q: 'Explain wait-die and wound-wait.', answerMd: 'Both use transaction timestamps. Wait-die: an older requester waits, a younger requester aborts (dies). Wound-wait: an older requester forces the younger holder to abort (wounds it), a younger requester waits. Waits go only one way in age, so no cycle forms; restarted transactions keep their original timestamp to avoid starvation.' },
    { id: 'iq3', q: 'Two concurrent money transfers deadlock. How do you fix it?', answerMd: 'Acquire locks in a consistent order, e.g. lock both account rows with SELECT … FOR UPDATE ordered by id before updating; keep the transaction short; and retry on deadlock errors with backoff as a safety net.' },
    { id: 'iq4', q: 'Deadlock vs lock wait timeout?', answerMd: 'A deadlock is a cycle in which no transaction can ever proceed; it is detected immediately and a victim is rolled back. A lock wait timeout fires when a transaction waits longer than a limit for a lock held by a transaction that is merely slow (for example a long-running or forgotten open transaction).' },
  ],
  revision: { notesMd: `- Deadlock = cycle of lock waits; Coffman conditions all hold under locking.
- Detection: wait-for graph cycle → roll back a victim → app retries.
- Wait-die: old waits, young dies. Wound-wait: old wounds young, young waits. Keep original timestamps.
- Prevention in apps: consistent lock order, short transactions, indexes, retries with backoff.`, flashcards: [
    { id: 'f1', front: 'Wait-for graph edge Ti → Tj means?', backMd: 'Ti is waiting for a lock held by Tj.' },
    { id: 'f2', front: 'Wait-die: what happens to a younger requester?', backMd: 'It aborts (dies) and restarts later with the same timestamp.' },
    { id: 'f3', front: 'Wound-wait: what does an older requester do?', backMd: 'It wounds (aborts) the younger lock holder.' },
    { id: 'f4', front: 'Simplest application-level deadlock prevention?', backMd: 'Lock rows in a consistent global order (e.g. by primary key).' },
    { id: 'f5', front: 'What should an app do on a deadlock error?', backMd: 'Retry the whole transaction (with backoff and a limit).' },
  ] },
  resources: [DBBOOK, CMU, { title: 'Explicit locking: deadlocks (PostgreSQL docs)', url: 'https://www.postgresql.org/docs/current/explicit-locking.html', kind: 'official-docs' }],
});

const dlMcqs: MCQ[] = [
  mcq({ ...q(DL), id: 'dbms.dl.q1', type: 'scenario', difficulty: 'easy', stem: 'T1 locks row 1 then requests row 2; T2 locks row 2 then requests row 1. What happens in a database with deadlock detection?', options: ['A cycle is detected and one transaction is rolled back as the victim', ['Both wait forever', 'Detection breaks the cycle.'], ['Both commit', 'Neither can proceed until one releases its lock.'], ['The second request is silently ignored', 'Lock requests are never ignored.']], answer: 0, explanation: 'The wait-for graph has T1 → T2 → T1; the DBMS aborts one so the other can continue.' }),
  mcq({ ...q(DL), id: 'dbms.dl.q2', type: 'concept', difficulty: 'medium', stem: 'Under wait-die, an older transaction requests a lock held by a younger one. What happens?', options: ['The older transaction waits', ['The older transaction aborts', 'In wait-die only younger requesters die.'], ['The younger transaction is aborted', 'That is wound-wait.'], ['Both abort', 'Neither scheme aborts both.']], answer: 0, explanation: 'Wait-die: old waits for young; young requesting from old dies.' }),
  mcq({ ...q(DL), id: 'dbms.dl.q3', type: 'concept', difficulty: 'medium', stem: 'Under wound-wait, an older transaction requests a lock held by a younger one. What happens?', options: ['The younger holder is aborted (wounded) and the older one gets the lock', ['The older transaction waits', 'That is wait-die.'], ['The older transaction aborts', 'Old transactions are never aborted by younger ones here.'], ['The request is queued with a timeout', 'Timeouts are a different scheme.']], answer: 0, explanation: 'Preemptive: older transactions take priority.' }),
  mcq({ ...q(DL), id: 'dbms.dl.q4', type: 'scenario', difficulty: 'medium', stem: 'Money transfers between random account pairs deadlock under load. Which change prevents most of these deadlocks?', options: ['Always lock the two account rows in ascending id order', ['Use a lower isolation level', 'Updates still take exclusive row locks.'], ['Increase the lock wait timeout', 'Deadlocks are detected regardless of timeout.'], ['Run each UPDATE in its own transaction', 'That breaks atomicity of the transfer.']], answer: 0, explanation: 'A global lock order makes circular waits impossible between these transactions.' }),
  mcq({ ...q(DL), id: 'dbms.dl.q5', type: 'concept', difficulty: 'easy', stem: 'Why do timestamp schemes restart an aborted transaction with its ORIGINAL timestamp?', options: ['So it eventually becomes the oldest and cannot be starved', ['To make it younger', 'A new timestamp would make it younger.'], ['Because timestamps cannot change', 'They could; keeping them is a design choice.'], ['To detect deadlocks faster', 'The aim is fairness.']], answer: 0, explanation: 'An ever-older transaction eventually wins every conflict in either scheme.' }),
  mcq({ ...q(DL), id: 'dbms.dl.q6', type: 'scenario', difficulty: 'medium', stem: 'Your service receives MySQL error 1213 (deadlock) occasionally. What is the right response in code?', options: ['Retry the whole transaction with backoff, up to a limit', ['Ignore it; the transaction committed', 'The victim was rolled back.'], ['Retry only the last statement', 'Earlier statements were rolled back too.'], ['Switch to MyISAM to avoid locks', 'MyISAM has no transactions.']], answer: 0, explanation: 'The victim transaction is fully rolled back, so it must be re-executed from the start.' }),
];

export const topics: Topic[] = [relational, erModelling, algebra, serialisability, deadlocks];
export const mcqs: MCQ[] = [...rbMcqs, ...erMcqs, ...raMcqs, ...srMcqs, ...dlMcqs];
