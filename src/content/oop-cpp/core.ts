import type { MCQ, Topic } from '../schema';
import { cpp, cppErr, mcq } from '../helpers';
import { CPPREF, ISOCPP, cppTopic, q } from './common';

// C++ batch 2: classes and objects, access control, inheritance, overloading, composition.
// Every code-output and compile-error question is compiled (g++ -std=c++14) by verify-code.

// ---------------------------------------------------------------------------------------
const CO = 'cpp.classes-objects';
const classes = cppTopic({
  id: CO, title: 'Classes and Objects', level: 'foundation', estMinutes: 40, prerequisites: [], related: ['cpp.constructors-destructors', 'cpp.access-encapsulation', 'java.classes-objects'],
  summary: 'class vs struct, members, this, and const member functions.',
  objectives: ['Define a class with data members and member functions, and create objects on the stack and the heap.', 'Explain the only difference between class and struct (default access) and when each is idiomatic.', 'Use this, const member functions and mutable correctly.', 'Predict sizeof for simple classes, including padding and the effect of a virtual function.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'A class bundles state and behaviour', bodyMd: `\`\`\`cpp
class Account {
public:
    explicit Account(long long opening) : balance_(opening) {}
    void deposit(long long amt) { balance_ += amt; }        // modifies the object
    long long balance() const { return balance_; }           // promises not to modify it
private:
    long long balance_;                                      // invariant: never negative
};

Account a(100);              // automatic storage (stack): destroyed at the end of the scope
Account* p = new Account(5); // dynamic storage (heap): you must delete it (prefer smart pointers)
\`\`\`

- **class vs struct:** identical except the default access: \`class\` members and bases are **private** by default, \`struct\` ones **public**. Convention: \`struct\` for plain data aggregates, \`class\` when there is an invariant to protect.
- **this** is a pointer to the object the member function was called on. In a const member function its type is \`const Account*\`.
- **const member functions** can be called on const objects and through const references; a non-const member function cannot. Mark every function that does not modify state as const.
- **mutable** members may change inside const functions (caches, mutexes) without changing the observable state.` },
    { id: 'layout', kind: 'concept', title: 'Object layout and sizeof', bodyMd: `An object holds its non-static data members (in declaration order, with **padding** so each member is suitably aligned) and, if the class has virtual functions, a hidden **vptr**. Member functions are not stored in objects; static members are not stored in objects either.

| Class | Typical sizeof on a 64-bit system |
|---|---|
| \`struct E {};\` | 1 (every object needs a distinct address) |
| \`struct A { char c; int i; };\` | 8 (char, 3 padding bytes, int) |
| \`struct B { int i; char c; };\` | 8 (tail padding keeps arrays aligned) |
| \`struct V { virtual void f(); int i; };\` | 16 (8-byte vptr, int, padding) |

Exact sizes are implementation-defined; interviewers care that you know padding and the vptr exist. Ordering members from largest to smallest alignment reduces padding.` },
    { id: 'code', kind: 'code', title: 'const correctness in practice', bodyMd: 'A const object can only call const member functions; returning references to members needs both overloads when callers may modify.', code: [cpp(`
#include <iostream>
#include <string>
#include <vector>
using namespace std;

class Inventory {
public:
    void add(const string& item) { items_.push_back(item); }
    size_t size() const { return items_.size(); }
    const string& at(size_t i) const { return items_.at(i); }   // read-only access
    string& at(size_t i) { return items_.at(i); }               // mutable access
private:
    vector<string> items_;
};

void print(const Inventory& inv) {       // const reference: only const members are callable
    for (size_t i = 0; i < inv.size(); ++i) cout << inv.at(i) << "\\n";
}

int main() {
    Inventory inv;
    inv.add("pen");
    inv.at(0) = "pencil";                 // non-const overload
    print(inv);
    return 0;
}`, 'C++', 'pencil')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls', bodyMd: `1. **Forgetting const** on getters, which makes them unusable through \`const T&\` parameters.
2. **Most vexing parse:** \`Account a();\` declares a function, not an object. Use \`Account a;\` or \`Account a{};\`.
3. **Returning a reference or pointer to a local** from a member function (dangling).
4. **Memory leaks with raw new** (prefer automatic objects or \`std::unique_ptr\`).
5. **Assuming sizeof is the sum of the members** (padding, vptr).

**C++ vs Java:** in C++ objects can live directly on the stack and are copied by value by default; in Java every object is on the heap and variables hold references.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is the difference between a class and a struct in C++?', answerMd: 'Only the default access: class members and base classes are private by default, struct ones public. Everything else (constructors, inheritance, virtual functions) works the same. By convention, struct is used for passive data and class for types with invariants.' },
    { id: 'iq2', q: 'What does a const member function guarantee?', answerMd: 'It does not modify the object\'s non-mutable data members (this has type const T*). It can be called on const objects and through const references and pointers. mutable members are the exception, meant for caches or synchronisation that do not change observable state.' },
    { id: 'iq3', q: 'Why is sizeof of an empty class 1?', answerMd: 'Every complete object must have a unique address, so an empty object occupies at least one byte. (As a base class subobject it can take zero bytes thanks to the empty base optimisation.)' },
    { id: 'iq4', q: 'Stack vs heap objects in C++?', answerMd: 'Automatic (stack) objects are destroyed when their scope ends, deterministically and cheaply. Dynamic (heap) objects live until deleted; allocation is slower and must be managed, ideally through smart pointers (RAII). Prefer automatic storage unless you need a lifetime beyond the scope or a size known only at run time.' },
    { id: 'iq5', q: 'What is the "most vexing parse"?', answerMd: 'A declaration like Widget w(); is parsed as a function named w returning Widget, not as a default-constructed object. Write Widget w; or Widget w{}; instead.' },
  ],
  revision: { notesMd: `- class = private by default; struct = public by default.
- this: pointer to the current object; const member functions get const T*.
- Mark non-modifying functions const; mutable for caches.
- sizeof includes padding and a vptr if virtual; empty class = 1.
- Widget w(); declares a function.`, flashcards: [
    { id: 'f1', front: 'Only difference between class and struct?', backMd: 'Default access (private vs public) for members and bases.' },
    { id: 'f2', front: 'Type of this in a const member function of T?', backMd: 'const T*.' },
    { id: 'f3', front: 'sizeof an empty class?', backMd: '1 byte.' },
    { id: 'f4', front: 'What does mutable allow?', backMd: 'Changing that member inside const member functions.' },
    { id: 'f5', front: 'What does `Widget w();` declare?', backMd: 'A function named w that returns a Widget.' },
  ] },
  resources: [CPPREF('Classes', 'language/classes'), CPPREF('Member functions with cv-qualifiers', 'language/member_functions'), ISOCPP],
});

const coMcqs: MCQ[] = [
  mcq({ ...q(CO), id: 'cpp.co.q1', type: 'compile-error', difficulty: 'easy', stem: 'Why does this not compile?', code: cppErr(`class Counter {
    int n = 0;
public:
    void inc() { ++n; }
};
int main() {
    Counter c;
    c.n = 5;   // here
    return 0;
}`), options: ['n is private because class members are private by default', ['Counter has no constructor', 'The implicit default constructor exists.'], ['inc must be const', 'Unrelated to the error.'], ['Members cannot have default initialisers', 'They can since C++11.']], answer: 0, explanation: 'Members declared before any access specifier in a class are private. In a struct they would be public.' }),
  mcq({ ...q(CO), id: 'cpp.co.q2', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: cppErr(`struct Box {
    int w = 1;
    int width() { return w; }
};
int area(const Box& b) {
    return b.width() * 2;   // here
}`), options: ['width() is not const, so it cannot be called through a const reference', ['w is private', 'struct members are public by default.'], ['Box has no constructor', 'Not needed.'], ['References cannot call member functions', 'They can.']], answer: 0, explanation: 'Declare int width() const { … }. Getters should be const so they work with const objects.' }),
  mcq({ ...q(CO), id: 'cpp.co.q3', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct Node {
    int v;
    Node* self() { return this; }
};
int main() {
    Node a{1}, b{2};
    cout << (a.self() == &a) << (b.self() == &a) << a.self()->v + b.self()->v << endl;
    return 0;
}`, 'C++', '103'), options: ['103', ['113', 'b.self() is the address of b, not a.'], ['11 3', 'The bools print as 1 and 0 with no separator.'], ['013', 'a.self() equals &a.']], answer: 0, explanation: 'this points to the object the function was called on: true (1), false (0), then 1 + 2 = 3.', verified: 'compiled' }),
  mcq({ ...q(CO), id: 'cpp.co.q4', type: 'concept', difficulty: 'easy', stem: 'What does `Widget w();` declare?', options: ['A function w taking no arguments and returning Widget', ['A Widget object built with the default constructor', 'That is Widget w; or Widget w{};.'], ['A pointer to Widget', 'No pointer is involved.'], ['A compile error always', 'It is a valid function declaration.']], answer: 0, explanation: 'The "most vexing parse": anything that can be read as a declaration is one.' }),
  mcq({ ...q(CO), id: 'cpp.co.q5', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
class Cache {
    mutable int hits = 0;
    int value = 42;
public:
    int get() const { ++hits; return value; }
    int count() const { return hits; }
};
int main() {
    const Cache c;
    c.get(); c.get();
    int v = c.get();                     // separate statements: operand order in << is unspecified before C++17
    cout << v << " " << c.count() << endl;
    return 0;
}`, 'C++', '42 3'), options: ['42 3', ['42 0', 'mutable members can change in const functions.'], ['42 2', 'get() was called three times.'], ['It does not compile', 'Modifying a mutable member in a const function is allowed.']], answer: 0, explanation: 'hits is mutable, so the const get() may increment it: three calls, three hits.', verified: 'compiled' }),
  mcq({ ...q(CO), id: 'cpp.co.q6', type: 'concept', difficulty: 'medium', stem: 'Why is sizeof(struct { char c; int i; }) typically 8 rather than 5?', options: ['Padding aligns the int to a 4-byte boundary', ['The compiler stores a vptr', 'There are no virtual functions.'], ['char takes 4 bytes in C++', 'char is 1 byte by definition.'], ['Member functions are stored in the object', 'They are not.']], answer: 0, explanation: '1 byte for c, 3 padding bytes, 4 bytes for i. Exact layout is implementation-defined, but alignment padding is universal.' }),
];

// ---------------------------------------------------------------------------------------
const AE = 'cpp.access-encapsulation';
const access = cppTopic({
  id: AE, title: 'Access Control and Encapsulation', level: 'foundation', estMinutes: 40, prerequisites: [CO], related: ['cpp.inheritance', 'java.access-packages', 'cpp.solid-patterns'],
  summary: 'public/protected/private, friend, and class invariants.',
  objectives: ['Explain public, protected and private for members and how access is checked per class, not per object.', 'Use friend functions and classes sparingly (operator<< is the common case).', 'Design a class around an invariant and keep data private behind a minimal interface.', 'Compare C++ access control with Java\'s, including package-private.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Access specifiers', bodyMd: `| Specifier | Accessible from |
|---|---|
| public | anywhere |
| protected | the class, its friends, and derived classes (through derived objects) |
| private | the class and its friends only |

Two facts that surprise people:
1. **Access is per class, not per object.** A member function of \`Point\` can read the private members of **another** \`Point\` (that is how copy constructors and \`operator==\` work).
2. **Access is checked at compile time and does not change layout or run-time behaviour.** It is a design tool, not a security mechanism.

**friend** grants a specific function or class access to private members. Typical legitimate uses: \`operator<<\` for printing, and tightly coupled helper classes (a container and its iterator). Friendship is not inherited and not transitive.` },
    { id: 'invariants', kind: 'concept', title: 'Encapsulation means protecting invariants', bodyMd: `An **invariant** is a condition that must always hold for a valid object: a \`Fraction\` never has denominator 0 and is always reduced; a \`BankAccount\` balance is never negative; a \`Date\` is a real calendar date.

Encapsulation keeps the data private so only the class's own functions can change it, and each of those functions preserves the invariant. Getters and setters for every field ("anaemic" classes) break this: a \`setBalance(-5)\` defeats the purpose. Prefer **operations with meaning** (\`deposit\`, \`withdraw\`) that validate their input.

Benefits: you can change the representation (store cents instead of a double) without touching callers, and bugs that break the invariant can only come from a small amount of code.` },
    { id: 'code', kind: 'code', title: 'An invariant-preserving class with a friend printer', bodyMd: 'Fraction keeps itself reduced with a positive denominator; operator<< is a friend so it can read the private fields.', code: [cpp(`
#include <iostream>
#include <stdexcept>
using namespace std;

class Fraction {
public:
    Fraction(long long n, long long d) : num_(n), den_(d) {
        if (d == 0) throw invalid_argument("zero denominator");
        normalise();
    }
    Fraction operator+(const Fraction& o) const { return Fraction(num_ * o.den_ + o.num_ * den_, den_ * o.den_); }
    bool operator==(const Fraction& o) const { return num_ == o.num_ && den_ == o.den_; }   // reads o's privates
    friend ostream& operator<<(ostream& os, const Fraction& f) { return os << f.num_ << "/" << f.den_; }
private:
    long long num_, den_;
    static long long gcd(long long a, long long b) { return b == 0 ? (a < 0 ? -a : a) : gcd(b, a % b); }
    void normalise() {
        if (den_ < 0) { num_ = -num_; den_ = -den_; }
        long long g = gcd(num_, den_);
        if (g) { num_ /= g; den_ /= g; }
    }
};

int main() {
    Fraction a(1, 6), b(1, -3);
    cout << a + b << " " << (Fraction(2, 4) == Fraction(1, 2)) << "\\n";
    return 0;
}`, 'C++', '-1/6 1')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and C++ vs Java', bodyMd: `1. Making data protected "for subclasses": every derived class can then break the invariant. Prefer private data and protected functions.
2. Getters and setters for everything, which exposes the representation.
3. Overusing friend to avoid designing an interface.
4. Believing private members of another object of the same class are inaccessible.

**C++ vs Java:** Java has a fourth level, package-private (no modifier), and Java's protected also grants access to the whole package. C++ has friend instead. Java classes default to package-private members; C++ classes default to private.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Can a member function access private members of another object of the same class?', answerMd: 'Yes. Access control in C++ is per class, not per object: any member function (or friend) of Point can access the private members of any Point. That is how copy constructors and comparison operators read the other operand.' },
    { id: 'iq2', q: 'What is encapsulation, really?', answerMd: 'Keeping an object\'s data private and exposing operations that preserve its invariants, so the representation can change and invalid states cannot be created from outside. It is about protecting invariants, not about writing getters and setters.' },
    { id: 'iq3', q: 'When is friend appropriate?', answerMd: 'For functions that are logically part of the class interface but cannot be members, such as operator<< (its left operand is the stream), and for tightly coupled helpers like iterators. Friendship is granted, not taken, and is neither inherited nor transitive.' },
    { id: 'iq4', q: 'protected data members: good idea?', answerMd: 'Usually not. Every derived class, including future ones written by others, can then modify the data and break invariants, and the base class can no longer change its representation. Keep data private and give derived classes protected member functions instead.' },
  ],
  revision: { notesMd: `- public / protected (derived classes) / private (class + friends).
- Access is per class, not per object; checked at compile time only.
- friend: operator<<, iterators; not inherited, not transitive.
- Encapsulation = private data + operations that keep invariants.
- Java adds package-private; Java protected includes the package.`, flashcards: [
    { id: 'f1', front: 'Can Point::equals read other.x_ when x_ is private?', backMd: 'Yes: access is checked per class.' },
    { id: 'f2', front: 'Is friendship inherited?', backMd: 'No (and not transitive either).' },
    { id: 'f3', front: 'Why is operator<< usually a friend?', backMd: 'Its left operand is the stream, so it cannot be a member of your class, yet it needs private data.' },
    { id: 'f4', front: 'Default access for class members?', backMd: 'private.' },
    { id: 'f5', front: 'What is an invariant?', backMd: 'A condition that must hold for every valid object (e.g. denominator ≠ 0).' },
  ] },
  resources: [CPPREF('Access specifiers', 'language/access'), CPPREF('Friend declaration', 'language/friend'), ISOCPP],
});

const aeMcqs: MCQ[] = [
  mcq({ ...q(AE), id: 'cpp.ae.q1', type: 'code-output', difficulty: 'medium', stem: 'Does this compile, and what does it print?', code: cpp(`#include <iostream>
using namespace std;
class Point {
    int x_;
public:
    Point(int x) : x_(x) {}
    bool sameX(const Point& other) const { return x_ == other.x_; }
};
int main() {
    cout << Point(3).sameX(Point(3)) << Point(3).sameX(Point(4)) << endl;
    return 0;
}`, 'C++', '10'), options: ['It compiles and prints 10', ['It fails: other.x_ is private', 'Access is per class, so Point members can read any Point\'s private data.'], ['It prints 11', 'The second comparison is false.'], ['It prints 01', 'The first comparison is true.']], answer: 0, explanation: 'Private members are accessible to every member function of the same class, for any object of that class.', verified: 'compiled' }),
  mcq({ ...q(AE), id: 'cpp.ae.q2', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: cppErr(`class Base {
protected:
    int secret = 1;
};
class Derived : public Base {};
int main() {
    Derived d;
    return d.secret;   // here
}`), options: ['protected members are accessible only inside the class and its derived classes, not from main', ['secret must be static', 'Unrelated.'], ['Derived must declare a constructor', 'The implicit one is fine.'], ['Inheritance must be protected', 'The inheritance mode does not make it public.']], answer: 0, explanation: 'protected widens access to derived classes\' member functions only.' }),
  mcq({ ...q(AE), id: 'cpp.ae.q3', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
class Temp {
    double c_;
public:
    explicit Temp(double c) : c_(c < -273.15 ? -273.15 : c) {}
    void add(double d) { c_ = c_ + d < -273.15 ? -273.15 : c_ + d; }
    double celsius() const { return c_; }
};
int main() {
    Temp t(-300);
    t.add(10);
    cout << t.celsius() << endl;
    return 0;
}`, 'C++', '-263.15'), options: ['-263.15', ['-290', 'The constructor already clamped the value to absolute zero.'], ['-273.15', 'add(10) raises it by 10.'], ['It does not compile', 'Everything is valid.']], answer: 0, explanation: 'The invariant (≥ −273.15) is enforced in every operation: −300 becomes −273.15, then +10 gives −263.15.', verified: 'compiled' }),
  mcq({ ...q(AE), id: 'cpp.ae.q4', type: 'concept', difficulty: 'easy', stem: 'Which is the best encapsulated design for a bank account?', options: ['Private balance with deposit() and withdraw() that validate amounts', ['Public balance field', 'Anyone can set it to any value.'], ['Private balance with setBalance(double) and getBalance()', 'setBalance lets callers bypass every rule.'], ['Protected balance so subclasses can manage it', 'Every subclass could break the invariant.']], answer: 0, explanation: 'Expose meaningful operations that keep the invariant, not raw access to the data.' }),
  mcq({ ...q(AE), id: 'cpp.ae.q5', type: 'concept', difficulty: 'medium', stem: 'Class A declares `friend class B;`. Class C derives from B. Which is true?', options: ['B can access A\'s private members; C cannot (friendship is not inherited)', ['Both B and C can', 'Friendship is not inherited.'], ['A can access B\'s private members', 'Friendship is one-way.'], ['Neither can', 'B is a friend.']], answer: 0, explanation: 'Friendship is granted explicitly, one way, and not inherited or transitive.' }),
  mcq({ ...q(AE), id: 'cpp.ae.q6', type: 'concept', difficulty: 'medium', stem: 'Java has an access level that C++ lacks. Which one?', options: ['Package-private (no modifier)', ['protected', 'C++ has protected.'], ['private', 'C++ has private.'], ['friend', 'friend is C++, not Java.']], answer: 0, explanation: 'Java\'s default access allows the whole package; C++ uses friend for selective access instead.' }),
];

// ---------------------------------------------------------------------------------------
const IN = 'cpp.inheritance';
const inheritance = cppTopic({
  id: IN, title: 'Inheritance', level: 'core', estMinutes: 55, prerequisites: ['cpp.constructors-destructors'], related: ['cpp.polymorphism-virtual', 'cpp.composition-association', 'java.inheritance'],
  summary: 'Access in inheritance, construction order, multiple and virtual inheritance.',
  objectives: ['Explain public, protected and private inheritance and what each means for access and for is-a.', 'Predict constructor and destructor order with base classes and members.', 'Explain name hiding and how using-declarations bring base overloads back.', 'Describe multiple inheritance, the diamond problem and virtual inheritance.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'is-a and the inheritance modes', bodyMd: `\`class Dog : public Animal\` says a Dog **is an** Animal: a \`Dog\` can be used wherever an \`Animal&\` or \`Animal*\` is expected.

| Base member | public inheritance | protected inheritance | private inheritance |
|---|---|---|---|
| public | public | protected | private |
| protected | protected | protected | private |
| private | not accessible | not accessible | not accessible |

- **public inheritance** is the normal "is-a". Use it only when every Animal operation makes sense for a Dog (the Liskov substitution principle).
- **private inheritance** means "implemented in terms of": the base is a detail, outside code cannot convert Derived* to Base*. Composition is usually clearer.
- Default for \`class\` is private inheritance, for \`struct\` public inheritance. Write the keyword explicitly.

**Construction:** base classes first (left to right in the base list), then members, then the body. **Destruction:** the reverse. Constructors are not inherited by default; \`using Base::Base;\` inherits them (C++11).` },
    { id: 'hiding', kind: 'concept', title: 'Name hiding', bodyMd: `A name declared in a derived class **hides all base members with that name**, whatever their parameters:

\`\`\`cpp
struct Base { void f(int); void f(double); };
struct Derived : Base { void f(const char*); };   // hides both Base::f overloads
Derived d;
d.f(1);            // error: only f(const char*) is visible
\`\`\`

Fix with a using-declaration in Derived: \`using Base::f;\` brings the base overloads into scope, so overload resolution sees all three.

This is different from **overriding**, which requires a virtual function with the same signature (see Polymorphism).` },
    { id: 'diamond', kind: 'example', title: 'Multiple inheritance and the diamond', bodyMd: `C++ allows several base classes. The **diamond** appears when two bases share a common base:

\`\`\`text
        Device
       /      \\
   Printer   Scanner
       \\      /
        Copier
\`\`\`

With ordinary inheritance, a Copier contains **two** Device subobjects, so \`copier.id\` is ambiguous. **Virtual inheritance** (\`class Printer : virtual public Device\`) makes the most-derived class share a single Device subobject, and the **most-derived class constructs the virtual base** directly (its constructor call takes precedence over the intermediate classes' calls).

Java avoids this by allowing multiple inheritance only of interfaces (with default-method conflict rules). In C++, multiple inheritance of pure interfaces (abstract classes with no data) is common and safe; inheriting several data-carrying bases is rarely a good idea.` },
    { id: 'code', kind: 'code', title: 'Construction order with a virtual base', bodyMd: 'The virtual base is constructed once, first, by the most-derived class.', code: [cpp(`
#include <iostream>
using namespace std;
struct Device  { Device(int id)  { cout << "Device(" << id << ") "; } };
struct Printer : virtual Device { Printer() : Device(1) { cout << "Printer "; } };
struct Scanner : virtual Device { Scanner() : Device(2) { cout << "Scanner "; } };
struct Copier : Printer, Scanner { Copier() : Device(3) { cout << "Copier"; } };

int main() {
    Copier c;
    cout << "\\n";
    return 0;
}`, 'C++', 'Device(3) Printer Scanner Copier')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and C++ vs Java', bodyMd: `1. **Public inheritance for code reuse** when the derived class is not truly substitutable (a Stack deriving from vector exposes insert in the middle).
2. **Name hiding surprises** when adding an overload in the derived class.
3. **Forgetting virtual destructors** in polymorphic bases (see Polymorphism).
4. **Object slicing:** copying a Derived into a Base by value drops the derived part.
5. **The diamond without virtual inheritance**, duplicating the shared base.

**C++ vs Java:** Java has single class inheritance (\`extends\`) plus multiple interfaces, all methods are virtual by default, there are no inheritance modes, and \`super(...)\` must be the first statement of a constructor.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is the difference between public and private inheritance?', answerMd: 'Public inheritance models is-a: public base members stay public and a Derived* converts to Base*. Private inheritance models implemented-in-terms-of: base members become private in Derived and outside code cannot treat Derived as Base. Composition is usually preferred over private inheritance.' },
    { id: 'iq2', q: 'In what order are constructors called in a hierarchy?', answerMd: 'Virtual bases first (by the most-derived class), then direct non-virtual bases in declaration order, then members in declaration order, then the constructor body. Destructors run in exactly the reverse order.' },
    { id: 'iq3', q: 'What is the diamond problem, and how does C++ solve it?', answerMd: 'When D inherits from B and C, which both inherit from A, D contains two A subobjects and references to A\'s members are ambiguous. Declaring the inheritance from A as virtual in B and C makes D contain one shared A, constructed directly by D.' },
    { id: 'iq4', q: 'Why does adding a function f(string) to a derived class break calls to the base f(int)?', answerMd: 'Name hiding: a name in the derived scope hides every base member with that name, so overload resolution only sees the derived f. Add using Base::f; in the derived class to bring the base overloads back.' },
    { id: 'iq5', q: 'Are constructors inherited?', answerMd: 'Not by default. Since C++11 a using-declaration (using Base::Base;) inherits the base constructors. Destructors, copy assignment and other special members are handled separately.' },
  ],
  revision: { notesMd: `- public inheritance = is-a (LSP); private = implemented-in-terms-of (prefer composition).
- class defaults to private inheritance, struct to public.
- Order: virtual bases → bases (declaration order) → members → body; destruction reversed.
- Name hiding: derived names hide all base overloads; fix with using Base::f.
- Diamond → virtual inheritance; the most-derived class constructs the virtual base.`, flashcards: [
    { id: 'f1', front: 'Base public member under protected inheritance becomes…?', backMd: 'protected.' },
    { id: 'f2', front: 'Who constructs a virtual base class?', backMd: 'The most-derived class.' },
    { id: 'f3', front: 'Fix for name hiding of base overloads?', backMd: '`using Base::f;` in the derived class.' },
    { id: 'f4', front: 'Default inheritance mode for class?', backMd: 'private.' },
    { id: 'f5', front: 'Inherit base constructors in C++11?', backMd: '`using Base::Base;`.' },
  ] },
  resources: [CPPREF('Derived classes', 'language/derived_class'), CPPREF('Using-declaration', 'language/using_declaration'), ISOCPP],
});

const inMcqs: MCQ[] = [
  mcq({ ...q(IN), id: 'cpp.in.q1', type: 'code-output', difficulty: 'easy', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct A { A() { cout << "A"; } ~A() { cout << "~A"; } };
struct B : A { B() { cout << "B"; } ~B() { cout << "~B"; } };
struct C : B { C() { cout << "C"; } ~C() { cout << "~C"; } };
int main() { { C c; } cout << endl; return 0; }`, 'C++', 'ABC~C~B~A'), options: ['ABC~C~B~A', ['CBA~A~B~C', 'Bases are constructed first.'], ['ABC~A~B~C', 'Destruction is the reverse of construction.'], ['C~C', 'Base parts are constructed and destroyed too.']], answer: 0, explanation: 'Construction goes from the most basic class down; destruction goes back up.', verified: 'compiled' }),
  mcq({ ...q(IN), id: 'cpp.in.q2', type: 'compile-error', difficulty: 'medium', stem: 'Why does this fail to compile?', code: cppErr(`struct Base {
    void f(int) {}
};
struct Derived : Base {
    void f(const char*) {}
};
int main() {
    Derived d;
    d.f(42);   // here
    return 0;
}`), options: ['Derived::f hides Base::f(int), so f(int) is not considered', ['f must be virtual', 'Virtual is unrelated to name lookup.'], ['42 cannot convert to int', 'It is an int.'], ['Derived needs a constructor', 'The implicit one exists.']], answer: 0, explanation: 'Add `using Base::f;` inside Derived to make both overloads visible.' }),
  mcq({ ...q(IN), id: 'cpp.in.q3', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct Base {
    void f(int) { cout << "int "; }
    void f(double) { cout << "double "; }
};
struct Derived : Base {
    using Base::f;
    void f(const char*) { cout << "str "; }
};
int main() {
    Derived d;
    d.f(1); d.f(2.5); d.f("x");
    cout << endl;
    return 0;
}`, 'C++', 'int double str'), options: ['int double str', ['str str str', 'using Base::f brings the base overloads into scope.'], ['It does not compile', 'The using-declaration fixes name hiding.'], ['double double str', '1 is an int literal, an exact match for f(int).']], answer: 0, explanation: 'All three overloads are visible, and each call picks its exact match.', verified: 'compiled' }),
  mcq({ ...q(IN), id: 'cpp.in.q4', type: 'compile-error', difficulty: 'hard', stem: 'Why does this fail to compile?', code: cppErr(`struct Device { int id = 0; };
struct Printer : Device {};
struct Scanner : Device {};
struct Copier : Printer, Scanner {};
int main() {
    Copier c;
    return c.id;   // here
}`), options: ['c.id is ambiguous: Copier has two Device subobjects', ['Device has no constructor', 'The implicit default constructor exists.'], ['Multiple inheritance is not allowed', 'C++ allows it.'], ['id is private', 'struct members are public.']], answer: 0, explanation: 'Without virtual inheritance there is one Device via Printer and one via Scanner. Use `: virtual Device` in both, or qualify c.Printer::id.' }),
  mcq({ ...q(IN), id: 'cpp.in.q5', type: 'code-output', difficulty: 'hard', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct V { V(int x) { cout << "V" << x << " "; } };
struct L : virtual V { L() : V(1) { cout << "L "; } };
struct R : virtual V { R() : V(2) { cout << "R "; } };
struct D : L, R { D() : V(9) { cout << "D"; } };
int main() { D d; cout << endl; return 0; }`, 'C++', 'V9 L R D'), options: ['V9 L R D', ['V1 L V2 R D', 'With virtual inheritance there is one V, built once.'], ['V1 L R D', 'The most-derived class constructs the virtual base.'], ['L R V9 D', 'Virtual bases are constructed before other bases.']], answer: 0, explanation: 'D constructs the single shared V with 9; the V(1) and V(2) calls in L and R are ignored when they are not the most-derived class.', verified: 'compiled' }),
  mcq({ ...q(IN), id: 'cpp.in.q6', type: 'compile-error', difficulty: 'medium', stem: 'Why does this fail to compile?', code: cppErr(`class Engine { public: void start() {} };
class Car : Engine {};
int main() {
    Car c;
    c.start();   // here
    return 0;
}`), options: ['class inherits privately by default, so start() is private in Car', ['Engine has no constructor', 'Implicit.'], ['start must be virtual', 'Unrelated.'], ['A class cannot inherit from another class', 'It can.']], answer: 0, explanation: 'Write `class Car : public Engine` for is-a (or better: give Car an Engine member).' }),
];

// ---------------------------------------------------------------------------------------
const OV = 'cpp.overloading';
const overloading = cppTopic({
  id: OV, title: 'Function and Operator Overloading', level: 'core', estMinutes: 50, prerequisites: [CO], related: ['java.overloading-resolution', 'cpp.templates', 'cpp.copy-semantics'],
  summary: 'Overload resolution and operator overloading done right.',
  objectives: ['Explain how overload resolution ranks candidates (exact match, promotion, conversion, user-defined conversion) and when calls are ambiguous.', 'Overload operators with the conventional signatures: arithmetic, comparison, compound assignment, subscript, stream insertion.', 'Decide between member and non-member operators, and keep symmetric operators non-members.', 'Avoid surprises from default arguments and implicit converting constructors.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Overload resolution in short', bodyMd: `Several functions can share a name if their parameter lists differ (return type alone is not enough). For a call, the compiler:
1. collects the **candidates** visible by name lookup,
2. keeps the **viable** ones (right number of arguments, each argument convertible),
3. picks the **best** by ranking each argument's conversion:

| Rank | Examples |
|---|---|
| Exact match | int → int, array → pointer, adding const |
| Promotion | char/short → int, float → double |
| Standard conversion | int → double, double → int, int → long, pointer → bool |
| User-defined conversion | via a converting constructor or conversion operator |
| Ellipsis | f(...) |

If no single candidate is at least as good for every argument and better for one, the call is **ambiguous**. Example: with f(long) and f(double), the call f(5) is ambiguous because int → long and int → double are both standard conversions.` },
    { id: 'operators', kind: 'example', title: 'Operator overloading conventions', bodyMd: `| Operator | Usual form |
|---|---|
| \`+=\`, \`-=\` | member, returns \`T&\` (\`*this\`) |
| \`+\`, \`-\` | non-member (often defined via \`+=\`), returns \`T\` by value |
| \`==\`, \`<\` | non-member or const member, returns bool (C++20 can generate the others from \`<=>\`) |
| \`[]\` | member, two overloads (const and non-const) |
| \`<<\` (streams) | non-member (often friend), returns \`ostream&\` |
| \`=\` | member (see Copy Semantics) |
| \`()\` | member: function objects |
| \`++x\` / \`x++\` | \`T& operator++()\` / \`T operator++(int)\` |

**Symmetry:** if \`Money + int\` works through a converting constructor, \`int + Money\` only works when \`operator+\` is a non-member, because a member operator's left operand must already be a Money.

Do not overload \`&&\`, \`||\` or \`,\`: the overloads lose short-circuiting (and before C++17, sequencing), surprising readers.` },
    { id: 'code', kind: 'code', title: 'A small value type with operators', bodyMd: 'Defining + in terms of +=, and keeping the symmetric operators non-members.', code: [cpp(`
#include <iostream>
using namespace std;

class Money {
public:
    Money(long long paise = 0) : p_(paise) {}            // implicit on purpose: 500 → Money
    Money& operator+=(const Money& o) { p_ += o.p_; return *this; }
    long long paise() const { return p_; }
private:
    long long p_;
};
Money operator+(Money a, const Money& b) { a += b; return a; }
bool operator<(const Money& a, const Money& b) { return a.paise() < b.paise(); }
ostream& operator<<(ostream& os, const Money& m) { return os << "Rs " << m.paise() / 100 << "." << (m.paise() % 100) / 10 << m.paise() % 10; }

int main() {
    Money price(1999);
    Money total = 500 + price;                         // works: operator+ is a non-member
    total += 1;
    cout << total << " " << (price < total) << "\\n";
    return 0;
}`, 'C++', 'Rs 25.00 1')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and C++ vs Java', bodyMd: `1. **Overloading on return type only:** not allowed.
2. **Ambiguity** with literals (f(long) vs f(double) for f(5); f(int*) vs f(long) for f(0) before nullptr; use nullptr).
3. **Default arguments plus overloads** creating ambiguous calls (f(int) and f(int, int = 0)).
4. **Operators with surprising meaning** (\`+\` that modifies its operand).
5. **Implicit converting constructors** that allow unintended conversions; mark single-argument constructors \`explicit\` unless the conversion is natural.

**C++ vs Java:** Java has method overloading with similar rules (widening, then boxing, then varargs) but **no operator overloading** (except built-in + for String).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Can you overload functions by return type?', answerMd: 'No. Overloads must differ in their parameter lists (number, types, or cv/ref qualifiers of member functions). The return type is not used to choose between overloads.' },
    { id: 'iq2', q: 'Why should operator+ usually be a non-member function?', answerMd: 'So both operands are treated symmetrically: with a member, 5 + money fails because the left operand must already be a Money, while a non-member allows implicit conversion of either operand. Implement it via the member operator+= for consistency.' },
    { id: 'iq3', q: 'How are prefix and postfix ++ distinguished?', answerMd: 'Prefix is T& operator++(); postfix is T operator++(int) with a dummy int parameter. Postfix returns a copy of the old value, so prefix is preferred when the result is not needed.' },
    { id: 'iq4', q: 'Why is f(5) ambiguous with overloads f(long) and f(double)?', answerMd: 'The argument is an int. Both int → long and int → double are standard conversions of the same rank, so neither overload is better, and the call is ambiguous. An exact f(int) or a cast resolves it.' },
    { id: 'iq5', q: 'Which operators should you not overload?', answerMd: '&& and || (lose short-circuit evaluation), the comma operator, and unary & (address-of). Some operators (::, ., .*, ?:, sizeof) cannot be overloaded at all.' },
  ],
  revision: { notesMd: `- Ranking: exact > promotion > standard conversion > user-defined > ellipsis; ties = ambiguous.
- Return type does not distinguish overloads.
- += member returning T&; + non-member via +=; << non-member returning ostream&.
- Prefix T& operator++(), postfix T operator++(int).
- Do not overload &&, ||, comma. explicit single-argument constructors unless conversion is natural.`, flashcards: [
    { id: 'f1', front: 'Postfix ++ signature?', backMd: 'T operator++(int).' },
    { id: 'f2', front: 'f(long) and f(double); call f(5)?', backMd: 'Ambiguous: both are standard conversions from int.' },
    { id: 'f3', front: 'f(int) and f(double); call f(\'a\')?', backMd: 'f(int): char → int is a promotion.' },
    { id: 'f4', front: 'Why is operator<< not a member of your class?', backMd: 'Its left operand is the stream.' },
    { id: 'f5', front: 'Can :: or ?: be overloaded?', backMd: 'No.' },
  ] },
  resources: [CPPREF('Overload resolution', 'language/overload_resolution'), CPPREF('Operator overloading', 'language/operators'), ISOCPP],
});

const ovMcqs: MCQ[] = [
  mcq({ ...q(OV), id: 'cpp.ov.q1', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
void f(int) { cout << "int "; }
void f(double) { cout << "double "; }
void f(const char*) { cout << "str "; }
int main() {
    f('a'); f(3.0f); f(true); f("hi");
    cout << endl;
    return 0;
}`, 'C++', 'int double int str'), options: ['int double int str', ['int double double str', 'bool → int is a promotion, which beats the bool → double conversion.'], ['char double int str', 'There is no f(char).'], ['int float int str', 'There is no f(float).']], answer: 0, explanation: 'char → int, float → double and bool → int are all promotions, which outrank conversions, so they pick f(int), f(double) and f(int).', verified: 'compiled' }),
  mcq({ ...q(OV), id: 'cpp.ov.q2', type: 'compile-error', difficulty: 'medium', stem: 'Why does this not compile?', code: cppErr(`void g(long) {}
void g(double) {}
int main() {
    g(5);   // here
    return 0;
}`), options: ['The call is ambiguous: int → long and int → double are both standard conversions', ['g(long) is not a valid overload', 'It is.'], ['5 is a double literal', '5 is an int.'], ['Overloads must have different return types', 'Return types do not matter.']], answer: 0, explanation: 'Neither conversion ranks higher, so overload resolution fails. Add g(int) or cast the argument.' }),
  mcq({ ...q(OV), id: 'cpp.ov.q3', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct Counter {
    int v = 0;
    Counter& operator++() { ++v; return *this; }
    Counter operator++(int) { Counter old = *this; ++v; return old; }
};
int main() {
    Counter c;
    Counter a = c++;
    Counter b = ++c;
    cout << a.v << b.v << c.v << endl;
    return 0;
}`, 'C++', '022'), options: ['022', ['122', 'Postfix returns the old value (0).'], ['012', 'b gets the incremented value 2.'], ['011', 'c is incremented twice.']], answer: 0, explanation: 'a = old value 0, then c = 1; ++c makes c = 2 and b = 2.', verified: 'compiled' }),
  mcq({ ...q(OV), id: 'cpp.ov.q4', type: 'compile-error', difficulty: 'hard', stem: 'Money has an implicit Money(int) constructor and a MEMBER `Money operator+(const Money&) const`. Why does this fail?', code: cppErr(`struct Money {
    int p;
    Money(int x) : p(x) {}
    Money operator+(const Money& o) const { return Money(p + o.p); }
};
int main() {
    Money m(5);
    Money a = m + 3;
    Money b = 3 + m;   // here
    return a.p + b.p;
}`), options: ['A member operator+ needs a Money on the left; 3 is not converted to call a member function', ['Money(int) must be explicit', 'Explicit would break m + 3 too.'], ['operator+ must return a reference', 'Returning by value is correct.'], ['m + 3 is the error', 'm + 3 converts 3 through Money(int).']], answer: 0, explanation: 'Implicit conversions apply to arguments, not to the object a member function is called on. Make operator+ a non-member for symmetry.' }),
  mcq({ ...q(OV), id: 'cpp.ov.q5', type: 'concept', difficulty: 'easy', stem: 'Which statement about overloading in C++ is true?', options: ['Overloads must differ in their parameter lists', ['Overloads can differ only in return type', 'Return type is not part of overload resolution.'], ['Every operator can be overloaded', ':: . ?: sizeof cannot.'], ['Java also supports operator overloading', 'Java has none for user types.']], answer: 0, explanation: 'Number, types (and for members, const/ref qualifiers) of parameters distinguish overloads.' }),
  mcq({ ...q(OV), id: 'cpp.ov.q6', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
using namespace std;
struct Vec { int x, y; };
Vec operator+(Vec a, Vec b) { return {a.x + b.x, a.y + b.y}; }
bool operator==(Vec a, Vec b) { return a.x == b.x && a.y == b.y; }
ostream& operator<<(ostream& os, Vec v) { return os << "(" << v.x << "," << v.y << ")"; }
int main() {
    Vec a{1, 2}, b{3, 4};
    cout << a + b << " " << (a + b == Vec{4, 6}) << endl;
    return 0;
}`, 'C++', '(4,6) 1'), options: ['(4,6) 1', ['(4,6) true', 'bool prints as 1 without boolalpha.'], ['(1,2)(3,4) 1', 'operator+ adds the vectors.'], ['It does not compile', 'Non-member operators for an aggregate are fine.']], answer: 0, explanation: 'Each operator is an ordinary function chosen by its operand types; the comparison yields true, printed as 1.', verified: 'compiled' }),
];

// ---------------------------------------------------------------------------------------
const CA = 'cpp.composition-association';
const composition = cppTopic({
  id: CA, title: 'Composition, Aggregation and Association', level: 'core', estMinutes: 40, prerequisites: [CO], related: ['cpp.inheritance', 'cpp.memory-raii', 'cpp.solid-patterns', 'java.solid-patterns'],
  summary: 'has-a vs is-a, and choosing between them.',
  objectives: ['Distinguish association, aggregation and composition by ownership and lifetime.', 'Express each relationship in C++ (member object, unique_ptr, shared_ptr, raw/weak pointer, reference).', 'Explain why composition is usually preferred over inheritance, with a concrete counterexample.', 'Model a small system (library, car, order) with the right relationships.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Three kinds of has-a', bodyMd: `| Relationship | Ownership and lifetime | Example | C++ expression |
|---|---|---|---|
| **Composition** | the whole owns the part; the part dies with the whole | Car has an Engine; Order has OrderLines | member object, or \`unique_ptr<Part>\` |
| **Aggregation** | the whole groups parts it does not exclusively own; parts outlive it | Team has Players; Playlist has Songs | non-owning pointers/references, or \`shared_ptr\` when shared ownership is real |
| **Association** | objects know about each other; no ownership | Teacher teaches Student; Driver uses Car | references, raw non-owning pointers, \`weak_ptr\`, ids |

UML marks composition with a filled diamond and aggregation with a hollow one; interviews mostly care about **who owns what and who deletes it**.

In C++ the choice of member type **encodes** the relationship: a \`unique_ptr\` member says "I own this exclusively"; a raw pointer or reference member says "I use this but do not delete it".` },
    { id: 'composition-vs-inheritance', kind: 'comparison', title: 'Favour composition over inheritance', bodyMd: `Inheritance creates a tight, compile-time coupling: derived classes depend on base implementation details, and every public base operation becomes part of the derived interface.

Counterexample: \`class Stack : public std::vector<int>\` lets callers call \`insert\` in the middle or \`erase\`, breaking the stack's LIFO contract. With composition, the Stack exposes only push, pop and top:

\`\`\`cpp
class Stack {
public:
    void push(int x) { v_.push_back(x); }
    void pop() { v_.pop_back(); }
    int top() const { return v_.back(); }
    bool empty() const { return v_.empty(); }
private:
    std::vector<int> v_;        // composition: an implementation detail
};
\`\`\`

Use inheritance for genuine is-a relationships with polymorphic behaviour (Shape → Circle) and composition for reuse. **Strategy** and **decorator** patterns are composition-based alternatives to deep inheritance hierarchies.` },
    { id: 'code', kind: 'code', title: 'Encoding ownership in member types', bodyMd: 'The car owns its engine (destroyed with it) and refers to a driver it does not own.', code: [cpp(`
#include <iostream>
#include <memory>
#include <string>
using namespace std;

struct Engine { ~Engine() { cout << "engine destroyed\\n"; } };
struct Driver { string name; };

class Car {
public:
    explicit Car(Driver& d) : engine_(new Engine()), driver_(&d) {}
    void changeDriver(Driver& d) { driver_ = &d; }   // association: just a link
    const string& driverName() const { return driver_->name; }
private:
    unique_ptr<Engine> engine_;   // composition: owned, dies with the Car
    Driver* driver_;              // association: not owned, never deleted here
};

int main() {
    Driver asha{"Asha"};
    {
        Car c(asha);
        cout << c.driverName() << "\\n";
    }                             // the Car and its Engine are destroyed; asha lives on
    cout << asha.name << " still exists\\n";
    return 0;
}`, 'C++', 'Asha\nengine destroyed\nAsha still exists')] },
    { id: 'pitfalls', kind: 'mistakes', title: 'Pitfalls and C++ vs Java', bodyMd: `1. Using inheritance to reuse code from a class that is not a true supertype.
2. Raw owning pointers (who deletes them?); use unique_ptr for ownership.
3. shared_ptr everywhere "to be safe", hiding unclear ownership and creating cycles (break them with weak_ptr).
4. Dangling non-owning pointers when the referenced object dies first.

**C++ vs Java:** Java's garbage collector hides lifetime, so composition vs aggregation is only a design idea there; in C++ it decides who destroys the part.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Composition vs aggregation?', answerMd: 'Both are has-a. In composition the whole exclusively owns the part and the part\'s lifetime ends with the whole (a house and its rooms). In aggregation the whole refers to parts that exist independently and can be shared (a department and its professors).' },
    { id: 'iq2', q: 'Why "favour composition over inheritance"?', answerMd: 'Composition exposes only the interface you choose, keeps implementation details private, lets you swap parts at run time, and avoids fragile coupling to a base class\'s internals. Inheritance should be reserved for genuine, substitutable is-a relationships.' },
    { id: 'iq3', q: 'How do you express ownership in C++ members?', answerMd: 'A member object or unique_ptr for exclusive ownership; shared_ptr only for true shared ownership; raw pointers, references or weak_ptr for non-owning links. The type documents who is responsible for destruction.' },
    { id: 'iq4', q: 'Model a library: books, copies, members and loans.', answerMd: 'Library composes Copies (owns them); a Book (title, ISBN) is associated with its Copies; a Member is associated with Loans; a Loan links a Copy and a Member with dates and owns neither. Ownership decides which object creates and destroys which.' },
  ],
  revision: { notesMd: `- Composition: owns, same lifetime (member / unique_ptr).
- Aggregation: groups parts with independent lifetimes (non-owning or shared).
- Association: knows-about, no ownership (reference, raw ptr, weak_ptr, id).
- Prefer composition for reuse; inheritance only for substitutable is-a.
- Stack via vector member, not via public inheritance.`, flashcards: [
    { id: 'f1', front: 'Which relationship ends the part\'s life with the whole?', backMd: 'Composition.' },
    { id: 'f2', front: 'C++ member type for exclusive ownership?', backMd: 'A member object or std::unique_ptr.' },
    { id: 'f3', front: 'Why not `class Stack : public vector<int>`?', backMd: 'It exposes vector operations (insert, erase) that break the stack contract.' },
    { id: 'f4', front: 'How do you break shared_ptr cycles?', backMd: 'Make one direction a weak_ptr.' },
    { id: 'f5', front: 'Team and Players: which relationship?', backMd: 'Aggregation: players exist independently of the team.' },
  ] },
  resources: [CPPREF('std::unique_ptr', 'memory/unique_ptr'), ISOCPP, { title: 'Object composition (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Object_composition', kind: 'article' }],
});

const caMcqs: MCQ[] = [
  mcq({ ...q(CA), id: 'cpp.ca.q1', type: 'concept', difficulty: 'easy', stem: 'A House has Rooms that cannot exist without the house. Which relationship?', options: ['Composition', ['Aggregation', 'In aggregation the parts outlive the whole.'], ['Association', 'Association implies no ownership.'], ['Inheritance', 'A room is not a house.']], answer: 0, explanation: 'Exclusive ownership with a shared lifetime.' }),
  mcq({ ...q(CA), id: 'cpp.ca.q2', type: 'code-output', difficulty: 'medium', stem: 'What does this program print?', code: cpp(`#include <iostream>
#include <memory>
using namespace std;
struct Part { char c; Part(char x) : c(x) {} ~Part() { cout << c; } };
struct Whole {
    unique_ptr<Part> owned;
    Part* borrowed;
    Whole(Part* b) : owned(new Part('o')), borrowed(b) {}
};
int main() {
    Part p('b');
    { Whole w(&p); }
    cout << "|";
    return 0;
}`, 'C++', 'o|b'), options: ['o|b', ['ob|', 'Whole does not delete the borrowed part.'], ['|ob', 'The owned part dies at the end of the inner block.'], ['o|', 'p is destroyed when main returns, after "|".']], answer: 0, explanation: 'The unique_ptr deletes the owned Part with the Whole; the borrowed Part p lives until main ends.', verified: 'compiled' }),
  mcq({ ...q(CA), id: 'cpp.ca.q3', type: 'design', difficulty: 'medium', stem: 'You want a Stack that reuses std::vector. Why prefer a vector member over `class Stack : public std::vector<int>`?', options: ['Public inheritance exposes vector operations like insert and erase that break the stack contract', ['vector cannot be inherited from', 'It can, but it was not designed for it.'], ['Members are faster than base classes', 'Performance is the same.'], ['Inheritance prevents push_back', 'It does not.']], answer: 0, explanation: 'Composition exposes only push, pop and top.' }),
  mcq({ ...q(CA), id: 'cpp.ca.q4', type: 'concept', difficulty: 'medium', stem: 'A Playlist refers to Songs; the same Song can be in many playlists and outlives them. Which member type fits best in C++?', options: ['Non-owning references (e.g. Song* or ids) to songs owned by a library', ['unique_ptr<Song> in each playlist', 'A song cannot be uniquely owned by several playlists.'], ['Song objects copied into each playlist', 'Copies would diverge.'], ['Inheriting Playlist from Song', 'A playlist is not a song.']], answer: 0, explanation: 'Aggregation: the library owns songs; playlists only refer to them.' }),
  mcq({ ...q(CA), id: 'cpp.ca.q5', type: 'design', difficulty: 'medium', stem: 'Two objects hold shared_ptr to each other and are never destroyed. What fixes the leak?', options: ['Make one of the links a weak_ptr', ['Use more shared_ptr copies', 'Increases the counts.'], ['Call delete on both', 'Mixing manual delete with shared_ptr is undefined behaviour.'], ['Use new instead of make_shared', 'The cycle remains.']], answer: 0, explanation: 'A reference cycle keeps both counts above zero; weak_ptr does not contribute to the count.' }),
  mcq({ ...q(CA), id: 'cpp.ca.q6', type: 'concept', difficulty: 'easy', stem: 'A Teacher teaches many Students and a Student has many Teachers; neither owns the other. This is…', options: ['Association', ['Composition', 'No ownership.'], ['Inheritance', 'Not an is-a relationship.'], ['Aggregation where Teacher owns Students', 'Neither owns the other.']], answer: 0, explanation: 'A plain many-to-many association.' }),
];

export const topics: Topic[] = [classes, access, inheritance, overloading, composition];
export const mcqs: MCQ[] = [...coMcqs, ...aeMcqs, ...inMcqs, ...ovMcqs, ...caMcqs];
