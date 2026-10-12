import type { MCQ, Topic } from '../schema';
import { java, javaErr, mcq } from '../helpers';
import { JLS, TUT, javaTopic, q } from './common';
import * as core from './core';


// ---------------------------------------------------------------------------------------
const CI = 'java.constructors-init';
const init = javaTopic({
  id: CI, title: 'Constructors and Initialisation Order', level: 'foundation', estMinutes: 45, prerequisites: ['java.classes-objects'],
  summary: 'Constructor chaining and static/instance initialisation order.',
  objectives: ['Predict the exact order of static blocks, instance initialisers, field initialisers and constructors across a class hierarchy.', 'Use this(...) and super(...) chaining correctly.', 'Know default field values and the implicit default constructor.'],
  sections: [
    { id: 'order', kind: 'concept', title: 'The initialisation order', bodyMd: `**Class initialisation** (once, the first time the class is used): static field initialisers and \`static { }\` blocks run **in textual order**, superclass first.

**Object creation** with \`new Child()\`:
1. Memory is allocated and every field gets its **default value** (0, false, null).
2. The Child constructor starts. Its first statement is \`this(...)\` or \`super(...)\` (implicit \`super()\` if omitted).
3. The **superclass** is fully initialised first (recursively up to Object).
4. Then Child's **instance field initialisers and instance initialiser blocks** run, in textual order.
5. Then the rest of Child's constructor body runs.

Mnemonic: *static (parent, then child, once) → for each level from the top: fields/blocks → constructor body*.` },
    { id: 'chaining', kind: 'example', title: 'Constructor chaining', bodyMd: '`this(...)` delegates to another constructor of the same class; `super(...)` calls the parent constructor. Either must be the **first** statement, and you cannot have both.', code: [java(`class Account {
    private final String id;
    private double balance;
    Account(String id) { this(id, 0.0); }            // delegate
    Account(String id, double balance) {
        this.id = id;
        this.balance = balance;
    }
}
class Savings extends Account {
    private final double rate;
    Savings(String id, double rate) {
        super(id);                                    // must be first
        this.rate = rate;
    }
}`)] },
    { id: 'defaults', kind: 'concept', title: 'Default constructor and default values', bodyMd: `- If a class declares **no** constructor, the compiler adds a no-argument constructor that calls \`super()\`. Declaring any constructor removes it.
- If the parent has no no-argument constructor, every child constructor must call \`super(args)\` explicitly, or compilation fails.
- Fields get defaults (0/false/null); **local variables do not**. Reading an unassigned local is a compile error.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Calling an overridable method from a constructor: the subclass override runs **before** the subclass's fields are initialised (it sees default values).
2. Assuming static blocks run per object (they run once per class).
3. Forgetting that a parent without a no-arg constructor forces explicit super(...) calls.
4. Putting statements before \`super(...)\` (an error before Java 22's preview of flexible constructor bodies).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Describe the order of initialisation when creating an object of a subclass.', answerMd: 'Static initialisation for parent then child (once per class). For the object: all fields get default values; the constructor chain calls up to Object; then, from the top class down, each class runs its instance initialisers and field initialisers in textual order, followed by its constructor body.' },
    { id: 'iq2', q: 'Why is calling an overridable method from a constructor dangerous?', answerMd: 'Dynamic dispatch applies even during construction, so the subclass override runs while the subclass fields still have default values (their initialisers have not run yet). This leads to nulls and zeros in surprising places.' },
    { id: 'iq3', q: 'this() vs super()?', answerMd: 'this(...) calls another constructor of the same class; super(...) calls a parent constructor. Only one can appear, and it must be the first statement; if neither is written, super() is inserted.' },
    { id: 'iq4', q: 'Do local variables have default values?', answerMd: 'No. Only fields (and array elements) get default values. A local must be definitely assigned before use, or the code does not compile.' },
  ],
  revision: { notesMd: `- Static: parent → child, once per class, in textual order.
- Object: defaults → constructor chain up → (per class, top-down) field initialisers and instance blocks → constructor body.
- this(...)/super(...) must come first; implicit super().
- No constructors declared means an implicit no-arg constructor.
- Do not call overridable methods in constructors.`, flashcards: [
    { id: 'f1', front: 'How many times does a static block run?', backMd: 'Once, when the class is initialised.' },
    { id: 'f2', front: 'Parent or child instance initialisers first?', backMd: 'The parent\'s (including its constructor body) completes before the child\'s field initialisers run.' },
    { id: 'f3', front: 'A subclass override called from the parent constructor sees fields as…?', backMd: 'Their default values (0/null/false), because the subclass initialisers have not run yet.' },
    { id: 'f4', front: 'Implicit first statement of a constructor?', backMd: 'super(); unless this(...) or super(...) is written explicitly.' },
    { id: 'f5', front: 'Default value of an unassigned local int?', backMd: 'There is none; using it is a compile error.' },
  ] },
  resources: [JLS, TUT],
});

const ciMcqs: MCQ[] = [
  mcq({ ...q(CI), id: 'java.ci.q1', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: java(`public class Main {
    static class A {
        static { System.out.print("sA "); }
        { System.out.print("iA "); }
        A() { System.out.print("cA "); }
    }
    static class B extends A {
        static { System.out.print("sB "); }
        { System.out.print("iB "); }
        B() { System.out.print("cB "); }
    }
    public static void main(String[] args) {
        new B();
        new B();
        System.out.println();
    }
}`, 'Java', 'sA sB iA cA iB cB iA cA iB cB'), options: ['sA sB iA cA iB cB iA cA iB cB', ['sA iA cA sB iB cB iA cA iB cB', 'Both static blocks run (parent first) before any instance work.'], ['sA sB iA iB cA cB iA iB cA cB', 'A\'s constructor body completes before B\'s instance initialisers.'], ['sA sB iA cA iB cB sA sB iA cA iB cB', 'Static blocks run only once.']], answer: 0, explanation: 'Statics run once (A then B). For each object: A\'s initialiser and constructor, then B\'s initialiser and constructor.', verified: 'compiled' }),
  mcq({ ...q(CI), id: 'java.ci.q2', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: java(`public class Main {
    static class Base {
        Base() { show(); }
        void show() { System.out.println("base"); }
    }
    static class Child extends Base {
        String name = "child";
        @Override void show() { System.out.println(name); }
    }
    public static void main(String[] args) {
        new Child();
    }
}`, 'Java', 'null'), options: ['null', ['child', 'name is assigned only after Base\'s constructor finishes.'], ['base', 'Dynamic dispatch selects Child.show even during construction.'], ['A NullPointerException', 'Printing a null String reference prints "null".']], answer: 0, explanation: 'Base() calls the overridden show() while Child\'s field initialiser has not run yet, so name is still null.', verified: 'compiled' }),
  mcq({ ...q(CI), id: 'java.ci.q3', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: javaErr(`static class Parent {
    Parent(int x) {}
}
static class Child extends Parent {
    Child() {}   // here
}`), options: ['Child() implicitly calls super(), but Parent has no no-arg constructor', ['Child must declare a field', 'Not required.'], ['Parent must be abstract', 'Not required.'], ['Static nested classes cannot extend each other', 'They can.']], answer: 0, explanation: 'Write Child() { super(0); }, or add Parent() to Parent.' }),
  mcq({ ...q(CI), id: 'java.ci.q4', type: 'compile-error', difficulty: 'easy', stem: 'Why does this not compile?', code: javaErr(`static int f() {
    int count;
    return count + 1;   // here
}`), options: ['The local variable count is not initialised; locals have no default value', ['int cannot be returned', 'It can.'], ['count must be static', 'Locals cannot be static in Java.'], ['The method must be public', 'Access does not matter.']], answer: 0, explanation: 'Only fields and array elements get default values. Locals must be definitely assigned before use.' }),
  mcq({ ...q(CI), id: 'java.ci.q5', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    static class P {
        P() { this(5); System.out.print("P() "); }
        P(int x) { System.out.print("P(" + x + ") "); }
    }
    public static void main(String[] args) {
        new P();
        System.out.println();
    }
}`, 'Java', 'P(5) P()'), options: ['P(5) P()', ['P() P(5)', 'this(5) runs first, before the rest of P().'], ['P()', 'The delegated constructor also prints.'], ['A compile error', 'this(...) as the first statement is valid.']], answer: 0, explanation: 'this(5) delegates to P(int), which completes before P()\'s remaining body.', verified: 'compiled' }),
  mcq({ ...q(CI), id: 'java.ci.q6', type: 'concept', difficulty: 'easy', stem: 'A class declares only `Point(int x, int y)`. What does `new Point()` do?', options: ['It fails to compile: the implicit no-arg constructor is not generated', ['It creates a Point with x = y = 0', 'Only if a no-arg constructor exists.'], ['It throws at run time', 'It is a compile-time error.'], ['It calls Point(0, 0)', 'Java has no default arguments.']], answer: 0, explanation: 'Declaring any constructor removes the default one.' }),
];

// ---------------------------------------------------------------------------------------
const PO = 'java.polymorphism';
const poly = javaTopic({
  id: PO, title: 'Polymorphism and Dynamic Dispatch', level: 'core', estMinutes: 55, prerequisites: ['java.inheritance'],
  summary: 'Overriding, field hiding, static method hiding and casting.',
  objectives: ['Predict which method runs: instance methods dispatch on the runtime type.', 'Know that fields and static methods do NOT dispatch dynamically (they are hidden).', 'Apply the overriding rules (access, exceptions, covariant returns).', 'Use casting and instanceof safely.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'What is dynamic and what is not', bodyMd: `| Member | Chosen by |
|---|---|
| Instance method (non-private, non-final, non-static) | **runtime type** of the object (dynamic dispatch) |
| Field access | **compile-time (declared) type** of the reference (fields are *hidden*, not overridden) |
| Static method | **compile-time type** (static methods are hidden, not overridden) |
| private method | not inherited, so never overridden |
| Overload selection | **compile-time** types of the arguments |

All Java instance methods are "virtual" by default, unlike C++. \`final\` prevents overriding.` },
    { id: 'rules', kind: 'concept', title: 'Overriding rules', bodyMd: `An override must:
- have the same name and parameter types,
- have a return type that is the same or a **subtype** (covariant return),
- not reduce visibility (a public method cannot become protected),
- not throw broader **checked** exceptions.

Annotate overrides with \`@Override\` so the compiler catches signature mistakes (such as \`equals(Point p)\` instead of \`equals(Object o)\`).` },
    { id: 'casting', kind: 'example', title: 'Casting and instanceof', bodyMd: 'Upcasting (Child to Parent) is implicit and always safe. Downcasting needs an explicit cast and throws ClassCastException at run time if the object is not actually of that type. Pattern matching (Java 16+) combines the test and the cast.', code: [java(`static String describe(Object o) {
    if (o instanceof String s) return "String of length " + s.length();
    if (o instanceof Integer i) return "Integer " + (i + 1);
    return "Other";
}`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Expecting field access through a parent reference to read the child's field.
2. Expecting static methods to dispatch dynamically.
3. Overloading instead of overriding (wrong parameter type), with no @Override to catch it.
4. Unchecked downcasts that throw ClassCastException.
5. Thinking private methods can be overridden: a same-named method in the child is a new, unrelated method.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Overloading vs overriding in Java?', answerMd: 'Overloading means the same method name with different parameter lists in the same class (or a subclass); it is resolved at compile time by argument types. Overriding means a subclass replaces an inherited instance method with the same signature; it is resolved at run time by the object\'s type.' },
    { id: 'iq2', q: 'Can static methods be overridden?', answerMd: 'No. A static method with the same signature in a subclass hides the parent\'s method. Which one runs depends on the reference\'s declared type, not the object.' },
    { id: 'iq3', q: 'Are fields polymorphic?', answerMd: 'No. Fields are resolved by the declared type of the reference. A child field with the same name hides the parent field; both exist in the object.' },
    { id: 'iq4', q: 'What is a covariant return type?', answerMd: 'An overriding method may return a subtype of the overridden method\'s return type, for example Animal create() in the parent and Dog create() in the child.' },
  ],
  revision: { notesMd: `- Instance methods: runtime type. Fields and static methods: declared type.
- Overload resolution is compile time; override dispatch is run time.
- An override cannot narrow access or widen checked exceptions; covariant returns are allowed.
- Use @Override; private methods are never overridden.`, flashcards: [
    { id: 'f1', front: '`Parent p = new Child(); p.field` reads whose field?', backMd: 'Parent\'s (fields are not polymorphic).' },
    { id: 'f2', front: '`p.staticMethod()` with p declared as Parent runs?', backMd: 'Parent.staticMethod (hiding, not overriding).' },
    { id: 'f3', front: 'Can an override reduce visibility?', backMd: 'No (public cannot become protected).' },
    { id: 'f4', front: 'Purpose of @Override?', backMd: 'A compile error if the method does not override anything.' },
    { id: 'f5', front: 'Bad downcast throws?', backMd: 'ClassCastException at run time.' },
  ] },
  resources: [JLS, { title: 'Overriding and Hiding Methods (Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/java/IandI/override.html', kind: 'official-docs' }],
});

const poMcqs: MCQ[] = [
  mcq({ ...q(PO), id: 'java.po.q1', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: java(`public class Main {
    static class P {
        String name = "P";
        String get() { return "P.get"; }
        static String s() { return "P.s"; }
    }
    static class C extends P {
        String name = "C";
        @Override String get() { return "C.get"; }
        static String s() { return "C.s"; }
    }
    public static void main(String[] args) {
        P p = new C();
        System.out.println(p.name + " " + p.get() + " " + p.s());
    }
}`, 'Java', 'P C.get P.s'), options: ['P C.get P.s', ['C C.get C.s', 'Only instance methods dispatch on the runtime type.'], ['P P.get P.s', 'get() is overridden, so C.get runs.'], ['C C.get P.s', 'Fields resolve by the declared type P.']], answer: 0, explanation: 'Field access and static methods use the declared type (P); the instance method get() dispatches on the runtime type (C).', verified: 'compiled' }),
  mcq({ ...q(PO), id: 'java.po.q2', type: 'code-output', difficulty: 'hard', stem: 'Which overload runs, and what is printed?', code: java(`public class Main {
    static class Animal {}
    static class Dog extends Animal {}
    static void speak(Animal a) { System.out.print("animal "); }
    static void speak(Dog d) { System.out.print("dog "); }
    public static void main(String[] args) {
        Animal a = new Dog();
        speak(a);
        speak(new Dog());
        System.out.println();
    }
}`, 'Java', 'animal dog'), options: ['animal dog', ['dog dog', 'Overload resolution uses the compile-time type Animal for the first call.'], ['animal animal', 'The second argument\'s static type is Dog.'], ['A compile error: ambiguous', 'The most specific applicable overload is chosen.']], answer: 0, explanation: 'Overloads are chosen at compile time from the declared argument types; only overriding is dynamic.', verified: 'compiled' }),
  mcq({ ...q(PO), id: 'java.po.q3', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: javaErr(`static class Base {
    public void run() {}
}
static class Sub extends Base {
    @Override protected void run() {}   // here
}`), options: ['An override cannot reduce visibility from public to protected', ['@Override is not allowed on protected methods', 'It is allowed.'], ['run() must return a value', 'void is fine.'], ['Sub must be public', 'Not required.']], answer: 0, explanation: 'Overrides may keep or widen access, never narrow it.' }),
  mcq({ ...q(PO), id: 'java.po.q4', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    static class Shape { String kind() { return "shape"; } }
    static class Circle extends Shape { @Override String kind() { return "circle"; } }
    public static void main(String[] args) {
        Object o = new Circle();
        Shape s = (Shape) o;
        System.out.print(s.kind() + " ");
        try {
            Circle c = (Circle) new Shape();
            System.out.print(c.kind());
        } catch (ClassCastException e) {
            System.out.print("CCE");
        }
        System.out.println();
    }
}`, 'Java', 'circle CCE'), options: ['circle CCE', ['shape CCE', 'The object is a Circle, so kind() is overridden.'], ['circle shape', 'A plain Shape cannot be cast to Circle.'], ['A compile error', 'The cast compiles; it fails at run time.']], answer: 0, explanation: 'Upcasting keeps dynamic dispatch. Downcasting a real Shape to Circle throws ClassCastException at run time.', verified: 'compiled' }),
  mcq({ ...q(PO), id: 'java.po.q5', type: 'debug', difficulty: 'medium', stem: 'A `Point` class defines `public boolean equals(Point other)`. Why does `list.contains(new Point(1, 2))` return false for a list containing an equal point?', options: ['It overloads equals instead of overriding equals(Object), so collections call Object.equals (identity)', ['contains uses hashCode only', 'ArrayList.contains uses equals.'], ['Points must be Comparable', 'Not for contains.'], ['equals must be static', 'equals is an instance method.']], answer: 0, explanation: 'Declare public boolean equals(Object o) with @Override (and also override hashCode).' }),
  mcq({ ...q(PO), id: 'java.po.q6', type: 'concept', difficulty: 'easy', stem: 'Which Java methods participate in dynamic dispatch?', options: ['Non-static, non-private, non-final instance methods', ['Static methods', 'They are hidden, not overridden.'], ['Private methods', 'They are not inherited.'], ['Constructors', 'Constructors are not inherited or overridden.']], answer: 0, explanation: 'Every other kind of member is resolved at compile time.' }),
];

// ---------------------------------------------------------------------------------------
const OE = 'java.object-equality';
const equality = javaTopic({
  id: OE, title: 'equals, hashCode and Strings', level: 'core', estMinutes: 50, prerequisites: ['java.inheritance'],
  summary: '== vs equals, the hashCode contract, the String pool and Integer caching.',
  objectives: ['Distinguish reference equality (==) from logical equality (equals).', 'Implement equals and hashCode consistently and explain the contract.', 'Predict String pool and Integer cache behaviour in output questions.', 'Know why mutable fields in hash keys break HashMap/HashSet.'],
  sections: [
    { id: 'concept', kind: 'concept', title: '== vs equals', bodyMd: `- \`==\` on references compares **identity** (are they the same object?). On primitives it compares values.
- \`equals\` compares **logical equality**. Object's default implementation is identity; String, Integer, List and others override it to compare contents.

**String pool:** string literals and compile-time constant expressions are interned, so equal literals share one object (\`"ab" == "a" + "b"\` is true). \`new String("ab")\` always creates a new object; runtime concatenation creates new objects too.

**Integer cache:** autoboxing (\`Integer.valueOf\`) caches −128…127, so \`Integer a = 127, b = 127; a == b\` is true but with 128 it is false. Always use equals for wrapper objects.` },
    { id: 'contract', kind: 'concept', title: 'The equals/hashCode contract', bodyMd: `If you override \`equals\`, you **must** override \`hashCode\` so that **equal objects have equal hash codes**. Hash-based collections first use hashCode to find a bucket, then equals inside it; equal objects with different hash codes are effectively invisible to each other.

equals must be reflexive, symmetric, transitive, consistent, and return false for null.`, code: [java(`final class Point {
    private final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point)) return false;
        Point p = (Point) o;
        return x == p.x && y == p.y;
    }
    @Override public int hashCode() { return java.util.Objects.hash(x, y); }
}`)] },
    { id: 'mutable', kind: 'concept', title: 'Mutable keys', bodyMd: 'If a field used by hashCode changes after the object is inserted into a HashSet or HashMap, the object sits in the wrong bucket: `contains` returns false and `remove` fails. Use immutable keys (String, records, final fields).' },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Comparing Strings or Integers with \`==\`.
2. Overriding equals without hashCode.
3. equals(Point) instead of equals(Object) (an overload, not an override).
4. Mutating key fields after insertion into a hash collection.
5. Using getClass() vs instanceof inconsistently across a hierarchy, which breaks symmetry.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Why must hashCode be overridden with equals?', answerMd: 'Hash collections locate a bucket by hashCode and then compare with equals. If two equal objects have different hash codes, a HashSet stores both and HashMap lookups miss. The contract requires equal objects to have equal hash codes.' },
    { id: 'iq2', q: 'Explain the String pool.', answerMd: 'The JVM interns string literals and compile-time constants so equal literals refer to one shared immutable object. new String(...) and runtime concatenation create new objects; intern() returns the pooled instance.' },
    { id: 'iq3', q: 'Why is `Integer a = 1000, b = 1000; a == b` false?', answerMd: 'Autoboxing uses Integer.valueOf, which caches only −128 to 127. 1000 creates two distinct objects, and == compares references. Use equals or compare int values.' },
    { id: 'iq4', q: 'Why are Strings immutable?', answerMd: 'For safety and efficiency: pooling and sharing (the String pool), safe use as HashMap keys (a cached hash code), thread safety without locks, and security (paths and class names cannot change after validation).' },
  ],
  revision: { notesMd: `- == means identity for objects; equals means contents.
- Literals are pooled; new String always creates a new object.
- Integer cache −128…127; never compare wrappers with ==.
- Override equals(Object) and hashCode together.
- Hash keys must be immutable.`, flashcards: [
    { id: 'f1', front: '`"ab" == "a" + "b"`?', backMd: 'true: a compile-time constant, interned.' },
    { id: 'f2', front: '`Integer x = 128, y = 128; x == y`?', backMd: 'false: outside the Integer cache.' },
    { id: 'f3', front: 'The equals/hashCode rule?', backMd: 'Equal objects must have equal hash codes.' },
    { id: 'f4', front: 'equals signature to override?', backMd: 'public boolean equals(Object o).' },
    { id: 'f5', front: 'Mutating a key inside a HashSet?', backMd: 'It lands in the wrong bucket, so contains and remove fail.' },
  ] },
  resources: [{ title: 'Object.equals and hashCode (Java SE 21 API)', url: 'https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Object.html', kind: 'official-docs' }, JLS],
});

const oeMcqs: MCQ[] = [
  mcq({ ...q(OE), id: 'java.oe.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        Integer c = 128, d = 128;
        System.out.println((a == b) + " " + (c == d) + " " + c.equals(d));
    }
}`, 'Java', 'true false true'), options: ['true false true', ['true true true', '128 is outside the Integer cache.'], ['false false true', '127 is inside the cache.'], ['true false false', 'equals compares values.']], answer: 0, explanation: 'Integer.valueOf caches −128…127, so 127 is shared and 128 is not; equals compares the int values.', verified: 'compiled' }),
  mcq({ ...q(OE), id: 'java.oe.q2', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    public static void main(String[] args) {
        String s1 = "java";
        String part = "ja";
        String s2 = part + "va";
        String s3 = s2.intern();
        System.out.println((s1 == s2) + " " + (s1 == s3) + " " + s1.equals(s2));
    }
}`, 'Java', 'false true true'), options: ['false true true', ['true true true', 'part is a variable, so part + "va" is computed at run time and creates a new String.'], ['false false true', 'intern() returns the pooled instance.'], ['true false true', 'It is the other way round.']], answer: 0, explanation: 'Runtime concatenation creates a new object; intern() returns the pooled "java"; equals compares characters.', verified: 'compiled' }),
  mcq({ ...q(OE), id: 'java.oe.q3', type: 'code-output', difficulty: 'hard', stem: 'Key overrides equals but NOT hashCode. What does this print (typically)?', code: java(`import java.util.*;
public class Main {
    static class Key {
        final int id;
        Key(int id) { this.id = id; }
        @Override public boolean equals(Object o) { return o instanceof Key && ((Key) o).id == id; }
    }
    public static void main(String[] args) {
        Set<Key> set = new HashSet<>();
        set.add(new Key(1));
        set.add(new Key(1));
        System.out.println(set.size() + " " + set.contains(new Key(1)));
    }
}`, 'Java', '2 false'), options: ['2 false', ['1 true', 'That requires a consistent hashCode.'], ['1 false', 'Without hashCode, both keys go into (usually) different buckets.'], ['2 true', 'contains looks in the bucket of a new identity hash.']], answer: 0, explanation: 'The default identity hashCode differs per object, so equal keys land in different buckets and never get compared with equals.', verified: 'compiled' }),
  mcq({ ...q(OE), id: 'java.oe.q4', type: 'concept', difficulty: 'easy', stem: 'For two object references, `a == b` is true exactly when:', options: ['They refer to the same object', ['Their contents are equal', 'That is what a well-defined equals checks.'], ['Their hash codes are equal', 'Different objects can share a hash code.'], ['Their classes are equal', 'Not sufficient.']], answer: 0, explanation: 'For references, == compares identity.' }),
  mcq({ ...q(OE), id: 'java.oe.q5', type: 'scenario', difficulty: 'medium', stem: 'After inserting a mutable `Point` into a HashSet, you change its x field. What happens to `set.contains(p)`?', options: ['It typically returns false, because the object is now in the bucket of its old hash code', ['It returns true; sets track identity', 'HashSet uses hashCode and equals, not identity tracking.'], ['It throws ConcurrentModificationException', 'That is for structural changes during iteration.'], ['The set rehashes automatically', 'It does not know the field changed.']], answer: 0, explanation: 'Use immutable keys, or remove, modify and re-insert.' }),
  mcq({ ...q(OE), id: 'java.oe.q6', type: 'concept', difficulty: 'medium', stem: 'Which statement about the equals/hashCode contract is correct?', options: ['If a.equals(b) then a.hashCode() == b.hashCode()', ['If a.hashCode() == b.hashCode() then a.equals(b)', 'Collisions are allowed.'], ['hashCode must be unique per object', 'It cannot be (there are only 2³² ints).'], ['equals must compare hash codes', 'Not required.']], answer: 0, explanation: 'Equal implies the same hash; the same hash does not imply equal.' }),
];

// ---------------------------------------------------------------------------------------
const EX = 'java.exceptions';
const exceptions = javaTopic({
  id: EX, title: 'Exceptions', level: 'core', estMinutes: 45, prerequisites: ['java.inheritance'],
  summary: 'Checked vs unchecked, finally traps and try-with-resources.',
  objectives: ['Distinguish checked exceptions, unchecked exceptions and errors.', 'Predict control flow with try/catch/finally, including return in finally.', 'Use try-with-resources and know the close order.', 'Apply the overriding rules for throws clauses.'],
  sections: [
    { id: 'hierarchy', kind: 'concept', title: 'The hierarchy', bodyMd: `\`Throwable\` → \`Error\` (serious JVM problems: OutOfMemoryError; do not catch) and \`Exception\`.
- **Checked** exceptions (Exception but not RuntimeException: IOException, SQLException) must be caught or declared with \`throws\`.
- **Unchecked** exceptions (RuntimeException and subclasses: NullPointerException, IllegalArgumentException, ArrayIndexOutOfBoundsException) need not be declared; they usually indicate bugs.

Catch blocks are checked in order; a catch for a subclass must come **before** its superclass, or the code does not compile (the subclass catch would be unreachable).` },
    { id: 'finally', kind: 'concept', title: 'finally semantics', bodyMd: `\`finally\` runs whether the try completes normally, returns, or throws (except for System.exit or a JVM crash).

- If try returns a value, the return value is **computed first**, then finally runs, then the method returns that value. Changing a primitive local inside finally does **not** change the returned value.
- A \`return\` **inside** finally overrides any previous return **and swallows any exception** in flight. Never return from finally.` },
    { id: 'twr', kind: 'example', title: 'try-with-resources', bodyMd: 'Resources implementing AutoCloseable are closed automatically, in **reverse order of declaration**, even on exceptions. Exceptions thrown by close() are added as suppressed exceptions rather than hiding the original.', code: [java(`static String firstLine(String path) throws java.io.IOException {
    try (java.io.BufferedReader r = new java.io.BufferedReader(new java.io.FileReader(path))) {
        return r.readLine();
    }   // r.close() runs here automatically
}`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Returning from finally (swallows exceptions and overrides returns).
2. Catching Exception or Throwable broadly and ignoring it.
3. Catch order: superclass before subclass (a compile error).
4. An overriding method throwing a broader checked exception than the parent (a compile error).
5. Manually closing resources in finally instead of try-with-resources.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Checked vs unchecked exceptions?', answerMd: 'Checked exceptions are enforced by the compiler (catch or declare) and model recoverable conditions such as I/O failures. Unchecked exceptions (RuntimeException) are not enforced and usually indicate programming errors. Errors represent serious JVM problems.' },
    { id: 'iq2', q: 'Does finally always run?', answerMd: 'Almost always: after normal completion, a return or an exception. Not if the JVM exits (System.exit), crashes, or the thread is killed. A return in finally overrides the try\'s return and swallows exceptions.' },
    { id: 'iq3', q: 'Why use try-with-resources?', answerMd: 'It guarantees close() is called in reverse order, even on exceptions, with less code, and it records close() failures as suppressed exceptions instead of masking the original error.' },
    { id: 'iq4', q: 'Can an overriding method throw new checked exceptions?', answerMd: 'No broader or new checked exceptions than the overridden method declares; it may throw fewer, narrower ones, or any unchecked exceptions.' },
  ],
  revision: { notesMd: `- Checked: catch or declare; unchecked: RuntimeException.
- Catch subclasses before superclasses.
- finally runs after the return value is computed; never return from finally.
- try-with-resources closes in reverse order; close() errors become suppressed exceptions.
- Overrides cannot widen checked exceptions.`, flashcards: [
    { id: 'f1', front: 'Is NullPointerException checked?', backMd: 'No: it is a RuntimeException (unchecked).' },
    { id: 'f2', front: 'try returns x; finally does x++. Value returned?', backMd: 'The original x (for primitives the value was captured before finally).' },
    { id: 'f3', front: 'Effect of return inside finally?', backMd: 'It overrides the return value and swallows any in-flight exception.' },
    { id: 'f4', front: 'Order of resource closing?', backMd: 'Reverse of declaration order.' },
    { id: 'f5', front: 'catch (Exception e) before catch (IOException e)?', backMd: 'A compile error: the second catch is unreachable.' },
  ] },
  resources: [{ title: 'Exceptions (Java Tutorials)', url: 'https://docs.oracle.com/javase/tutorial/essential/exceptions/index.html', kind: 'official-docs' }, JLS],
});

const exMcqs: MCQ[] = [
  mcq({ ...q(EX), id: 'java.ex.q1', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: java(`public class Main {
    static int f() {
        int x = 1;
        try {
            return x;
        } finally {
            x = 99;
        }
    }
    public static void main(String[] args) {
        System.out.println(f());
    }
}`, 'Java', '1'), options: ['1', ['99', 'The return value was evaluated before finally ran.'], ['A compile error', 'Assigning a local in finally is legal.'], ['0', 'x was 1.']], answer: 0, explanation: 'return x stores the value 1; finally changes the local afterwards, which does not affect the stored return value.', verified: 'compiled' }),
  mcq({ ...q(EX), id: 'java.ex.q2', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: java(`public class Main {
    @SuppressWarnings("finally")
    static int g() {
        try {
            throw new RuntimeException("boom");
        } finally {
            return 7;
        }
    }
    public static void main(String[] args) {
        System.out.println(g());
    }
}`, 'Java', '7'), options: ['7', ['RuntimeException: boom', 'The return in finally swallows the exception.'], ['A compile error', 'It compiles (with a warning).'], ['0', 'finally returns 7.']], answer: 0, explanation: 'A return in finally discards the in-flight exception. This is why you never return from finally.', verified: 'compiled' }),
  mcq({ ...q(EX), id: 'java.ex.q3', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: javaErr(`static void read() {
    try {
        throw new java.io.IOException("x");
    } catch (Exception e) {
        System.out.println("e");
    } catch (java.io.IOException e) {   // here
        System.out.println("io");
    }
}`), options: ['The IOException catch is unreachable because Exception (its superclass) is caught first', ['IOException cannot be thrown manually', 'It can.'], ['Two catch blocks are not allowed', 'Several are allowed.'], ['read() must declare throws IOException', 'It is caught inside.']], answer: 0, explanation: 'Order catch blocks from most specific to most general.' }),
  mcq({ ...q(EX), id: 'java.ex.q4', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    static class R implements AutoCloseable {
        final String n;
        R(String n) { this.n = n; System.out.print("open-" + n + " "); }
        @Override public void close() { System.out.print("close-" + n + " "); }
    }
    public static void main(String[] args) {
        try (R a = new R("a"); R b = new R("b")) {
            System.out.print("body ");
        }
        System.out.println();
    }
}`, 'Java', 'open-a open-b body close-b close-a'), options: ['open-a open-b body close-b close-a', ['open-a open-b body close-a close-b', 'Resources close in reverse order.'], ['open-a body close-a open-b close-b', 'Both open before the body.'], ['open-b open-a body close-a close-b', 'Opening follows declaration order.']], answer: 0, explanation: 'Resources are opened in order and closed in reverse order (like a stack).', verified: 'compiled' }),
  mcq({ ...q(EX), id: 'java.ex.q5', type: 'concept', difficulty: 'easy', stem: 'Which of these is a checked exception?', options: ['java.io.IOException', ['NullPointerException', 'It is a RuntimeException.'], ['ArithmeticException', 'It is a RuntimeException.'], ['IllegalArgumentException', 'It is a RuntimeException.']], answer: 0, explanation: 'IOException extends Exception but not RuntimeException, so it must be caught or declared.' }),
  mcq({ ...q(EX), id: 'java.ex.q6', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: javaErr(`static class Base {
    void load() {}
}
static class Sub extends Base {
    @Override void load() throws java.io.IOException {}   // here
}`), options: ['An override cannot throw a checked exception that the overridden method does not declare', ['@Override cannot be combined with throws', 'It can.'], ['IOException must be caught inside load', 'Declaring it is fine where allowed.'], ['Sub must be abstract', 'Not required.']], answer: 0, explanation: 'Callers using a Base reference do not expect a checked IOException. Overrides may only narrow checked exceptions.' }),
];

// ---------------------------------------------------------------------------------------
const OR = 'java.overloading-resolution';
const overload = javaTopic({
  id: OR, title: 'Overloading Resolution', level: 'core', estMinutes: 35, prerequisites: ['java.classes-objects'],
  summary: 'Widening vs boxing vs varargs, and ambiguity errors.',
  objectives: ['Apply the three phases of overload resolution (widening, then boxing, then varargs).', 'Predict which overload is called for literals and null.', 'Recognise ambiguous calls that fail to compile.'],
  sections: [
    { id: 'phases', kind: 'concept', title: 'The three phases', bodyMd: `Java picks an overload in phases and stops at the first phase that finds an applicable method:
1. **Exact match and widening primitive conversion** (int → long → float → double; no boxing).
2. **Boxing/unboxing** (int → Integer) combined with widening reference conversions.
3. **Varargs.**

Within a phase, the **most specific** method wins. So \`f(5)\` prefers \`f(long)\` (widening) over \`f(Integer)\` (boxing), and both over \`f(int...)\`.` },
    { id: 'null', kind: 'concept', title: 'Passing null', bodyMd: '`null` matches any reference type. The most specific applicable type wins: with `f(Object)` and `f(String)`, `f(null)` calls `f(String)` because String is a subtype of Object. With `f(String)` and `f(Integer)` (unrelated), `f(null)` is **ambiguous** and fails to compile.' },
    { id: 'example', kind: 'example', title: 'Example', bodyMd: 'Return type does not participate in overload resolution, so two methods differing only in return type cannot coexist.', code: [java(`static void p(long x)    { System.out.println("long"); }
static void p(Integer x) { System.out.println("Integer"); }
static void p(int... x)  { System.out.println("varargs"); }
// p(5) prints "long": phase 1 (widening) succeeds before boxing is considered.`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Assuming boxing beats widening.
2. Expecting overloads to be chosen by runtime type (they use compile-time types).
3. Ambiguous null arguments with unrelated parameter types.
4. Overloading methods that differ only by return type (not allowed).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How does Java choose between overloaded methods?', answerMd: 'In three phases: first without boxing or varargs (exact match and widening), then allowing boxing/unboxing, then varargs. The first phase with an applicable method wins, choosing the most specific one; ties cause an ambiguity compile error.' },
    { id: 'iq2', q: 'Can two methods differ only in return type?', answerMd: 'No. The method signature (name plus parameter types) must differ; the return type is not part of overload resolution.' },
    { id: 'iq3', q: 'Why does f(null) sometimes fail to compile?', answerMd: 'null is applicable to every reference type. If no single overload is more specific than all the others (for example f(String) and f(Integer)), the call is ambiguous.' },
    { id: 'iq4', q: 'Is overload resolution static or dynamic?', answerMd: 'Static: it uses the compile-time types of the arguments. Only the choice among overrides of the selected method signature is dynamic.' },
  ],
  revision: { notesMd: `- Phase 1: exact/widening; phase 2: boxing; phase 3: varargs.
- Widening beats boxing beats varargs.
- null picks the most specific reference type; unrelated types are ambiguous.
- Return type does not overload.`, flashcards: [
    { id: 'f1', front: 'p(long) vs p(Integer) for p(5)?', backMd: 'p(long): widening (phase 1) beats boxing (phase 2).' },
    { id: 'f2', front: 'f(Object) vs f(String) for f(null)?', backMd: 'f(String): it is more specific.' },
    { id: 'f3', front: 'f(String) vs f(Integer) for f(null)?', backMd: 'A compile error: ambiguous.' },
    { id: 'f4', front: 'When are varargs considered?', backMd: 'Only if no method applies without them (the last phase).' },
    { id: 'f5', front: 'Overload by return type only?', backMd: 'Not allowed.' },
  ] },
  resources: [{ title: 'JLS 15.12: Method Invocation Expressions', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.12', kind: 'official-docs' }, TUT],
});

const orMcqs: MCQ[] = [
  mcq({ ...q(OR), id: 'java.or.q1', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: java(`public class Main {
    static void p(long x)    { System.out.print("long "); }
    static void p(Integer x) { System.out.print("Integer "); }
    static void p(int... x)  { System.out.print("varargs "); }
    public static void main(String[] args) {
        p(5);
        p(Integer.valueOf(5));
        System.out.println();
    }
}`, 'Java', 'long Integer'), options: ['long Integer', ['Integer Integer', 'For p(5), widening int to long (phase 1) wins over boxing.'], ['varargs Integer', 'Varargs are considered last.'], ['long long', 'An Integer argument exactly matches p(Integer).']], answer: 0, explanation: 'p(5): phase 1 finds p(long) by widening. p(Integer): an exact match in phase 1.', verified: 'compiled' }),
  mcq({ ...q(OR), id: 'java.or.q2', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    static void f(Object o) { System.out.println("Object"); }
    static void f(String s) { System.out.println("String"); }
    public static void main(String[] args) {
        f(null);
    }
}`, 'Java', 'String'), options: ['String', ['Object', 'String is more specific than Object.'], ['A compile error: ambiguous', 'String is a subtype of Object, so it is not ambiguous.'], ['NullPointerException', 'Passing null does not dereference it.']], answer: 0, explanation: 'Both apply; the most specific (String) is chosen.', verified: 'compiled' }),
  mcq({ ...q(OR), id: 'java.or.q3', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: javaErr(`static void g(String s) {}
static void g(Integer i) {}
static void test() {
    g(null);   // here
}`), options: ['The call is ambiguous: null fits both String and Integer, and neither is more specific', ['null cannot be passed to methods', 'It can.'], ['g is declared twice', 'Overloading with different parameter types is legal.'], ['test must be public', 'Unrelated.']], answer: 0, explanation: 'Cast to pick one: g((String) null).' }),
  mcq({ ...q(OR), id: 'java.or.q4', type: 'compile-error', difficulty: 'easy', stem: 'Why does this not compile?', code: javaErr(`static int size() { return 1; }
static long size() { return 1L; }   // here`), options: ['Methods cannot differ only by return type', ['long cannot be returned', 'It can.'], ['static methods cannot be overloaded', 'They can, with different parameters.'], ['1L is not a valid literal', 'It is a valid long literal.']], answer: 0, explanation: 'The signatures (name plus parameter types) are identical.' }),
  mcq({ ...q(OR), id: 'java.or.q5', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: java(`public class Main {
    static void m(double d) { System.out.print("double "); }
    static void m(Object o) { System.out.print("Object "); }
    public static void main(String[] args) {
        m(3);
        m('a');
        m("s");
        System.out.println();
    }
}`, 'Java', 'double double Object'), options: ['double double Object', ['Object Object Object', 'Primitive widening (phase 1) is preferred over boxing to Object.'], ['double Object Object', "char widens to double as well."], ['Object double Object', 'int also widens to double.']], answer: 0, explanation: 'int and char widen to double in phase 1; a String only fits Object.', verified: 'compiled' }),
  mcq({ ...q(OR), id: 'java.or.q6', type: 'concept', difficulty: 'easy', stem: 'Overload selection in Java uses:', options: ['The compile-time (declared) types of the arguments', ['The runtime types of the arguments', 'That is how overriding (on the receiver) works.'], ['The return type', 'It is not part of resolution.'], ['Random choice among matches', 'Resolution is deterministic.']], answer: 0, explanation: 'Overloads are resolved statically.' }),
];

export const topics: Topic[] = [init, poly, equality, exceptions, overload, ...core.topics];
export const mcqs: MCQ[] = [...ciMcqs, ...poMcqs, ...oeMcqs, ...exMcqs, ...orMcqs, ...core.mcqs];
