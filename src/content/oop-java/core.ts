import type { MCQ, Topic } from '../schema';
import { java, javaErr, mcq } from '../helpers';
import { API, JLS, TUT, javaTopic, q } from './common';

// Java batch 2: classes and references, access and packages, inheritance, abstract classes and
// interfaces, static and final. Output and compile-error questions are checked with javac/java.

// ---------------------------------------------------------------------------------------
const CO = 'java.classes-objects';
const classes = javaTopic({
  id: CO, title: 'Classes, Objects and References', level: 'foundation', estMinutes: 40, prerequisites: [], related: ['java.constructors-init', 'java.object-equality', 'cpp.classes-objects'],
  summary: 'References vs objects, this, and pass-by-value of references.',
  objectives: ['Distinguish a reference variable from the object it refers to, and predict aliasing effects.', 'Explain why Java is always pass-by-value, including for object references.', 'Use this for fields, constructor chaining and passing the current object.', 'Know where objects and local variables live (heap vs stack) and what null means.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Variables hold references, not objects', bodyMd: `\`\`\`java
Point a = new Point(1, 2);   // a holds a reference to a Point object on the heap
Point b = a;                 // b refers to the SAME object (aliasing)
b.x = 10;                    // visible through a as well: a.x == 10
b = new Point(0, 0);         // b now refers to a different object; a is unaffected
\`\`\`

- \`new\` creates an object on the **heap** and returns a reference to it.
- A variable of a class type holds a **reference** (or \`null\`); assignment copies the reference, never the object.
- Local variables (primitives and references) live in the method's **stack frame**; objects live on the heap and are reclaimed by the **garbage collector** when unreachable.
- Calling a method on \`null\` throws \`NullPointerException\`.

**this** refers to the current object: disambiguate fields from parameters (\`this.x = x\`), call another constructor (\`this(0, 0)\`, first statement only), or pass the current object (\`listener.register(this)\`).` },
    { id: 'pass', kind: 'concept', title: 'Java is always pass-by-value', bodyMd: `Java copies the **value** of every argument. For an object argument, that value is a **reference**, so:

- The method can **mutate the object** through the copied reference, and the caller sees the change.
- The method **cannot make the caller's variable refer to a different object**: reassigning the parameter only changes the local copy.

\`\`\`java
static void grow(List<Integer> list) { list.add(4); }          // caller sees 4
static void replace(List<Integer> list) { list = new ArrayList<>(); list.add(9); }  // caller unaffected
\`\`\`

This is why a "swap two Integers" method cannot work in Java, while it does in C++ with references (\`void swap(int&, int&)\`).` },
    { id: 'code', kind: 'code', title: 'Aliasing and pass-by-value in one program', bodyMd: 'Follow which object each variable refers to.', code: [java(`
public class Main {
    static class Box { int v; Box(int v) { this.v = v; } }

    static void mutate(Box b) { b.v++; }                 // changes the shared object
    static void rebind(Box b) { b = new Box(100); }       // changes only the local copy

    public static void main(String[] args) {
        Box a = new Box(1);
        Box alias = a;
        alias.v = 5;
        mutate(a);
        rebind(a);
        System.out.println(a.v + " " + (alias == a));
    }
}`, 'Java', '6 true')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and Java vs C++', bodyMd: `1. Thinking \`b = a\` copies the object (use a copy constructor or a copy method).
2. Saying "objects are passed by reference": references are passed by value.
3. Comparing objects with \`==\` (identity) instead of \`equals\` (value) — see equals and hashCode.
4. Forgetting that a field of a class type defaults to \`null\`, causing NullPointerExceptions.
5. Expecting local variables to be initialised by default (they are not; the compiler rejects reading them before assignment).

**Java vs C++:** C++ objects can be values on the stack, copied on assignment, and passed by reference with \`&\`. Java has only references to heap objects (plus primitives), garbage collection instead of destructors, and no pointer arithmetic.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Is Java pass-by-value or pass-by-reference?', answerMd: 'Always pass-by-value. For objects the value passed is a copy of the reference, so a method can modify the object\'s state but cannot make the caller\'s variable point to a different object. Reassigning a parameter inside a method has no effect on the caller.' },
    { id: 'iq2', q: 'What is the difference between a reference and an object?', answerMd: 'An object is the instance on the heap with its fields; a reference is a value that points to an object (or is null). Several references can point to the same object (aliasing), and an object becomes eligible for garbage collection when no live reference can reach it.' },
    { id: 'iq3', q: 'Where are objects and local variables stored?', answerMd: 'Objects (including arrays) are allocated on the heap. Local variables, including references, live in the stack frame of the method call. (The JIT may scalar-replace objects that do not escape, but conceptually objects are on the heap.)' },
    { id: 'iq4', q: 'Why can\'t you write a swap(Integer a, Integer b) method that swaps the caller\'s variables?', answerMd: 'The method receives copies of the references; swapping the copies does not change the caller\'s variables, and Integer is immutable so the objects cannot be changed either. You would swap elements of an array or fields of a holder object instead.' },
  ],
  revision: { notesMd: `- Variables hold references; assignment copies the reference (aliasing).
- Always pass-by-value: methods can mutate the object, not rebind the caller's variable.
- Objects on the heap, locals in stack frames, GC reclaims unreachable objects.
- this: field disambiguation, this(...) chaining (first statement), passing the current object.
- Fields default to null/0/false; locals must be assigned before use.`, flashcards: [
    { id: 'f1', front: 'After `Box b = a; b.v = 5;` what is a.v?', backMd: '5: both refer to the same object.' },
    { id: 'f2', front: 'Can a method make the caller\'s variable refer to a new object?', backMd: 'No: it only has a copy of the reference.' },
    { id: 'f3', front: 'Default value of an object field?', backMd: 'null.' },
    { id: 'f4', front: 'Where must this(...) appear in a constructor?', backMd: 'As the first statement.' },
    { id: 'f5', front: 'What does == compare for objects?', backMd: 'Reference identity (same object).' },
  ] },
  resources: [TUT, JLS],
});

const coMcqs: MCQ[] = [
  mcq({ ...q(CO), id: 'java.co.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`import java.util.*;

public class Main {
    static void a(List<Integer> l) { l.add(4); }
    static void b(List<Integer> l) { l = new ArrayList<>(); l.add(9); }
    public static void main(String[] args) {
        List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
        a(list);
        b(list);
        System.out.println(list);
    }
}`, 'Java', '[1, 2, 3, 4]'), options: ['[1, 2, 3, 4]', ['[9]', 'b reassigns only its local copy of the reference.'], ['[1, 2, 3, 4, 9]', '9 is added to a new list that the caller never sees.'], ['[1, 2, 3]', 'a mutates the shared list.']], answer: 0, explanation: 'Java passes a copy of the reference: mutation through it is visible, rebinding it is not.', verified: 'compiled' }),
  mcq({ ...q(CO), id: 'java.co.q2', type: 'code-output', difficulty: 'easy', stem: 'What does this program print?', code: java(`public class Main {
    static class P { int x; P(int x) { this.x = x; } }
    public static void main(String[] args) {
        P a = new P(1);
        P b = a;
        b.x = 7;
        b = new P(3);
        System.out.println(a.x + " " + b.x);
    }
}`, 'Java', '7 3'), options: ['7 3', ['1 3', 'b.x = 7 changed the object a also refers to.'], ['3 3', 'Rebinding b does not affect a.'], ['7 7', 'b now refers to a new object with x = 3.']], answer: 0, explanation: 'b first aliases a\'s object (setting x to 7), then is rebound to a new object.', verified: 'compiled' }),
  mcq({ ...q(CO), id: 'java.co.q3', type: 'compile-error', difficulty: 'easy', stem: 'Why does this not compile?', code: javaErr(`static int f(boolean flag) {
    int count;
    if (flag) count = 1;
    return count;   // here
}`), options: ['count might not have been initialised: local variables have no default value', ['int cannot be returned', 'It can.'], ['if needs braces', 'Braces are optional.'], ['count must be static', 'Locals cannot be static.']], answer: 0, explanation: 'Fields get default values; local variables must be definitely assigned before they are read.' }),
  mcq({ ...q(CO), id: 'java.co.q4', type: 'concept', difficulty: 'medium', stem: 'Which statement about Java argument passing is correct?', options: ['Arguments are passed by value; for objects the value is a reference', ['Objects are passed by reference', 'The reference itself is copied, so rebinding the parameter does not affect the caller.'], ['Primitives are passed by reference', 'Primitives are copied.'], ['It depends on whether the class is final', 'Unrelated.']], answer: 0, explanation: 'Mutation through the reference is visible; reassignment is not.' }),
  mcq({ ...q(CO), id: 'java.co.q5', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    String name;
    Main(String name) { name = name; }
    public static void main(String[] args) {
        System.out.println(new Main("ana").name);
    }
}`, 'Java', 'null'), options: ['null', ['ana', 'name = name assigns the parameter to itself; the field is never set.'], ['It does not compile', 'Self-assignment is legal.'], ['An empty line', 'A null String prints as "null".']], answer: 0, explanation: 'The parameter shadows the field. Write this.name = name.', verified: 'compiled' }),
  mcq({ ...q(CO), id: 'java.co.q6', type: 'concept', difficulty: 'easy', stem: 'When does an object become eligible for garbage collection?', options: ['When it is no longer reachable from any live reference', ['When the method that created it returns', 'It may still be referenced elsewhere.'], ['When System.gc() is called', 'gc() is only a hint, and only unreachable objects are collected.'], ['When its reference variable is set to null, always', 'Only if no other reference reaches it.']], answer: 0, explanation: 'Reachability from GC roots (stacks, static fields) decides; the timing of collection is up to the JVM.' }),
];

// ---------------------------------------------------------------------------------------
const AP = 'java.access-packages';
const access = javaTopic({
  id: AP, title: 'Access Modifiers and Packages', level: 'foundation', estMinutes: 35, prerequisites: [CO], related: ['java.inheritance', 'cpp.access-encapsulation', 'java.solid-patterns'],
  summary: 'private, default, protected, public and encapsulation.',
  objectives: ['State the visibility of private, package-private (default), protected and public members.', 'Explain the protected subtlety for subclasses in other packages.', 'Organise classes into packages and use imports correctly.', 'Design encapsulated classes (private fields, validated operations, immutability where possible).'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'The four access levels', bodyMd: `| Modifier | Same class | Same package | Subclass in another package | Everywhere |
|---|---|---|---|---|
| \`private\` | yes | no | no | no |
| (none) package-private | yes | yes | no | no |
| \`protected\` | yes | yes | yes (through inheritance) | no |
| \`public\` | yes | yes | yes | yes |

- Top-level classes can only be \`public\` or package-private; one \`public\` top-level class per file, named like the file.
- **protected in another package:** a subclass can access the protected member through **its own type** (\`this.field\` or another \`Sub\` reference), not through an arbitrary \`Base\` reference.
- Access is checked per class, so a method can read the private fields of another object of the same class (as in \`equals\`).` },
    { id: 'packages', kind: 'concept', title: 'Packages and imports', bodyMd: `A **package** is a namespace and a unit of access control: \`package com.prepforge.billing;\` at the top of the file, mirrored by the directory structure.

- \`import java.util.List;\` imports one type; \`import java.util.*;\` imports all public types of that package (not subpackages). \`java.lang\` is imported automatically.
- Imports are a compile-time convenience: they do not load or include code.
- \`import static java.lang.Math.max;\` imports a static member.
- Name clashes (\`java.util.Date\` vs \`java.sql.Date\`) are resolved with fully qualified names.
- Java 9 modules (\`module-info.java\`) add a further layer: a package is visible outside its module only if exported.` },
    { id: 'encapsulation', kind: 'example', title: 'Encapsulation in practice', bodyMd: `\`\`\`java
public final class Money {
    private final long paise;                 // private and final: cannot change after construction
    private Money(long paise) { this.paise = paise; }
    public static Money ofRupees(long r) { return new Money(Math.multiplyExact(r, 100)); }
    public Money plus(Money o) { return new Money(Math.addExact(paise, o.paise)); }   // returns a new object
    public long paise() { return paise; }
}
\`\`\`

Guidelines:
1. Fields **private**, operations public.
2. Prefer **immutable** value classes (final fields, no setters, final class).
3. Return **defensive copies** (or unmodifiable views) of mutable internals: returning the internal \`List\` lets callers modify it.
4. Use the narrowest access that works; package-private is a good default for helpers.` },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and Java vs C++', bodyMd: `1. Forgetting that package-private (no modifier) is not private: every class in the package can access it.
2. Assuming protected is private-plus-subclasses: in Java it also opens access to the whole package.
3. Leaking mutable internals through getters.
4. Making everything public "for testing".

**Java vs C++:** C++ has no package-private level but has \`friend\`; C++ protected does not grant package access; C++ inheritance itself has access modes (public/protected/private), Java's does not.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What are the Java access modifiers and their scopes?', answerMd: 'private: the class only. Package-private (no modifier): the class and its package. protected: the package plus subclasses in other packages (through the subclass type). public: everywhere.' },
    { id: 'iq2', q: 'How does protected work across packages?', answerMd: 'A subclass in another package can access an inherited protected member through references of its own type (or subtypes), for example this.count or otherSub.count, but not through a plain Base reference such as new Base().count.' },
    { id: 'iq3', q: 'How do you make a class immutable?', answerMd: 'Make the class final (or use a private constructor with factories), all fields private and final, no setters, initialise everything in the constructor, and make defensive copies of mutable inputs and outputs. String, Integer and LocalDate are examples.' },
    { id: 'iq4', q: 'What does an import statement do at run time?', answerMd: 'Nothing. Imports only let you refer to types by their simple names at compile time; classes are loaded lazily by the class loader when first used.' },
  ],
  revision: { notesMd: `- private < package-private < protected < public.
- protected = package + subclasses (via the subclass type in other packages).
- One public top-level class per file; java.lang auto-imported; imports are compile-time only.
- Encapsulation: private fields, validated operations, immutability, defensive copies.`, flashcards: [
    { id: 'f1', front: 'Visibility of a member with no modifier?', backMd: 'Package-private: the same package only.' },
    { id: 'f2', front: 'Can classes in the same package access protected members?', backMd: 'Yes.' },
    { id: 'f3', front: 'Which package is imported automatically?', backMd: 'java.lang.' },
    { id: 'f4', front: 'Possible access modifiers for a top-level class?', backMd: 'public or package-private.' },
    { id: 'f5', front: 'Why return a copy of an internal list from a getter?', backMd: 'So callers cannot modify the object\'s internal state.' },
  ] },
  resources: [{ title: 'Controlling access to members (The Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html', kind: 'official-docs' }, JLS],
});

const apMcqs: MCQ[] = [
  mcq({ ...q(AP), id: 'java.ap.q1', type: 'concept', difficulty: 'easy', stem: 'A field has no access modifier. Which code can access it?', options: ['Any class in the same package', ['Only the declaring class', 'That is private.'], ['Any subclass anywhere', 'Subclasses in other packages cannot.'], ['Everything', 'That is public.']], answer: 0, explanation: 'No modifier means package-private.' }),
  mcq({ ...q(AP), id: 'java.ap.q2', type: 'concept', difficulty: 'medium', stem: 'Which statement about Java protected members is true?', options: ['They are accessible from the same package and from subclasses in other packages', ['They are accessible only from subclasses', 'Java protected also includes the package.'], ['They are accessible everywhere', 'That is public.'], ['They behave exactly like C++ protected', 'C++ has no package access.']], answer: 0, explanation: 'protected is wider than package-private.' }),
  mcq({ ...q(AP), id: 'java.ap.q3', type: 'compile-error', difficulty: 'easy', stem: 'Why does this not compile?', code: javaErr(`static class Account {
    private long balance = 100;
}
static long peek() {
    Account a = new Account();
    return a.balance + new Object().hashCode() * 0;
}
static class Thief {
    long steal(Account a) { return a.balance; }
}
static void probe() {
    Object o = new Account();
    long x = ((Account) o).balance;
    int y = o.balance;   // here
}`), options: ['o is declared as Object, which has no field named balance', ['balance is private, so the nested classes cannot read it', 'Nested classes in the same top-level class may access private members.'], ['Casting Object to Account is illegal', 'It is legal.'], ['long cannot be assigned to int', 'The first error is the missing field on Object.']], answer: 0, explanation: 'Members are looked up by the static type of the expression. (The private accesses compile because all these classes are nested in the same top-level class.)' }),
  mcq({ ...q(AP), id: 'java.ap.q4', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`import java.util.*;

public class Main {
    static class Team {
        private final List<String> members = new ArrayList<>();
        void add(String m) { members.add(m); }
        List<String> leaky() { return members; }
        List<String> safe() { return Collections.unmodifiableList(members); }
    }
    public static void main(String[] args) {
        Team t = new Team();
        t.add("ana");
        t.leaky().add("intruder");
        try { t.safe().add("x"); } catch (UnsupportedOperationException e) { System.out.print("blocked "); }
        System.out.println(t.safe());
    }
}`, 'Java', 'blocked [ana, intruder]'), options: ['blocked [ana, intruder]', ['blocked [ana]', 'The leaky getter returned the internal list, which the caller modified.'], ['[ana, intruder, x]', 'The unmodifiable view rejects add.'], ['It does not compile', 'Valid code.']], answer: 0, explanation: 'Returning internal mutable collections breaks encapsulation even when the field is private and final.', verified: 'compiled' }),
  mcq({ ...q(AP), id: 'java.ap.q5', type: 'concept', difficulty: 'easy', stem: 'What happens at run time because of `import java.util.*;`?', options: ['Nothing: imports only affect name resolution at compile time', ['Every class in java.util is loaded', 'Classes are loaded lazily when used.'], ['The program becomes slower to start', 'No run-time effect.'], ['Subpackages are imported too', 'Wildcard imports do not include subpackages.']], answer: 0, explanation: 'Imports are syntactic sugar for fully qualified names.' }),
  mcq({ ...q(AP), id: 'java.ap.q6', type: 'concept', difficulty: 'medium', stem: 'Which is NOT required for an immutable Java class?', options: ['Every method must be static', ['Fields are private and final', 'Required.'], ['No setters', 'Required.'], ['Defensive copies of mutable inputs and outputs', 'Required when fields hold mutable objects.']], answer: 0, explanation: 'Instance methods are fine as long as they never modify state (they return new objects).' }),
];

// ---------------------------------------------------------------------------------------
const IN = 'java.inheritance';
const inheritance = javaTopic({
  id: IN, title: 'Inheritance', level: 'core', estMinutes: 45, prerequisites: ['java.constructors-init'], related: ['java.polymorphism', 'java.abstract-interfaces', 'cpp.inheritance'],
  summary: 'extends, super, and the Object class.',
  objectives: ['Use extends and super for constructors and overridden methods.', 'Predict constructor chaining order and the implicit super() call.', 'Know what every class inherits from Object (equals, hashCode, toString, getClass) and when to override them.', 'Explain why Java has single class inheritance and how final prevents extension.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'extends and super', bodyMd: `\`\`\`java
class Vehicle {
    protected final String id;
    Vehicle(String id) { this.id = id; }
    String describe() { return "vehicle " + id; }
}
class Truck extends Vehicle {
    private final int capacity;
    Truck(String id, int capacity) {
        super(id);                       // must be the first statement
        this.capacity = capacity;
    }
    @Override String describe() { return super.describe() + " carrying " + capacity; }
}
\`\`\`

- A class extends **exactly one** class (single inheritance); every class implicitly extends \`Object\`.
- Every constructor starts with \`super(…)\` or \`this(…)\`; if you write neither, the compiler inserts \`super()\`. If the parent has no no-argument constructor, that is a compile error.
- \`super.method()\` calls the parent's version of an overridden method.
- Constructors are not inherited; private members are not accessible in the subclass (but they exist in the object).
- \`final class\` cannot be extended (\`String\`, \`Integer\`); a \`final\` method cannot be overridden.` },
    { id: 'object', kind: 'concept', title: 'What every object inherits from Object', bodyMd: `| Method | Default behaviour | Override when |
|---|---|---|
| \`equals(Object)\` | identity (\`this == o\`) | the class has value semantics |
| \`hashCode()\` | identity-based | always together with equals |
| \`toString()\` | \`ClassName@hexHash\` | for readable logs and debugging |
| \`getClass()\` | runtime class (final) | never |
| \`clone()\` | protected, shallow copy, needs \`Cloneable\` | rarely; prefer copy constructors |
| \`wait/notify/notifyAll\` | monitor methods | low-level concurrency |
| \`finalize()\` | deprecated | never |

Always annotate overrides with \`@Override\`: the compiler then rejects accidental overloads such as \`equals(Point other)\`.` },
    { id: 'code', kind: 'code', title: 'Constructor chaining order', bodyMd: 'Field initialisers of each class run after its super constructor returns and before its own constructor body.', code: [java(`
public class Main {
    static class A {
        A() { System.out.print("A() "); }
    }
    static class B extends A {
        String f = init("B.field ");
        B() { super(); System.out.print("B() "); }
        static String init(String s) { System.out.print(s); return s; }
    }
    static class C extends B {
        C() { System.out.print("C()"); }          // implicit super() first
    }
    public static void main(String[] args) {
        new C();
        System.out.println();
    }
}`, 'Java', 'A() B.field B() C()')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and Java vs C++', bodyMd: `1. Calling an overridable method from a constructor: the subclass override runs before the subclass's fields are initialised.
2. Forgetting that the implicit \`super()\` needs a no-arg parent constructor.
3. Overloading instead of overriding (\`equals(Point)\` instead of \`equals(Object)\`); use @Override.
4. Using inheritance for code reuse where composition fits (a \`Stack extends Vector\` in the JDK is a famous regret).

**Java vs C++:** single class inheritance, all non-static, non-final, non-private methods are virtual by default, no inheritance access modes, no destructors (constructors chain, there is no reverse chain at the end).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Why doesn\'t Java support multiple inheritance of classes?', answerMd: 'To avoid the diamond problem (ambiguous inherited state and implementations) and keep the object model simple. Java allows a class to implement several interfaces; since Java 8, conflicting default methods must be resolved explicitly by the class.' },
    { id: 'iq2', q: 'What happens if the superclass has no no-argument constructor?', answerMd: 'Every subclass constructor must explicitly call super(…) with arguments as its first statement; otherwise the compiler inserts super() and reports an error because no such constructor exists.' },
    { id: 'iq3', q: 'Which methods of Object do you usually override?', answerMd: 'equals and hashCode together for value types, and toString for readability. getClass is final; clone and finalize are best avoided.' },
    { id: 'iq4', q: 'Why is calling an overridable method from a constructor dangerous?', answerMd: 'Dynamic dispatch already selects the subclass override, but the subclass constructor has not run yet, so its fields still have default values (null, 0). The override can then misbehave or throw NullPointerException.' },
  ],
  revision: { notesMd: `- Single class inheritance; implicit extends Object.
- Constructors start with super(…) or this(…); implicit super() otherwise.
- Order: super constructor → this class's field initialisers → constructor body.
- super.m() calls the parent's version; @Override catches signature mistakes.
- final class / final method block extension / overriding.`, flashcards: [
    { id: 'f1', front: 'What does the compiler insert if a constructor has no super(...) or this(...)?', backMd: 'An implicit super() call.' },
    { id: 'f2', front: 'Default Object.equals?', backMd: 'Reference identity (this == o).' },
    { id: 'f3', front: 'Can a final class be extended?', backMd: 'No.' },
    { id: 'f4', front: 'When do a subclass\'s field initialisers run?', backMd: 'After the super constructor returns, before the rest of the subclass constructor body.' },
    { id: 'f5', front: 'How many classes can a Java class extend?', backMd: 'One.' },
  ] },
  resources: [{ title: 'Inheritance (The Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/java/IandI/subclasses.html', kind: 'official-docs' }, API('Object', 'java/lang/Object.html')],
});

const inMcqs: MCQ[] = [
  mcq({ ...q(IN), id: 'java.in.q1', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: javaErr(`static class Parent {
    Parent(int x) {}
}
static class Child extends Parent {
    Child() {   // here
    }
}`), options: ['The implicit super() call needs a no-argument Parent constructor, which does not exist', ['Child must declare a field', 'Unrelated.'], ['Nested classes cannot extend each other', 'They can.'], ['Constructors cannot be empty', 'They can.']], answer: 0, explanation: 'Call super(0) (or another int) explicitly as the first statement.' }),
  mcq({ ...q(IN), id: 'java.in.q2', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    static class Base {
        String name() { return "base"; }
        String greet() { return "hi " + name(); }
    }
    static class Derived extends Base {
        @Override String name() { return "derived"; }
        @Override String greet() { return super.greet() + "!"; }
    }
    public static void main(String[] args) {
        Base b = new Derived();
        System.out.println(b.greet());
    }
}`, 'Java', 'hi derived!'), options: ['hi derived!', ['hi base!', 'Inside Base.greet, name() still dispatches to the Derived override.'], ['hi derived', 'Derived.greet appends "!".'], ['hi base', 'Both overrides are used.']], answer: 0, explanation: 'super.greet() runs Base\'s code, but its call to name() is dynamically dispatched to Derived.', verified: 'compiled' }),
  mcq({ ...q(IN), id: 'java.in.q3', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: java(`public class Main {
    static class Base {
        Base() { show(); }
        void show() { System.out.print("base "); }
    }
    static class Derived extends Base {
        String label = "ready";
        @Override void show() { System.out.print(label + " "); }
    }
    public static void main(String[] args) {
        new Derived().show();
        System.out.println();
    }
}`, 'Java', 'null ready'), options: ['null ready', ['base ready', 'show() is overridden, so the Derived version runs even from the Base constructor.'], ['ready ready', 'label is not initialised yet when Base() runs.'], ['It throws NullPointerException', 'Concatenating null with a String is fine.']], answer: 0, explanation: 'During Base(), Derived\'s field initialisers have not run, so label is still null.', verified: 'compiled' }),
  mcq({ ...q(IN), id: 'java.in.q4', type: 'compile-error', difficulty: 'easy', stem: 'Why does this not compile?', code: javaErr(`static final class Shape {}
static class Circle extends Shape {}   // here`), options: ['Shape is final and cannot be extended', ['Circle needs a constructor', 'The default one is fine.'], ['Classes must be public to be extended', 'Not required.'], ['static classes cannot be extended', 'Static nested classes can be extended.']], answer: 0, explanation: 'final forbids subclassing (String and Integer are final for this reason).' }),
  mcq({ ...q(IN), id: 'java.in.q5', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    static class Point {
        int x;
        Point(int x) { this.x = x; }
        public boolean equals(Point o) { return o != null && o.x == x; }
    }
    public static void main(String[] args) {
        Point a = new Point(1), b = new Point(1);
        Object o = b;
        System.out.println(a.equals(b) + " " + a.equals(o));
    }
}`, 'Java', 'true false'), options: ['true false', ['true true', 'equals(Point) overloads, it does not override equals(Object).'], ['false false', 'a.equals(b) picks the Point overload.'], ['It does not compile', 'Overloading equals is legal (and a bug).']], answer: 0, explanation: 'With a static type of Object, Object.equals (identity) is chosen. @Override on equals(Point) would have been a compile error, revealing the mistake.', verified: 'compiled' }),
  mcq({ ...q(IN), id: 'java.in.q6', type: 'concept', difficulty: 'easy', stem: 'Which method of Object can never be overridden?', options: ['getClass()', ['toString()', 'Commonly overridden.'], ['equals(Object)', 'Commonly overridden.'], ['hashCode()', 'Overridden together with equals.']], answer: 0, explanation: 'getClass is final; it returns the runtime class.' }),
];

// ---------------------------------------------------------------------------------------
const AI = 'java.abstract-interfaces';
const ifaces = javaTopic({
  id: AI, title: 'Abstract Classes and Interfaces', level: 'core', estMinutes: 50, prerequisites: ['java.polymorphism'], related: ['java.inner-lambdas', 'java.solid-patterns', 'cpp.abstract-interfaces'],
  summary: 'Default and static interface methods, and diamond resolution.',
  objectives: ['Choose between an abstract class and an interface for a given design.', 'Use default, static and private interface methods (Java 8/9), and know that interface fields are constants.', 'Resolve default-method conflicts (class wins, more specific interface wins, otherwise override explicitly).', 'Recognise functional interfaces and how they enable lambdas.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Abstract class vs interface', bodyMd: `| | Abstract class | Interface |
|---|---|---|
| Instances | none | none |
| State | any fields | only \`public static final\` constants |
| Constructors | yes | no |
| Methods | abstract and concrete, any access | abstract, \`default\`, \`static\`, \`private\` (Java 9+) |
| Inheritance | a class extends **one** | a class implements **many** |
| Use for | a partial implementation shared by closely related classes (template method) | a capability/contract across unrelated classes (\`Comparable\`, \`Runnable\`) |

Interface methods without a body are implicitly \`public abstract\`; fields are implicitly \`public static final\`.

\`\`\`java
interface Shape {
    double area();                                  // abstract
    default String describe() { return getClass().getSimpleName() + " " + area(); }   // Java 8
    static Shape unit() { return () -> 1.0; }       // static factory; Shape is functional
}
\`\`\`` },
    { id: 'diamond', kind: 'concept', title: 'Default-method conflicts', bodyMd: `If a class inherits the same default method from several places, Java applies three rules:

1. **Classes win:** a method from the superclass chain beats any interface default.
2. **More specific interface wins:** if B extends A and both provide the default, B's version is used.
3. Otherwise the class **must override** the method; it can call a chosen parent with \`InterfaceName.super.method()\`.

\`\`\`java
interface Walker  { default String move() { return "walk"; } }
interface Swimmer { default String move() { return "swim"; } }
class Duck implements Walker, Swimmer {
    public String move() { return Walker.super.move() + "+" + Swimmer.super.move(); }   // required
}
\`\`\`` },
    { id: 'functional', kind: 'example', title: 'Functional interfaces', bodyMd: `An interface with **exactly one abstract method** is a functional interface (annotate it with \`@FunctionalInterface\` to have the compiler check). Lambdas and method references implement them:

\`\`\`java
Comparator<String> byLength = (a, b) -> Integer.compare(a.length(), b.length());
Runnable task = () -> System.out.println("run");
Function<String, Integer> len = String::length;
\`\`\`

Default and static methods do not count against the "one abstract method" rule, which is why \`Comparator\` (with many defaults like \`reversed()\` and \`thenComparing\`) is still functional.` },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and Java vs C++', bodyMd: `1. Putting mutable state in interfaces (fields are constants).
2. Reducing visibility when implementing an interface method (implementations must be \`public\`).
3. Expecting a default method to override a superclass method (classes always win).
4. Using an abstract class only to share constants (a final class with constants or an enum is clearer).

**Java vs C++:** C++ has no interface keyword; pure abstract classes play that role, and multiple inheritance of them is allowed. Java's default methods resemble C++ virtual functions with an implementation in a pure-interface base.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'When would you use an abstract class instead of an interface?', answerMd: 'When related classes share state or a partial implementation (a template method with common fields and constructors) and form a single hierarchy. Use an interface for a capability that unrelated classes can implement, especially when a class needs several of them.' },
    { id: 'iq2', q: 'How are default-method conflicts resolved?', answerMd: 'A method from the superclass wins over interface defaults; otherwise the most specific interface wins; if two unrelated interfaces provide the same default, the class must override it and may delegate with X.super.method().' },
    { id: 'iq3', q: 'Why were default methods added in Java 8?', answerMd: 'To evolve interfaces without breaking existing implementations: Collection got stream() and forEach() as defaults, so every existing implementation kept compiling.' },
    { id: 'iq4', q: 'What is a functional interface?', answerMd: 'An interface with exactly one abstract method (defaults and statics do not count), such as Runnable, Comparator, Function or Predicate. Lambdas and method references provide its implementation.' },
    { id: 'iq5', q: 'Can an interface have fields?', answerMd: 'Only constants: every field is implicitly public static final and must be initialised. Interfaces cannot hold per-instance state.' },
  ],
  revision: { notesMd: `- Abstract class: state, constructors, one per class. Interface: contract, many per class, constants only.
- Interface methods: abstract (public), default, static, private (Java 9).
- Conflicts: class wins → more specific interface wins → override and pick with X.super.m().
- Functional interface = exactly one abstract method → lambdas.
- Implementations of interface methods must be public.`, flashcards: [
    { id: 'f1', front: 'Implicit modifiers of an interface field?', backMd: 'public static final.' },
    { id: 'f2', front: 'Two interfaces give the same default; what must the class do?', backMd: 'Override it (optionally calling A.super.m()).' },
    { id: 'f3', front: 'Does a superclass method beat an interface default?', backMd: 'Yes: classes win.' },
    { id: 'f4', front: 'Functional interface definition?', backMd: 'Exactly one abstract method.' },
    { id: 'f5', front: 'Why default methods?', backMd: 'To add methods to interfaces without breaking existing implementations.' },
  ] },
  resources: [{ title: 'Interfaces (The Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html', kind: 'official-docs' }, { title: 'Default methods (The Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/java/IandI/defaultmethods.html', kind: 'official-docs' }],
});

const aiMcqs: MCQ[] = [
  mcq({ ...q(AI), id: 'java.ai.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    interface Walker { default String move() { return "walk"; } }
    interface Swimmer { default String move() { return "swim"; } }
    static class Duck implements Walker, Swimmer {
        public String move() { return Walker.super.move() + "+" + Swimmer.super.move(); }
    }
    public static void main(String[] args) {
        System.out.println(new Duck().move());
    }
}`, 'Java', 'walk+swim'), options: ['walk+swim', ['walk', 'Duck overrides move and calls both.'], ['It does not compile: the defaults conflict', 'The explicit override resolves the conflict.'], ['swim+walk', 'The order is as written.']], answer: 0, explanation: 'X.super.method() selects a specific interface\'s default.', verified: 'compiled' }),
  mcq({ ...q(AI), id: 'java.ai.q2', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: javaErr(`interface Walker { default String move() { return "walk"; } }
interface Swimmer { default String move() { return "swim"; } }
static class Duck implements Walker, Swimmer {}   // here`), options: ['Duck inherits two unrelated defaults for move() and must override it', ['Interfaces cannot have default methods', 'They can since Java 8.'], ['A class can implement only one interface', 'It can implement many.'], ['Duck must be abstract', 'Making it abstract does not resolve the conflict either.']], answer: 0, explanation: 'Neither interface is more specific, so the class has to decide.' }),
  mcq({ ...q(AI), id: 'java.ai.q3', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    interface Greeter { default String hello() { return "interface"; } }
    static class Base { public String hello() { return "class"; } }
    static class Impl extends Base implements Greeter {}
    public static void main(String[] args) {
        Greeter g = new Impl();
        System.out.println(g.hello());
    }
}`, 'Java', 'class'), options: ['class', ['interface', 'Methods inherited from a superclass win over interface defaults.'], ['It does not compile', 'No conflict: the class method wins.'], ['classinterface', 'Only one method runs.']], answer: 0, explanation: 'Rule 1, classes win: Base.hello() is inherited by Impl and beats the Greeter default, even through a Greeter reference.', verified: 'compiled' }),
  mcq({ ...q(AI), id: 'java.ai.q4', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: javaErr(`interface Shape { double area(); }
static class Square implements Shape {
    double side = 2;
    double area() { return side * side; }   // here
}`), options: ['area() must be public: interface methods are implicitly public and visibility cannot be reduced', ['Square must be abstract', 'It implements area.'], ['Interfaces cannot declare double methods', 'They can.'], ['side must be final', 'Unrelated.']], answer: 0, explanation: 'Implementations of interface methods are declared public.' }),
  mcq({ ...q(AI), id: 'java.ai.q5', type: 'concept', difficulty: 'easy', stem: 'Which is a functional interface?', options: ['interface Check { boolean test(String s); default Check negate() { return s -> !test(s); } }', ['interface Pair { int a(); int b(); }', 'Two abstract methods.'], ['interface Empty {}', 'No abstract method.'], ['abstract class Op { abstract int apply(int x); }', 'An abstract class is not an interface.']], answer: 0, explanation: 'Exactly one abstract method; default methods do not count.' }),
  mcq({ ...q(AI), id: 'java.ai.q6', type: 'scenario', difficulty: 'medium', stem: 'Unrelated classes (Invoice, User, Product) must all be exportable to CSV. Best design?', options: ['An interface CsvExportable with toCsv(), implemented by each class', ['An abstract base class CsvEntity they all extend', 'They already have other superclasses or no common is-a relationship.'], ['A static method with instanceof checks for each class', 'Violates open/closed.'], ['A public field csv in each class', 'No contract, no behaviour.']], answer: 0, explanation: 'A capability shared by unrelated classes is an interface.' }),
];

// ---------------------------------------------------------------------------------------
const SF = 'java.static-final';
const staticFinal = javaTopic({
  id: SF, title: 'static and final', level: 'core', estMinutes: 40, prerequisites: [CO], related: ['java.constructors-init', 'cpp.static-members', 'java.memory-gc'],
  summary: 'Static members and the meanings of final.',
  objectives: ['Explain static fields, methods, blocks and nested classes, and when static members are initialised.', 'Know what static methods cannot do (no this, no instance members) and that they are hidden, not overridden.', 'Apply final to variables, fields, parameters, methods and classes, and distinguish final reference from immutable object.', 'Use effectively final variables in lambdas and anonymous classes.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'static: belongs to the class', bodyMd: `- A **static field** has one copy shared by all instances (a counter, a cache, constants).
- A **static method** has no \`this\`; it cannot use instance fields or methods directly. Call it on the class: \`Math.max(a, b)\`.
- A **static block** runs once when the class is **initialised**, which happens on first active use (creating an instance, calling a static method, reading a non-constant static field), not when the class is merely mentioned.
- A **static nested class** does not hold a reference to an outer instance (unlike an inner class).
- Static methods are **hidden, not overridden**: \`Parent p = new Child(); p.staticMethod()\` calls Parent's version, chosen by the static type.

**Constants:** \`public static final int MAX = 100;\` A compile-time constant of a primitive or String type is inlined into other classes at compile time.` },
    { id: 'final', kind: 'concept', title: 'The meanings of final', bodyMd: `| Where | Meaning |
|---|---|
| local variable / parameter | assigned exactly once |
| instance field | assigned exactly once, in every constructor path (or at declaration) |
| static field | assigned once, at declaration or in a static block |
| method | cannot be overridden |
| class | cannot be extended |

**final reference ≠ immutable object:** \`final List<String> names = new ArrayList<>();\` prevents \`names = otherList\`, but \`names.add("x")\` still works. Immutability needs final fields **and** no way to change their contents (immutable types, unmodifiable collections, defensive copies).

**Effectively final:** a local variable that is never reassigned after initialisation can be captured by lambdas and anonymous classes, even without the keyword.

final fields also have a concurrency benefit: once the constructor finishes, other threads see their initialised values without synchronisation (safe publication of immutable objects).` },
    { id: 'code', kind: 'code', title: 'Static state and initialisation order', bodyMd: 'The static block runs once, on first use; instance creation increments the shared counter.', code: [java(`
public class Main {
    static class Ticket {
        static int issued;                     // one copy for all tickets
        static { System.out.println("Ticket class initialised"); issued = 0; }
        final int number;                      // set once per ticket
        Ticket() { number = ++issued; }
        static int count() { return issued; }  // no 'this' here
    }
    public static void main(String[] args) {
        System.out.println("before");
        Ticket a = new Ticket(), b = new Ticket();
        System.out.println(a.number + " " + b.number + " " + Ticket.count());
    }
}`, 'Java', 'before\nTicket class initialised\n1 2 2')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and Java vs C++', bodyMd: `1. Mutable static state shared across threads without synchronisation.
2. Calling static methods through instances, which hides that dispatch is static.
3. Believing final makes an object immutable.
4. Changing a public static final constant in a library and forgetting that clients have it inlined until they recompile.
5. Static collections that grow forever (memory leaks).

**Java vs C++:** C++ static data members need a definition outside the class (before C++17 inline variables); C++ \`const\` is closer to Java's final for variables, but C++ has const member functions and const objects, which Java lacks.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Can you override a static method?', answerMd: 'No. A static method with the same signature in a subclass hides the parent\'s method. The call is resolved at compile time from the static type of the expression, so Parent p = new Child(); p.m() calls Parent.m().' },
    { id: 'iq2', q: 'Does final make an object immutable?', answerMd: 'No. final on a reference prevents reassigning the variable, but the object it points to can still be mutated (final List can still be added to). Immutability requires final fields of immutable types (or defensive copies) and no mutating methods.' },
    { id: 'iq3', q: 'When is a static block executed?', answerMd: 'Once, when the class is initialised: on first active use such as creating an instance, invoking a static method or assigning/reading a non-constant static field. Merely declaring a variable of that type does not trigger it.' },
    { id: 'iq4', q: 'What does "effectively final" mean?', answerMd: 'A local variable that is assigned once and never modified afterwards. Lambdas and anonymous classes may capture only final or effectively final locals, because they capture the value, not the variable.' },
  ],
  revision: { notesMd: `- static: one per class; static methods have no this; static blocks run once at class initialisation (first active use).
- Static methods are hidden (static dispatch), not overridden.
- final: variable once, method not overridable, class not extendable.
- final reference ≠ immutable object.
- Lambdas capture effectively final locals.`, flashcards: [
    { id: 'f1', front: 'Parent p = new Child(); p.staticM() calls…?', backMd: 'Parent.staticM() (static dispatch by declared type).' },
    { id: 'f2', front: 'Can you add to a `final List`?', backMd: 'Yes; only reassignment of the variable is forbidden.' },
    { id: 'f3', front: 'When does a static initialiser run?', backMd: 'Once, at class initialisation on first active use.' },
    { id: 'f4', front: 'Can a static method use `this`?', backMd: 'No.' },
    { id: 'f5', front: 'What can lambdas capture from the enclosing method?', backMd: 'Final or effectively final local variables.' },
  ] },
  resources: [{ title: 'Understanding class members (The Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/java/javaOO/classvars.html', kind: 'official-docs' }, JLS],
});

const sfMcqs: MCQ[] = [
  mcq({ ...q(SF), id: 'java.sf.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    static class Parent { static String who() { return "parent"; } String me() { return "parent"; } }
    static class Child extends Parent { static String who() { return "child"; } @Override String me() { return "child"; } }
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.println(p.who() + " " + p.me());
    }
}`, 'Java', 'parent child'), options: ['parent child', ['child child', 'Static methods are hidden: the declared type Parent decides.'], ['parent parent', 'Instance methods are dispatched dynamically.'], ['It does not compile', 'Calling a static method through an instance only warns.']], answer: 0, explanation: 'who() is chosen at compile time from Parent; me() at run time from Child.', verified: 'compiled' }),
  mcq({ ...q(SF), id: 'java.sf.q2', type: 'code-output', difficulty: 'easy', stem: 'What does this program print?', code: java(`import java.util.*;

public class Main {
    public static void main(String[] args) {
        final List<String> names = new ArrayList<>();
        names.add("ana");
        names.add("bo");
        System.out.println(names.size());
    }
}`, 'Java', '2'), options: ['2', ['It does not compile: names is final', 'final forbids reassignment, not mutation.'], ['0', 'Both adds succeed.'], ['It throws UnsupportedOperationException', 'ArrayList is mutable.']], answer: 0, explanation: 'final applies to the variable, not to the object it refers to.', verified: 'compiled' }),
  mcq({ ...q(SF), id: 'java.sf.q3', type: 'compile-error', difficulty: 'easy', stem: 'Why does this not compile?', code: javaErr(`static class Counter {
    int count;
    static void reset() {
        count = 0;   // here
    }
}`), options: ['A static method has no this, so it cannot access the instance field count', ['count must be private', 'Unrelated.'], ['Static methods cannot assign values', 'They can assign static fields.'], ['reset must return int', 'void is fine.']], answer: 0, explanation: 'Make count static, or make reset an instance method.' }),
  mcq({ ...q(SF), id: 'java.sf.q4', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: javaErr(`static java.util.function.IntSupplier make() {
    int n = 1;
    n++;
    return () -> n;   // here
}`), options: ['n is modified after initialisation, so it is not effectively final and cannot be captured', ['Lambdas cannot return ints', 'IntSupplier returns an int.'], ['IntSupplier is not a functional interface', 'It is.'], ['n must be static', 'Locals cannot be static.']], answer: 0, explanation: 'Copy it into a new effectively final variable: int m = n; return () -> m;' }),
  mcq({ ...q(SF), id: 'java.sf.q5', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: java(`public class Main {
    static class Config {
        static { System.out.print("load "); }
        static final int CONSTANT = 7;
        static int counter = 3;
    }
    public static void main(String[] args) {
        System.out.print(Config.CONSTANT + " ");
        System.out.print(Config.counter + " ");
        System.out.println(Config.counter);
    }
}`, 'Java', '7 load 3 3'), options: ['7 load 3 3', ['load 7 3 3', 'A compile-time constant is inlined, so reading it does not initialise the class.'], ['load 7 load 3 3', 'Static initialisation happens at most once.'], ['7 3 3', 'Reading the non-constant counter initialises the class.']], answer: 0, explanation: 'CONSTANT is a compile-time constant (inlined); the first access to counter triggers class initialisation, which runs the static block once.', verified: 'compiled' }),
  mcq({ ...q(SF), id: 'java.sf.q6', type: 'concept', difficulty: 'medium', stem: 'What does declaring a method final prevent?', options: ['Overriding it in subclasses', ['Calling it', 'It can be called normally.'], ['Overloading it', 'Overloads are allowed.'], ['Changing its local variables', 'Unrelated.']], answer: 0, explanation: 'final methods cannot be overridden; final classes cannot be extended at all.' }),
];

export const topics: Topic[] = [classes, access, inheritance, ifaces, staticFinal];
export const mcqs: MCQ[] = [...coMcqs, ...apMcqs, ...inMcqs, ...aiMcqs, ...sfMcqs];
