import type { MCQ, Topic } from '../schema';
import { cpp, cppErr, mcq } from '../helpers';
import { CPPREF, ISOCPP, cppTopic, q } from './common';

// C++ batch 3: move semantics, abstract classes, exceptions, templates, SOLID and patterns.
// Output questions avoid behaviour that C++14 leaves unspecified (copy elision of temporaries
// and return values, operand evaluation order), so the verified output is the only correct one.

// ---------------------------------------------------------------------------------------
const MV = 'cpp.move-semantics';
const moveSem = cppTopic({
  id: MV, title: 'Move Semantics', level: 'advanced', estMinutes: 55, prerequisites: ['cpp.memory-raii'], related: ['cpp.copy-semantics', 'cpp.memory-raii', 'cpp.templates'],
  summary: 'rvalues, move constructors and std::move.',
  objectives: ['Distinguish lvalues and rvalues and bind rvalue references (T&&).', 'Write a move constructor and move assignment that steal resources and leave the source valid but unspecified.', 'Explain what std::move really does (a cast) and when the compiler moves automatically.', 'Apply the rule of five / zero, and know why noexcept moves matter for std::vector.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Why moves exist', bodyMd: `Copying a \`std::string\` or \`std::vector\` allocates and copies every element. When the source is about to die anyway (a temporary, or a local we no longer need), we can **steal** its buffer instead: copy one pointer and set the source's pointer to null. That is a **move**.

- An **lvalue** has a name and an address you can take (\`v\`, \`*p\`, \`a[i]\`).
- An **rvalue** is a temporary or a value about to expire (\`f()\` returning by value, \`x + y\`, \`std::move(v)\`).
- \`T&&\` (an **rvalue reference**) binds only to rvalues, so overloads can tell the cases apart:

\`\`\`cpp
void take(const Buffer& b);   // copies: the caller keeps its buffer
void take(Buffer&& b);        // may steal: the caller's buffer is expiring
\`\`\`

**std::move does not move anything.** It is a cast to \`T&&\` that says "you may steal from this". The actual move happens only if a move constructor or move assignment is then selected. After \`b = std::move(a);\`, \`a\` is in a **valid but unspecified** state: you may assign to it or destroy it, but do not rely on its contents.` },
    { id: 'code', kind: 'code', title: 'A resource-owning class with all five special members', bodyMd: 'Copy deep-copies; move steals and nulls the source. noexcept on the moves lets std::vector use them when it grows.', code: [cpp(`
#include <algorithm>
#include <cstddef>
#include <iostream>
#include <utility>
using namespace std;

class Buffer {
public:
    explicit Buffer(size_t n) : size_(n), data_(new int[n]()) {}
    ~Buffer() { delete[] data_; }
    Buffer(const Buffer& o) : size_(o.size_), data_(new int[o.size_]) {       // copy: deep
        copy(o.data_, o.data_ + size_, data_);
        cout << "copy ";
    }
    Buffer(Buffer&& o) noexcept : size_(o.size_), data_(o.data_) {           // move: steal
        o.size_ = 0; o.data_ = nullptr;
        cout << "move ";
    }
    Buffer& operator=(Buffer o) noexcept {          // copy-and-swap handles copy AND move assignment
        swap(size_, o.size_); swap(data_, o.data_);
        return *this;
    }
    size_t size() const { return size_; }
private:
    size_t size_;
    int* data_;
};

int main() {
    Buffer a(1000);
    Buffer b(a);              // copy
    Buffer c(std::move(a));   // move: a is now empty
    cout << a.size() << " " << b.size() << " " << c.size() << "\\n";
    return 0;
}`, 'C++', 'copy move 0 1000 1000')] },
    { id: 'rules', kind: 'concept', title: 'When moves happen, and the rule of five', bodyMd: `The compiler moves automatically from **rvalues**: temporaries, return values (\`return local;\` moves if copy elision does not apply), and \`throw\` expressions. It never moves from a named variable unless you write \`std::move\`.

**Rule of five:** if a class needs a custom destructor, copy constructor or copy assignment (because it manages a resource), it probably needs all five, including move constructor and move assignment. Declaring a destructor or a copy operation **suppresses the implicit move operations**, so the class silently falls back to copying.

**Rule of zero (preferred):** hold resources in members that already manage themselves (\`std::vector\`, \`std::string\`, \`std::unique_ptr\`) and declare none of the five; the compiler-generated ones are correct and efficient.

**noexcept matters:** when \`std::vector\` reallocates, it moves elements only if the move constructor is \`noexcept\` (otherwise it copies, to keep the strong exception guarantee).

**Forwarding references:** in a template, \`T&&\` with a deduced T can bind to anything (lvalues too); \`std::forward<T>(x)\` passes it on preserving its value category (perfect forwarding, used by \`emplace_back\`).` },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and C++ vs Java', bodyMd: `1. Using an object after moving from it as if it still had its value.
2. \`return std::move(local);\` which can prevent copy elision (return the local directly).
3. Moving from a \`const\` object: \`std::move(constObj)\` yields \`const T&&\`, which binds to the copy constructor, so it copies.
4. Forgetting \`noexcept\` on move operations, making vectors copy instead of move.
5. Declaring a destructor "just to log" and losing the implicit moves.

**C++ vs Java:** Java variables hold references, so "copying" an object variable never copies the object and moves are unnecessary; in C++ objects are values, which is why move semantics were added in C++11.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What does std::move do?', answerMd: 'It is an unconditional cast to an rvalue reference (static_cast<T&&>). It does not move anything by itself; it makes overload resolution pick a move constructor or move assignment if one exists. Afterwards the source must be treated as being in a valid but unspecified state.' },
    { id: 'iq2', q: 'Why should move constructors be noexcept?', answerMd: 'Containers such as std::vector provide the strong exception guarantee when reallocating. They can only move elements if moving cannot throw; otherwise they copy. Marking the move constructor noexcept lets vector move, which is much faster for resource-owning types.' },
    { id: 'iq3', q: 'What is the rule of five and the rule of zero?', answerMd: 'Rule of five: a class that manages a resource and defines one of destructor, copy constructor, copy assignment, move constructor, move assignment usually needs all five. Rule of zero: better to manage resources with RAII members (unique_ptr, vector) so the class declares none and the defaults are correct.' },
    { id: 'iq4', q: 'Why is `return std::move(x);` usually wrong?', answerMd: 'Returning a local by name already allows copy elision (NRVO) or an implicit move. Wrapping it in std::move turns the expression into an rvalue reference, which disables NRVO and forces a move at best. Return the local directly.' },
    { id: 'iq5', q: 'What is perfect forwarding?', answerMd: 'In a template taking T&& (a forwarding reference), std::forward<T>(arg) passes the argument on as an lvalue if an lvalue was passed and as an rvalue if an rvalue was passed, so the callee sees the original value category. emplace_back and make_unique rely on it.' },
  ],
  revision: { notesMd: `- lvalue = has identity; rvalue = temporary/expiring. T&& binds rvalues.
- std::move = cast; the moved-from object is valid but unspecified.
- Move ctor steals the resource and nulls the source; mark it noexcept.
- Declaring a destructor or copy op suppresses implicit moves → rule of five; prefer rule of zero.
- Don't return std::move(local); std::move on const copies.`, flashcards: [
    { id: 'f1', front: 'What does std::move actually do?', backMd: 'Casts its argument to an rvalue reference; nothing else.' },
    { id: 'f2', front: 'State of a moved-from std::string?', backMd: 'Valid but unspecified (usually empty); you may assign to it or destroy it.' },
    { id: 'f3', front: 'Why noexcept move constructors?', backMd: 'So std::vector moves (rather than copies) elements when it reallocates.' },
    { id: 'f4', front: 'Does declaring a destructor affect moves?', backMd: 'Yes: implicit move operations are not generated, so the class copies.' },
    { id: 'f5', front: 'std::move on a const object?', backMd: 'Produces const T&&, which selects the copy constructor.' },
  ] },
  resources: [CPPREF('Move constructors', 'language/move_constructor'), CPPREF('std::move', 'utility/move'), ISOCPP],
});

const mvMcqs: MCQ[] = [
  mcq({ ...q(MV), id: 'cpp.mv.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
#include <string>
#include <utility>
using namespace std;
int main() {
    string a = "hello";
    string b = a;
    string c = std::move(a);
    cout << b << " " << c << " " << b.size() + c.size() << endl;
    return 0;
}`, 'C++', 'hello hello 10'), options: ['hello hello 10', ['hello hello 15', 'a is not printed; b and c have 5 characters each.'], [' hello 5', 'b is a copy taken before the move.'], ['hello  5', 'c received the moved string.']], answer: 0, explanation: 'b is a copy; c steals a\'s buffer. a is now valid but unspecified, so the program avoids printing it.', verified: 'compiled' }),
  mcq({ ...q(MV), id: 'cpp.mv.q2', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
#include <utility>
using namespace std;
struct T {
    T() {}
    T(const T&) { cout << "C"; }
    T(T&&) noexcept { cout << "M"; }
};
int main() {
    T a;
    const T k;
    T b(a);
    T c(std::move(a));
    T d(std::move(k));
    cout << endl;
    return 0;
}`, 'C++', 'CMC'), options: ['CMC', ['CMM', 'std::move(k) is const T&&, which cannot bind to T&&, so the copy constructor runs.'], ['CCC', 'std::move(a) selects the move constructor.'], ['MMM', 'T b(a) copies from an lvalue.']], answer: 0, explanation: 'Moving from a const object silently copies: the move constructor needs a non-const rvalue.', verified: 'compiled' }),
  mcq({ ...q(MV), id: 'cpp.mv.q3', type: 'concept', difficulty: 'easy', stem: 'What does std::move(x) do by itself?', options: ['Casts x to an rvalue reference so that move operations can be selected', ['Moves x\'s contents into a new object', 'Only a constructor or assignment that receives it can move.'], ['Deletes x', 'x is still alive.'], ['Copies x to the heap', 'No copy happens in the cast.']], answer: 0, explanation: 'It is equivalent to static_cast<T&&>(x).' }),
  mcq({ ...q(MV), id: 'cpp.mv.q4', type: 'concept', difficulty: 'hard', stem: 'Class Widget declares only a destructor (`~Widget() { log(); }`) and holds a std::vector member. What happens when you `std::move` a Widget into another?', options: ['It is copied: declaring the destructor suppressed the implicit move constructor', ['It is moved as usual', 'The implicit move constructor is not declared when a destructor is user-declared.'], ['It does not compile', 'The copy constructor is still generated, so it compiles.'], ['The vector is moved but the rest copied', 'Either the whole object is copied or moved.']], answer: 0, explanation: 'Add `Widget(Widget&&) = default;` (and the other special members) or remove the destructor.' }),
  mcq({ ...q(MV), id: 'cpp.mv.q5', type: 'concept', difficulty: 'medium', stem: 'Why does std::vector<Buffer> copy elements during reallocation even though Buffer has a move constructor?', options: ['The move constructor is not marked noexcept', ['Vectors never move elements', 'They do, when it is safe.'], ['Buffer has no copy constructor', 'Then it would have to move.'], ['Reallocation only happens with reserve()', 'It also happens on growth.']], answer: 0, explanation: 'To keep the strong exception guarantee, vector uses move_if_noexcept: a throwing move would leave the old buffer half-moved.' }),
  mcq({ ...q(MV), id: 'cpp.mv.q6', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
#include <memory>
#include <utility>
using namespace std;
int main() {
    unique_ptr<int> p(new int(7));
    unique_ptr<int> q = std::move(p);
    cout << (p == nullptr) << " " << *q << endl;
    return 0;
}`, 'C++', '1 7'), options: ['1 7', ['0 7', 'Moving a unique_ptr leaves the source null (this is specified for unique_ptr).'], ['It does not compile', 'unique_ptr is movable.'], ['1 0', 'q owns the int 7.']], answer: 0, explanation: 'unique_ptr transfers ownership on move and its moved-from state is guaranteed to be null.', verified: 'compiled' }),
];

// ---------------------------------------------------------------------------------------
const AI = 'cpp.abstract-interfaces';
const abstractIfaces = cppTopic({
  id: AI, title: 'Abstract Classes and Interfaces', level: 'core', estMinutes: 40, prerequisites: ['cpp.polymorphism-virtual'], related: ['cpp.polymorphism-virtual', 'cpp.solid-patterns', 'java.abstract-interfaces'],
  summary: 'Pure virtual functions as interfaces.',
  objectives: ['Declare pure virtual functions and explain why a class with one is abstract.', 'Design an interface (abstract class with only pure virtual functions and a virtual destructor) and program against it.', 'Know that a pure virtual function can have a definition, and that a pure virtual destructor still needs one.', 'Compare C++ abstract classes with Java interfaces and abstract classes.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Pure virtual functions', bodyMd: `\`\`\`cpp
class Shape {
public:
    virtual double area() const = 0;      // pure virtual: no implementation required here
    virtual std::string name() const = 0;
    virtual ~Shape() = default;           // always: deleting through Shape* must work
};
\`\`\`

- A class with at least one pure virtual function is **abstract**: you cannot create objects of it, but you can have pointers and references to it.
- A derived class becomes **concrete** only when it overrides **every** pure virtual function; otherwise it is abstract too.
- Use \`override\` on the implementations so the compiler checks the signatures.
- An **interface** in C++ is just an abstract class with only pure virtual functions (and a virtual destructor), no data. Classes can implement several interfaces through multiple inheritance safely, because interfaces carry no state.` },
    { id: 'code', kind: 'code', title: 'Programming to an interface', bodyMd: 'Callers depend on Notifier only; new channels can be added without changing them.', code: [cpp(`
#include <iostream>
#include <memory>
#include <string>
#include <vector>
using namespace std;

class Notifier {                                     // interface
public:
    virtual void send(const string& to, const string& msg) = 0;
    virtual ~Notifier() = default;
};
class EmailNotifier : public Notifier {
public:
    void send(const string& to, const string& msg) override { cout << "email " << to << ": " << msg << "\\n"; }
};
class SmsNotifier : public Notifier {
public:
    void send(const string& to, const string& msg) override { cout << "sms " << to << ": " << msg << "\\n"; }
};

void alertAll(const vector<unique_ptr<Notifier>>& channels, const string& msg) {
    for (const auto& c : channels) c->send("oncall", msg);     // dynamic dispatch
}

int main() {
    vector<unique_ptr<Notifier>> channels;
    channels.push_back(unique_ptr<Notifier>(new EmailNotifier()));
    channels.push_back(unique_ptr<Notifier>(new SmsNotifier()));
    alertAll(channels, "disk full");
    return 0;
}`, 'C++', 'email oncall: disk full\nsms oncall: disk full')] },
    { id: 'details', kind: 'concept', title: 'Details interviewers like', bodyMd: `- **A pure virtual function can have a body**, defined outside the class: \`void Shape::describe() const { … }\`. Derived classes must still override it, but may call \`Shape::describe()\` to reuse the default part.
- **Pure virtual destructor:** \`virtual ~Shape() = 0;\` makes the class abstract even with no other pure functions, but you **must** still define \`Shape::~Shape() {}\`, because every derived destructor calls it.
- **Calling a pure virtual function from a constructor or destructor** is undefined behaviour (often a crash with "pure virtual method called"), because during construction the object is still of the base type.
- **Abstract class vs interface:** an abstract class may hold data and implemented functions shared by subclasses (a template method), while an interface only declares a contract.` },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and C++ vs Java', bodyMd: `1. Forgetting the virtual destructor in an interface (deleting through the interface pointer is undefined behaviour).
2. A typo in the override signature (missing const) leaves the function pure in the derived class; \`override\` catches it.
3. Trying to instantiate an abstract class or pass it by value (slicing; cannot even compile).
4. Declaring a pure virtual destructor without defining it (link error).

**C++ vs Java:** Java has a separate \`interface\` keyword (with default and static methods since Java 8) and single class inheritance; C++ uses abstract classes for both roles and allows multiple inheritance.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What makes a class abstract in C++?', answerMd: 'Having at least one pure virtual function (declared with = 0), either declared in the class or inherited and not overridden. Abstract classes cannot be instantiated but can be used through pointers and references.' },
    { id: 'iq2', q: 'Can a pure virtual function have an implementation?', answerMd: 'Yes, defined outside the class. Derived classes must still override it to become concrete, but they can call Base::f() explicitly to reuse it. A pure virtual destructor must always have a definition.' },
    { id: 'iq3', q: 'How do you model a Java-style interface in C++?', answerMd: 'An abstract class with only public pure virtual functions, no data members, and a public virtual destructor (or a protected non-virtual one if deletion through the interface is not allowed). Classes implement several interfaces with multiple public inheritance.' },
    { id: 'iq4', q: 'Why is calling a virtual function from a base constructor dangerous?', answerMd: 'During the base constructor the object\'s dynamic type is still the base, so the call is not dispatched to the derived override. If the function is pure virtual in the base, the call is undefined behaviour.' },
  ],
  revision: { notesMd: `- = 0 makes a function pure virtual; any pure function → abstract class.
- Derived is concrete only if it overrides all pure functions (use override).
- Interface = abstract class, only pure functions, virtual destructor, no data.
- Pure functions may have bodies; a pure virtual destructor must have one.
- No (pure) virtual calls from constructors/destructors.`, flashcards: [
    { id: 'f1', front: 'Syntax for a pure virtual function?', backMd: '`virtual void f() = 0;`' },
    { id: 'f2', front: 'Can you instantiate an abstract class?', backMd: 'No, but you can use pointers and references to it.' },
    { id: 'f3', front: 'Must a pure virtual destructor be defined?', backMd: 'Yes: derived destructors call it.' },
    { id: 'f4', front: 'When is a derived class still abstract?', backMd: 'When it leaves any inherited pure virtual function un-overridden.' },
    { id: 'f5', front: 'Why does every interface need a virtual destructor?', backMd: 'Deleting a derived object through the interface pointer otherwise skips the derived destructor (undefined behaviour).' },
  ] },
  resources: [CPPREF('Abstract classes', 'language/abstract_class'), CPPREF('override specifier', 'language/override'), ISOCPP],
});

const aiMcqs: MCQ[] = [
  mcq({ ...q(AI), id: 'cpp.ai.q1', type: 'compile-error', difficulty: 'easy', stem: 'Why does this fail to compile?', code: cppErr(`struct Shape {
    virtual double area() const = 0;
    virtual ~Shape() {}
};
int main() {
    Shape s;   // here
    return 0;
}`), options: ['Shape is abstract (it has a pure virtual function) and cannot be instantiated', ['area() has no body', 'Pure virtual functions do not need one.'], ['The destructor must be pure virtual', 'Not required.'], ['Shape needs a constructor', 'The implicit one exists.']], answer: 0, explanation: 'Use a concrete subclass, and refer to it through Shape& or Shape*.' }),
  mcq({ ...q(AI), id: 'cpp.ai.q2', type: 'compile-error', difficulty: 'medium', stem: 'Why does this fail to compile?', code: cppErr(`struct Shape {
    virtual double area() const = 0;
    virtual ~Shape() {}
};
struct Square : Shape {
    double s = 2;
    double area() { return s * s; }
};
int main() {
    Square sq;   // here
    return 0;
}`), options: ['Square::area is not const, so it does not override Shape::area and Square stays abstract', ['Square needs a constructor', 'Not needed.'], ['area must return int', 'double matches.'], ['Square must be a class, not a struct', 'Irrelevant.']], answer: 0, explanation: 'The signature differs (missing const), so it is a new function. Writing `override` would have reported the mistake at the declaration.' }),
  mcq({ ...q(AI), id: 'cpp.ai.q3', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct Base {
    virtual void hello() const = 0;
    virtual ~Base() {}
};
void Base::hello() const { cout << "base "; }
struct Derived : Base {
    void hello() const override { Base::hello(); cout << "derived"; }
};
int main() {
    Derived d;
    const Base& b = d;
    b.hello();
    cout << endl;
    return 0;
}`, 'C++', 'base derived'), options: ['base derived', ['derived', 'Derived::hello calls Base::hello explicitly first.'], ['It does not compile: pure virtual functions cannot have bodies', 'They can, defined outside the class.'], ['base', 'Dispatch goes to Derived::hello.']], answer: 0, explanation: 'A pure virtual function may have a definition; derived overrides can call it with qualified syntax.', verified: 'compiled' }),
  mcq({ ...q(AI), id: 'cpp.ai.q4', type: 'concept', difficulty: 'medium', stem: 'Which declaration best represents a Java-style interface in C++?', options: ['struct Logger { virtual void log(const std::string&) = 0; virtual ~Logger() = default; };', ['struct Logger { void log(const std::string&); };', 'Not virtual, so no polymorphism.'], ['struct Logger { virtual void log(const std::string&) = 0; };', 'Missing the virtual destructor.'], ['struct Logger { std::string prefix; virtual void log(const std::string&) = 0; };', 'Interfaces should not carry data.']], answer: 0, explanation: 'Only pure virtual functions plus a virtual destructor.' }),
  mcq({ ...q(AI), id: 'cpp.ai.q5', type: 'concept', difficulty: 'hard', stem: '`struct A { virtual ~A() = 0; };` compiles, but linking a program that creates a class derived from A fails. Why?', options: ['A pure virtual destructor still needs a definition, because the derived destructor calls it', ['Destructors cannot be pure', 'They can.'], ['A needs another pure function', 'Not required.'], ['Derived classes cannot have destructors', 'They always do.']], answer: 0, explanation: 'Add `A::~A() {}` (or `= default` outside the class).' }),
  mcq({ ...q(AI), id: 'cpp.ai.q6', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
#include <vector>
using namespace std;
struct Animal { virtual const char* sound() const = 0; virtual ~Animal() {} };
struct Dog : Animal { const char* sound() const override { return "woof"; } };
struct Cat : Animal { const char* sound() const override { return "meow"; } };
int main() {
    Dog d; Cat c;
    vector<const Animal*> zoo = {&d, &c, &d};
    for (const Animal* a : zoo) cout << a->sound() << " ";
    cout << endl;
    return 0;
}`, 'C++', 'woof meow woof'), options: ['woof meow woof', ['It does not compile: Animal is abstract', 'Pointers to abstract classes are fine.'], ['(three empty strings)', 'Each call dispatches to the concrete class.'], ['woof woof woof', 'The second element is a Cat.']], answer: 0, explanation: 'Calls through Animal* dispatch to the dynamic type of each object.', verified: 'compiled' }),
];

// ---------------------------------------------------------------------------------------
const EX = 'cpp.exceptions';
const exceptions = cppTopic({
  id: EX, title: 'Exceptions', level: 'core', estMinutes: 50, prerequisites: ['cpp.memory-raii'], related: ['cpp.memory-raii', 'java.exceptions', 'cpp.move-semantics'],
  summary: 'Stack unwinding, exception safety and noexcept.',
  objectives: ['Throw and catch exceptions, catching by const reference, and order catch clauses from specific to general.', 'Explain stack unwinding and why RAII makes cleanup automatic.', 'State the basic, strong and nothrow exception-safety guarantees and write code that gives the strong guarantee.', 'Use noexcept correctly and know what happens when an exception escapes a noexcept function or a destructor.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Throw, catch, unwind', bodyMd: `\`\`\`cpp
try {
    parse(config);                       // may throw
} catch (const std::invalid_argument& e) {   // most specific first
    log(e.what());
} catch (const std::exception& e) {
    log(e.what());
} catch (...) {                          // anything else
    throw;                               // rethrow the same exception
}
\`\`\`

When an exception is thrown, the runtime looks up the call stack for a matching handler. On the way, every function is exited and its **local objects are destroyed in reverse order** (stack unwinding). That is why **RAII** is the C++ answer to cleanup: a \`std::lock_guard\`, \`std::unique_ptr\` or \`std::fstream\` releases its resource in its destructor whether the function returns normally or by an exception.

- **Catch by const reference.** Catching by value copies the exception and **slices** derived exceptions down to the base type.
- **Order matters:** the first matching handler wins, so a \`catch (const std::exception&)\` before a more specific handler hides it.
- \`throw;\` (no operand) rethrows the current exception object; \`throw e;\` throws a copy of \`e\`'s static type (slicing again).
- Standard hierarchy: \`std::exception\` → \`logic_error\` (\`invalid_argument\`, \`out_of_range\`) and \`runtime_error\` (\`overflow_error\`, …); \`bad_alloc\`, \`bad_cast\`.` },
    { id: 'safety', kind: 'concept', title: 'Exception-safety guarantees', bodyMd: `| Guarantee | Promise | Example |
|---|---|---|
| **Nothrow** | never throws | destructors, swap, move constructors marked noexcept |
| **Strong** | if it throws, state is unchanged (commit or rollback) | \`vector::push_back\` (for types with a non-throwing move or a copy) |
| **Basic** | if it throws, no leaks and invariants hold, but state may have changed | most operations |
| None | anything can happen | code with raw new/delete and early throws |

**Copy-and-swap** gives the strong guarantee for assignment: build the new state in a temporary (which may throw), then \`swap\` it in (which cannot).

**Destructors must not throw.** If a destructor throws during stack unwinding, \`std::terminate\` is called. Since C++11 destructors are implicitly \`noexcept\`.

**noexcept** promises no exception escapes. If one does, \`std::terminate\` is called (no unwinding guarantee). Mark move operations, swap and destructors noexcept; use \`noexcept\` as an optimisation hint, not as documentation for functions that might throw.` },
    { id: 'code', kind: 'code', title: 'Unwinding releases resources', bodyMd: 'The guard objects are destroyed in reverse order as the exception leaves each scope.', code: [cpp(`
#include <iostream>
#include <stdexcept>
using namespace std;

struct Guard {
    const char* name;
    explicit Guard(const char* n) : name(n) { cout << "open " << name << "\\n"; }
    ~Guard() { cout << "close " << name << "\\n"; }
};

void inner() {
    Guard file("file");
    throw runtime_error("disk error");
    cout << "never printed\\n";
}

void outer() {
    Guard lock("lock");
    inner();
}

int main() {
    try {
        outer();
    } catch (const exception& e) {
        cout << "caught: " << e.what() << "\\n";
    }
    return 0;
}`, 'C++', 'open lock\nopen file\nclose file\nclose lock\ncaught: disk error')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and C++ vs Java', bodyMd: `1. Catching by value (slicing, extra copy).
2. A general handler before a specific one.
3. Throwing from destructors.
4. Raw new/delete between operations that may throw (leaks); use smart pointers.
5. Using exceptions for normal control flow in hot paths (throwing is slow).
6. \`throw e;\` inside a catch where \`throw;\` was intended.

**C++ vs Java:** Java has checked exceptions (compiler-enforced \`throws\`), \`finally\` and try-with-resources; C++ has no checked exceptions and no \`finally\`, relying on RAII destructors instead. Java can throw from anywhere safely because of GC; C++ code must be written to be exception-safe.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Why catch exceptions by const reference?', answerMd: 'Catching by value copies the exception object and slices derived exceptions to the catch type, losing information (and the right what() override). A const reference avoids the copy and preserves the dynamic type.' },
    { id: 'iq2', q: 'What is stack unwinding?', answerMd: 'When an exception propagates, each function frame between the throw and the handler is exited and its local objects are destroyed in reverse order of construction. With RAII, this releases memory, locks and files automatically.' },
    { id: 'iq3', q: 'Explain the basic and strong exception-safety guarantees.', answerMd: 'Basic: if an operation throws, nothing leaks and all invariants still hold, but the object\'s state may have changed. Strong: if it throws, the state is exactly as before (transactional). Copy-and-swap and building the new state before committing are common ways to get the strong guarantee.' },
    { id: 'iq4', q: 'What happens if a destructor throws?', answerMd: 'Destructors are implicitly noexcept since C++11, so an exception escaping one calls std::terminate. Even without noexcept, a destructor throwing during stack unwinding (another exception in flight) terminates the program. Destructors must catch and handle errors internally.' },
    { id: 'iq5', q: 'What does noexcept do?', answerMd: 'It declares that the function does not throw. If an exception escapes anyway, std::terminate is called. Containers and algorithms check noexcept (move_if_noexcept) to choose faster strategies, so move constructors and swap should be noexcept.' },
  ],
  revision: { notesMd: `- Throw by value, catch by const reference; specific handlers first; throw; to rethrow.
- Unwinding destroys locals in reverse order → RAII cleanup.
- Guarantees: nothrow > strong > basic > none. Copy-and-swap for strong.
- Destructors never throw (implicitly noexcept).
- noexcept violation → std::terminate. Mark moves/swap noexcept.
- No finally in C++: RAII instead.`, flashcards: [
    { id: 'f1', front: 'Catch by value or by reference?', backMd: 'By const reference (avoids copies and slicing).' },
    { id: 'f2', front: '`throw;` vs `throw e;`?', backMd: '`throw;` rethrows the original object; `throw e;` throws a (possibly sliced) copy.' },
    { id: 'f3', front: 'Strong exception guarantee?', backMd: 'On failure, the state is unchanged.' },
    { id: 'f4', front: 'What happens if an exception escapes a noexcept function?', backMd: 'std::terminate is called.' },
    { id: 'f5', front: 'C++ replacement for finally?', backMd: 'RAII: destructors run during unwinding.' },
  ] },
  resources: [CPPREF('Exceptions', 'language/exceptions'), CPPREF('noexcept specifier', 'language/noexcept_spec'), ISOCPP],
});

const exMcqs: MCQ[] = [
  mcq({ ...q(EX), id: 'cpp.ex.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
#include <stdexcept>
using namespace std;
struct R { char c; R(char x) : c(x) {} ~R() { cout << c; } };
void f() { R a('a'); R b('b'); throw runtime_error("x"); }
int main() {
    try { R m('m'); f(); }
    catch (const exception&) { cout << "!"; }
    cout << endl;
    return 0;
}`, 'C++', 'bam!'), options: ['bam!', ['!bam', 'Locals are destroyed during unwinding, before the handler runs.'], ['abm!', 'Destruction is in reverse order of construction.'], ['mab!', 'f\'s locals are destroyed first.']], answer: 0, explanation: 'Unwinding leaves f (destroying b, then a), then the try block (destroying m), then runs the handler.', verified: 'compiled' }),
  mcq({ ...q(EX), id: 'cpp.ex.q2', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
#include <stdexcept>
using namespace std;
int main() {
    try {
        throw out_of_range("index 9");
    } catch (const logic_error& e) {
        cout << "logic: " << e.what();
    } catch (const out_of_range& e) {
        cout << "range: " << e.what();
    }
    cout << endl;
    return 0;
}`, 'C++', 'logic: index 9'), options: ['logic: index 9', ['range: index 9', 'out_of_range derives from logic_error, and the first matching handler wins.'], ['It does not compile', 'Handler order is only warned about.'], ['logic: out_of_range', 'what() returns the message passed to the constructor.']], answer: 0, explanation: 'Put the more specific handler (out_of_range) first.', verified: 'compiled' }),
  mcq({ ...q(EX), id: 'cpp.ex.q3', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct Base { virtual const char* who() const { return "base"; } virtual ~Base() {} };
struct Derived : Base { const char* who() const override { return "derived"; } };
int main() {
    try { throw Derived(); }
    catch (Base b) { cout << b.who() << " "; }
    try { throw Derived(); }
    catch (const Base& b) { cout << b.who(); }
    cout << endl;
    return 0;
}`, 'C++', 'base derived'), options: ['base derived', ['derived derived', 'Catching by value slices the exception into a Base.'], ['base base', 'The reference keeps the dynamic type.'], ['It does not compile', 'Both handlers are valid.']], answer: 0, explanation: 'Catch by value copies only the Base part (slicing); catch by reference sees the real Derived object.', verified: 'compiled' }),
  mcq({ ...q(EX), id: 'cpp.ex.q4', type: 'concept', difficulty: 'medium', stem: 'An operation offers the strong exception guarantee. What does that mean if it throws?', options: ['The program state is exactly as before the call', ['Nothing leaks, but the object may be in a different valid state', 'That is the basic guarantee.'], ['It never throws', 'That is the nothrow guarantee.'], ['The program terminates', 'Not implied.']], answer: 0, explanation: 'Commit-or-rollback semantics, typically via building new state then swapping.' }),
  mcq({ ...q(EX), id: 'cpp.ex.q5', type: 'concept', difficulty: 'medium', stem: 'What happens when an exception escapes a function declared noexcept?', options: ['std::terminate is called', ['The exception propagates normally', 'noexcept is a guarantee enforced at run time.'], ['It is silently swallowed', 'Not swallowed.'], ['A compile error', 'The compiler cannot always prove it.']], answer: 0, explanation: 'Stack unwinding may not even happen; the program ends.' }),
  mcq({ ...q(EX), id: 'cpp.ex.q6', type: 'concept', difficulty: 'easy', stem: 'C++ has no `finally` block. How is cleanup guaranteed when exceptions are thrown?', options: ['RAII: resources are released in destructors, which run during stack unwinding', ['catch (...) in every function', 'Verbose and easy to get wrong.'], ['The garbage collector', 'C++ has no GC.'], ['atexit handlers', 'They run at program exit only.']], answer: 0, explanation: 'lock_guard, unique_ptr and fstream release their resources automatically.' }),
];

// ---------------------------------------------------------------------------------------
const TP = 'cpp.templates';
const templates = cppTopic({
  id: TP, title: 'Templates', level: 'advanced', estMinutes: 55, prerequisites: ['cpp.classes-objects'], related: ['java.generics', 'cpp.overloading', 'cpp.move-semantics'],
  summary: 'Function and class templates, and how they differ from Java generics.',
  objectives: ['Write function and class templates and explain argument deduction.', 'Explain instantiation: the compiler generates code per type, which is why templates live in headers.', 'Use full specialisation and overloading with templates, and know when each is chosen.', 'Contrast C++ templates (compile-time code generation) with Java generics (type erasure).'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Generic code at compile time', bodyMd: `\`\`\`cpp
template <typename T>
T maxOf(T a, T b) { return a < b ? b : a; }

maxOf(3, 7);            // T deduced as int
maxOf(2.5, 1.0);        // T = double
maxOf<double>(3, 7.5);  // explicit: deduction would see int and double and fail
\`\`\`

The compiler **instantiates** a separate function or class for each set of template arguments used. Consequences:
- Errors appear only when a use instantiates the code with a type that does not support the operations used (no \`<\`), often with long messages. C++20 concepts make these requirements explicit.
- Template definitions must be visible where they are used, so they usually live in **headers**.
- There is **no run-time cost**: each instantiation is ordinary, inlinable code ("zero-overhead abstraction"), at the cost of compile time and binary size.

**Class templates:** \`template <typename T> class Stack { std::vector<T> v_; … };\` used as \`Stack<int>\`. **Non-type parameters:** \`template <typename T, size_t N> class Array\` (like \`std::array<int, 4>\`).` },
    { id: 'specialisation', kind: 'example', title: 'Specialisation and overloads', bodyMd: `\`\`\`cpp
template <typename T> std::string describe(T)        { return "generic"; }
template <>           std::string describe(bool)     { return "bool"; }      // full specialisation
std::string describe(const char*)                    { return "c-string"; }  // ordinary overload
\`\`\`

Overload resolution first considers ordinary functions and **primary templates**; specialisations are only looked at after their primary template has been chosen. When an ordinary function and a template are equally good matches, the **non-template wins**. For this reason, prefer overloading function templates over specialising them; class templates are where specialisation shines (\`std::vector<bool>\`, \`std::hash<MyType>\`).

**Partial specialisation** (for some but not all parameters, such as \`template <typename T> class Box<T*>\`) exists only for class templates.` },
    { id: 'comparison', kind: 'comparison', title: 'C++ templates vs Java generics', bodyMd: `| | C++ templates | Java generics |
|---|---|---|
| Mechanism | code generated per type at compile time | **type erasure**: one compiled class, types checked then erased |
| Primitive types | \`vector<int>\` holds ints directly | only reference types (\`List<Integer>\`, boxing) |
| Run-time type info | \`T\` is a real type in each instantiation | \`T\` unknown at run time (cannot \`new T()\`, \`instanceof List<String>\`) |
| Constraints | duck typing (any type with the used operations); C++20 concepts | bounds: \`<T extends Comparable<T>>\` |
| Non-type parameters | yes (\`array<int, 4>\`) | no |
| Cost | possible code bloat, longer compiles | casts inserted by the compiler, boxing overhead |` },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls', bodyMd: `1. Defining templates in a .cpp file and getting "undefined reference" link errors.
2. Deduction failure with mixed argument types (\`maxOf(3, 7.5)\`).
3. Specialising function templates and being surprised that an overload is chosen instead.
4. \`std::vector<bool>\` is a specialisation that packs bits: \`v[0]\` is not a \`bool&\`.
5. Needing \`typename\` before dependent type names: \`typename T::value_type x;\`.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'How do C++ templates differ from Java generics?', answerMd: 'C++ templates generate separate code for each type at compile time, work with primitive types and non-type parameters, and know T at run time in each instantiation. Java generics use type erasure: one class, compile-time checking, casts inserted, no primitive type arguments and no T at run time.' },
    { id: 'iq2', q: 'Why are templates usually defined in header files?', answerMd: 'The compiler needs the full definition at the point of instantiation to generate code for the specific types used. If the definition is only in another .cpp file, no instantiation is generated there and the linker cannot find it (unless explicit instantiation is used).' },
    { id: 'iq3', q: 'What is template specialisation?', answerMd: 'Providing a custom implementation for particular template arguments: full specialisation (template<> struct hash<Point>) or, for class templates only, partial specialisation (template<typename T> struct Box<T*>). std::vector<bool> is a well-known class specialisation.' },
    { id: 'iq4', q: 'If both a function template and an ordinary function match a call equally well, which is used?', answerMd: 'The ordinary (non-template) function. Templates are preferred only when they give a better match, for example avoiding a conversion the ordinary function needs.' },
  ],
  revision: { notesMd: `- template <typename T>: code generated per type; zero run-time overhead.
- Definitions in headers (instantiation needs them).
- Deduction fails on mixed types; specify T explicitly.
- Non-template beats template on equal matches; prefer overloading to function specialisation.
- Partial specialisation: class templates only.
- Java generics: erasure, no primitives, no T at run time.`, flashcards: [
    { id: 'f1', front: 'maxOf(3, 7.5) with template<typename T> T maxOf(T, T)?', backMd: 'Deduction fails (int vs double); write maxOf<double>(3, 7.5).' },
    { id: 'f2', front: 'Why "undefined reference" for a template defined in a .cpp?', backMd: 'It was never instantiated for the type used in another translation unit.' },
    { id: 'f3', front: 'Can function templates be partially specialised?', backMd: 'No; only class templates. Overload function templates instead.' },
    { id: 'f4', front: 'Java generics implementation strategy?', backMd: 'Type erasure.' },
    { id: 'f5', front: 'Equal match: template or non-template?', backMd: 'The non-template function wins.' },
  ] },
  resources: [CPPREF('Templates', 'language/templates'), CPPREF('Template argument deduction', 'language/template_argument_deduction'), ISOCPP],
});

const tpMcqs: MCQ[] = [
  mcq({ ...q(TP), id: 'cpp.tp.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
#include <string>
using namespace std;
template <typename T> string kind(T) { return "T"; }
template <> string kind(bool) { return "bool"; }
string kind(int) { return "int"; }
int main() {
    cout << kind(1) << " " << kind(true) << " " << kind(2.0) << " " << kind('c') << endl;
    return 0;
}`, 'C++', 'int bool T T'), options: ['int bool T T', ['int int T int', 'The template gives exact matches for bool and char, which beat promotions to int.'], ['T bool T T', 'For kind(1) the non-template wins the tie with the template.'], ['int bool T int', '\'c\' is a char; the template deduces T = char exactly.']], answer: 0, explanation: 'kind(1): exact match for both, the non-template wins. kind(true) and kind(\'c\'): the template is an exact match, better than promoting to int; for bool the specialisation is then used.', verified: 'compiled' }),
  mcq({ ...q(TP), id: 'cpp.tp.q2', type: 'compile-error', difficulty: 'medium', stem: 'Why does this fail to compile?', code: cppErr(`template <typename T>
T maxOf(T a, T b) { return a < b ? b : a; }
int main() {
    double m = maxOf(3, 7.5);   // here
    return (int)m;
}`), options: ['T is deduced as int from 3 and double from 7.5, which conflict', ['Templates cannot return T', 'They can.'], ['double has no operator<', 'It does.'], ['maxOf must be declared inline', 'Not required.']], answer: 0, explanation: 'Write maxOf<double>(3, 7.5), or use two template parameters.' }),
  mcq({ ...q(TP), id: 'cpp.tp.q3', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
#include <cstddef>
using namespace std;
template <typename T, size_t N>
struct Ring {
    T data[N];
    size_t capacity() const { return N; }
};
int main() {
    Ring<int, 4> a;
    Ring<char, 16> b;
    cout << a.capacity() << " " << b.capacity() << " " << sizeof(b) << endl;
    return 0;
}`, 'C++', '4 16 16'), options: ['4 16 16', ['4 16 64', 'char is 1 byte, so 16 chars take 16 bytes.'], ['16 16 16', 'Each instantiation has its own N.'], ['It does not compile: N is not a type', 'Non-type template parameters are allowed.']], answer: 0, explanation: 'Non-type parameters become compile-time constants in each instantiation.', verified: 'compiled' }),
  mcq({ ...q(TP), id: 'cpp.tp.q4', type: 'concept', difficulty: 'medium', stem: 'Which can Java generics NOT do that C++ templates can?', options: ['Use a primitive type such as int as the type argument', ['Restrict T to subtypes of a class', 'Bounds like <T extends Number>.'], ['Check types at compile time', 'Both do.'], ['Write generic methods', 'Both do.']], answer: 0, explanation: 'Java requires List<Integer> (boxing); C++ instantiates vector<int> directly.' }),
  mcq({ ...q(TP), id: 'cpp.tp.q5', type: 'concept', difficulty: 'medium', stem: 'A template is declared in a header and defined in widget.cpp. Other files using `process<int>()` get "undefined reference". Why?', options: ['The definition was not visible where process<int> was used, so it was never instantiated', ['Templates cannot be in headers', 'They normally are.'], ['int is not a valid template argument', 'It is.'], ['The linker does not support templates', 'It links instantiations like any function.']], answer: 0, explanation: 'Move the definition into the header, or explicitly instantiate process<int> in widget.cpp.' }),
  mcq({ ...q(TP), id: 'cpp.tp.q6', type: 'code-output', difficulty: 'easy', stem: 'What does this program print?', code: cpp(`#include <iostream>
#include <vector>
using namespace std;
template <typename T>
T sum(const vector<T>& v) {
    T total = T();
    for (const T& x : v) total += x;
    return total;
}
int main() {
    cout << sum(vector<int>{1, 2, 3}) << " " << sum(vector<double>{0.5, 0.25}) << endl;
    return 0;
}`, 'C++', '6 0.75'), options: ['6 0.75', ['6 0', 'The double instantiation adds doubles.'], ['6.0 0.75', 'int prints without a decimal point.'], ['It does not compile', 'T is deduced from the vector element type.']], answer: 0, explanation: 'Two instantiations, sum<int> and sum<double>, each with its own arithmetic. T() is zero for arithmetic types.', verified: 'compiled' }),
];

// ---------------------------------------------------------------------------------------
const SP = 'cpp.solid-patterns';
const solid = cppTopic({
  id: SP, title: 'SOLID and Design Patterns in C++', level: 'core', estMinutes: 60, prerequisites: ['cpp.polymorphism-virtual'], related: ['java.solid-patterns', 'cpp.abstract-interfaces', 'cpp.composition-association'],
  summary: 'SOLID principles with Singleton, Factory, Strategy and Observer.',
  objectives: ['State each SOLID principle with a concrete violation and fix.', 'Implement Singleton (Meyers), Factory, Strategy and Observer in modern C++.', 'Choose a pattern from the problem, not the other way round, and know the trade-offs (testability, coupling).', 'Use these ideas in low-level design rounds (parking lot, notification system, rate limiter).'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'SOLID in one table', bodyMd: `| Principle | Meaning | Violation | Fix |
|---|---|---|---|
| **S**ingle responsibility | a class has one reason to change | \`Invoice\` computes totals, prints PDFs and emails them | separate calculator, renderer, sender |
| **O**pen/closed | extend behaviour without editing existing code | a \`switch (shape.type)\` in every function | polymorphism: add a new subclass |
| **L**iskov substitution | subtypes must work wherever the base works | \`Square : Rectangle\` breaking \`setWidth\` expectations | separate types, or immutable shapes |
| **I**nterface segregation | no client depends on methods it does not use | a \`Machine\` interface with print, scan, fax for a simple printer | small interfaces: \`Printer\`, \`Scanner\` |
| **D**ependency inversion | depend on abstractions, inject concrete parts | \`OrderService\` creates a \`MySqlRepo\` itself | pass an \`OrderRepository&\` in the constructor |

Dependency inversion is what makes classes **testable**: inject a fake repository or notifier in tests.` },
    { id: 'patterns', kind: 'example', title: 'Four patterns you should be able to write', bodyMd: `**Singleton** (use sparingly; it is global state):

\`\`\`cpp
class Config {
public:
    static Config& instance() { static Config c; return c; }   // thread-safe since C++11
    Config(const Config&) = delete;
    Config& operator=(const Config&) = delete;
private:
    Config() {}
};
\`\`\`

**Factory:** a function or class that decides which concrete type to create, returning \`std::unique_ptr<Base>\`; callers never name the concrete classes.

**Strategy:** an object holds an interface (or \`std::function\`) for an algorithm that can be swapped at run time: pricing rules, sorting comparators, rate-limit algorithms.

**Observer:** a subject keeps a list of observers and notifies them on events (UI events, order status updates). Watch out for observers that are destroyed while still registered (use unsubscribe or weak_ptr).

Others worth recognising: **Decorator** (wrap an object to add behaviour: logging, caching), **Adapter** (wrap an incompatible interface), **Builder** (step-by-step construction of complex objects), **Template method** (base class algorithm with overridable steps).` },
    { id: 'code', kind: 'code', title: 'Strategy and Observer together', bodyMd: 'A checkout uses a pricing strategy and notifies observers when an order is placed.', code: [cpp(`
#include <functional>
#include <iostream>
#include <memory>
#include <string>
#include <vector>
using namespace std;

struct PricingStrategy {                                  // Strategy interface
    virtual long long price(long long base) const = 0;
    virtual ~PricingStrategy() = default;
};
struct Regular : PricingStrategy { long long price(long long b) const override { return b; } };
struct Festive : PricingStrategy { long long price(long long b) const override { return b * 80 / 100; } };

class Checkout {
public:
    explicit Checkout(unique_ptr<PricingStrategy> s) : strategy_(std::move(s)) {}
    void setStrategy(unique_ptr<PricingStrategy> s) { strategy_ = std::move(s); }
    void onPlaced(function<void(long long)> cb) { observers_.push_back(cb); }   // Observer
    void place(long long base) {
        long long total = strategy_->price(base);
        for (auto& cb : observers_) cb(total);
    }
private:
    unique_ptr<PricingStrategy> strategy_;
    vector<function<void(long long)>> observers_;
};

int main() {
    Checkout c(unique_ptr<PricingStrategy>(new Regular()));
    c.onPlaced([](long long t) { cout << "email " << t << "\\n"; });
    c.onPlaced([](long long t) { cout << "analytics " << t << "\\n"; });
    c.place(1000);
    c.setStrategy(unique_ptr<PricingStrategy>(new Festive()));
    c.place(1000);
    return 0;
}`, 'C++', 'email 1000\nanalytics 1000\nemail 800\nanalytics 800')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and LLD tips', bodyMd: `1. **Pattern-first design:** forcing a pattern where a function would do.
2. **Singleton abuse:** hidden dependencies and hard-to-test code; prefer passing dependencies explicitly.
3. **Fat interfaces** that every implementer half-supports (throwing "not supported").
4. **Inheritance for variation** that changes at run time (use Strategy/composition).
5. **Observers that outlive or die before the subject** without unsubscribing.

**In LLD rounds:** start with requirements and core entities, define interfaces at the points of variation (payment method, notification channel, pricing), keep classes small, and explain the trade-offs. Mention concurrency (locking around shared state) and extensibility (adding a new vehicle type).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Explain the Liskov substitution principle with an example.', answerMd: 'Objects of a subtype must be usable wherever the base type is expected without breaking correctness. Classic violation: Square derived from Rectangle; code that sets width to 5 and height to 4 and expects area 20 breaks for a Square that keeps sides equal. Fix by not modelling Square as a mutable Rectangle subtype.' },
    { id: 'iq2', q: 'How do you implement a thread-safe Singleton in C++?', answerMd: 'The Meyers singleton: return a reference to a function-local static object. Since C++11, initialisation of function-local statics is thread-safe. Delete the copy constructor and copy assignment, and keep the constructor private.' },
    { id: 'iq3', q: 'Strategy vs inheritance for varying behaviour?', answerMd: 'Inheritance fixes the behaviour per class at compile time and multiplies subclasses for every combination. Strategy composes the behaviour as an object (or std::function) that can be swapped at run time and tested in isolation, which follows open/closed and composition over inheritance.' },
    { id: 'iq4', q: 'How does dependency inversion improve testability?', answerMd: 'High-level code depends on an abstraction (an interface) supplied from outside instead of constructing concrete dependencies itself. Tests can then pass fakes or mocks (an in-memory repository, a recording notifier) without databases or networks.' },
    { id: 'iq5', q: 'Design the classes for a parking lot (briefly).', answerMd: 'Entities: ParkingLot (floors), Floor (spots), Spot (type, occupied), Vehicle (type), Ticket (spot, entry time), and interfaces at the variation points: SpotAllocationStrategy (nearest, by type) and FeeCalculator (hourly, flat). The lot coordinates allocation and ticketing with locking around spot assignment for concurrency.' },
  ],
  revision: { notesMd: `- SRP, OCP, LSP, ISP, DIP: one reason to change; extend not edit; substitutable subtypes; small interfaces; depend on abstractions.
- Singleton: function-local static (thread-safe since C++11); delete copies; use sparingly.
- Factory returns unique_ptr<Base>; Strategy swaps algorithms; Observer notifies subscribers.
- Prefer composition; inject dependencies for tests.`, flashcards: [
    { id: 'f1', front: 'Which SOLID principle does Square : Rectangle typically violate?', backMd: 'Liskov substitution.' },
    { id: 'f2', front: 'Thread-safe lazy Singleton in C++11?', backMd: 'Return a reference to a function-local static.' },
    { id: 'f3', front: 'Pattern for swapping an algorithm at run time?', backMd: 'Strategy.' },
    { id: 'f4', front: 'Pattern for notifying many subscribers of an event?', backMd: 'Observer.' },
    { id: 'f5', front: 'Dependency inversion in one line?', backMd: 'High-level code depends on abstractions; concrete implementations are injected.' },
  ] },
  resources: [{ title: 'SOLID (Wikipedia)', url: 'https://en.wikipedia.org/wiki/SOLID', kind: 'article' }, { title: 'Refactoring.Guru: design patterns catalog', url: 'https://refactoring.guru/design-patterns/catalog', kind: 'article' }, ISOCPP],
});

const spMcqs: MCQ[] = [
  mcq({ ...q(SP), id: 'cpp.sp.q1', type: 'scenario', difficulty: 'easy', stem: 'Adding a new payment method requires editing a big switch in five different functions. Which principle is violated?', options: ['Open/closed', ['Single responsibility', 'The issue is having to modify existing code for each extension.'], ['Interface segregation', 'Not about fat interfaces here.'], ['Liskov substitution', 'No subtype is misbehaving.']], answer: 0, explanation: 'Introduce a PaymentMethod interface; adding a method becomes adding a class.' }),
  mcq({ ...q(SP), id: 'cpp.sp.q2', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
class Counter {
public:
    static Counter& instance() { static Counter c; return c; }
    int next() { return ++n_; }
    Counter(const Counter&) = delete;
private:
    Counter() { cout << "init "; }
    int n_ = 0;
};
int main() {
    cout << "start ";
    int a = Counter::instance().next();
    int b = Counter::instance().next();
    cout << a << b << endl;
    return 0;
}`, 'C++', 'start init 12'), options: ['start init 12', ['init start 12', 'The function-local static is created on the first call to instance().'], ['start init init 11', 'The static is initialised only once.'], ['It does not compile: the constructor is private', 'instance() is a member, so it can call it.']], answer: 0, explanation: 'Lazy, one-time initialisation of the Meyers singleton.', verified: 'compiled' }),
  mcq({ ...q(SP), id: 'cpp.sp.q3', type: 'scenario', difficulty: 'medium', stem: 'OrderService constructs `MySqlOrderRepository` inside its constructor, so unit tests need a real database. Which principle would fix this?', options: ['Dependency inversion: depend on an OrderRepository interface passed in', ['Single responsibility', 'Related, but the core issue is the hard-wired concrete dependency.'], ['Open/closed', 'Not the main issue.'], ['Liskov substitution', 'No subtype misbehaves.']], answer: 0, explanation: 'Inject the repository; tests pass an in-memory fake.' }),
  mcq({ ...q(SP), id: 'cpp.sp.q4', type: 'design', difficulty: 'medium', stem: 'A rate limiter must support token bucket today and sliding window later, switchable per customer at run time. Which pattern fits?', options: ['Strategy', ['Singleton', 'One global instance does not give per-customer algorithms.'], ['Observer', 'No event broadcasting is needed.'], ['Template method with a subclass per customer', 'Subclasses fix the behaviour at compile time.']], answer: 0, explanation: 'Each customer holds a RateLimitStrategy implementation that can be replaced.' }),
  mcq({ ...q(SP), id: 'cpp.sp.q5', type: 'concept', difficulty: 'medium', stem: 'A `Bird` base class has `fly()`. `Penguin` overrides it to throw. Which principle is broken, and what is a better design?', options: ['Liskov substitution; separate FlyingBird from Bird (or a Flyer interface)', ['Interface segregation only', 'ISP is related, but the visible break is that Penguin cannot substitute for Bird.'], ['Single responsibility; split Penguin into two classes', 'Unrelated.'], ['None; throwing is fine', 'Callers of Bird::fly break.']], answer: 0, explanation: 'Model only the capabilities a type really has.' }),
  mcq({ ...q(SP), id: 'cpp.sp.q6', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <functional>
#include <iostream>
#include <vector>
using namespace std;
struct Subject {
    vector<function<void(int)>> subs;
    void subscribe(function<void(int)> f) { subs.push_back(f); }
    void emit(int v) { for (auto& f : subs) f(v); }
};
int main() {
    Subject s;
    int total = 0;
    s.subscribe([&total](int v) { total += v; });
    s.subscribe([](int v) { cout << v << " "; });
    s.emit(3); s.emit(4);
    cout << total << endl;
    return 0;
}`, 'C++', '3 4 7'), options: ['3 4 7', ['3 4 0', 'The first observer captures total by reference and adds to it.'], ['7 3 4', 'Each emit prints immediately.'], ['3 7 4 7', 'Only the second observer prints.']], answer: 0, explanation: 'Each emit calls every subscriber in order; the first accumulates into total.', verified: 'compiled' }),
];

export const topics: Topic[] = [moveSem, abstractIfaces, exceptions, templates, solid];
export const mcqs: MCQ[] = [...mvMcqs, ...aiMcqs, ...exMcqs, ...tpMcqs, ...spMcqs];
