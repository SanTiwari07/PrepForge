import type { MCQ, Topic } from '../schema';
import { java, javaErr, mcq } from '../helpers';
import { API, JLS, javaTopic, q } from './common';

// Java batch 3: generics, collections internals, memory and GC, nested classes and lambdas,
// SOLID and patterns. Output and compile-error questions are checked with javac/java; no
// question depends on HashMap iteration order, identity hash codes or GC timing.

// ---------------------------------------------------------------------------------------
const GE = 'java.generics';
const generics = javaTopic({
  id: GE, title: 'Generics', level: 'advanced', estMinutes: 50, prerequisites: ['java.abstract-interfaces'], related: ['java.collections-internals', 'cpp.templates', 'java.inner-lambdas'],
  summary: 'Type erasure, bounded types and wildcards (PECS).',
  objectives: ['Write generic classes and methods, and use bounded type parameters such as <T extends Comparable<? super T>>.', 'Explain type erasure and the restrictions it causes (no new T(), no generic arrays, no instanceof List<String>, overload clashes).', 'Apply PECS: ? extends for producers, ? super for consumers, and explain why generics are invariant while arrays are covariant.', 'Recognise raw types and heap pollution, and why the compiler warns about them.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Why generics, and the syntax', bodyMd: `Generics move type errors from run time (\`ClassCastException\`) to compile time and remove casts:

\`\`\`java
class Box<T> {                                   // generic class
    private T value;
    void set(T v) { value = v; }
    T get() { return value; }
}
static <T extends Comparable<T>> T max(T a, T b) { return a.compareTo(b) >= 0 ? a : b; }   // generic method

Box<String> b = new Box<>();                      // diamond: type argument inferred
String s = b.get();                               // no cast
\`\`\`

- Type arguments must be **reference types**: \`List<int>\` is illegal, use \`List<Integer>\` (autoboxing) or a primitive array/stream.
- **Bounded** parameters restrict and enable: \`<T extends Number>\` lets you call \`doubleValue()\` on a \`T\`. Multiple bounds: \`<T extends Number & Comparable<T>>\` (class first).
- The idiom \`<T extends Comparable<? super T>>\` also accepts types whose comparison is inherited from a supertype.` },
    { id: 'erasure', kind: 'concept', title: 'Type erasure and its consequences', bodyMd: `The compiler checks generic types, then **erases** them: \`T\` becomes its bound (\`Object\` if unbounded), and casts are inserted where values come out. At run time \`List<String>\` and \`List<Integer>\` are the same class, \`ArrayList\`.

Consequences you will be asked about:

| Not allowed | Why | Workaround |
|---|---|---|
| \`new T()\` | T is unknown at run time | pass a \`Supplier<T>\` or \`Class<T>\` |
| \`new T[n]\`, \`new List<String>[n]\` | arrays check element types at run time, generics cannot | use \`List<T>\`, or \`(T[]) new Object[n]\` internally |
| \`x instanceof List<String>\` | the type argument is gone | \`instanceof List<?>\` |
| \`print(List<String>)\` and \`print(List<Integer>)\` overloads | same erasure: name clash | different method names |
| \`static T field\` | one static field shared by all parameterisations | none |

Erasure was chosen for **backward compatibility** with pre-Java 5 code. **Raw types** (\`List\` with no argument) still compile with warnings and switch off checking, which can cause **heap pollution**: a \`List<String>\` that actually contains an \`Integer\`, failing later at a compiler-inserted cast.` },
    { id: 'wildcards', kind: 'concept', title: 'Invariance, wildcards and PECS', bodyMd: `Generics are **invariant**: \`List<Integer>\` is **not** a \`List<Number>\`, even though \`Integer\` is a \`Number\`. If it were, you could add a \`Double\` to a list of integers. (Arrays are covariant, \`Integer[]\` is an \`Object[]\`, and pay for it with \`ArrayStoreException\` at run time.)

Wildcards restore flexibility:

| Wildcard | You can read | You can add | Use when the parameter… |
|---|---|---|---|
| \`List<? extends Number>\` | \`Number\` | nothing (except \`null\`) | **produces** values (you read from it) |
| \`List<? super Integer>\` | \`Object\` | \`Integer\` | **consumes** values (you write to it) |
| \`List<?>\` | \`Object\` | nothing | you only need size, clear, etc. |

**PECS: Producer Extends, Consumer Super.** \`Collections.copy(List<? super T> dest, List<? extends T> src)\` is the textbook example.` },
    { id: 'code', kind: 'code', title: 'Bounded generic method, PECS and erasure', bodyMd: '`max` reads from a producer; `copy` moves values from a producer into a consumer.', code: [java(`
import java.util.*;

public class Main {
    static <T extends Comparable<? super T>> T max(List<? extends T> items) {
        T best = items.get(0);
        for (T x : items) if (x.compareTo(best) > 0) best = x;
        return best;
    }
    static <T> void copy(List<? super T> dest, List<? extends T> src) {
        for (T x : src) dest.add(x);
    }
    public static void main(String[] args) {
        List<Integer> ints = List.of(3, 9, 4);
        List<Number> nums = new ArrayList<>();
        copy(nums, ints);                  // Integer producer, Number consumer
        nums.add(2.5);
        System.out.println(max(ints) + " " + nums);
        System.out.println(new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass());
    }
}`, 'Java', '9 [3, 9, 4, 2.5]\ntrue')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and generics vs C++ templates', bodyMd: `1. Expecting \`List<Integer>\` to be passed where \`List<Number>\` is required (use \`List<? extends Number>\`).
2. Trying to add to a \`? extends\` list.
3. Using raw types to "make it compile", which hides real type errors until run time.
4. Overloading methods that differ only in type arguments.
5. Mixing arrays and generics (\`T[]\`, varargs of generic types): prefer lists.

**Java generics vs C++ templates:** C++ templates are instantiated per type at compile time (code is generated for \`vector<int>\` and \`vector<string>\` separately, primitives are fine, and \`T\` exists in the generated code). Java compiles a generic class once and erases the types, so there is one class at run time, no primitives, and no \`new T()\`. C++ templates are duck-typed until C++20 concepts; Java uses explicit bounds.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is type erasure?', answerMd: 'After type-checking, the compiler removes type arguments: type parameters are replaced by their bounds (Object if unbounded) and casts are inserted where values are read. At run time List<String> and List<Integer> are the same class. It was chosen so generic code stays compatible with pre-Java 5 bytecode and libraries.' },
    { id: 'iq2', q: 'Why can\'t you write new T() or new T[10]?', answerMd: 'Because T is erased, the JVM does not know which class to instantiate. Pass a Supplier<T> (e.g. ArrayList::new) or a Class<T> token and call getDeclaredConstructor().newInstance(). For arrays, use a List<T>, or create Object[] internally and cast, keeping the array private.' },
    { id: 'iq3', q: 'Explain PECS.', answerMd: 'Producer Extends, Consumer Super. If a parameter only supplies values to your method, declare it ? extends T so lists of any subtype work. If it only receives values, declare it ? super T so lists of any supertype work. Collections.copy(List<? super T> dest, List<? extends T> src) uses both.' },
    { id: 'iq4', q: 'Why is List<Integer> not a subtype of List<Number> when Integer[] is a subtype of Number[]?', answerMd: 'If it were, code holding a List<Number> view could add a Double into a list of Integers, breaking type safety with no run-time check (the types are erased). Arrays are covariant but carry their element type at run time, so a wrong store throws ArrayStoreException. Generics chose compile-time safety instead.' },
    { id: 'iq5', q: 'What is a raw type and what is heap pollution?', answerMd: 'A raw type is a generic type used without type arguments (List instead of List<String>); it exists for legacy code and disables generic checks. Heap pollution is when a variable of a parameterised type refers to an object holding the wrong element types, for example an Integer inside a List<String>, which fails later with ClassCastException at a compiler-inserted cast.' },
  ],
  revision: { notesMd: `- Generics: compile-time type safety, no casts; type arguments are reference types only.
- Erasure: one class at run time; no new T(), no generic arrays, no instanceof List<String>, overloads that clash after erasure.
- Invariant: List<Integer> is not a List<Number>. Arrays are covariant (ArrayStoreException).
- PECS: ? extends to read (producer), ? super to write (consumer).
- Raw types disable checks → heap pollution → ClassCastException later.`, flashcards: [
    { id: 'f1', front: 'Can you add an Integer to a List<? extends Number>?', backMd: 'No: the actual list might be a List<Double>.' },
    { id: 'f2', front: 'new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()?', backMd: 'true: erasure leaves one ArrayList class.' },
    { id: 'f3', front: 'PECS stands for?', backMd: 'Producer Extends, Consumer Super.' },
    { id: 'f4', front: 'What happens when you store a String into an Object[] that is really an Integer[]?', backMd: 'ArrayStoreException at run time.' },
    { id: 'f5', front: 'How do you create a T inside a generic method?', backMd: 'Take a Supplier<T> (or a Class<T>) parameter.' },
  ] },
  resources: [{ title: 'Generics (The Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/java/generics/index.html', kind: 'official-docs' }, { title: 'Type erasure (The Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/java/generics/erasure.html', kind: 'official-docs' }, JLS],
});

const geMcqs: MCQ[] = [
  mcq({ ...q(GE), id: 'java.ge.q1', type: 'code-output', difficulty: 'easy', stem: 'What does this program print?', code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> a = new ArrayList<>();
        List<Integer> b = new ArrayList<>();
        System.out.println(a.getClass() == b.getClass());
        System.out.println(a.getClass().getSimpleName());
    }
}`, 'Java', 'true\nArrayList'), options: ['true, then ArrayList', ['false, then ArrayList<String>', 'Type arguments are erased; there is a single ArrayList class at run time.'], ['true, then ArrayList<String>', 'Class names carry no type arguments.'], ['It does not compile', 'Comparing the two Class objects is legal.']], answer: 0, explanation: 'Erasure: the JVM sees one ArrayList class for every parameterisation.', verified: 'compiled' }),
  mcq({ ...q(GE), id: 'java.ge.q2', type: 'compile-error', difficulty: 'easy', stem: 'Why does this not compile?', code: javaErr(`static void fill() {
    List<Integer> ints = new ArrayList<>();
    List<Number> nums = ints;   // here
}`), options: ['Generics are invariant: List<Integer> is not a subtype of List<Number>', ['Integer is not a subclass of Number', 'It is.'], ['Local variables cannot be generic', 'They can.'], ['The diamond <> cannot be used with ArrayList', 'It can.']], answer: 0, explanation: 'Otherwise nums.add(2.5) would put a Double into a list of Integers. Use List<? extends Number> to read Numbers from it.' }),
  mcq({ ...q(GE), id: 'java.ge.q3', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    public static void main(String[] args) {
        Object[] arr = new String[2];
        try {
            arr[0] = "ok";
            arr[1] = 42;
            System.out.println("stored");
        } catch (ArrayStoreException e) {
            System.out.println("ArrayStoreException " + arr[0]);
        }
    }
}`, 'Java', 'ArrayStoreException ok'), options: ['ArrayStoreException ok', ['stored', 'The array is really a String[]; storing an Integer is checked at run time.'], ['It does not compile', 'Arrays are covariant, so String[] is assignable to Object[].'], ['ClassCastException', 'Wrong array stores throw ArrayStoreException.']], answer: 0, explanation: 'Arrays are covariant and check element types at run time. Generics are invariant precisely to catch this at compile time instead.', verified: 'compiled' }),
  mcq({ ...q(GE), id: 'java.ge.q4', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: javaErr(`static void addOne(List<? extends Number> nums) {
    Number first = nums.get(0);
    nums.add(1);   // here
}`), options: ['The list could be a List<Double>, so nothing (except null) can be added to a ? extends list', ['Reading a Number from it is illegal', 'Reading is exactly what ? extends allows.'], ['1 cannot be autoboxed', 'It can, to Integer.'], ['Wildcards are not allowed in parameters', 'They are.']], answer: 0, explanation: 'A ? extends list is a producer. To add Integers, declare List<? super Integer>.' }),
  mcq({ ...q(GE), id: 'java.ge.q5', type: 'concept', difficulty: 'medium', stem: 'A method adds Integers to a list. It must accept List<Integer>, List<Number> and List<Object>. Which parameter type fits?', options: ['List<? super Integer>', ['List<? extends Integer>', 'You cannot add to a ? extends list.'], ['List<Number>', 'Invariant: List<Integer> and List<Object> are not accepted.'], ['List<?>', 'Nothing but null can be added.']], answer: 0, explanation: 'Consumer Super: the list consumes Integers.' }),
  mcq({ ...q(GE), id: 'java.ge.q6', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: java(`import java.util.*;

public class Main {
    @SuppressWarnings({"unchecked", "rawtypes"})
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        List raw = names;
        raw.add(7);
        System.out.println(names.size());
        try {
            String s = names.get(0);
            System.out.println(s);
        } catch (ClassCastException e) {
            System.out.println("ClassCastException");
        }
    }
}`, 'Java', '1\nClassCastException'), options: ['1, then ClassCastException', ['It does not compile: 7 is not a String', 'Through the raw type the compiler only warns.'], ['0, then null', 'The add succeeded; the list holds an Integer.'], ['1, then 7', 'The compiler inserts a cast to String when reading, which fails.']], answer: 0, explanation: 'Raw types bypass checks (heap pollution); the failure appears later, at the cast the compiler inserted in names.get(0).', verified: 'compiled' }),
];

// ---------------------------------------------------------------------------------------
const CI = 'java.collections-internals';
const collections = javaTopic({
  id: CI, title: 'Collections Internals', level: 'advanced', estMinutes: 55, prerequisites: ['java.object-equality'], related: ['java.generics', 'dsa.hashing', 'dsa.stl-collections'],
  summary: 'How HashMap works, fail-fast iterators, Comparable vs Comparator.',
  objectives: ['Explain HashMap internals: hashing, bucket index, collisions, treeification, load factor and resizing.', 'Choose the right collection (ArrayList, LinkedList, ArrayDeque, HashMap, LinkedHashMap, TreeMap, PriorityQueue) and state its costs.', 'Explain fail-fast iterators and ConcurrentModificationException, and remove elements safely.', 'Write correct Comparable and Comparator implementations and know when a comparator must agree with equals.'],
  sections: [
    { id: 'hashmap', kind: 'concept', title: 'How HashMap works', bodyMd: `A \`HashMap\` is an array of **buckets** (the table).

1. **Hash:** \`h = key.hashCode()\`, then spread as \`h ^ (h >>> 16)\` so high bits influence the index.
2. **Index:** \`(table.length - 1) & hash\`. The table length is always a **power of two** (default 16), so this equals \`hash mod length\`.
3. **Collisions:** entries in the same bucket form a linked list. When one bucket reaches **8** entries and the table has at least **64** buckets, it becomes a **red-black tree** (worst case O(log n) instead of O(n)); with a smaller table, the map resizes instead.
4. **Lookup:** find the bucket, then compare the stored hash and \`equals\`. This is why \`equals\` and \`hashCode\` must be consistent.
5. **Resize:** when \`size > capacity × loadFactor\` (16 × 0.75 = 12 by default), the table doubles and entries are redistributed. Pre-size with \`new HashMap<>(expected * 4 / 3 + 1)\` when you know the size.

Average get/put is **O(1)**. \`HashMap\` allows one \`null\` key and is **not thread-safe**; use \`ConcurrentHashMap\` (no null keys or values) for concurrent access. **Never mutate a key** after inserting it: its hash changes and the entry becomes unreachable.

\`HashSet\` is a \`HashMap\` with dummy values; \`LinkedHashMap\` adds a doubly linked list for insertion or access order.` },
    { id: 'choose', kind: 'comparison', title: 'Choosing a collection', bodyMd: `| Collection | Structure | Key costs | Notes |
|---|---|---|---|
| \`ArrayList\` | resizable array (grows by 1.5×) | get O(1), add at end amortised O(1), insert/remove in the middle O(n) | the default list |
| \`LinkedList\` | doubly linked list | add/remove at ends O(1), get(i) O(n) | rarely the best choice; poor cache locality |
| \`ArrayDeque\` | circular array | push/pop/offer/poll at both ends O(1) | use for stacks and queues (not \`Stack\`) |
| \`HashMap\` / \`HashSet\` | hash table | O(1) average | no ordering guarantee |
| \`LinkedHashMap\` | hash table + linked list | O(1) | insertion or access order; LRU caches |
| \`TreeMap\` / \`TreeSet\` | red-black tree | O(log n) | sorted; \`floorKey\`, \`ceilingKey\`, \`headMap\`, \`subMap\` |
| \`PriorityQueue\` | binary heap | offer/poll O(log n), peek O(1) | iteration order is **not** sorted |
| \`ConcurrentHashMap\` | hash table with per-bin locking/CAS | O(1) average | thread-safe; weakly consistent iterators |` },
    { id: 'iterators', kind: 'concept', title: 'Fail-fast iterators and comparators', bodyMd: `**Fail-fast iterators.** Collections keep a modification count (\`modCount\`). An iterator remembers it, and \`next()\` throws \`ConcurrentModificationException\` if the collection was structurally modified by anything other than the iterator itself. This is a bug detector, not a thread-safety mechanism. Remove safely with:

\`\`\`java
list.removeIf(x -> x % 2 == 0);                       // simplest
for (Iterator<Integer> it = list.iterator(); it.hasNext(); )
    if (it.next() % 2 == 0) it.remove();              // the iterator's own remove
\`\`\`

Concurrent collections (\`CopyOnWriteArrayList\`, \`ConcurrentHashMap\`) have **weakly consistent** iterators that never throw CME.

**Comparable vs Comparator.** \`Comparable<T>\` defines the natural order inside the class (\`compareTo\`); \`Comparator<T>\` is an external, swappable order:

\`\`\`java
people.sort(Comparator.comparing(Person::city).thenComparing(Person::age, Comparator.reverseOrder()));
\`\`\`

- Never compare with subtraction (\`a - b\`): it overflows for large values. Use \`Integer.compare(a, b)\`.
- \`TreeMap\`/\`TreeSet\` use the comparator, **not equals**, to detect duplicates: elements that compare as 0 are treated as the same element.` },
    { id: 'code', kind: 'code', title: 'An LRU cache with LinkedHashMap', bodyMd: 'Access order moves an entry to the end on every get; removeEldestEntry evicts the least recently used one.', code: [java(`
import java.util.*;

public class Main {
    static class Lru<K, V> extends LinkedHashMap<K, V> {
        private final int capacity;
        Lru(int capacity) { super(16, 0.75f, true); this.capacity = capacity; }   // true = access order
        @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) { return size() > capacity; }
    }
    public static void main(String[] args) {
        Lru<String, Integer> cache = new Lru<>(2);
        cache.put("a", 1);
        cache.put("b", 2);
        cache.get("a");          // a becomes the most recently used
        cache.put("c", 3);       // evicts b, the least recently used
        System.out.println(cache.keySet());
    }
}`, 'Java', '[a, c]')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and Java vs C++', bodyMd: `1. Removing from a list inside a for-each loop (CME, or silently skipped elements).
2. Mutable objects as HashMap keys, or keys with inconsistent equals/hashCode.
3. Assuming HashMap or HashSet iteration order is stable or sorted (use LinkedHashMap or TreeMap).
4. Iterating a PriorityQueue expecting sorted order (poll repeatedly instead).
5. Subtraction comparators and comparators that disagree with equals in sorted sets.
6. Using \`Stack\`, \`Vector\` or \`Hashtable\` in new code (legacy, synchronised); prefer \`ArrayDeque\`, \`ArrayList\`, \`HashMap\`/\`ConcurrentHashMap\`.

**Java vs C++:** \`HashMap\` ≈ \`unordered_map\`, \`TreeMap\` ≈ \`map\`, \`ArrayDeque\` ≈ \`deque\`, \`PriorityQueue\` is a **min-heap** by default (C++ \`priority_queue\` is a max-heap). Java collections hold references (boxed primitives), C++ containers hold values.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How does HashMap work internally?', answerMd: 'It keeps an array of buckets whose length is a power of two. put spreads the key\'s hashCode, picks the bucket with (n - 1) & hash, and either adds a node or replaces the value of a node whose hash and equals match. Collisions form linked lists that become red-black trees at 8 nodes (when the table has at least 64 buckets). When size exceeds capacity × load factor (0.75), the table doubles and entries are redistributed. get and put are O(1) on average.' },
    { id: 'iq2', q: 'What happens if two keys have the same hashCode?', answerMd: 'They land in the same bucket; HashMap then uses equals to tell them apart, so both entries are stored. Many collisions degrade performance (a long list, or a tree with O(log n) lookups), which is why a good hashCode spreads values.' },
    { id: 'iq3', q: 'Why does modifying a list in a for-each loop throw ConcurrentModificationException?', answerMd: 'The for-each loop uses an iterator that records the list\'s modification count. list.remove changes the count, and the next call to iterator.next() detects the mismatch and throws. Use Iterator.remove, removeIf or iterate over a copy.' },
    { id: 'iq4', q: 'HashMap vs ConcurrentHashMap vs Hashtable?', answerMd: 'HashMap is unsynchronised and allows one null key and null values. Hashtable is a legacy class with every method synchronised (one lock) and no nulls. ConcurrentHashMap is thread-safe with fine-grained locking and CAS (lock-free reads), no nulls, weakly consistent iterators and atomic operations like computeIfAbsent and merge; it is the one to use for concurrent code.' },
    { id: 'iq5', q: 'Comparable vs Comparator?', answerMd: 'Comparable is implemented by the class itself (compareTo) and defines a single natural order (String, Integer). Comparator is a separate object, often a lambda, that defines any number of alternative orders and can be composed with comparing, thenComparing and reversed.' },
    { id: 'iq6', q: 'How would you implement an LRU cache in Java?', answerMd: 'Extend LinkedHashMap with accessOrder = true and override removeEldestEntry to return size() > capacity. In an interview where library help is not allowed, combine a HashMap from key to node with a doubly linked list: move a node to the front on access and evict from the tail, all in O(1).' },
  ],
  revision: { notesMd: `- HashMap: power-of-two table, index = (n-1) & spread(hash), chains → red-black tree at 8 (table ≥ 64), resize at size > 0.75 × capacity (doubles).
- Lookup compares hash then equals; never mutate keys.
- ArrayList for lists, ArrayDeque for stacks/queues, TreeMap for order, LinkedHashMap for LRU, PriorityQueue is a min-heap.
- Fail-fast iterators throw CME; use Iterator.remove or removeIf.
- Comparator.comparing/thenComparing; Integer.compare, never subtraction; sorted sets dedupe by comparator.`, flashcards: [
    { id: 'f1', front: 'Default HashMap capacity and load factor?', backMd: '16 buckets, 0.75 (resize after 12 entries).' },
    { id: 'f2', front: 'When does a HashMap bucket become a tree?', backMd: 'At 8 entries, if the table has at least 64 buckets (otherwise it resizes).' },
    { id: 'f3', front: 'Which Java collection to use as a stack?', backMd: 'ArrayDeque (push/pop).' },
    { id: 'f4', front: 'What does TreeSet use to detect duplicates?', backMd: 'compareTo / the comparator returning 0, not equals.' },
    { id: 'f5', front: 'Is iterating a PriorityQueue sorted?', backMd: 'No; only repeated poll() returns elements in order.' },
  ] },
  resources: [API('HashMap', 'java/util/HashMap.html'), { title: 'Collections (The Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/collections/index.html', kind: 'official-docs' }],
});

const ciMcqs: MCQ[] = [
  mcq({ ...q(CI), id: 'java.col.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> xs = new ArrayList<>(List.of(1, 2, 3, 4));
        try {
            for (Integer x : xs) if (x == 2) xs.remove(x);
        } catch (ConcurrentModificationException e) {
            System.out.print("CME ");
        }
        System.out.println(xs);
    }
}`, 'Java', 'CME [1, 3, 4]'), options: ['CME [1, 3, 4]', ['[1, 3, 4]', 'The next call to the iterator\'s next() detects the modification.'], ['CME [1, 2, 3, 4]', 'The removal happened before the exception.'], ['[1, 2, 3]', 'remove(x) with an Integer removes the value 2, not index 2.']], answer: 0, explanation: 'The list changed behind the iterator\'s back, so next() throws ConcurrentModificationException; the element was already removed.', verified: 'compiled' }),
  mcq({ ...q(CI), id: 'java.col.q2', type: 'code-output', difficulty: 'hard', stem: 'Same loop, but removing 3 (the second-to-last element). What does it print?', code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> xs = new ArrayList<>(List.of(1, 2, 3, 4));
        try {
            for (Integer x : xs) if (x == 3) xs.remove(x);
        } catch (ConcurrentModificationException e) {
            System.out.print("CME ");
        }
        System.out.println(xs);
    }
}`, 'Java', '[1, 2, 4]'), options: ['[1, 2, 4]', ['CME [1, 2, 4]', 'After the removal hasNext() compares cursor 3 with size 3 and returns false, so next() is never called again.'], ['CME [1, 2, 3, 4]', 'The removal succeeded.'], ['[1, 2, 3, 4]', '3 was removed.']], answer: 0, explanation: 'Fail-fast checks happen in next(). Removing the second-to-last element makes hasNext() false, so the loop ends silently and 4 is never visited. Fail-fast is best-effort, never rely on it.', verified: 'compiled' }),
  mcq({ ...q(CI), id: 'java.col.q3', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        Set<String> set = new TreeSet<>(Comparator.comparing(String::length));
        set.addAll(List.of("kiwi", "fig", "pear", "plum", "apple"));
        System.out.println(set);
    }
}`, 'Java', '[fig, kiwi, apple]'), options: ['[fig, kiwi, apple]', ['[fig, kiwi, pear, plum, apple]', 'Strings of equal length compare as 0, so the set treats them as duplicates.'], ['[apple, fig, kiwi, pear, plum]', 'The order is by length, not alphabetical.'], ['[fig, plum, apple]', 'The first of each length is kept; later "duplicates" are rejected.']], answer: 0, explanation: 'TreeSet decides equality with the comparator. A comparator inconsistent with equals silently drops elements; add thenComparing(Comparator.naturalOrder()).', verified: 'compiled' }),
  mcq({ ...q(CI), id: 'java.col.q4', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<Integer> key = new ArrayList<>(List.of(1));
        Map<List<Integer>, String> map = new HashMap<>();
        map.put(key, "v");
        key.add(2);
        System.out.println(map.get(key) + " " + map.size());
    }
}`, 'Java', 'null 1'), options: ['null 1', ['v 1', 'The key\'s hashCode changed, so the lookup does not match the stored entry\'s hash.'], ['null 0', 'The entry is still in the map, just unreachable by lookup.'], ['It throws ConcurrentModificationException', 'No iteration happens.']], answer: 0, explanation: 'HashMap stores each entry\'s hash at insertion. Mutating the key changes its hashCode, so get compares against the wrong hash and finds nothing, while the stale entry stays (a leak).', verified: 'compiled' }),
  mcq({ ...q(CI), id: 'java.col.q5', type: 'concept', difficulty: 'medium', stem: 'A HashMap is created with the default constructor. When does its table first grow beyond 16 buckets?', options: ['When the 13th entry is added (size exceeds 16 × 0.75 = 12)', ['When the 17th entry is added', 'The load factor triggers resizing at 75% occupancy.'], ['When any bucket has 8 entries', 'That triggers treeification (or a resize only if the table is below 64).'], ['Never: HashMap capacity is fixed', 'It doubles as needed.']], answer: 0, explanation: 'Threshold = capacity × load factor = 12; the table doubles to 32 when size exceeds it.' }),
  mcq({ ...q(CI), id: 'java.col.q6', type: 'debug', difficulty: 'medium', stem: 'Why is the comparator `(a, b) -> a - b` for Integers a bug?', options: ['a - b can overflow (e.g. Integer.MIN_VALUE - 1), giving the wrong sign', ['Lambdas cannot be comparators', 'Comparator is a functional interface.'], ['It sorts in descending order', 'It is ascending when it does not overflow.'], ['Integers must be compared with equals', 'Ordering needs a sign, not equality.']], answer: 0, explanation: 'Use Integer.compare(a, b) or Comparator.naturalOrder(); subtraction breaks the comparator contract for large magnitudes.' }),
];

// ---------------------------------------------------------------------------------------
const MG = 'java.memory-gc';
const memory = javaTopic({
  id: MG, title: 'Memory and Garbage Collection', level: 'advanced', estMinutes: 45, prerequisites: ['java.classes-objects'], related: ['java.static-final', 'cpp.memory-raii', 'java.inner-lambdas'],
  summary: 'Stack vs heap, GC basics and Java memory leaks.',
  objectives: ['Describe the JVM memory areas (heap generations, thread stacks, metaspace) and what lives where.', 'Explain reachability, generational collection, stop-the-world pauses and the common collectors (G1, ZGC, Parallel).', 'Distinguish StackOverflowError and OutOfMemoryError and their typical causes.', 'Find and fix Java memory leaks, and know strong, soft, weak and phantom references.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'JVM memory areas', bodyMd: `| Area | Holds | Shared? | Failure |
|---|---|---|---|
| **Heap** (young: eden + survivor spaces; old generation) | all objects and arrays, the String pool (since Java 7) | all threads | \`OutOfMemoryError: Java heap space\` |
| **Thread stack** | one frame per call: local variables (primitives and references), operand stack, return address | one per thread | \`StackOverflowError\` (too deep recursion) |
| **Metaspace** (native memory, since Java 8; replaced PermGen) | class metadata, method bytecode | all threads | \`OutOfMemoryError: Metaspace\` (e.g. class-loader leaks) |
| Code cache | JIT-compiled native code | all threads | |

\`\`\`java
void handle() {
    int count = 3;                       // primitive local: in the stack frame
    Order o = new Order();               // reference o in the frame, the Order object on the heap
}                                        // frame popped; the Order becomes unreachable (if not stored elsewhere)
\`\`\`

Size limits: \`-Xms\`/\`-Xmx\` (heap), \`-Xss\` (thread stack).` },
    { id: 'gc', kind: 'concept', title: 'How garbage collection works', bodyMd: `An object is **garbage** when it is not **reachable** from any GC root: local variables in live stack frames, static fields, active threads and JNI references. Cycles of objects that reference each other but are unreachable are collected too (unlike reference counting).

**Generational hypothesis:** most objects die young. So the heap is split:

1. New objects go to **eden**. A **minor GC** copies survivors to a survivor space; objects surviving several minor GCs are **promoted** to the old generation.
2. A **major/full GC** collects the old generation (mark live objects, sweep or compact).
3. Some phases are **stop-the-world**: application threads pause.

| Collector | Goal |
|---|---|
| **G1** (default since Java 9) | balanced throughput and pause-time targets, region-based |
| **ZGC** / Shenandoah | very low pauses (sub-millisecond to a few ms) on large heaps |
| Parallel | maximum throughput, longer pauses (batch jobs) |
| Serial | small heaps, single core |

\`System.gc()\` is only a hint. \`finalize()\` is deprecated; release resources with try-with-resources (\`AutoCloseable\`) or \`java.lang.ref.Cleaner\`.` },
    { id: 'leaks', kind: 'concept', title: 'Memory leaks and reference types', bodyMd: `GC cannot free what is still reachable, so a Java "leak" is an object you no longer need but still reference:

1. **Static collections** and caches that only grow (bound them: LRU, size limits, expiry).
2. **Listeners and callbacks** registered but never removed.
3. **Inner classes and lambdas** that capture an outer object and outlive it.
4. **ThreadLocal** values in thread pools (threads never die, so call \`remove()\`).
5. **Mutable HashMap keys** that leave unreachable-by-lookup entries.
6. Unclosed resources (streams, connections), which also leak native handles.

Diagnose with a heap dump (\`-XX:+HeapDumpOnOutOfMemoryError\`, \`jcmd <pid> GC.heap_dump\`) analysed in Eclipse MAT or VisualVM: look for the largest retained sizes and their paths to GC roots.

**Reference strengths** (\`java.lang.ref\`):

| Type | Collected when | Use |
|---|---|---|
| strong (normal) | unreachable | everything |
| \`SoftReference\` | memory is low (before an OOM) | memory-sensitive caches |
| \`WeakReference\` | at the next GC once only weakly reachable | \`WeakHashMap\` keys, canonical maps, listener lists |
| \`PhantomReference\` | after finalisation, \`get()\` always returns null | cleanup tracking (\`Cleaner\`) |` },
    { id: 'code', kind: 'code', title: 'StackOverflowError and an unsubscribe fix', bodyMd: 'Unbounded recursion exhausts the thread stack (an Error, not an Exception). The second snippet shows the classic listener leak and its fix.', code: [java(`
public class Main {
    static int depth = 0;
    static void recurse() { depth++; recurse(); }
    public static void main(String[] args) {
        try {
            recurse();
        } catch (StackOverflowError e) {
            System.out.println("StackOverflowError after " + (depth > 1000 ? "more than 1000" : "few") + " frames");
        }
    }
}`, 'Java', 'StackOverflowError after more than 1000 frames'), java(`
static class EventBus {
    private final List<Runnable> listeners = new ArrayList<>();
    void subscribe(Runnable r) { listeners.add(r); }
    void unsubscribe(Runnable r) { listeners.remove(r); }
}
static class Screen implements AutoCloseable {
    private final EventBus bus;
    private final Runnable onEvent = () -> refresh();       // captures this Screen
    Screen(EventBus bus) { this.bus = bus; bus.subscribe(onEvent); }
    void refresh() {}
    // Without this, the long-lived bus keeps every closed Screen reachable forever.
    @Override public void close() { bus.unsubscribe(onEvent); }
}`, 'Leak fix')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and Java vs C++', bodyMd: `1. Believing Java cannot leak memory because it has GC.
2. Calling \`System.gc()\` to "fix" memory problems.
3. Relying on \`finalize()\` for cleanup (deprecated, unpredictable).
4. Catching \`OutOfMemoryError\` and continuing as if nothing happened.
5. Setting \`-Xmx\` very high to hide a leak (it only delays the OOM and lengthens GC pauses).

**Java vs C++:** C++ frees memory deterministically (destructors, RAII, smart pointers) and objects can live on the stack; Java allocates every object on the heap and frees it at a time the GC chooses, so non-memory resources must be closed explicitly with try-with-resources. A C++ \`shared_ptr\` cycle leaks; Java GC collects cycles.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is stored on the stack and what on the heap in Java?', answerMd: 'Each thread\'s stack holds frames with local variables: primitives and references. All objects and arrays live on the heap, shared by threads. A reference in a stack frame points to an object on the heap. Class metadata lives in metaspace (native memory since Java 8).' },
    { id: 'iq2', q: 'How does the garbage collector decide what to collect?', answerMd: 'By reachability: it traces from GC roots (locals in live frames, static fields, active threads, JNI references) and everything not reached is garbage, including unreachable cycles. Generational collectors do frequent cheap minor GCs on the young generation, where most objects die, and rarer collections of the old generation.' },
    { id: 'iq3', q: 'Can a Java program have a memory leak? Give examples.', answerMd: 'Yes, when unneeded objects stay reachable: ever-growing static caches, listeners never unregistered, ThreadLocals in pooled threads, inner classes holding outer instances, mutable HashMap keys. Find them with a heap dump and the path to GC roots in MAT or VisualVM; fix by bounding caches, unregistering, calling ThreadLocal.remove(), or using weak references.' },
    { id: 'iq4', q: 'StackOverflowError vs OutOfMemoryError?', answerMd: 'StackOverflowError: a thread\'s stack is exhausted, almost always by unbounded or very deep recursion (fix the base case or make it iterative; -Xss raises the limit). OutOfMemoryError: the heap (or metaspace) cannot satisfy an allocation after GC, caused by leaks or genuinely too much live data. Both are Errors, not Exceptions.' },
    { id: 'iq5', q: 'What are weak and soft references used for?', answerMd: 'A WeakReference does not keep its object alive; it is cleared at the next GC once no strong reference exists (WeakHashMap keys, canonicalising maps). A SoftReference is cleared only when memory runs low, so it suits memory-sensitive caches.' },
  ],
  revision: { notesMd: `- Heap: objects (young: eden/survivors, old). Stack: frames with locals and references, per thread. Metaspace: class metadata (Java 8+).
- GC = reachability from roots; cycles are collected; minor GC (young) vs major/full GC (old); stop-the-world pauses.
- G1 is the default; ZGC/Shenandoah for low latency; System.gc() is a hint.
- Leaks = unneeded but reachable: static caches, listeners, ThreadLocal, inner classes, mutable keys.
- Soft (cleared when memory is low), weak (next GC), phantom (cleanup).`, flashcards: [
    { id: 'f1', front: 'Where do local primitive variables live?', backMd: 'In the thread\'s stack frame.' },
    { id: 'f2', front: 'What replaced PermGen in Java 8?', backMd: 'Metaspace (native memory).' },
    { id: 'f3', front: 'Default collector since Java 9?', backMd: 'G1.' },
    { id: 'f4', front: 'Are unreachable reference cycles collected?', backMd: 'Yes: Java uses tracing, not reference counting.' },
    { id: 'f5', front: 'Which reference type backs WeakHashMap keys?', backMd: 'WeakReference.' },
  ] },
  resources: [{ title: 'HotSpot Garbage Collection Tuning Guide (Java SE 21)', url: 'https://docs.oracle.com/en/java/javase/21/gctuning/introduction-garbage-collection-tuning.html', kind: 'official-docs' }, API('java.lang.ref package', 'java/lang/ref/package-summary.html')],
});

const mgMcqs: MCQ[] = [
  mcq({ ...q(MG), id: 'java.mg.q1', type: 'concept', difficulty: 'easy', stem: 'Inside a method: `int n = 5; int[] a = new int[n];`. Where do n, the variable a, and the array live?', options: ['n and a in the stack frame; the array object on the heap', ['All three on the heap', 'Locals live in the stack frame.'], ['All three on the stack', 'Arrays are objects, allocated on the heap.'], ['n on the stack; a and the array in metaspace', 'Metaspace holds class metadata.']], answer: 0, explanation: 'Locals (primitives and references) are in the frame; every object, including arrays, is on the heap.' }),
  mcq({ ...q(MG), id: 'java.mg.q2', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    static void f() { f(); }
    public static void main(String[] args) {
        try {
            f();
        } catch (Exception e) {
            System.out.println("exception");
        } catch (Throwable t) {
            System.out.println(t.getClass().getSimpleName());
        }
    }
}`, 'Java', 'StackOverflowError'), options: ['StackOverflowError', ['exception', 'StackOverflowError is an Error, not an Exception, so the first catch does not match.'], ['OutOfMemoryError', 'Recursion exhausts the thread stack, not the heap.'], ['Nothing: the JVM crashes', 'The error can be caught like any Throwable.']], answer: 0, explanation: 'Errors extend Throwable directly (via Error), so catch (Exception) misses them.', verified: 'compiled' }),
  mcq({ ...q(MG), id: 'java.mg.q3', type: 'concept', difficulty: 'medium', stem: 'Objects A and B reference each other, and nothing else references either. What happens?', options: ['Both are eligible for garbage collection', ['They are never collected because their reference counts are 1', 'The JVM traces reachability from roots; it does not count references.'], ['Only A is collected', 'Neither is reachable.'], ['They are collected only if System.gc() is called', 'The GC runs on its own schedule; gc() is a hint.']], answer: 0, explanation: 'Tracing collectors collect unreachable cycles; this is a key difference from C++ shared_ptr cycles.' }),
  mcq({ ...q(MG), id: 'java.mg.q4', type: 'scenario', difficulty: 'medium', stem: 'A service\'s heap grows steadily for days until OutOfMemoryError. The heap dump shows a static HashMap<String, Report> holding millions of entries. Best fix?', options: ['Bound the cache (LRU with a size limit or expiry) or remove entries when reports are no longer needed', ['Increase -Xmx', 'It only delays the crash.'], ['Call System.gc() every minute', 'The entries are reachable, so GC cannot free them.'], ['Switch from G1 to ZGC', 'No collector frees reachable objects.']], answer: 0, explanation: 'A leak in Java means unneeded objects remain reachable; only removing the references fixes it.' }),
  mcq({ ...q(MG), id: 'java.mg.q5', type: 'concept', difficulty: 'medium', stem: 'Which reference type is cleared only when the JVM is low on memory, making it suitable for caches?', options: ['SoftReference', ['WeakReference', 'Weak references are cleared at the next GC once the object is only weakly reachable.'], ['PhantomReference', 'Used for cleanup tracking; get() always returns null.'], ['A strong reference', 'Never cleared while reachable.']], answer: 0, explanation: 'Soft references survive until memory pressure; the JVM clears them before throwing OutOfMemoryError.' }),
  mcq({ ...q(MG), id: 'java.mg.q6', type: 'concept', difficulty: 'easy', stem: 'Since Java 8, where is class metadata stored?', options: ['Metaspace, in native memory', ['PermGen, inside the heap', 'PermGen was removed in Java 8.'], ['The thread stack', 'Stacks hold call frames.'], ['The young generation', 'The young generation holds new objects.']], answer: 0, explanation: 'Metaspace grows in native memory (limit it with -XX:MaxMetaspaceSize); class-loader leaks show up as OutOfMemoryError: Metaspace.' }),
];

// ---------------------------------------------------------------------------------------
const IL = 'java.inner-lambdas';
const lambdas = javaTopic({
  id: IL, title: 'Nested Classes and Lambdas', level: 'advanced', estMinutes: 50, prerequisites: ['java.abstract-interfaces'], related: ['java.memory-gc', 'java.generics', 'java.solid-patterns'],
  summary: 'Inner, static nested and anonymous classes; lambdas.',
  objectives: ['Distinguish static nested, inner, local and anonymous classes, and know which hold a reference to an outer instance.', 'Write lambdas and the four kinds of method references against the standard functional interfaces.', 'Explain capture of effectively final variables and the meaning of this in a lambda vs an anonymous class.', 'Use streams correctly: lazy intermediate operations, terminal operations, and single use.'],
  sections: [
    { id: 'nested', kind: 'concept', title: 'The four kinds of nested class', bodyMd: `| Kind | Declared | Outer instance? | Typical use |
|---|---|---|---|
| **static nested** | \`static class Node\` inside a class | no | helpers tightly tied to the outer class (\`Map.Entry\`, builders, list nodes) |
| **inner** (member) | \`class Itr\` inside a class | yes, \`Outer.this\` | needs the outer object's state (an iterator over its collection) |
| **local** | inside a method | yes (if in an instance method) | rare |
| **anonymous** | \`new Interface() { ... }\` in an expression | yes (if in an instance method) | one-off implementations; mostly replaced by lambdas |

\`\`\`java
Outer outer = new Outer();
Outer.Inner in = outer.new Inner();          // an inner class needs an outer instance
Outer.Nested n = new Outer.Nested();         // a static nested class does not
\`\`\`

Prefer **static nested** unless you need the outer instance: an inner class silently keeps its outer object alive (a common leak when it is passed to a long-lived listener or thread).` },
    { id: 'lambdas', kind: 'concept', title: 'Lambdas and method references', bodyMd: `A lambda is an implementation of a **functional interface** (one abstract method); its type comes from the context (target typing).

| Interface | Method | Example |
|---|---|---|
| \`Function<T,R>\` | \`R apply(T)\` | \`s -> s.length()\` |
| \`BiFunction<T,U,R>\` | \`R apply(T,U)\` | \`(a, b) -> a + b\` |
| \`Supplier<T>\` | \`T get()\` | \`() -> new ArrayList<>()\` |
| \`Consumer<T>\` | \`void accept(T)\` | \`x -> log.add(x)\` |
| \`Predicate<T>\` | \`boolean test(T)\` | \`x -> x > 0\` |
| \`UnaryOperator<T>\` / \`BinaryOperator<T>\` | \`T apply(T)\` / \`T apply(T,T)\` | \`Integer::sum\` |

Primitive versions (\`IntPredicate\`, \`IntUnaryOperator\`, \`ToIntFunction\`…) avoid boxing.

**Method references:** static (\`Integer::parseInt\`), bound instance (\`System.out::println\`), unbound instance (\`String::length\`, the first argument is the receiver), constructor (\`ArrayList::new\`).

**Rules:**
- Lambdas capture only **effectively final** locals (they copy the value).
- In a lambda, \`this\` is the **enclosing instance**; in an anonymous class, \`this\` is the anonymous object.
- A lambda body is not a new scope for names: redeclaring an enclosing local is an error (an anonymous class may shadow it).` },
    { id: 'streams', kind: 'concept', title: 'Streams in one screen', bodyMd: `\`\`\`java
Map<String, Long> countByCity = people.stream()
    .filter(p -> p.age() >= 18)                   // intermediate (lazy)
    .collect(Collectors.groupingBy(Person::city, Collectors.counting()));   // terminal
\`\`\`

- **Intermediate** operations (\`filter\`, \`map\`, \`sorted\`, \`distinct\`, \`limit\`) are lazy: nothing runs until a **terminal** operation (\`collect\`, \`forEach\`, \`reduce\`, \`count\`, \`findFirst\`, \`anyMatch\`).
- Elements flow one at a time through the pipeline, and **short-circuiting** operations (\`findFirst\`, \`anyMatch\`, \`limit\`) stop early.
- A stream can be consumed **once**; a second terminal operation throws \`IllegalStateException\`.
- Keep lambdas in streams free of side effects; use \`IntStream\` for primitives; parallel streams only for large CPU-bound work.` },
    { id: 'code', kind: 'code', title: 'this in lambdas vs anonymous classes, and method references', bodyMd: 'The lambda sees the enclosing Main instance; the anonymous class is its own object. The inner class reads the outer field through Main.this.', code: [java(`
import java.util.*;
import java.util.function.*;

public class Main {
    private final String name = "outer";
    @Override public String toString() { return name; }

    class Inner { String who() { return name + "/inner"; } }          // reads Main.this.name

    void demo() {
        Supplier<String> lambda = () -> this.toString();                // this = the Main instance
        Supplier<String> anon = new Supplier<String>() {
            @Override public String get() { return this.toString(); }   // this = the anonymous object
            @Override public String toString() { return "anonymous"; }
        };
        Inner in = this.new Inner();
        System.out.println(lambda.get() + " " + anon.get() + " " + in.who());
    }

    public static void main(String[] args) {
        new Main().demo();
        Function<String, Integer> len = String::length;                 // unbound instance method
        BinaryOperator<Integer> max = Math::max;                        // static method
        Supplier<List<String>> make = ArrayList::new;                   // constructor
        List<String> xs = make.get();
        xs.add("lambda");
        System.out.println(len.apply(xs.get(0)) + " " + max.apply(3, 8));
    }
}`, 'Java', 'outer anonymous outer/inner\n6 8')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and Java vs C++', bodyMd: `1. Using inner (non-static) classes where static nested would do, leaking the outer object.
2. Trying to modify a captured local inside a lambda (use an \`AtomicInteger\`, an array cell, or better, a stream reduction).
3. Assuming \`this\` in a lambda means the lambda.
4. Reusing a stream after a terminal operation.
5. Side effects in \`map\`/\`filter\`, which are lazy and may be skipped by short-circuiting.

**Java vs C++:** C++ lambdas choose capture explicitly (\`[=]\`, \`[&]\`, \`[x]\`) and can capture by reference and mutate (\`mutable\`); Java captures values of effectively final locals only. C++ lambdas have unique closure types (often used with \`auto\` or templates); Java lambdas always target a functional interface type.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Static nested class vs inner class?', answerMd: 'An inner class instance holds a hidden reference to an instance of the outer class (Outer.this) and can use its instance members; it is created with outer.new Inner(). A static nested class has no such reference, is created like a normal class, and can only use the outer class\'s static members directly. Prefer static nested unless the outer instance is needed, to avoid keeping outer objects alive.' },
    { id: 'iq2', q: 'Why must captured variables be effectively final?', answerMd: 'A lambda or anonymous class captures a copy of the local\'s value, and may run later or on another thread after the method returns. Allowing changes would make the copy and the variable disagree, so Java requires the variable to never change after initialisation.' },
    { id: 'iq3', q: 'Lambda vs anonymous class?', answerMd: 'Lambdas implement only functional interfaces, have no state of their own, and this refers to the enclosing instance; they are compiled with invokedynamic, not as a separate class file per lambda. Anonymous classes can implement any interface or extend a class, can have fields and several methods, and this refers to the anonymous object.' },
    { id: 'iq4', q: 'What are the kinds of method references?', answerMd: 'Static (Integer::parseInt), bound instance on a specific object (System.out::println, str::concat), unbound instance where the first parameter is the receiver (String::length), and constructor (ArrayList::new).' },
    { id: 'iq5', q: 'Are Java streams lazy?', answerMd: 'Yes. Intermediate operations only build the pipeline; the terminal operation pulls elements through one at a time, and short-circuiting terminals like findFirst stop as soon as they have an answer. A stream can be consumed only once.' },
  ],
  revision: { notesMd: `- Static nested: no outer instance. Inner: holds Outer.this (outer.new Inner()). Anonymous: one-off, own this.
- Lambda = functional interface implementation; capture effectively final locals; this = enclosing instance.
- Method refs: static, bound, unbound (receiver first), constructor.
- Core interfaces: Function, BiFunction, Supplier, Consumer, Predicate, UnaryOperator, BinaryOperator.
- Streams: lazy intermediates, one terminal, single use, short-circuiting.`, flashcards: [
    { id: 'f1', front: 'In a lambda inside an instance method, what is `this`?', backMd: 'The enclosing instance.' },
    { id: 'f2', front: 'How do you create an inner class instance?', backMd: '`outer.new Inner()`.' },
    { id: 'f3', front: 'Which interface: takes T, returns boolean?', backMd: 'Predicate<T>.' },
    { id: 'f4', front: '`String::length` is which kind of method reference?', backMd: 'Unbound instance (the string is the first argument).' },
    { id: 'f5', front: 'What happens on a second terminal operation on a stream?', backMd: 'IllegalStateException.' },
  ] },
  resources: [{ title: 'Nested classes (The Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/java/javaOO/nested.html', kind: 'official-docs' }, { title: 'Lambda expressions (The Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html', kind: 'official-docs' }, { title: 'Method references (The Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/java/javaOO/methodreferences.html', kind: 'official-docs' }, API('java.util.stream package', 'java/util/stream/package-summary.html')],
});

const ilMcqs: MCQ[] = [
  mcq({ ...q(IL), id: 'java.il.q1', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: javaErr(`static void run() {
    int x = 1;
    Runnable r = () -> {
        int x = 2;   // here
        System.out.println(x);
    };
}`), options: ['A lambda body is not a new scope for local names, so x is already defined in run()', ['Lambdas cannot declare local variables', 'They can, with new names.'], ['Runnable cannot print', 'Any code can run in run().'], ['x must be final', 'Capture is not the problem; redeclaration is.']], answer: 0, explanation: 'An anonymous class could shadow x, but a lambda shares the enclosing scope.' }),
  mcq({ ...q(IL), id: 'java.il.q2', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: javaErr(`class Node { int value; }
static Node build() {
    return new Node();   // here
}`), options: ['Node is an inner (non-static) class, so it needs an enclosing instance, which a static method does not have', ['Node has no constructor', 'The default constructor exists.'], ['A method cannot return a nested class', 'It can.'], ['value must be initialised', 'Fields default to 0.']], answer: 0, explanation: 'Declare it static class Node, or create it from an instance: outer.new Node().' }),
  mcq({ ...q(IL), id: 'java.il.q3', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`import java.util.function.*;

public class Main {
    @Override public String toString() { return "Main"; }
    void run() {
        Supplier<String> a = () -> this.toString();
        Supplier<String> b = new Supplier<String>() {
            @Override public String get() { return this.toString(); }
            @Override public String toString() { return "Anon"; }
        };
        System.out.println(a.get() + " " + b.get());
    }
    public static void main(String[] args) { new Main().run(); }
}`, 'Java', 'Main Anon'), options: ['Main Anon', ['Anon Anon', 'In a lambda, this is the enclosing Main instance.'], ['Main Main', 'In an anonymous class, this is the anonymous object.'], ['It does not compile', 'Both are valid Supplier implementations.']], answer: 0, explanation: 'Lambdas do not introduce a new this; anonymous classes do.', verified: 'compiled' }),
  mcq({ ...q(IL), id: 'java.il.q4', type: 'code-output', difficulty: 'easy', stem: 'What does this program print?', code: java(`import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        List<String> words = List.of("stream", "map", "filter", "sum", "lambda");
        String out = words.stream()
            .filter(w -> w.length() > 3)
            .map(String::toUpperCase)
            .sorted()
            .collect(Collectors.joining(","));
        System.out.println(out);
    }
}`, 'Java', 'FILTER,LAMBDA,STREAM'), options: ['FILTER,LAMBDA,STREAM', ['STREAM,FILTER,LAMBDA', 'sorted() orders them alphabetically.'], ['FILTER,LAMBDA,MAP,STREAM,SUM', 'The filter keeps only words longer than 3 characters.'], ['filter,lambda,stream', 'map(String::toUpperCase) runs before collecting.']], answer: 0, explanation: 'filter keeps stream, filter, lambda; map upper-cases; sorted orders; joining concatenates with commas.', verified: 'compiled' }),
  mcq({ ...q(IL), id: 'java.il.q5', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: java(`import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        Stream<Integer> s = Stream.of(1, 2, 3, 4)
            .peek(x -> System.out.print("p" + x + " "))
            .filter(x -> x % 2 == 0);
        System.out.print("built ");
        System.out.println(s.findFirst().get());
    }
}`, 'Java', 'built p1 p2 2'), options: ['built p1 p2 2', ['p1 p2 p3 p4 built 2', 'Intermediate operations are lazy: nothing runs until findFirst.'], ['built p1 p2 p3 p4 2', 'Elements flow one at a time and findFirst stops at the first match.'], ['built 2', 'peek runs for each element that is pulled through the pipeline.']], answer: 0, explanation: 'Laziness delays all work until the terminal operation; short-circuiting stops after the first even element.', verified: 'compiled' }),
  mcq({ ...q(IL), id: 'java.il.q6', type: 'scenario', difficulty: 'medium', stem: 'An Activity-like screen object registers `new Listener() { ... }` (an anonymous class created in an instance method) with an application-wide event bus and never unregisters. What is the consequence?', options: ['The anonymous class holds a reference to the screen, so the bus keeps every old screen reachable (a memory leak)', ['Nothing: anonymous classes have no reference to their creator', 'One created in an instance method captures the outer instance.'], ['A compile error', 'It compiles.'], ['The listener is garbage collected immediately', 'The bus still references it.']], answer: 0, explanation: 'Unregister on close, or use a static nested class with a WeakReference to the screen.' }),
];

// ---------------------------------------------------------------------------------------
const SP = 'java.solid-patterns';
const solid = javaTopic({
  id: SP, title: 'SOLID and Design Patterns in Java', level: 'core', estMinutes: 60, prerequisites: ['java.abstract-interfaces'], related: ['cpp.solid-patterns', 'java.inner-lambdas', 'java.abstract-interfaces'],
  summary: 'SOLID principles and common patterns in Java idioms.',
  objectives: ['State each SOLID principle with a Java example and spot violations in code.', 'Implement Singleton correctly (enum, holder idiom, double-checked locking with volatile) and know its downsides.', 'Apply Factory, Builder, Strategy, Observer, Decorator and Adapter, and recognise them in the JDK.', 'Use lambdas to express Strategy and Observer with less boilerplate.'],
  sections: [
    { id: 'solid', kind: 'concept', title: 'SOLID with Java examples', bodyMd: `| Principle | Meaning | Java example |
|---|---|---|
| **S**ingle responsibility | one reason to change | split \`InvoiceService\` (calculation) from \`InvoicePdfWriter\` (formatting) |
| **O**pen/closed | extend without editing | a new \`PaymentMethod\` implementation instead of another \`case\` in a switch |
| **L**iskov substitution | subtypes honour the base contract | a \`Square extends Rectangle\` whose \`setWidth\` also changes height breaks callers; an \`ImmutableList\` that throws on \`add\` weakens \`List\` |
| **I**nterface segregation | small, focused interfaces | \`Readable\` and \`Writable\` instead of one \`FileOps\` with ten methods |
| **D**ependency inversion | depend on abstractions, inject them | \`OrderService(OrderRepository repo)\`, with \`JdbcOrderRepository\` or an in-memory fake injected |

\`\`\`java
interface OrderRepository { void save(Order o); }
final class OrderService {
    private final OrderRepository repo;                      // abstraction, not a concrete class
    OrderService(OrderRepository repo) { this.repo = repo; }   // constructor injection: easy to test
    void place(Order o) { /* validate */ repo.save(o); }
}
\`\`\`` },
    { id: 'patterns', kind: 'concept', title: 'Patterns you are expected to know', bodyMd: `| Pattern | Intent | Java idiom / JDK example |
|---|---|---|
| **Singleton** | one instance | \`enum Registry { INSTANCE; }\` (serialisation- and reflection-safe), or the lazy holder idiom |
| **Factory** | hide which class is created | static factories: \`List.of\`, \`Integer.valueOf\`, \`Calendar.getInstance\` |
| **Builder** | readable construction with many optional parameters | \`StringBuilder\`, \`HttpClient.newBuilder()\`, Lombok \`@Builder\` |
| **Strategy** | swap an algorithm | \`Comparator\` passed to \`sort\`; any lambda parameter |
| **Observer** | notify subscribers of changes | listeners, \`PropertyChangeListener\`, reactive streams (\`java.util.Observer\` is deprecated) |
| **Decorator** | add behaviour by wrapping | \`new BufferedReader(new FileReader(f))\`, \`Collections.unmodifiableList\` |
| **Adapter** | convert one interface to another | \`InputStreamReader\` (bytes → chars), \`Arrays.asList\` |
| **Template method** | fixed algorithm, overridable steps | \`AbstractList\` (implement \`get\` and \`size\`) |
| **Iterator** | traverse without exposing structure | \`Iterable\`/\`Iterator\` |

**Thread-safe lazy singleton without enum:**

\`\`\`java
final class Config {
    private Config() {}
    private static class Holder { static final Config INSTANCE = new Config(); }   // loaded on first use
    static Config get() { return Holder.INSTANCE; }                              // class init is thread-safe
}
\`\`\`

Double-checked locking also works, but only with a **volatile** field; without it another thread can see a non-null reference to a partly constructed object. Singletons are global state: prefer dependency injection where you can, for testability.` },
    { id: 'code', kind: 'code', title: 'Builder and Strategy in one program', bodyMd: 'The builder validates and produces an immutable Order; the shipping rule is a strategy passed as a lambda.', code: [java(`
import java.util.function.*;

public class Main {
    static final class Order {
        final String item; final int qty; final boolean express;
        private Order(Builder b) { item = b.item; qty = b.qty; express = b.express; }
        static Builder builder(String item) { return new Builder(item); }

        static final class Builder {
            private final String item;
            private int qty = 1;
            private boolean express;
            private Builder(String item) { this.item = item; }
            Builder qty(int q) { if (q <= 0) throw new IllegalArgumentException("qty"); qty = q; return this; }
            Builder express() { express = true; return this; }
            Order build() { return new Order(this); }
        }
    }

    // Strategy: the shipping rule is swappable without touching checkout()
    static int checkout(Order o, int unitPrice, IntUnaryOperator shipping) {
        int subtotal = o.qty * unitPrice;
        return subtotal + shipping.applyAsInt(subtotal);
    }

    public static void main(String[] args) {
        Order o = Order.builder("pen").qty(3).express().build();
        IntUnaryOperator standard = s -> s >= 100 ? 0 : 40;
        IntUnaryOperator express = s -> 99;
        System.out.println(checkout(o, 50, o.express ? express : standard) + " " + checkout(o, 50, standard));
    }
}`, 'Java', '249 150')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and Java vs C++', bodyMd: `1. Naming patterns instead of solving the problem: use one only when it removes a real change point.
2. Singleton as a global variable that makes code untestable.
3. Double-checked locking without \`volatile\`.
4. Inheritance for reuse where composition (Strategy, Decorator) is more flexible.
5. "Interfaces for everything" with a single implementation and no test seam.

**Java vs C++:** Java's enum singleton and static factories have no direct C++ equivalent (C++ uses a function-local static, the "Meyers singleton", which is thread-safe since C++11). Java Strategy/Observer are usually lambdas over functional interfaces; C++ uses \`std::function\` or templates. Decorators in Java wrap through interfaces; C++ can also use templates (static decoration).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain the SOLID principles with examples.', answerMd: 'Single responsibility: a class has one reason to change (separate pricing from PDF formatting). Open/closed: add a new PaymentMethod class instead of editing a switch. Liskov: a subtype must work wherever the base is expected (Square extends Rectangle breaks setWidth expectations). Interface segregation: several small interfaces instead of one fat one. Dependency inversion: high-level classes depend on interfaces injected through constructors, so implementations can be swapped and faked in tests.' },
    { id: 'iq2', q: 'How do you write a thread-safe singleton in Java?', answerMd: 'Simplest and safest: a single-element enum, which the JVM guarantees is created once and which resists serialisation and reflection attacks. For lazy initialisation, use the holder idiom (a private static nested class holding the instance, initialised on first access, relying on thread-safe class initialisation). Double-checked locking also works but requires the field to be volatile.' },
    { id: 'iq3', q: 'Where do you see the Decorator pattern in the JDK?', answerMd: 'In java.io: BufferedInputStream, DataInputStream and BufferedReader wrap another stream of the same interface and add buffering or parsing. Collections.unmodifiableList and synchronizedList also decorate a list.' },
    { id: 'iq4', q: 'Why use a Builder instead of a constructor?', answerMd: 'When an object has many parameters, especially optional ones, telescoping constructors are unreadable and error-prone (which int is which?). A builder names each value, supplies defaults, validates in build(), and produces an immutable object.' },
    { id: 'iq5', q: 'Strategy vs Template Method?', answerMd: 'Both vary part of an algorithm. Template method uses inheritance: the base class fixes the steps and subclasses override some. Strategy uses composition: the algorithm is an object (often a lambda) passed in, so it can be changed at run time and combined freely. Prefer Strategy unless the steps share a lot of state.' },
  ],
  revision: { notesMd: `- SRP one reason to change; OCP extend, don't edit; LSP honour the contract; ISP small interfaces; DIP depend on injected abstractions.
- Singleton: enum, or holder idiom; DCL only with volatile; prefer DI.
- Factory (List.of), Builder (optional params, immutable result), Strategy (Comparator/lambdas), Observer (listeners), Decorator (java.io wrappers), Adapter (InputStreamReader).
- Composition over inheritance.`, flashcards: [
    { id: 'f1', front: 'Safest Java singleton?', backMd: 'A single-element enum.' },
    { id: 'f2', front: 'Why volatile in double-checked locking?', backMd: 'To stop other threads from seeing a partly constructed object through a non-null reference.' },
    { id: 'f3', front: 'Pattern behind `new BufferedReader(new FileReader(f))`?', backMd: 'Decorator.' },
    { id: 'f4', front: 'Which SOLID principle does `Square extends Rectangle` usually break?', backMd: 'Liskov substitution.' },
    { id: 'f5', front: 'What is Comparator an example of?', backMd: 'The Strategy pattern.' },
  ] },
  resources: [{ title: 'SOLID (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SOLID', kind: 'article' }, { title: 'Refactoring.Guru: design patterns catalog', url: 'https://refactoring.guru/design-patterns/catalog', kind: 'article' }],
});

const spMcqs: MCQ[] = [
  mcq({ ...q(SP), id: 'java.sp.q1', type: 'scenario', difficulty: 'medium', stem: '`class Square extends Rectangle` overrides setWidth to also set the height. A caller does `r.setWidth(4); r.setHeight(5);` and expects area 20, but gets 25 when r is a Square. Which principle is violated?', options: ['Liskov substitution', ['Single responsibility', 'Square has one responsibility; the problem is substitutability.'], ['Interface segregation', 'Interface size is not the issue.'], ['Dependency inversion', 'No dependency is involved.']], answer: 0, explanation: 'A subtype must keep the base type\'s contract (width and height are independent); Square does not, so it is not a valid Rectangle subtype.' }),
  mcq({ ...q(SP), id: 'java.sp.q2', type: 'code-output', difficulty: 'easy', stem: 'What does this program print?', code: java(`public class Main {
    enum Registry {
        INSTANCE;
        private int hits;
        int hit() { return ++hits; }
    }
    public static void main(String[] args) {
        Registry.INSTANCE.hit();
        Registry r = Registry.valueOf("INSTANCE");
        r.hit();
        System.out.println(Registry.INSTANCE.hit() + " " + (r == Registry.INSTANCE));
    }
}`, 'Java', '3 true'), options: ['3 true', ['1 false', 'valueOf returns the same single instance.'], ['2 true', 'There are three calls to hit() on one object.'], ['3 false', 'Enum constants are unique, so == is true.']], answer: 0, explanation: 'Each enum constant exists exactly once per class loader, which is why an enum is the simplest singleton.', verified: 'compiled' }),
  mcq({ ...q(SP), id: 'java.sp.q3', type: 'concept', difficulty: 'hard', stem: 'In double-checked locking (`if (inst == null) synchronized (...) { if (inst == null) inst = new X(); }`), why must `inst` be volatile?', options: ['Without it, another thread may see a non-null reference to an object whose constructor writes are not yet visible', ['Without it, two instances are always created', 'The inner check under the lock prevents that.'], ['volatile makes the constructor run faster', 'It is about visibility and ordering.'], ['It is not needed since Java 5', 'Java 5 made it correct only with volatile.']], answer: 0, explanation: 'volatile forbids the reordering that publishes the reference before the object is initialised, and makes the write visible to other threads.' }),
  mcq({ ...q(SP), id: 'java.sp.q4', type: 'pattern', difficulty: 'medium', stem: 'Which patterns are combined in `new BufferedReader(new InputStreamReader(System.in))`?', options: ['Decorator (BufferedReader adds buffering to a Reader) around an Adapter (InputStreamReader turns an InputStream into a Reader)', ['Factory and Singleton', 'No object creation is hidden and nothing is single-instance.'], ['Observer and Strategy', 'No subscriptions or swappable algorithm.'], ['Two Decorators', 'InputStreamReader changes the interface (bytes to chars), which is adaptation.']], answer: 0, explanation: 'A decorator keeps the same interface and adds behaviour; an adapter converts one interface into another.' }),
  mcq({ ...q(SP), id: 'java.sp.q5', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`import java.util.*;
import java.util.function.*;

public class Main {
    static class Stock {
        private final List<Consumer<Integer>> listeners = new ArrayList<>();
        private int price;
        void subscribe(Consumer<Integer> l) { listeners.add(l); }
        void setPrice(int p) {
            if (p == price) return;
            price = p;
            listeners.forEach(l -> l.accept(p));
        }
    }
    public static void main(String[] args) {
        Stock s = new Stock();
        StringBuilder log = new StringBuilder();
        s.subscribe(p -> log.append("A").append(p).append(' '));
        s.setPrice(10);
        s.subscribe(p -> log.append("B").append(p).append(' '));
        s.setPrice(10);
        s.setPrice(12);
        System.out.println(log.toString().trim());
    }
}`, 'Java', 'A10 A12 B12'), options: ['A10 A12 B12', ['A10 A10 B10 A12 B12', 'Setting the same price returns early without notifying.'], ['A10 B10 A12 B12', 'B subscribed after the first change, so it missed it.'], ['A12 B12', 'A was notified of the first change to 10.']], answer: 0, explanation: 'Observers receive only changes that happen after they subscribe, and this subject skips no-op updates.', verified: 'compiled' }),
  mcq({ ...q(SP), id: 'java.sp.q6', type: 'design', difficulty: 'medium', stem: 'PaymentService.pay() has a switch on "card", "upi" and "wallet", and every new method means editing it. Best refactor?', options: ['A PaymentMethod interface with one implementation per method, looked up from a Map<String, PaymentMethod> injected into the service', ['Add a default branch that throws', 'Still requires editing the switch for each new method.'], ['Move the switch into a static utility class', 'Same switch, different file.'], ['Make PaymentService abstract and subclass it per method', 'One service per method duplicates the shared flow.']], answer: 0, explanation: 'Open/closed via Strategy: a new method is a new class registered in the map; the service is not edited.' }),
];

export const topics: Topic[] = [generics, collections, memory, lambdas, solid];
export const mcqs: MCQ[] = [...geMcqs, ...ciMcqs, ...mgMcqs, ...ilMcqs, ...spMcqs];
