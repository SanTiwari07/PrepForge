import type { MCQ, Resource, Topic } from '../schema';
import { cpp, cppErr, mcq } from '../helpers';

const MASTERY = { testSize: 6, testMinutes: 12, passPct: 80, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 7 };
const CPPREF = (title: string, path: string): Resource => ({ title: `${title} (cppreference)`, url: `https://en.cppreference.com/w/cpp/${path}`, kind: 'official-docs' });
const ISOCPP: Resource = { title: 'C++ Super-FAQ (isocpp.org)', url: 'https://isocpp.org/faq', kind: 'article' };
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
const cppTopic = (t: TopicInput): Topic => ({ moduleId: 'oop-cpp', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
const q = (topic: string) => ({ topics: [topic], module: 'oop-cpp' as const });

// ---------------------------------------------------------------------------------------
const CD = 'cpp.constructors-destructors';
const ctors = cppTopic({
  id: CD, title: 'Constructors and Destructors', level: 'foundation', estMinutes: 50, prerequisites: ['cpp.classes-objects'],
  summary: 'Initialiser lists, member init order, explicit, and destruction order.',
  objectives: ['Predict construction and destruction order for members, bases and local objects.', 'Use member initialiser lists and know that members initialise in declaration order.', 'Explain default, parameterised, delegating and explicit constructors.', 'Know when the compiler generates special member functions.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Lifetime rules you must know cold', bodyMd: `- **Construction order:** base classes first (in declaration order), then **members in the order they are declared in the class** (not the order in the initialiser list), then the constructor body.
- **Destruction order:** exactly the reverse: destructor body, members in reverse declaration order, then bases.
- **Local objects** are destroyed in reverse order of construction when they go out of scope (LIFO).
- **Temporaries** are destroyed at the end of the full expression (unless bound to a const reference, which extends their life).

\`explicit\` on a one-argument constructor prevents implicit conversions (\`Meters m = 5;\` will not compile).` },
    { id: 'init-list', kind: 'example', title: 'Initialiser lists', bodyMd: 'Members are initialised before the constructor body runs. Use the initialiser list. It is required for const members, reference members and members without default constructors, and it avoids default-construct-then-assign.', code: [cpp(`class Account {
    const int id;          // must be initialised in the init list
    double balance;
    std::string owner;
public:
    Account(int id, std::string owner)
        : id(id), balance(0.0), owner(std::move(owner)) {}   // order follows the declaration order
};`)] },
    { id: 'special', kind: 'concept', title: 'Compiler-generated special members', bodyMd: `If you do not declare them, the compiler may generate: a default constructor (only if you declared **no** constructors), copy constructor, copy assignment, move constructor, move assignment and destructor. Declaring any constructor suppresses the implicit default constructor; use \`= default\` to bring it back.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Writing the initialiser list in a different order than the declarations and relying on that order (members still initialise in declaration order; -Wreorder warns).
2. Initialising one member from another that is declared later (it is still uninitialised).
3. Assigning in the constructor body instead of initialising (inefficient, and impossible for const or reference members).
4. Expecting a default constructor after declaring a parameterised one.
5. \`Widget w();\` declares a **function**, not an object (the "most vexing parse"); use \`Widget w;\` or \`Widget w{};\`.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'In what order are members initialised?', answerMd: 'In the order they are declared in the class, regardless of the order written in the constructor\'s initialiser list. Bases are initialised before members. Destruction happens in exactly the reverse order.' },
    { id: 'iq2', q: 'Why use member initialiser lists?', answerMd: 'They initialise members directly instead of default-constructing then assigning. They are mandatory for const members, references and members without default constructors.' },
    { id: 'iq3', q: 'What does explicit do?', answerMd: 'It prevents a constructor (usually single-argument) from being used for implicit conversions or copy-initialisation, avoiding surprising conversions like passing an int where a Meters object is expected.' },
    { id: 'iq4', q: 'When is a default constructor generated?', answerMd: 'Only if the class declares no constructors at all (and all members and bases are default-constructible). Otherwise declare it yourself or write Widget() = default;.' },
  ],
  revision: { notesMd: `- Construct: bases → members (declaration order) → body. Destroy: reverse.
- Local objects die in reverse order (LIFO).
- Init lists are required for const, reference and non-default-constructible members.
- Declaring any constructor removes the implicit default constructor.
- \`explicit\` blocks implicit conversions.`, flashcards: [
    { id: 'f1', front: 'Member initialisation order is determined by…?', backMd: 'The declaration order in the class, not the initialiser list order.' },
    { id: 'f2', front: 'Destruction order of locals a, b, c (declared in that order)?', backMd: 'c, b, a.' },
    { id: 'f3', front: '`Widget w();` declares…?', backMd: 'A function returning Widget (the most vexing parse).' },
    { id: 'f4', front: 'Members that must use the init list?', backMd: 'const members, references, and members without a default constructor.' },
    { id: 'f5', front: 'Base or member constructed first?', backMd: 'The base.' },
  ] },
  resources: [CPPREF('Constructors and member initializer lists', 'language/constructor'), CPPREF('Destructors', 'language/destructor'), ISOCPP],
});

const cdMcqs: MCQ[] = [
  mcq({ ...q(CD), id: 'cpp.cd.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct M { int id; M(int i) : id(i) { cout << "M" << id << " "; } ~M() { cout << "~M" << id << " "; } };
struct Base { Base() { cout << "B "; } ~Base() { cout << "~B "; } };
struct D : Base {
    M a, b;
    D() : b(2), a(1) { cout << "D "; }
    ~D() { cout << "~D "; }
};
int main() { { D d; } cout << endl; return 0; }`, 'C++', 'B M1 M2 D ~D ~M2 ~M1 ~B'), options: ['B M1 M2 D ~D ~M2 ~M1 ~B', ['B M2 M1 D ~D ~M1 ~M2 ~B', 'The init-list order (b, a) does not matter; declaration order (a, b) does.'], ['M1 M2 B D ~D ~B ~M2 ~M1', 'The base is constructed before members.'], ['D B M1 M2 ~B ~M1 ~M2 ~D', 'The constructor body runs last.']], answer: 0, explanation: 'Base first, then members in declaration order (a then b), then the body. Destruction reverses everything.', verified: 'compiled' }),
  mcq({ ...q(CD), id: 'cpp.cd.q2', type: 'code-output', difficulty: 'easy', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct T { char c; T(char x) : c(x) { cout << c; } ~T() { cout << c; } };
int main() {
    T a('a');
    T b('b');
    {
        T c('c');
    }
    cout << "|";
    return 0;
}`, 'C++', 'abcc|ba'), options: ['abcc|ba', ['abcc|ab', 'Locals are destroyed in reverse order.'], ['abc|cba', 'c is destroyed at the end of its inner block, before "|".'], ['abc|abc', 'Destruction is LIFO.']], answer: 0, explanation: 'Constructed a, b, c; c dies when its block ends; after "|", main\'s locals die in reverse: b then a.', verified: 'compiled' }),
  mcq({ ...q(CD), id: 'cpp.cd.q3', type: 'compile-error', difficulty: 'medium', stem: 'Why does this fail to compile?', code: cppErr(`class Point {
public:
    Point(int x, int y) : x(x), y(y) {}
private:
    int x, y;
};
Point p;   // here`), options: ['Declaring Point(int, int) suppresses the implicit default constructor', ['Members must be public', 'Access does not matter here.'], ['x(x) is ambiguous', 'It correctly initialises the member from the parameter.'], ['Classes need a destructor', 'One is generated.']], answer: 0, explanation: 'Add Point() = default; (with member initialisers) or construct with arguments.' }),
  mcq({ ...q(CD), id: 'cpp.cd.q4', type: 'code-output', difficulty: 'hard', stem: 'The initialiser list names `a` before `b`. What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct P { P(const char* s) { cout << s << " "; } };
struct S {
    P b;
    P a;
    S() : a("a"), b("b") { cout << "body"; }
};
int main() {
    S s;
    cout << endl;
    return 0;
}`, 'C++', 'b a body'), options: ['b a body', ['a b body', 'The initialiser-list order is ignored; members initialise in declaration order (b is declared first).'], ['body a b', 'Members are initialised before the constructor body runs.'], ['It does not compile', 'It compiles (with a -Wreorder warning).']], answer: 0, explanation: 'Members are always initialised in declaration order. This matters when one member is initialised from another: S() : a(5), b(a * 2) with b declared first reads a before it is initialised (undefined behaviour). Keep the init list in declaration order and enable -Wreorder.', verified: 'compiled' }),
  mcq({ ...q(CD), id: 'cpp.cd.q5', type: 'concept', difficulty: 'easy', stem: 'What does `explicit Meters(double)` prevent?', options: ['Implicit conversion such as `Meters m = 3.0;` or passing 3.0 to a function taking Meters', ['Calling the constructor at all', '`Meters m(3.0);` still works.'], ['Copying Meters objects', 'Unrelated.'], ['Inheriting from Meters', 'That is final.']], answer: 0, explanation: 'explicit allows only direct initialisation, not implicit conversion.' }),
  mcq({ ...q(CD), id: 'cpp.cd.q6', type: 'concept', difficulty: 'medium', stem: 'What does `Widget w();` declare?', options: ['A function named w that returns a Widget', ['A default-constructed Widget', 'Use Widget w; or Widget w{}; for that.'], ['A pointer to a Widget', 'No pointer is involved.'], ['A compile error', 'It is a valid function declaration.']], answer: 0, explanation: 'The most vexing parse: anything that can be parsed as a declaration is one.' }),
];

// ---------------------------------------------------------------------------------------
const PV = 'cpp.polymorphism-virtual';
const poly = cppTopic({
  id: PV, title: 'Polymorphism and Virtual Functions', level: 'core', estMinutes: 60, prerequisites: ['cpp.inheritance'],
  summary: 'Dynamic dispatch, vtables, virtual destructors and object slicing.',
  objectives: ['Predict which function runs for calls through base pointers and references (static vs dynamic binding).', 'Explain vtables and vptrs conceptually.', 'Know why base classes need virtual destructors.', 'Recognise object slicing and calls to virtual functions from constructors.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Static vs dynamic binding', bodyMd: `- A **non-virtual** call is bound at compile time using the **static type** of the expression (the declared type of the pointer or reference).
- A **virtual** call through a pointer or reference is bound at run time using the **dynamic type** (the actual object's type).
- Calls on an **object** (not a pointer/reference) always use its own type; there is nothing to dispatch.

Conceptually, each polymorphic class has a **vtable** (a table of function pointers), and each object carries a hidden **vptr** to its class's vtable. A virtual call loads the vptr, indexes the table and jumps: one extra indirection.

Use \`override\` on overriding functions so the compiler checks the signature, and \`final\` to forbid further overriding.` },
    { id: 'slicing', kind: 'concept', title: 'Object slicing', bodyMd: `Copying a derived object into a **base object by value** copies only the base part; the derived part is "sliced off" and the copy's dynamic type is Base. Passing by value (\`void f(Base b)\`) or storing in \`vector<Base>\` slices. Pass by reference or pointer, and store \`vector<unique_ptr<Base>>\`, to keep polymorphism.` },
    { id: 'vdtor', kind: 'concept', title: 'Virtual destructors and constructors', bodyMd: `- \`delete basePtr;\` on a derived object with a **non-virtual** base destructor is **undefined behaviour**; typically only the base destructor runs, leaking derived resources. **Rule:** a class intended for polymorphic use needs a public virtual destructor (or a protected non-virtual one).
- Inside a constructor or destructor, virtual calls resolve to the class currently being constructed or destroyed, **not** to more-derived overrides (the derived part does not exist yet, or no longer exists).
- Constructors cannot be virtual. For "virtual copy", write a virtual \`clone()\` method.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. A missing virtual destructor in a polymorphic base.
2. A signature mismatch (const, parameter type) silently creating a **new** function instead of overriding; \`override\` catches it.
3. Slicing via pass-by-value or containers of base objects.
4. Expecting a virtual call in a constructor to reach the derived override.
5. Hiding: declaring \`f(int)\` in Derived hides **all** Base overloads named f (bring them back with \`using Base::f;\`).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How do virtual functions work internally?', answerMd: 'Typically each polymorphic class has a vtable of function pointers and each object stores a vptr to it. A virtual call reads the vptr, indexes the slot for that function and calls through the pointer. The exact layout is implementation-defined.' },
    { id: 'iq2', q: 'Why does a base class need a virtual destructor?', answerMd: 'Deleting a derived object through a base pointer calls the destructor via dynamic dispatch only if it is virtual; otherwise the behaviour is undefined and in practice derived members are not destroyed (leaks). Polymorphic bases need public virtual destructors.' },
    { id: 'iq3', q: 'What is object slicing?', answerMd: 'Copying a derived object into a base-class object by value keeps only the base subobject. The derived data and overrides are lost. It happens with pass-by-value parameters, assignment to base objects and containers of base values.' },
    { id: 'iq4', q: 'What happens when a constructor calls a virtual function?', answerMd: 'It calls the version from the class whose constructor is running (or its bases), because more-derived parts are not constructed yet. The same applies in destructors.' },
  ],
  revision: { notesMd: `- Virtual + pointer/reference = dynamic type; otherwise static type.
- Mark overrides with \`override\`.
- Polymorphic base means a virtual destructor.
- Pass by value or containers of Base slice.
- Virtual calls in constructors/destructors do not reach derived overrides.
- Hiding: a derived \`f\` hides all base \`f\` overloads unless you add \`using Base::f\`.`, flashcards: [
    { id: 'f1', front: 'Non-virtual call through Base* to a Derived object runs?', backMd: 'Base::f (static binding).' },
    { id: 'f2', front: 'Effect of delete through Base* without a virtual destructor?', backMd: 'Undefined behaviour; typically only ~Base runs.' },
    { id: 'f3', front: 'What is object slicing?', backMd: 'Copying a derived object into a base object by value loses the derived part.' },
    { id: 'f4', front: 'Virtual call inside a base constructor dispatches to?', backMd: 'The base version (the derived part is not built yet).' },
    { id: 'f5', front: 'Benefit of the override keyword?', backMd: 'A compile error if the function does not actually override anything.' },
  ] },
  resources: [CPPREF('virtual function specifier', 'language/virtual'), CPPREF('override specifier', 'language/override'), ISOCPP],
});

const pvMcqs: MCQ[] = [
  mcq({ ...q(PV), id: 'cpp.pv.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct B { void f() { cout << "B::f "; } virtual void g() { cout << "B::g "; } virtual ~B() {} };
struct D : B { void f() { cout << "D::f "; } void g() override { cout << "D::g "; } };
int main() {
    D d;
    B* p = &d;
    B& r = d;
    p->f(); p->g(); r.g();
    cout << endl;
    return 0;
}`, 'C++', 'B::f D::g D::g'), options: ['B::f D::g D::g', ['D::f D::g D::g', 'f is not virtual, so the static type B decides.'], ['B::f B::g B::g', 'g is virtual and the object is a D.'], ['D::f B::g D::g', 'Pointers and references dispatch the same way.']], answer: 0, explanation: 'f is non-virtual (static binding through B*); g is virtual (dynamic binding through both the pointer and the reference).', verified: 'compiled' }),
  mcq({ ...q(PV), id: 'cpp.pv.q2', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct Animal { virtual const char* sound() const { return "..."; } virtual ~Animal() {} };
struct Dog : Animal { const char* sound() const override { return "Woof"; } };
void byValue(Animal a) { cout << a.sound() << " "; }
void byRef(const Animal& a) { cout << a.sound() << " "; }
int main() {
    Dog d;
    byValue(d);
    byRef(d);
    cout << endl;
    return 0;
}`, 'C++', '... Woof'), options: ['... Woof', ['Woof Woof', 'Passing by value slices the Dog into an Animal.'], ['... ...', 'The reference keeps the dynamic type.'], ['Woof ...', 'It is the other way round.']], answer: 0, explanation: 'byValue copies only the Animal part (slicing), so the dynamic type is Animal. byRef binds to the real Dog.', verified: 'compiled' }),
  mcq({ ...q(PV), id: 'cpp.pv.q3', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct Base {
    Base() { hello(); }
    virtual void hello() { cout << "Base "; }
    virtual ~Base() {}
};
struct Derived : Base {
    void hello() override { cout << "Derived "; }
};
int main() {
    Derived d;
    d.hello();
    cout << endl;
    return 0;
}`, 'C++', 'Base Derived'), options: ['Base Derived', ['Derived Derived', 'During Base\'s constructor the object is still a Base.'], ['Base Base', 'After construction, d.hello() calls Derived\'s version.'], ['Undefined behaviour, so nothing is printed', 'It is well-defined (unlike calling a pure virtual function).']], answer: 0, explanation: 'Virtual calls in a constructor resolve to the class being constructed. After construction, normal dispatch applies.', verified: 'compiled' }),
  mcq({ ...q(PV), id: 'cpp.pv.q4', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct B { virtual ~B() { cout << "~B "; } };
struct D : B { ~D() { cout << "~D "; } };
int main() {
    B* p = new D();
    delete p;
    cout << endl;
    return 0;
}`, 'C++', '~D ~B'), options: ['~D ~B', ['~B', 'That is what can happen (as UB) when ~B is NOT virtual.'], ['~B ~D', 'The derived destructor runs first.'], ['~D', 'The base destructor always runs after the derived one.']], answer: 0, explanation: 'Because ~B is virtual, delete dispatches to ~D, which then calls ~B automatically.', verified: 'compiled' }),
  mcq({ ...q(PV), id: 'cpp.pv.q5', type: 'compile-error', difficulty: 'medium', stem: 'Why does this fail to compile?', code: cppErr(`struct Shape { virtual double area() const { return 0; } virtual ~Shape() {} };
struct Circle : Shape {
    double r = 1;
    double area() override { return 3.14 * r * r; }   // here
};`), options: ['The override is missing const, so it does not override anything and `override` makes that an error', ['override must come before the return type', 'It goes after the parameter list.'], ['Circle needs a constructor', 'The default member initialiser suffices.'], ['area cannot return double', 'The return type is fine.']], answer: 0, explanation: 'Without `override`, this would silently declare a new non-const function and calls through Shape* would still run Shape::area.' }),
  mcq({ ...q(PV), id: 'cpp.pv.q6', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct B { void f(int) { cout << "B::f(int) "; } void f(double) { cout << "B::f(double) "; } };
struct D : B { void f(double) { cout << "D::f(double) "; } };
int main() {
    D d;
    d.f(1);
    d.B::f(1);
    cout << endl;
    return 0;
}`, 'C++', 'D::f(double) B::f(int)'), options: ['D::f(double) B::f(int)', ['B::f(int) B::f(int)', 'D::f hides every B::f overload, so B::f(int) is not considered for d.f(1).'], ['D::f(double) D::f(double)', 'Qualified lookup B::f finds the base overloads.'], ['Compile error: ambiguous', 'Name hiding removes the ambiguity: only D::f is visible.']], answer: 0, explanation: 'Declaring f in D hides all B::f overloads; 1 converts to double for D::f(double). Qualifying with B:: finds the base overloads, and f(int) is the exact match. Add using B::f; in D to restore overloading.', verified: 'compiled' }),
];

// ---------------------------------------------------------------------------------------
const CS = 'cpp.copy-semantics';
const copySem = cppTopic({
  id: CS, title: 'Copy Semantics', level: 'core', estMinutes: 55, prerequisites: [CD],
  summary: 'Copy constructor and assignment, shallow vs deep copy, rule of 3/5/0.',
  objectives: ['Tell when the copy constructor vs the copy assignment operator runs.', 'Explain shallow vs deep copy and the double-free bug.', 'Apply the rule of three/five/zero.', 'Write a safe copy assignment (copy-and-swap, self-assignment).'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Copy construction vs copy assignment', bodyMd: `- **Copy constructor** \`T(const T&)\`: creates a **new** object from an existing one: \`T b = a;\`, \`T b(a);\`, pass-by-value, return by value (often elided).
- **Copy assignment** \`T& operator=(const T&)\`: overwrites an **existing** object: \`b = a;\`.

The compiler-generated versions copy each member (**memberwise copy**). For raw pointers that means copying the address: a **shallow copy**. Two objects then own the same memory; when both destructors run, the memory is freed twice (**double free**, undefined behaviour).` },
    { id: 'rules', kind: 'concept', title: 'Rule of three, five and zero', bodyMd: `- **Rule of three:** if you need a custom destructor, copy constructor or copy assignment, you probably need all three (the class owns a resource).
- **Rule of five:** in C++11+, also consider the move constructor and move assignment.
- **Rule of zero (preferred):** do not manage raw resources yourself. Use members that already manage them (\`std::string\`, \`std::vector\`, \`std::unique_ptr\`), and the compiler-generated special members are correct.` },
    { id: 'deep', kind: 'example', title: 'A deep-copying class with copy-and-swap', bodyMd: 'Copy-and-swap gives strong exception safety and handles self-assignment automatically.', code: [cpp(`class Buffer {
    size_t n;
    int* data;
public:
    explicit Buffer(size_t n) : n(n), data(new int[n]()) {}
    Buffer(const Buffer& o) : n(o.n), data(new int[o.n]) {          // deep copy
        std::copy(o.data, o.data + n, data);
    }
    friend void swap(Buffer& a, Buffer& b) noexcept {
        std::swap(a.n, b.n);
        std::swap(a.data, b.data);
    }
    Buffer& operator=(Buffer o) { swap(*this, o); return *this; }   // copy-and-swap
    ~Buffer() { delete[] data; }
};`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Raw owning pointers with the default copy (shallow copy, double free).
2. Forgetting self-assignment (\`a = a\`) in a hand-written operator= that deletes first.
3. Copy assignment returning void (breaks chaining \`a = b = c\`); return \`T&\`.
4. Taking the copy constructor parameter **by value** (\`T(T o)\`), which is ill-formed: it would need itself to be called.
5. Writing all five special members when the rule of zero would do.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Shallow vs deep copy?', answerMd: 'A shallow copy duplicates member values, including pointer addresses, so both objects share the same resource. A deep copy allocates new storage and copies the pointed-to data, so each object owns its own copy.' },
    { id: 'iq2', q: 'What is the rule of three/five/zero?', answerMd: 'If a class manages a resource (needs a custom destructor), it also needs a correct copy constructor and copy assignment (three), plus move operations in modern C++ (five). Better: rule of zero, which composes RAII members so that no custom special members are needed.' },
    { id: 'iq3', q: 'Why must the copy constructor take its parameter by reference?', answerMd: 'Passing by value would require copying the argument, which itself calls the copy constructor: infinite recursion. Hence T(const T&).' },
    { id: 'iq4', q: 'Explain copy-and-swap.', answerMd: 'operator= takes its parameter by value (the copy is made, possibly throwing, before any modification), then swaps contents with *this; the old contents are destroyed with the parameter. It gives strong exception safety and handles self-assignment.' },
  ],
  revision: { notesMd: `- \`T b = a;\` is the copy constructor; \`b = a;\` is copy assignment.
- Default copy is memberwise: pointer members are shallow copied, risking a double free.
- Rule of 3/5; prefer the rule of 0 (RAII members).
- operator= returns T&; handle self-assignment (copy-and-swap).
- The copy constructor parameter must be a reference.`, flashcards: [
    { id: 'f1', front: '`T b = a;` calls?', backMd: 'The copy constructor (initialisation), not assignment.' },
    { id: 'f2', front: 'Danger of the default copy with a raw owning pointer?', backMd: 'Shallow copy: two owners, then a double delete.' },
    { id: 'f3', front: 'Rule of zero?', backMd: 'Let RAII members manage resources so the defaults are correct.' },
    { id: 'f4', front: 'Why T(const T&) and not T(T)?', backMd: 'By-value would recursively require the copy constructor.' },
    { id: 'f5', front: 'Benefit of copy-and-swap?', backMd: 'Strong exception safety and automatic self-assignment safety.' },
  ] },
  resources: [CPPREF('Copy constructors', 'language/copy_constructor'), CPPREF('The rule of three/five/zero', 'language/rule_of_three'), ISOCPP],
});

const csMcqs: MCQ[] = [
  mcq({ ...q(CS), id: 'cpp.cs.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct T {
    T() { cout << "D "; }
    T(const T&) { cout << "C "; }
    T& operator=(const T&) { cout << "A "; return *this; }
};
int main() {
    T a;
    T b = a;
    T c;
    c = a;
    cout << endl;
    return 0;
}`, 'C++', 'D C D A'), options: ['D C D A', ['D A D A', '`T b = a;` is initialisation, so it is the copy constructor.'], ['D C D C', '`c = a;` assigns to an existing object.'], ['D D D A', 'b is copy-constructed, not default-constructed.']], answer: 0, explanation: 'a: default; b: copy constructor; c: default; c = a: copy assignment.', verified: 'compiled' }),
  mcq({ ...q(CS), id: 'cpp.cs.q2', type: 'code-output', difficulty: 'medium', stem: 'The class uses the compiler-generated copy. What does this print?', code: cpp(`#include <iostream>
using namespace std;
struct Holder { int* p; };
int main() {
    Holder a{new int(1)};
    Holder b = a;          // memberwise copy
    *b.p = 42;
    cout << *a.p << endl;
    delete a.p;            // delete only once
    return 0;
}`, 'C++', '42'), options: ['42', ['1', 'b.p and a.p point to the same int (shallow copy).'], ['0', 'Nothing resets the value.'], ['A crash', 'Only one delete happens here.']], answer: 0, explanation: 'The pointer value was copied, not the int, so both objects share it. If both "owned" it and deleted it, that would be a double free.', verified: 'compiled' }),
  mcq({ ...q(CS), id: 'cpp.cs.q3', type: 'compile-error', difficulty: 'medium', stem: 'What is wrong with this declaration?', code: cppErr(`struct Widget {
    Widget(Widget other);   // copy constructor?
};`), options: ['A copy constructor taking its parameter by value is ill-formed (it would recursively need itself)', ['It must be named copy', 'Constructors are named after the class.'], ['It must be static', 'Constructors cannot be static.'], ['Nothing is wrong', 'Compilers reject it.']], answer: 0, explanation: 'Use Widget(const Widget& other).' }),
  mcq({ ...q(CS), id: 'cpp.cs.q4', type: 'concept', difficulty: 'easy', stem: 'A class has a destructor that deletes a raw pointer member. According to the rule of three, what else should it define (or delete)?', options: ['The copy constructor and the copy assignment operator', ['Only a default constructor', 'That does not fix shallow copies.'], ['A virtual function', 'Unrelated.'], ['operator<<', 'Unrelated.']], answer: 0, explanation: 'Otherwise the generated copies share the pointer and both destructors delete it.' }),
  mcq({ ...q(CS), id: 'cpp.cs.q5', type: 'debug', difficulty: 'hard', stem: 'This copy assignment crashes when an object is assigned to itself (`a = a`). Why?', code: cpp(`struct Buffer { size_t n; int* data; Buffer& operator=(const Buffer& o); };
Buffer& Buffer::operator=(const Buffer& o) {
    delete[] data;
    n = o.n;
    data = new int[n];
    std::copy(o.data, o.data + n, data);
    return *this;
}`), options: ['When &o == this, the source data is deleted before it is copied', ['delete[] should be delete', 'The array form is correct for new[].'], ['It should return by value', 'Returning a reference is idiomatic.'], ['std::copy cannot copy arrays', 'It can copy through pointers.']], answer: 0, explanation: 'Check for self-assignment or use copy-and-swap, which allocates the new copy first.' }),
  mcq({ ...q(CS), id: 'cpp.cs.q6', type: 'concept', difficulty: 'medium', stem: 'Which design follows the **rule of zero**?', options: ['A class whose members are std::string and std::vector<int>, with no user-declared special members', ['A class with a raw new[] pointer and all five special members written by hand', 'That is the rule of five.'], ['A class that deletes its copy constructor', 'Deleting copy is a choice, not the rule of zero.'], ['A class with a virtual destructor only', 'Unrelated to resource ownership.']], answer: 0, explanation: 'Members manage their own resources, so the compiler-generated copy, move and destructor are correct.' }),
];

// ---------------------------------------------------------------------------------------
const SM = 'cpp.static-members';
const statics = cppTopic({
  id: SM, title: 'Static Members', level: 'core', estMinutes: 30, prerequisites: ['cpp.classes-objects'],
  summary: 'Static data, static functions and static locals.',
  objectives: ['Explain that static data members are shared by all objects of a class.', 'Know that static member functions have no `this` pointer.', 'Predict the behaviour of static local variables across calls.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'One copy per class', bodyMd: `- A **static data member** belongs to the class: there is one copy shared by every object (for example, an instance counter). Non-const static data members must be defined outside the class (or be \`inline static\` in C++17).
- A **static member function** has no \`this\`; it can only access static members directly. Call it as \`Class::f()\`.
- A **static local variable** inside a function is initialised once (the first time control reaches it, thread-safely since C++11) and keeps its value between calls.` },
    { id: 'example', kind: 'example', title: 'Counting instances', bodyMd: 'A shared counter incremented by constructors and decremented by destructors.', code: [cpp(`class Session {
public:
    static int active;                  // declaration
    Session() { ++active; }
    ~Session() { --active; }
    static int count() { return active; }   // no 'this' here
};
int Session::active = 0;                // definition (C++14)`)] },
    { id: 'size', kind: 'concept', title: 'Static members and object size', bodyMd: 'Static data members are not stored inside each object, so they do not contribute to `sizeof(Class)`. An empty class still has size at least 1, so that distinct objects have distinct addresses.' },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Forgetting the out-of-class definition, which causes a linker error ("undefined reference").
2. Accessing non-static members from a static function (there is no object).
3. Assuming each object has its own copy of a static member.
4. Static initialisation order across translation units is unspecified (the "static initialisation order fiasco"); use function-local statics instead.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Static vs non-static members?', answerMd: 'Non-static data belongs to each object; static data is a single variable shared by the class. Static functions have no this pointer, so they can only use static members unless an object is passed in.' },
    { id: 'iq2', q: 'What is the static initialisation order fiasco?', answerMd: 'The initialisation order of globals and statics across different translation units is unspecified, so one may use another before it is initialised. Fix it with function-local statics (initialised on first use), as in a Meyers singleton.' },
    { id: 'iq3', q: 'Does a static member affect sizeof(Class)?', answerMd: 'No. Static data is stored separately, once. sizeof counts only non-static members (plus padding and a vptr if polymorphic).' },
    { id: 'iq4', q: 'Why does a static member function not have access to this?', answerMd: 'It is called without an object (Class::f()), so there is no instance to point to. That is also why it cannot be virtual or const.' },
  ],
  revision: { notesMd: `- Static data: one per class; define it outside the class (pre-C++17).
- Static function: no \`this\`; call it as Class::f().
- Static local: initialised once, persists across calls.
- sizeof ignores static members; an empty class has size ≥ 1.`, flashcards: [
    { id: 'f1', front: 'Linker error "undefined reference to X::count"?', backMd: 'The static data member was declared but not defined outside the class.' },
    { id: 'f2', front: 'Can a static member function be virtual?', backMd: 'No: it has no object or this.' },
    { id: 'f3', front: 'sizeof an empty class?', backMd: 'At least 1.' },
    { id: 'f4', front: 'Static local initialisation?', backMd: 'Once, the first time control reaches it (thread-safe since C++11).' },
    { id: 'f5', front: 'Fix for the static init order fiasco?', backMd: 'Function-local statics (construct on first use).' },
  ] },
  resources: [CPPREF('static members', 'language/static'), ISOCPP],
});

const smMcqs: MCQ[] = [
  mcq({ ...q(SM), id: 'cpp.sm.q1', type: 'code-output', difficulty: 'easy', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct C { static int n; C() { ++n; } ~C() { --n; } };
int C::n = 0;
int main() {
    C a, b;
    {
        C c;
        cout << C::n << " ";
    }
    cout << C::n << endl;
    return 0;
}`, 'C++', '3 2'), options: ['3 2', ['1 1', 'n is shared by all objects.'], ['3 3', 'c is destroyed at the end of its block.'], ['2 2', 'c is alive at the first print.']], answer: 0, explanation: 'Three objects exist at the first print; c is destroyed before the second print.', verified: 'compiled' }),
  mcq({ ...q(SM), id: 'cpp.sm.q2', type: 'code-output', difficulty: 'easy', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
int next_id() {
    static int id = 100;
    return ++id;
}
int main() {
    int a = next_id();
    int b = next_id();
    int c = next_id();
    cout << a << " " << b << " " << c << endl;
    return 0;
}`, 'C++', '101 102 103'), options: ['101 102 103', ['101 101 101', 'The static local keeps its value between calls.'], ['100 101 102', 'Pre-increment returns the incremented value, so the first call returns 101.'], ['103 102 101', 'Each call is a separate statement, so the order is fixed.']], answer: 0, explanation: 'id is initialised once to 100 and incremented on each call. (Each call is its own statement on purpose: in `cout << f() << f()` the evaluation order of the calls was unspecified before C++17, and g++ in C++14 mode actually prints them right to left.)', verified: 'compiled' }),
  mcq({ ...q(SM), id: 'cpp.sm.q3', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: cppErr(`struct Counter {
    int value = 0;
    static void reset() { value = 0; }   // here
};`), options: ['A static member function has no `this`, so it cannot access the non-static member value', ['Static functions cannot return void', 'They can.'], ['value must be private', 'Access is unrelated.'], ['Static functions must be defined outside the class', 'Inline definitions are fine.']], answer: 0, explanation: 'Make reset non-static, or pass a Counter& to it.' }),
  mcq({ ...q(SM), id: 'cpp.sm.q4', type: 'code-output', difficulty: 'medium', stem: 'What does this program print (typical 64-bit compiler, `int` is 4 bytes)?', code: cpp(`#include <iostream>
using namespace std;
struct A { int x; static int y; };
int A::y = 0;
struct E {};
int main() {
    cout << sizeof(A) << " " << sizeof(E) << endl;
    return 0;
}`, 'C++', '4 1'), options: ['4 1', ['8 0', 'Static members are not stored in objects, and empty classes have size ≥ 1.'], ['8 1', 'y is not part of each object.'], ['4 0', 'An empty class still occupies at least 1 byte.']], answer: 0, explanation: 'Only x is stored per object. An empty class has non-zero size, so that distinct objects have distinct addresses.', verified: 'compiled' }),
  mcq({ ...q(SM), id: 'cpp.sm.q5', type: 'concept', difficulty: 'medium', stem: 'In C++14, a class declares `static int count;` but no definition exists in any .cpp file, and the code uses count. What happens?', options: ['A linker error: undefined reference', ['It compiles and count is 0', 'Odr-use requires a definition.'], ['A compiler error at the declaration', 'The declaration itself is fine.'], ['Undefined behaviour at run time', 'The program fails to link.']], answer: 0, explanation: 'Add int Class::count = 0; in exactly one translation unit (or use inline static in C++17).' }),
  mcq({ ...q(SM), id: 'cpp.sm.q6', type: 'concept', difficulty: 'easy', stem: 'How many copies of a static data member exist when 10 objects of the class are created?', options: ['One', ['Ten', 'Static members are per class.'], ['Eleven', 'There is no per-object copy.'], ['Zero until accessed', 'It exists once it is defined.']], answer: 0, explanation: 'All objects share the single static member.' }),
];

// ---------------------------------------------------------------------------------------
const MR = 'cpp.memory-raii';
const raii = cppTopic({
  id: MR, title: 'Memory, RAII and Smart Pointers', level: 'core', estMinutes: 55, prerequisites: [CS],
  summary: 'Stack vs heap, RAII, unique_ptr, shared_ptr and weak_ptr.',
  objectives: ['Explain RAII and why it gives exception-safe cleanup.', 'Choose between unique_ptr, shared_ptr and weak_ptr.', 'Predict reference counts and destruction times.', 'Break shared_ptr cycles with weak_ptr.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'RAII: tie resources to object lifetime', bodyMd: `**Resource Acquisition Is Initialisation:** acquire a resource (memory, file, lock, socket) in a constructor and release it in the destructor. Because destructors run automatically when objects go out of scope, including during stack unwinding after an exception, cleanup cannot be forgotten.

Examples: \`std::vector\` (memory), \`std::fstream\` (file handle), \`std::lock_guard\` (mutex), smart pointers (heap objects).

Manual \`new\`/\`delete\` is error-prone: an early return or an exception between them leaks memory.` },
    { id: 'smart', kind: 'comparison', title: 'Smart pointers', bodyMd: `| Pointer | Ownership | Copyable? | Use |
|---|---|---|---|
| \`unique_ptr<T>\` | exclusive | no (move only) | the default for single ownership |
| \`shared_ptr<T>\` | shared, reference counted | yes | several owners with unclear lifetimes |
| \`weak_ptr<T>\` | non-owning observer of a shared_ptr | yes | break cycles, caches; \`lock()\` to use |

Create them with \`make_unique\` / \`make_shared\` (exception-safe; make_shared does one allocation for the object and its control block). The object of a shared_ptr is destroyed when the **last** shared_ptr to it is destroyed or reset.` },
    { id: 'cycles', kind: 'example', title: 'Reference cycles leak', bodyMd: 'Two objects holding shared_ptrs to each other never reach count 0. Make one direction a weak_ptr (for example child → parent).', code: [cpp(`struct Node {
    std::shared_ptr<Node> next;     // owning direction
    std::weak_ptr<Node>   prev;     // non-owning back pointer breaks the cycle
};`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Creating two shared_ptrs from the same raw pointer (two control blocks, double delete).
2. Using shared_ptr everywhere "to be safe": prefer unique_ptr; sharing has a cost (atomic counts) and obscures ownership.
3. shared_ptr cycles (leaks).
4. Using a raw pointer after the owning smart pointer was reset or destroyed (dangling).
5. \`delete\` vs \`delete[]\` mismatch with manual arrays; use std::vector instead.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is RAII?', answerMd: 'Resource Acquisition Is Initialisation: owning objects acquire resources in constructors and release them in destructors, so cleanup happens automatically and exception-safely when they go out of scope.' },
    { id: 'iq2', q: 'unique_ptr vs shared_ptr?', answerMd: 'unique_ptr has exclusive ownership, cannot be copied (only moved), and has no overhead beyond a raw pointer. shared_ptr has shared ownership with an atomic reference count and a control block; the object dies when the last owner goes away. Default to unique_ptr.' },
    { id: 'iq3', q: 'How does weak_ptr help?', answerMd: 'It observes an object owned by shared_ptrs without increasing the strong count, so cycles do not keep objects alive. Call lock() to get a shared_ptr if the object still exists (expired() otherwise).' },
    { id: 'iq4', q: 'Why prefer make_shared over shared_ptr<T>(new T)?', answerMd: 'One allocation for the object and the control block (faster, better locality), and no leak window if an exception occurs between new and the shared_ptr construction in a larger expression.' },
  ],
  revision: { notesMd: `- RAII: constructor acquires, destructor releases; exception-safe.
- unique_ptr (default, move-only) · shared_ptr (refcount) · weak_ptr (observer).
- make_unique / make_shared.
- Cycles of shared_ptr leak; use weak_ptr for back-links.
- Never create two shared_ptrs from one raw pointer.`, flashcards: [
    { id: 'f1', front: 'Can a unique_ptr be copied?', backMd: 'No; it can only be moved.' },
    { id: 'f2', front: 'When is a shared_ptr\'s object destroyed?', backMd: 'When the last owning shared_ptr is destroyed or reset.' },
    { id: 'f3', front: 'Fix a parent ↔ child shared_ptr cycle?', backMd: 'Make one direction (usually child → parent) a weak_ptr.' },
    { id: 'f4', front: 'Danger of `shared_ptr<T> a(p), b(p);` for a raw p?', backMd: 'Two control blocks, so the object is deleted twice.' },
    { id: 'f5', front: 'RAII example for mutexes?', backMd: 'std::lock_guard / std::unique_lock.' },
  ] },
  resources: [CPPREF('std::unique_ptr', 'memory/unique_ptr'), CPPREF('std::shared_ptr', 'memory/shared_ptr'), ISOCPP],
});

const mrMcqs: MCQ[] = [
  mcq({ ...q(MR), id: 'cpp.mr.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
#include <memory>
using namespace std;
struct R { ~R() { cout << "freed "; } };
int main() {
    shared_ptr<R> a = make_shared<R>();
    cout << a.use_count() << " ";
    {
        shared_ptr<R> b = a;
        cout << a.use_count() << " ";
    }
    cout << a.use_count() << " ";
    a.reset();
    cout << "end" << endl;
    return 0;
}`, 'C++', '1 2 1 freed end'), options: ['1 2 1 freed end', ['1 2 2 freed end', 'b is destroyed when its block ends.'], ['1 2 1 end freed', 'reset() drops the last owner immediately.'], ['1 1 1 freed end', 'Copying a shared_ptr increments the count.']], answer: 0, explanation: 'Copying raises the count to 2; b going out of scope lowers it to 1; reset() drops it to 0 and destroys R.', verified: 'compiled' }),
  mcq({ ...q(MR), id: 'cpp.mr.q2', type: 'compile-error', difficulty: 'easy', stem: 'Why does this fail to compile?', code: cppErr(`#include <memory>
void f() {
    std::unique_ptr<int> a = std::make_unique<int>(5);
    std::unique_ptr<int> b = a;   // here
}`), options: ['unique_ptr is move-only; its copy constructor is deleted (use std::move(a))', ['make_unique does not exist in C++14', 'It was added in C++14.'], ['unique_ptr cannot hold int', 'It can.'], ['b must be declared auto', 'The type is fine.']], answer: 0, explanation: 'Exclusive ownership means it can only be transferred: auto b = std::move(a);.' }),
  mcq({ ...q(MR), id: 'cpp.mr.q3', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: cpp(`#include <iostream>
#include <memory>
using namespace std;
struct Node {
    shared_ptr<Node> other;
    ~Node() { cout << "~Node "; }
};
int main() {
    {
        auto a = make_shared<Node>();
        auto b = make_shared<Node>();
        a->other = b;
        b->other = a;
    }
    cout << "done" << endl;
    return 0;
}`, 'C++', 'done'), options: ['done', ['~Node ~Node done', 'The cycle keeps both counts at 1, so neither is destroyed.'], ['~Node done', 'Neither node is freed.'], ['A crash', 'It simply leaks.']], answer: 0, explanation: 'After a and b go out of scope, each node is still owned by the other: a reference cycle, which is a leak. Make one link a weak_ptr.', verified: 'compiled' }),
  mcq({ ...q(MR), id: 'cpp.mr.q4', type: 'concept', difficulty: 'medium', stem: 'Why is RAII considered exception-safe?', options: ['Destructors of local objects run during stack unwinding, so resources are released even when an exception propagates', ['Exceptions are disabled inside constructors', 'They are not.'], ['RAII objects catch every exception', 'They do not catch anything.'], ['RAII avoids the heap entirely', 'RAII can manage heap memory.']], answer: 0, explanation: 'Cleanup is tied to scope exit, which always happens.' }),
  mcq({ ...q(MR), id: 'cpp.mr.q5', type: 'debug', difficulty: 'hard', stem: 'What is wrong here?', code: cpp(`int* raw = new int(7);
std::shared_ptr<int> p1(raw);
std::shared_ptr<int> p2(raw);`), options: ['Two independent control blocks own the same pointer, so it is deleted twice', ['shared_ptr cannot wrap an int*', 'It can.'], ['p2 should be a weak_ptr', 'A weak_ptr cannot be created from a raw pointer.'], ['Nothing, the counts merge', 'They do not know about each other.']], answer: 0, explanation: 'Create one shared_ptr (preferably make_shared) and copy it: auto p2 = p1;.' }),
  mcq({ ...q(MR), id: 'cpp.mr.q6', type: 'concept', difficulty: 'easy', stem: 'Which smart pointer should be your **default** for single ownership?', options: ['std::unique_ptr', ['std::shared_ptr', 'It adds reference-counting overhead and blurs ownership.'], ['std::weak_ptr', 'It does not own anything.'], ['std::auto_ptr', 'Removed in C++17; it had broken copy semantics.']], answer: 0, explanation: 'unique_ptr expresses exclusive ownership with zero overhead.' }),
];

export const topics: Topic[] = [ctors, poly, copySem, statics, raii];
export const mcqs: MCQ[] = [...cdMcqs, ...pvMcqs, ...csMcqs, ...smMcqs, ...mrMcqs];
