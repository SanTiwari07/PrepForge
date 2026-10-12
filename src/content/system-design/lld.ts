import type { MCQ, Topic } from '../schema';
import { cpp, java, mcq } from '../helpers';
import { q, sdTopic } from './common';

// Low-level design (LLD) practice set: six classic object-oriented design problems, each with
// requirements, a class diagram, key decisions, runnable C++ and Java skeletons (compiled, run and
// compared by scripts/verify-code.ts) and new-grad vs senior expectations. The numbers quoted in
// the lessons (fines, travel distances, minimum throws, change-making) are recomputed in
// tests/sd-facts.test.ts.

// ---------------------------------------------------------------------------------------
const PARKINGLOT = "sd.lld-parking-lot";
const parkingLot = sdTopic({
  id: PARKINGLOT, title: "LLD Practice: Parking Lot", level: 'core', estMinutes: 50, prerequisites: ["sd.requirements"], related: ["cpp.solid-patterns", "java.solid-patterns", "sd.lld-vending-machine"],
  summary: "Entities, spot allocation, pricing strategy and concurrent gates.",
  objectives: ["Clarify the requirements of a parking lot and list its entities and responsibilities.", "Choose a spot-allocation rule (best fit) and make pricing replaceable with the Strategy pattern.", "Identify and remove the check-then-act race when two gates allocate a spot at once.", "Extend the design (floors, EV spots, reservations, display board) without rewriting it."],
  sections: [
    { id: "requirements", kind: "concept", title: "1. Requirements and scope", bodyMd: `**Functional:** several vehicle types (bike, car, truck) and spots of matching sizes; a vehicle **enters**, is assigned a suitable free spot and gets a **ticket**; on **exit** the ticket is presented and a **fee** is computed from the duration and vehicle type; the lot rejects entry when no suitable spot is free; show free spots.
**Non-functional:** correct under **concurrent gates**; pricing rules change without code surgery; fast allocation.
**Out of scope (say so):** payment gateway, number-plate recognition, reservations, hardware sensors.

**Clarifying questions to ask:** one floor or many? Can a bike use a car spot? Is pricing per hour, per day, or tiered? Is a lost ticket possible? Do we need to show availability on a display? Peak-hour pricing?` },
    { id: "entities", kind: "concept", title: "2. Core entities and class diagram", bodyMd: `\`\`\`
ParkingLot ──has many──> Spot (id, size, taken)           [Floor groups spots in a multi-floor lot]
ParkingLot ──uses──────> FeePolicy  «interface»  ◄── HourlyFee / FlatFee / PeakHourFee   (Strategy)
ParkingLot ──creates───> Ticket (id, spotId, vehicleType, entryTime)
Vehicle (plate, VehicleType: BIKE < CAR < TRUCK)
ParkingLot.park(vehicleType, time) -> ticket id | -1        ParkingLot.unpark(ticket, time) -> fee
\`\`\`
Nouns in the requirements become classes (**Vehicle, Spot, Ticket, ParkingLot**); the part that **varies** (pricing, allocation) becomes an interface. The ticket, not the plate, is the key for exit: it is unique and always available.` },
    { id: "decisions", kind: "concept", title: "3. Key design decisions", bodyMd: `- **Sizes as an ordered enum** (BIKE < CAR < TRUCK): a vehicle fits a spot if \`spot.size >= vehicle.size\`.
- **Allocation: best fit** (the smallest free spot that fits) keeps large spots free for large vehicles. A scan is O(S); keeping an ordered set of free spots per size gives O(log S).
- **Pricing as a Strategy:** \`ParkingLot\` depends on the \`FeePolicy\` interface, so adding weekend or peak pricing is a new class (Open/Closed), not an \`if/else\` ladder on vehicle type inside the lot.
- **Time is passed in** (or a Clock is injected) so fees are deterministic and testable.
- **Concurrency:** \`park\` is a **check-then-act** (find a free spot, then mark it taken). Two gates can both find spot 5 free and both take it. Make the pair atomic: a lock around allocation (coarse), per-floor locks, or an atomic compare-and-set on the spot's state. \`unpark\` must be atomic too.
- **Single responsibility:** the lot allocates and issues tickets, the policy prices, the ticket records facts.` },
    { id: 'code-cpp', kind: 'code', title: "4. C++ skeleton", bodyMd: "A runnable skeleton: three spots (bike, car, truck), best-fit allocation, hourly fee strategy and a ticket per vehicle. Time is passed in as an hour number so the output is deterministic.", code: [cpp(`
#include <iostream>
#include <map>
#include <vector>
using namespace std;

enum class VType { Bike = 0, Car = 1, Truck = 2 };

struct Spot { int id; VType size; bool taken; };
struct Ticket { int id; int spotId; VType type; int inHour; };

class FeePolicy {                                   // Strategy: pricing can change without touching the lot
public:
    virtual ~FeePolicy() {}
    virtual int fee(VType t, int hours) const = 0;
};
class HourlyFee : public FeePolicy {
public:
    int fee(VType t, int hours) const override {
        static const int rate[] = {10, 20, 40};
        return rate[(int)t] * (hours < 1 ? 1 : hours);   // minimum one hour
    }
};

class ParkingLot {
    vector<Spot> spots;
    map<int, Ticket> active;                        // ticket id -> ticket
    const FeePolicy& policy;
    int nextTicket = 1;
public:
    ParkingLot(vector<Spot> s, const FeePolicy& p) : spots(s), policy(p) {}
    // Best fit: the smallest free spot that can hold the vehicle (a bike may use a bigger spot).
    int park(VType v, int hour) {
        Spot* best = nullptr;
        for (auto& s : spots)
            if (!s.taken && (int)s.size >= (int)v && (!best || (int)s.size < (int)best->size)) best = &s;
        if (!best) return -1;                       // no suitable spot: lot is full for this type
        best->taken = true;
        int id = nextTicket++;
        active[id] = Ticket{id, best->id, v, hour};
        return id;
    }
    int spotOf(int ticket) const { return active.at(ticket).spotId; }
    int unpark(int ticket, int hour) {
        Ticket t = active.at(ticket);
        for (auto& s : spots) if (s.id == t.spotId) s.taken = false;
        active.erase(ticket);
        return policy.fee(t.type, hour - t.inHour);
    }
};

int main() {
    HourlyFee fees;
    ParkingLot lot({{1, VType::Bike, false}, {2, VType::Car, false}, {3, VType::Truck, false}}, fees);
    int bike = lot.park(VType::Bike, 9);
    int car = lot.park(VType::Car, 9);
    int truck = lot.park(VType::Truck, 10);
    cout << "bike -> spot " << lot.spotOf(bike) << "\\n";
    cout << "car -> spot " << lot.spotOf(car) << "\\n";
    cout << "truck -> spot " << lot.spotOf(truck) << "\\n";
    cout << "second car -> " << (lot.park(VType::Car, 11) < 0 ? "full" : "parked") << "\\n";
    cout << "car fee = " << lot.unpark(car, 12) << "\\n";
    int again = lot.park(VType::Car, 12);
    cout << "second car -> spot " << lot.spotOf(again) << "\\n";
}`, "C++", "bike -> spot 1\ncar -> spot 2\ntruck -> spot 3\nsecond car -> full\ncar fee = 60\nsecond car -> spot 2")] },
    { id: 'code-java', kind: 'code', title: "5. Java skeleton", bodyMd: "The same design in Java: `synchronized` makes park and unpark atomic, and `FeePolicy` is an interface.", code: [java(`
import java.util.*;

public class Main {
    enum VType { BIKE, CAR, TRUCK }

    static class Spot {
        final int id; final VType size; boolean taken;
        Spot(int id, VType size) { this.id = id; this.size = size; }
    }
    static class Ticket {
        final int id, spotId, inHour; final VType type;
        Ticket(int id, int spotId, VType type, int inHour) { this.id = id; this.spotId = spotId; this.type = type; this.inHour = inHour; }
    }

    interface FeePolicy { int fee(VType type, int hours); }          // Strategy: pricing is replaceable
    static class HourlyFee implements FeePolicy {
        private static final int[] RATE = {10, 20, 40};
        public int fee(VType type, int hours) { return RATE[type.ordinal()] * Math.max(1, hours); }   // minimum one hour
    }

    static class ParkingLot {
        private final List<Spot> spots;
        private final Map<Integer, Ticket> active = new HashMap<>();
        private final FeePolicy policy;
        private int nextTicket = 1;
        ParkingLot(List<Spot> spots, FeePolicy policy) { this.spots = spots; this.policy = policy; }

        // Best fit: the smallest free spot that can hold the vehicle (a bike may use a bigger spot).
        synchronized int park(VType v, int hour) {
            Spot best = null;
            for (Spot s : spots)
                if (!s.taken && s.size.ordinal() >= v.ordinal() && (best == null || s.size.ordinal() < best.size.ordinal())) best = s;
            if (best == null) return -1;                              // lot full for this vehicle type
            best.taken = true;
            int id = nextTicket++;
            active.put(id, new Ticket(id, best.id, v, hour));
            return id;
        }
        int spotOf(int ticket) { return active.get(ticket).spotId; }
        synchronized int unpark(int ticket, int hour) {
            Ticket t = active.remove(ticket);
            for (Spot s : spots) if (s.id == t.spotId) s.taken = false;
            return policy.fee(t.type, hour - t.inHour);
        }
    }

    public static void main(String[] args) {
        ParkingLot lot = new ParkingLot(List.of(new Spot(1, VType.BIKE), new Spot(2, VType.CAR), new Spot(3, VType.TRUCK)), new HourlyFee());
        int bike = lot.park(VType.BIKE, 9);
        int car = lot.park(VType.CAR, 9);
        int truck = lot.park(VType.TRUCK, 10);
        System.out.println("bike -> spot " + lot.spotOf(bike));
        System.out.println("car -> spot " + lot.spotOf(car));
        System.out.println("truck -> spot " + lot.spotOf(truck));
        System.out.println("second car -> " + (lot.park(VType.CAR, 11) < 0 ? "full" : "parked"));
        System.out.println("car fee = " + lot.unpark(car, 12));
        int again = lot.park(VType.CAR, 12);
        System.out.println("second car -> spot " + lot.spotOf(again));
    }
}`, "Java", "bike -> spot 1\ncar -> spot 2\ntruck -> spot 3\nsecond car -> full\ncar fee = 60\nsecond car -> spot 2")] },
    { id: "extensions", kind: "concept", title: "6. Extensions and expectations", bodyMd: `- **Multiple floors:** a \`Floor\` holds spots; the lot searches floors by a policy (nearest to the entrance).
- **EV or handicap spots:** new spot attribute plus a vehicle requirement; allocation filters on it.
- **Display board:** an **Observer** subscribed to spot changes.
- **Reservations, lost tickets, monthly passes:** new policies and entities, not changes to the core flow.
- **Scale/distribution:** persist tickets in a database with a unique constraint on the spot's active ticket.

**New-grad vs senior:** a new grad should deliver clear classes, a working allocation/fee flow and name the pattern used for pricing. Seniors discuss the race and locking strategy, data-structure choice for allocation, persistence and failure handling (crash between allocation and ticket issue).` },
    { id: "mistakes", kind: "mistakes", title: "Common mistakes", bodyMd: `1. One giant \`ParkingLot\` class with \`if (type == CAR)\` pricing logic.
2. Using the plate number as the only identity (duplicates, unreadable plates).
3. No answer for two gates allocating the same spot.
4. Calling the real clock inside the fee code, making tests flaky.
5. Modelling spots as plain integers and losing the size rule.
6. Over-engineering (payment, sensors, microservices) before the core flow works.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: "Design a parking lot (walk me through your classes).", answerMd: "Entities are Vehicle (type), Spot (size, taken), Ticket (spot, type, entry time) and ParkingLot, which allocates a best-fit spot, issues a ticket and computes the fee on exit through a FeePolicy strategy. Park and unpark are made atomic for concurrent gates. Extensions such as floors or EV spots add attributes or policies rather than rewriting the lot." },
    { id: 'iq2', q: "How do you make fee calculation extensible?", answerMd: "Define a FeePolicy interface (fee(vehicleType, duration)) and inject an implementation into the lot. Hourly, flat, weekend or peak-hour pricing become separate classes; the lot never branches on pricing rules (Strategy pattern, Open/Closed principle)." },
    { id: 'iq3', q: "Two cars arrive at two gates at the same time. What can go wrong and how do you prevent it?", answerMd: "Both threads may find the same spot free and both mark it taken (a check-then-act race), so two vehicles get the same spot. Prevent it by making find-and-mark atomic with a lock (or per-floor lock), or by atomically compare-and-setting the spot state and retrying with another spot." },
    { id: 'iq4', q: "How would you speed up allocation for a lot with 100,000 spots?", answerMd: "Avoid scanning all spots: keep a sorted set (or min-heap) of free spot ids per size, so best-fit allocation and release are O(log n); partition by floor so threads contend on different structures." },
  ],
  revision: { notesMd: "- Entities: Vehicle, Spot (size), Ticket, ParkingLot; FeePolicy as a Strategy.\n- Spot sizes ordered: a vehicle fits when spot.size >= vehicle.size; allocate best fit.\n- park() is check-then-act: lock or CAS; unpark() atomic too.\n- Ticket (not plate) identifies a stay; inject time/clock for tests.\n- Extensions: floors, EV spots, display (Observer), reservations.", flashcards: [
    { id: 'f1', front: "Which pattern makes parking fees replaceable?", backMd: "Strategy (a FeePolicy interface)." },
    { id: 'f2', front: "What is best-fit allocation here?", backMd: "The smallest free spot that can hold the vehicle." },
    { id: 'f3', front: "Why does park() need a lock?", backMd: "Finding and marking a free spot is check-then-act; two gates could take the same spot." },
    { id: 'f4', front: "Why a Ticket instead of the plate number?", backMd: "Tickets are unique and always available; plates can be unreadable or duplicated." },
    { id: 'f5', front: "Faster allocation for huge lots?", backMd: "Ordered set or heap of free spots per size: O(log n)." },
  ] },
  resources: [{ title: 'Refactoring Guru: Strategy pattern', url: 'https://refactoring.guru/design-patterns/strategy', kind: 'article' }, { title: 'Awesome LLD: parking lot design discussion', url: 'https://github.com/ashishps1/awesome-low-level-design', kind: 'article' }, { title: 'Refactoring Guru: Observer pattern', url: 'https://refactoring.guru/design-patterns/observer', kind: 'article' }],
});

const parkingLotMcqs: MCQ[] = [
  mcq({ ...q(PARKINGLOT), id: "sd.lpa.q1", type: "concept", difficulty: "easy", stem: "Which design pattern lets the lot change its pricing rules (hourly, flat, peak) without modifying the lot class?", options: ["Strategy", ["Singleton", "It guarantees one instance; it does not make behaviour replaceable."], ["Factory Method", "It creates objects; it does not encapsulate interchangeable algorithms."], ["Decorator", "It wraps objects to add behaviour, not to swap an algorithm."]], answer: 0, explanation: "A FeePolicy interface with interchangeable implementations is the Strategy pattern." }),
  mcq({ ...q(PARKINGLOT), id: "sd.lpa.q2", type: "concept", difficulty: "medium", stem: "Two entry gates call `park()` at the same time and both vehicles are assigned spot 5. What is the underlying defect?", options: ["A check-then-act race: the free-spot check and the mark-as-taken step are not atomic", ["The fee policy is wrong", "Unrelated to allocation."], ["The ticket class is immutable", "Immutability is not the cause."], ["The lot has too many spots", "The number of spots is irrelevant."]], answer: 0, explanation: "Make find-and-mark atomic (lock or compare-and-set), then retry on conflict." }),
  mcq({ ...q(PARKINGLOT), id: "sd.lpa.q3", type: "concept", difficulty: "medium", stem: "Why is best-fit spot allocation (smallest free spot that fits) usually preferred?", options: ["It keeps large spots available for large vehicles", ["It always finds the nearest spot to the exit", "Best fit is about size, not distance."], ["It removes the need for tickets", "Unrelated."], ["It makes fees cheaper", "Unrelated."]], answer: 0, explanation: "Putting a bike in a truck spot when a bike spot exists can later block a truck." }),
  mcq({ ...q(PARKINGLOT), id: "sd.lpa.q4", type: "concept", difficulty: "medium", stem: "What should identify a stay when a vehicle leaves?", options: ["A unique ticket id issued at entry", ["The vehicle plate only", "May be unreadable, reused or mis-scanned."], ["The driver's name", "Not available or unique."], ["The spot number only", "The same spot is reused by many vehicles over time."]], answer: 0, explanation: "The ticket records the spot, vehicle type and entry time, and is unique." }),
  mcq({ ...q(PARKINGLOT), id: "sd.lpa.q5", type: "complexity", difficulty: "hard", stem: "A lot has 100,000 spots. How can free-spot lookup per vehicle type be made O(log n) instead of scanning all spots?", options: ["Keep an ordered set (or heap) of free spots for each size class", ["Sort all spots on every request", "That costs O(n log n) per request."], ["Scan only odd-numbered spots", "Not a general approach."], ["Use recursion", "Does not change the lookup cost."]], answer: 0, explanation: "Allocation takes the smallest element at or above the vehicle size; release inserts it back." }),
  mcq({ ...q(PARKINGLOT), id: "sd.lpa.q6", type: "concept", difficulty: "easy", stem: "Why pass the time (or inject a Clock) into park and unpark instead of reading the system clock inside them?", options: ["Fee calculations become deterministic and unit-testable", ["System clocks are not available in C++ or Java", "They are available."], ["It makes the code shorter", "Not the reason."], ["It avoids the need for tickets", "Unrelated."]], answer: 0, explanation: "Tests can then assert exact fees for chosen durations." }),
];

// ---------------------------------------------------------------------------------------
const LIBRARY = "sd.lld-library";
const library = sdTopic({
  id: LIBRARY, title: "LLD Practice: Library Management", level: 'core', estMinutes: 50, prerequisites: ["sd.requirements"], related: ["sd.lld-parking-lot", "cpp.solid-patterns", "java.solid-patterns"],
  summary: "Book vs copy, members, loans, limits, fines and reservations.",
  objectives: ["Separate the title (Book) from the physical item (Copy) and model Loans explicitly.", "Implement checkout and return with member limits, due dates and fines.", "Design reservations with a FIFO waitlist and notifications (Observer).", "Explain how to keep checkout correct under concurrency and in a database."],
  sections: [
    { id: "requirements", kind: "concept", title: "1. Requirements and scope", bodyMd: `**Functional:** members **search** the catalogue (title, author, ISBN); **check out** an available copy of a book; **return** it; there is a **limit** on concurrent loans (for example 3) and a **loan period** (14 days); late returns incur a **fine** per day; members can **reserve** a title that has no free copy and are notified when one returns.
**Non-functional:** no two members can borrow the same copy; correct limit enforcement under concurrency; policies (limit, days, fine) are configurable.
**Out of scope:** payments, e-books, inter-library loans, staff administration UI.

**Ask:** can a member renew? Are some books reference-only? Is the fine capped? Do reservations expire?` },
    { id: "entities", kind: "concept", title: "2. Core entities and class diagram", bodyMd: `\`\`\`
Library ──has many──> Book (isbn, title, author)           ← the title; searchable
Book   ──has many──> Copy (id, isbn, status: AVAILABLE | ON_LOAN | LOST)   ← the physical item
Member (id, name) ──has many──> Loan (copyId, memberId, outDay, dueDay, returnedDay?)
Library ──uses──> LoanPolicy (maxLoans, days)   FinePolicy (perDay)         (Strategies)
Book ──has──> Reservation queue (FIFO of memberIds) ──notifies──> Notifier  (Observer)
\`\`\`
The most common modelling mistake is putting "available" on \`Book\`: a library owns several **copies** of one title, so availability, location and condition belong to **Copy**.` },
    { id: "decisions", kind: "concept", title: "3. Key design decisions", bodyMd: `- **Book vs Copy:** search by title returns Books; checkout picks a free Copy of that Book.
- **Loan as an entity** (not a boolean on the copy): it stores due date and return date, giving history, overdue queries and fines.
- **Policies as objects:** \`LoanPolicy\` (limit, period) and \`FinePolicy\` (amount per late day) are injected; different member tiers (student/staff) use different policies.
- **Fine:** \`max(0, returnDay - dueDay) × finePerDay\`. Example: due day 14, returned day 19 → 5 days late × 2 = **10**.
- **Reservations:** a FIFO queue per Book; on return, the first reserver is notified and the copy is held for them for a limited time (Observer pattern for notifications).
- **Lookup structures:** \`isbn → Book\` map for O(1) access; inverted index for title/author search.
- **Concurrency/consistency:** "take a free copy" is check-then-act. In memory use a lock per book; in a database use a transaction with \`SELECT ... FOR UPDATE\` or a unique partial index such as *one active loan per copy* so a second concurrent checkout fails cleanly. Check the member's loan limit inside the same transaction.` },
    { id: 'code-cpp', kind: 'code', title: "4. C++ skeleton", bodyMd: "Copies of a title, a per-member loan limit, a 14-day due date and a 2-per-day fine. Days are plain integers so the output is deterministic.", code: [cpp(`
#include <iostream>
#include <map>
#include <string>
#include <vector>
using namespace std;

const int LIMIT = 3, LOAN_DAYS = 14, FINE_PER_DAY = 2;

struct Copy { int id; string isbn; bool out; };       // a physical copy; many copies share one title (isbn)

class Library {
    vector<Copy> copies;
    map<int, vector<int> > byMember;                  // member id -> copy ids on loan
    map<int, int> dueDay;                             // copy id -> due day
public:
    void addCopy(int id, const string& isbn) { copies.push_back(Copy{id, isbn, false}); }

    string checkout(int member, const string& isbn, int day) {
        vector<int>& mine = byMember[member];
        if ((int)mine.size() >= LIMIT) return "limit reached";
        for (auto& c : copies) {
            if (c.isbn == isbn && !c.out) {
                c.out = true;
                mine.push_back(c.id);
                dueDay[c.id] = day + LOAN_DAYS;
                return "ok, copy " + to_string(c.id) + " due day " + to_string(day + LOAN_DAYS);
            }
        }
        return "no copy available";
    }

    int giveBack(int member, int copyId, int day) {   // returns the fine owed
        vector<int>& mine = byMember[member];
        for (size_t i = 0; i < mine.size(); ++i) {
            if (mine[i] != copyId) continue;
            mine.erase(mine.begin() + i);
            for (auto& c : copies) if (c.id == copyId) c.out = false;
            int late = day - dueDay[copyId];
            return late > 0 ? late * FINE_PER_DAY : 0;
        }
        return -1;                                    // that member does not hold this copy
    }
};

int main() {
    Library lib;
    lib.addCopy(1, "A"); lib.addCopy(2, "A"); lib.addCopy(3, "B"); lib.addCopy(4, "C"); lib.addCopy(5, "D");
    cout << "m7 A: " << lib.checkout(7, "A", 0) << "\\n";
    cout << "m8 A: " << lib.checkout(8, "A", 1) << "\\n";
    cout << "m9 A: " << lib.checkout(9, "A", 2) << "\\n";
    cout << "m7 B: " << lib.checkout(7, "B", 0) << "\\n";
    cout << "m7 C: " << lib.checkout(7, "C", 0) << "\\n";
    cout << "m7 D: " << lib.checkout(7, "D", 0) << "\\n";
    cout << "fine m7 copy 1 on day 19 = " << lib.giveBack(7, 1, 19) << "\\n";
    cout << "fine m8 copy 2 on day 10 = " << lib.giveBack(8, 2, 10) << "\\n";
    cout << "m9 A: " << lib.checkout(9, "A", 20) << "\\n";
}`, "C++", "m7 A: ok, copy 1 due day 14\nm8 A: ok, copy 2 due day 15\nm9 A: no copy available\nm7 B: ok, copy 3 due day 14\nm7 C: ok, copy 4 due day 14\nm7 D: limit reached\nfine m7 copy 1 on day 19 = 10\nfine m8 copy 2 on day 10 = 0\nm9 A: ok, copy 1 due day 34")] },
    { id: 'code-java', kind: 'code', title: "5. Java skeleton", bodyMd: "The same logic in Java with `Map`/`List`; `giveBack` returns -1 if the member does not hold that copy.", code: [java(`
import java.util.*;

public class Main {
    static final int LIMIT = 3, LOAN_DAYS = 14, FINE_PER_DAY = 2;

    static class Copy {                                  // a physical copy; many copies share one title (isbn)
        final int id; final String isbn; boolean out;
        Copy(int id, String isbn) { this.id = id; this.isbn = isbn; }
    }

    static class Library {
        private final List<Copy> copies = new ArrayList<>();
        private final Map<Integer, List<Integer>> byMember = new HashMap<>();   // member -> copy ids on loan
        private final Map<Integer, Integer> dueDay = new HashMap<>();           // copy id -> due day

        void addCopy(int id, String isbn) { copies.add(new Copy(id, isbn)); }

        String checkout(int member, String isbn, int day) {
            List<Integer> mine = byMember.computeIfAbsent(member, k -> new ArrayList<>());
            if (mine.size() >= LIMIT) return "limit reached";
            for (Copy c : copies) {
                if (c.isbn.equals(isbn) && !c.out) {
                    c.out = true;
                    mine.add(c.id);
                    dueDay.put(c.id, day + LOAN_DAYS);
                    return "ok, copy " + c.id + " due day " + (day + LOAN_DAYS);
                }
            }
            return "no copy available";
        }

        int giveBack(int member, int copyId, int day) {  // returns the fine owed
            List<Integer> mine = byMember.getOrDefault(member, new ArrayList<>());
            if (!mine.remove(Integer.valueOf(copyId))) return -1;     // that member does not hold this copy
            for (Copy c : copies) if (c.id == copyId) c.out = false;
            int late = day - dueDay.get(copyId);
            return late > 0 ? late * FINE_PER_DAY : 0;
        }
    }

    public static void main(String[] args) {
        Library lib = new Library();
        lib.addCopy(1, "A"); lib.addCopy(2, "A"); lib.addCopy(3, "B"); lib.addCopy(4, "C"); lib.addCopy(5, "D");
        System.out.println("m7 A: " + lib.checkout(7, "A", 0));
        System.out.println("m8 A: " + lib.checkout(8, "A", 1));
        System.out.println("m9 A: " + lib.checkout(9, "A", 2));
        System.out.println("m7 B: " + lib.checkout(7, "B", 0));
        System.out.println("m7 C: " + lib.checkout(7, "C", 0));
        System.out.println("m7 D: " + lib.checkout(7, "D", 0));
        System.out.println("fine m7 copy 1 on day 19 = " + lib.giveBack(7, 1, 19));
        System.out.println("fine m8 copy 2 on day 10 = " + lib.giveBack(8, 2, 10));
        System.out.println("m9 A: " + lib.checkout(9, "A", 20));
    }
}`, "Java", "m7 A: ok, copy 1 due day 14\nm8 A: ok, copy 2 due day 15\nm9 A: no copy available\nm7 B: ok, copy 3 due day 14\nm7 C: ok, copy 4 due day 14\nm7 D: limit reached\nfine m7 copy 1 on day 19 = 10\nfine m8 copy 2 on day 10 = 0\nm9 A: ok, copy 1 due day 34")] },
    { id: "extensions", kind: "concept", title: "6. Extensions and expectations", bodyMd: `- **Renewals** (limited count, blocked if reserved), **fine caps**, **lost/damaged copies**, **membership tiers** (different policies).
- **Search:** inverted index, then a search service if the catalogue is large.
- **Notifications:** the Observer interface (\`onCopyAvailable(member, book)\`) with email/SMS implementations.
- **Persistence:** tables \`books\`, \`copies\`, \`members\`, \`loans\`, \`reservations\`; partial unique index on active loans.

**New-grad vs senior:** a new grad should separate Book/Copy, model Loan and policies, and explain the double-borrow problem. Seniors discuss transactional guarantees, reservation expiry jobs, indexing and scale.` },
    { id: "mistakes", kind: "mistakes", title: "Common mistakes", bodyMd: `1. A single \`Book\` class with an \`available\` flag (no notion of several copies).
2. Storing the loan only as \`borrowedBy\` on the copy: no history, due date or fines.
3. Hard-coding limit, loan days and fine in the checkout method.
4. Calling \`System.currentTimeMillis()\` inside business logic.
5. Not enforcing limits and copy availability atomically.
6. Reservations with no ordering, expiry or notification.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: "Design a library management system.", answerMd: "Book (title level) has many Copy objects (physical items). Members borrow Copies through Loan records that hold due and return dates. LoanPolicy and FinePolicy define limits and fines. A reservation queue per Book notifies members through an Observer when a copy returns. Checkout is made atomic so a copy cannot be lent twice." },
    { id: 'iq2', q: "Why separate Book and Copy?", answerMd: "A library owns several physical copies of the same title. Title data (author, ISBN) is shared, while status, condition and loan state are per copy. Putting availability on Book cannot represent \"2 of 3 copies are out\"." },
    { id: 'iq3', q: "How do you stop two members borrowing the last copy?", answerMd: "Make selecting and marking the copy atomic: a lock per book in memory, or a database transaction using row locks or a unique constraint on active loans per copy so the second attempt fails and returns \"no copy available\"." },
    { id: 'iq4', q: "How would reservations work?", answerMd: "Keep a FIFO queue of member ids per Book. When a copy is returned, notify the first member (Observer), hold the copy for a limited time, and move on to the next member if they do not collect it." },
  ],
  revision: { notesMd: "- Book (title) vs Copy (physical); Member; Loan (due/return dates); policies: LoanPolicy, FinePolicy.\n- Fine = max(0, returnDay - dueDay) × perDay (due 14, return 19 → 10).\n- Reservation = FIFO queue per Book + Observer notification.\n- Atomic checkout: lock or DB transaction/unique active-loan constraint; enforce limit in the same step.\n- Inject clock/days for tests.", flashcards: [
    { id: 'f1', front: "Where does \"available\" belong?", backMd: "On Copy, not Book." },
    { id: 'f2', front: "Fine for 5 days late at 2 per day?", backMd: "10." },
    { id: 'f3', front: "Which pattern notifies a reserver?", backMd: "Observer." },
    { id: 'f4', front: "DB guard against double lending?", backMd: "A unique (partial) constraint on one active loan per copy, plus transactions." },
    { id: 'f5', front: "Why a Loan entity?", backMd: "It records due and return dates, giving history, overdue queries and fines." },
  ] },
  resources: [{ title: 'Refactoring Guru: Observer pattern', url: 'https://refactoring.guru/design-patterns/observer', kind: 'article' }, { title: 'Refactoring Guru: Strategy pattern', url: 'https://refactoring.guru/design-patterns/strategy', kind: 'article' }],
});

const libraryMcqs: MCQ[] = [
  mcq({ ...q(LIBRARY), id: "sd.lli.q1", type: "concept", difficulty: "easy", stem: "A library owns three physical copies of the same title. Where should the \"currently on loan\" state live?", options: ["On the Copy", ["On the Book", "A single flag cannot represent that two of three copies are out."], ["On the Member only", "The copy still needs its own status."], ["In the ISBN", "An ISBN identifies the title, not a physical item."]], answer: 0, explanation: "Book is the title; Copy is the item that is lent." }),
  mcq({ ...q(LIBRARY), id: "sd.lli.q2", type: "complexity", difficulty: "easy", stem: "A book is due on day 14, returned on day 19, and the fine is 2 per late day. What is the fine?", options: ["10", ["5", "That is the number of late days, not the fine."], ["38", "That multiplies the return day by 2."], ["0", "The return was late."]], answer: 0, explanation: "The book is 19 − 14 = 5 days late, so the fine is 5 × 2 = 10." }),
  mcq({ ...q(LIBRARY), id: "sd.lli.q3", type: "concept", difficulty: "medium", stem: "Two members request the last available copy at the same moment. Which mechanism guarantees only one succeeds in a database-backed design?", options: ["A transaction with a row lock or a unique constraint on one active loan per copy", ["Checking availability in the UI first", "The check is not atomic."], ["Retrying every second", "Does not prevent the race."], ["Adding an index on title", "Does not enforce exclusivity."]], answer: 0, explanation: "The database must enforce the invariant, since the application check-then-act can race." }),
  mcq({ ...q(LIBRARY), id: "sd.lli.q4", type: "concept", difficulty: "medium", stem: "Which pattern best fits notifying a member when a reserved book is returned (email now, SMS later)?", options: ["Observer", ["Singleton", "Concerned with a single instance."], ["Builder", "Concerned with constructing objects."], ["Prototype", "Concerned with cloning objects."]], answer: 0, explanation: "Observers subscribe to the \"copy available\" event; new channels are new observers." }),
  mcq({ ...q(LIBRARY), id: "sd.lli.q5", type: "concept", difficulty: "medium", stem: "Why model a Loan as its own entity instead of a `borrowedBy` field on Copy?", options: ["It records due and return dates and keeps history for fines and overdue queries", ["It saves memory", "Not the reason."], ["It avoids needing members", "Members are still required."], ["It makes search faster", "Unrelated."]], answer: 0, explanation: "A field only shows the current borrower; a Loan captures the whole transaction." }),
  mcq({ ...q(LIBRARY), id: "sd.lli.q6", type: "concept", difficulty: "easy", stem: "Where should the loan limit (3) and loan period (14 days) be defined?", options: ["In configurable policy objects, so different membership tiers can differ", ["As literals inside the checkout method", "Changes would require editing core logic."], ["In the Book class", "They are rules about members and loans."], ["In the UI only", "The rule must be enforced on the server side."]], answer: 0, explanation: "Policies injected into the library keep rules configurable." }),
];

// ---------------------------------------------------------------------------------------
const VENDINGMACHINE = "sd.lld-vending-machine";
const vendingMachine = sdTopic({
  id: VENDINGMACHINE, title: "LLD Practice: Vending Machine (State Pattern)", level: 'core', estMinutes: 50, prerequisites: ["sd.requirements"], related: ["sd.lld-parking-lot", "cpp.solid-patterns", "java.solid-patterns"],
  summary: "The State pattern, inventory, change-making and error handling.",
  objectives: ["Model the machine as a state machine and implement it with the State pattern instead of nested conditionals.", "Define states, events, transitions and the invariants each state protects.", "Compute change, and explain when the greedy coin algorithm is correct and when it fails.", "Handle failures (sold out, jam, insufficient money) and extend with new states."],
  sections: [
    { id: "requirements", kind: "concept", title: "1. Requirements and scope", bodyMd: `**Functional:** a user **inserts money**, **selects** a product code, the machine **dispenses** the product and returns **change**, or reports "need N more" / "sold out"; the user may **cancel** and get a **refund**; an operator can **restock** products.
**Non-functional:** a transaction is **atomic** (never take money without dispensing or refunding); behaviour is easy to extend with new states; one user at a time.
**Out of scope:** card payments, network telemetry, temperature control.

**Ask:** which coins/notes are accepted? Is change always available? What if the machine cannot make change? Can several items be bought in one transaction?` },
    { id: "entities", kind: "concept", title: "2. States, events and class diagram", bodyMd: `\`\`\`
Machine (context): inventory, credit, current State
State «interface»: insert(amount), select(code), refund()
   ├─ IdleState      -- no credit
   ├─ HasMoneyState  -- credit > 0, waiting for a selection
   └─ (DispensingState, OutOfServiceState as extensions)

Idle ──insert──> HasMoney ──select ok──> Idle
HasMoney ──insert──> HasMoney     HasMoney ──refund──> Idle     HasMoney ──select (short/sold out)──> HasMoney
\`\`\`
| State | insert | select | refund |
|---|---|---|---|
| Idle | credit = amount → HasMoney | "insert money first" | "nothing to refund" |
| HasMoney | add to credit | dispense if stocked and credit ≥ price, else a message | return credit → Idle |

The key insight: the **same event does different things in different states**. A single class with \`if (state == IDLE) ... else if (state == HAS_MONEY) ...\` in every method grows unmanageable; the **State pattern** moves each state's behaviour into its own class and lets the context delegate.` },
    { id: "decisions", kind: "concept", title: "3. Key design decisions", bodyMd: `- **State pattern vs enum + switch:** states as classes keep each rule in one place and make a new state (OutOfService, Maintenance) a new class (Open/Closed). An enum and \`switch\` is fine for 2–3 trivial states, but the logic scatters as states grow. A **transition table** is a third option.
- **Who changes the state?** Either the context (central) or the states (each knows its successor, as in the skeleton). Pick one and keep transitions visible.
- **Inventory** is a map \`code → (price, count)\`; it is not a state, it is data the states consult.
- **Change-making:** pay out with the **fewest coins**. For canonical coin sets such as {25, 10, 5, 1}, **greedy** (largest coin first) is optimal: 35 → 25 + 10 = 2 coins. For arbitrary sets it can fail: with coins {1, 3, 4} and change 6, greedy gives 4 + 1 + 1 = 3 coins while the optimum is 3 + 3 = **2**. The general solution is dynamic programming (the classic coin-change problem). Also handle "cannot make exact change": refuse the sale up front or accept exact money only.
- **Atomicity and failure:** decrement stock and clear credit only after the dispense succeeds. If the motor jams, **refund** and move to OutOfService.
- **Thread-safety:** one user at a time; serialise events with a lock (or a single event queue) if buttons and coin sensors are separate threads.` },
    { id: 'code-cpp', kind: 'code', title: "4. C++ skeleton", bodyMd: "Two states with delegation. The machine has product A (price 25, one unit) and B (price 40). The output walks through every branch: idle select, short credit, successful purchase with change, sold out, refund.", code: [cpp(`
#include <iostream>
#include <map>
#include <string>
using namespace std;

struct Machine;
struct State {                                            // State pattern: behaviour depends on the current state
    virtual ~State() {}
    virtual string insert(Machine&, int amount) = 0;
    virtual string select(Machine&, char code) = 0;
    virtual string refund(Machine&) = 0;
};
struct IdleState : State {
    string insert(Machine&, int) override;
    string select(Machine&, char) override;
    string refund(Machine&) override;
};
struct HasMoneyState : State {
    string insert(Machine&, int) override;
    string select(Machine&, char) override;
    string refund(Machine&) override;
};

struct Machine {
    map<char, pair<int, int> > stock;                     // code -> (price, count)
    int credit = 0;
    IdleState idle;
    HasMoneyState hasMoney;
    State* state = &idle;
    string insert(int a) { return state->insert(*this, a); }
    string select(char c) { return state->select(*this, c); }
    string refund() { return state->refund(*this); }
};

string IdleState::insert(Machine& m, int a) { m.credit = a; m.state = &m.hasMoney; return "credit " + to_string(a); }
string IdleState::select(Machine&, char) { return "insert money first"; }
string IdleState::refund(Machine&) { return "nothing to refund"; }

string HasMoneyState::insert(Machine& m, int a) { m.credit += a; return "credit " + to_string(m.credit); }
string HasMoneyState::select(Machine& m, char code) {
    auto it = m.stock.find(code);
    if (it == m.stock.end() || it->second.second == 0) return "sold out";
    int price = it->second.first;
    if (m.credit < price) return "need " + to_string(price - m.credit) + " more";
    int change = m.credit - price;
    it->second.second--;
    m.credit = 0;
    m.state = &m.idle;                                    // transaction finished: back to Idle
    return "dispensed " + string(1, code) + ", change " + to_string(change);
}
string HasMoneyState::refund(Machine& m) { int c = m.credit; m.credit = 0; m.state = &m.idle; return "refunded " + to_string(c); }

int main() {
    Machine vm;
    vm.stock['A'] = make_pair(25, 1);
    vm.stock['B'] = make_pair(40, 5);
    cout << vm.select('A') << "\\n";
    cout << vm.insert(10) << "\\n";
    cout << vm.select('A') << "\\n";
    cout << vm.insert(20) << "\\n";
    cout << vm.select('A') << "\\n";
    cout << vm.insert(50) << "\\n";
    cout << vm.select('A') << "\\n";
    cout << vm.refund() << "\\n";
    cout << vm.refund() << "\\n";
}`, "C++", "insert money first\ncredit 10\nneed 15 more\ncredit 30\ndispensed A, change 5\ncredit 50\nsold out\nrefunded 50\nnothing to refund")] },
    { id: 'code-java', kind: 'code', title: "5. Java skeleton", bodyMd: "The same State pattern in Java; each state implements the `State` interface and changes `machine.state` itself.", code: [java(`
import java.util.*;

public class Main {
    interface State {                                        // State pattern: behaviour depends on the current state
        String insert(Machine m, int amount);
        String select(Machine m, char code);
        String refund(Machine m);
    }

    static class Idle implements State {
        public String insert(Machine m, int a) { m.credit = a; m.state = m.hasMoney; return "credit " + a; }
        public String select(Machine m, char c) { return "insert money first"; }
        public String refund(Machine m) { return "nothing to refund"; }
    }

    static class HasMoney implements State {
        public String insert(Machine m, int a) { m.credit += a; return "credit " + m.credit; }
        public String select(Machine m, char code) {
            int[] item = m.stock.get(code);                  // {price, count}
            if (item == null || item[1] == 0) return "sold out";
            if (m.credit < item[0]) return "need " + (item[0] - m.credit) + " more";
            int change = m.credit - item[0];
            item[1]--;
            m.credit = 0;
            m.state = m.idle;                                // transaction finished: back to Idle
            return "dispensed " + code + ", change " + change;
        }
        public String refund(Machine m) { int c = m.credit; m.credit = 0; m.state = m.idle; return "refunded " + c; }
    }

    static class Machine {
        final Map<Character, int[]> stock = new HashMap<>();
        int credit = 0;
        final State idle = new Idle(), hasMoney = new HasMoney();
        State state = idle;
        String insert(int a) { return state.insert(this, a); }
        String select(char c) { return state.select(this, c); }
        String refund() { return state.refund(this); }
    }

    public static void main(String[] args) {
        Machine vm = new Machine();
        vm.stock.put('A', new int[]{25, 1});
        vm.stock.put('B', new int[]{40, 5});
        System.out.println(vm.select('A'));
        System.out.println(vm.insert(10));
        System.out.println(vm.select('A'));
        System.out.println(vm.insert(20));
        System.out.println(vm.select('A'));
        System.out.println(vm.insert(50));
        System.out.println(vm.select('A'));
        System.out.println(vm.refund());
        System.out.println(vm.refund());
    }
}`, "Java", "insert money first\ncredit 10\nneed 15 more\ncredit 30\ndispensed A, change 5\ncredit 50\nsold out\nrefunded 50\nnothing to refund")] },
    { id: "extensions", kind: "concept", title: "6. Extensions and expectations", bodyMd: `- **DispensingState:** the machine ignores input while the motor runs (prevents double selection).
- **OutOfServiceState:** reached on jam or no change; only the operator can leave it.
- **Payment strategies:** coins, notes, card (Strategy) behind a \`PaymentMethod\` interface.
- **Cancel timeout** returning to Idle; **audit log** (Observer) for every transaction.

**New-grad vs senior:** a new grad should identify states and transitions, implement the State pattern and handle "sold out" and "need more money". Seniors cover change-making correctness, fault handling (jams, power loss mid-transaction), persistence of inventory and money, and remote operation.` },
    { id: "mistakes", kind: "mistakes", title: "Common mistakes", bodyMd: `1. One class with huge \`if/else\` or \`switch\` blocks on a state flag in every method.
2. Forgetting a transition (the machine gets stuck in HasMoney after dispensing).
3. Reducing stock before knowing that the dispense succeeded.
4. Assuming greedy change is always optimal (or always possible).
5. Letting the same select event be accepted twice (no Dispensing state or lock).
6. Modelling Inventory as a state.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: "Design a vending machine.", answerMd: "Model it as a state machine with the State pattern: the Machine context holds inventory and credit and delegates insert, select and refund to the current State (Idle, HasMoney, plus Dispensing/OutOfService). Each state defines what every event does and which state follows. Dispensing is atomic with stock and credit updates; change-making returns the fewest coins; failures lead to a refund." },
    { id: 'iq2', q: "Why use the State pattern here?", answerMd: "The same event (select) behaves differently depending on the state, and a flag with conditionals in each method becomes tangled as states grow. State classes localise each state's behaviour and make new states a new class without modifying existing ones." },
    { id: 'iq3', q: "Is greedy change-making always correct?", answerMd: "No. It is optimal for canonical coin systems like {25, 10, 5, 1}, but for {1, 3, 4} and amount 6 greedy uses 4+1+1 (3 coins) whereas 3+3 (2 coins) is optimal. For arbitrary coin sets use dynamic programming, and also check whether exact change can be made at all." },
    { id: 'iq4', q: "What if the motor jams after the user paid?", answerMd: "Do not decrement stock or clear the credit until dispensing is confirmed. On failure refund the credit, transition to OutOfService, log the fault and alert the operator." },
  ],
  revision: { notesMd: "- State pattern: Machine (context) delegates insert/select/refund to Idle / HasMoney (+ Dispensing, OutOfService).\n- Same event, different behaviour per state; transitions are explicit.\n- Inventory is data, not state. Update stock/credit only after a successful dispense; refund on failure.\n- Greedy change works for {25,10,5,1} (35 = 25+10) but fails for {1,3,4}, 6 (greedy 3 coins, optimal 2).\n- One user at a time; serialise events.", flashcards: [
    { id: 'f1', front: "Which pattern models the vending machine?", backMd: "State." },
    { id: 'f2', front: "What does select do in Idle?", backMd: "Rejects with \"insert money first\"." },
    { id: 'f3', front: "Greedy counter-example for coin change?", backMd: "Coins {1,3,4}, amount 6: greedy 3 coins, optimal 2 (3+3)." },
    { id: 'f4', front: "When do you decrement stock?", backMd: "Only after the dispense succeeds." },
    { id: 'f5', front: "Where do new behaviours like OutOfService go?", backMd: "In a new State class." },
  ] },
  resources: [{ title: 'Refactoring Guru: State pattern', url: 'https://refactoring.guru/design-patterns/state', kind: 'article' }, { title: 'LeetCode: Coin Change (the general change-making problem)', url: 'https://leetcode.com/problems/coin-change/', kind: 'practice' }],
});

const vendingMachineMcqs: MCQ[] = [
  mcq({ ...q(VENDINGMACHINE), id: "sd.lve.q1", type: "concept", difficulty: "easy", stem: "Which design pattern is the best fit for a machine whose response to the same button press depends on its current mode (idle, has money, out of service)?", options: ["State", ["Singleton", "Concerned with one instance."], ["Adapter", "Converts interfaces."], ["Facade", "Simplifies a subsystem interface."]], answer: 0, explanation: "State objects encapsulate mode-specific behaviour and transitions." }),
  mcq({ ...q(VENDINGMACHINE), id: "sd.lve.q2", type: "concept", difficulty: "easy", stem: "In the skeleton, what does `select('A')` return when no money has been inserted?", options: ["\"insert money first\" (the Idle state rejects it)", ["A dispensed product", "There is no credit."], ["An exception", "The state handles it gracefully."], ["A refund", "There is nothing to refund."]], answer: 0, explanation: "IdleState implements select as a message and stays in Idle." }),
  mcq({ ...q(VENDINGMACHINE), id: "sd.lve.q3", type: "complexity", difficulty: "medium", stem: "Coins available are {1, 3, 4} and the machine must return 6. How many coins does the optimal solution use, and what does the greedy algorithm give?", options: ["Optimal 2 coins (3+3); greedy 3 coins (4+1+1)", ["Both give 2 coins", "Greedy picks 4 first and needs two 1s."], ["Both give 3 coins", "The optimum is 3+3."], ["Optimal 1 coin", "No coin equals 6."]], answer: 0, explanation: "Greedy is not optimal for arbitrary coin systems; use dynamic programming." }),
  mcq({ ...q(VENDINGMACHINE), id: "sd.lve.q4", type: "concept", difficulty: "medium", stem: "The dispensing motor jams after the user paid. What is the correct handling?", options: ["Keep stock unchanged, refund the credit, move to an out-of-service state and alert the operator", ["Decrement stock and keep the money", "The customer gets nothing."], ["Ignore the failure", "Leaves the machine in an inconsistent state."], ["Retry forever without telling anyone", "May block the machine indefinitely."]], answer: 0, explanation: "Transactions must be atomic: stock and credit change only after success." }),
  mcq({ ...q(VENDINGMACHINE), id: "sd.lve.q5", type: "concept", difficulty: "medium", stem: "Why is Inventory (code → price and count) usually NOT modelled as a state?", options: ["It is data that states consult; states represent behaviour modes", ["Inventory never changes", "It changes with every sale and restock."], ["States cannot access data", "They can through the context."], ["Because C++ forbids it", "Language is irrelevant."]], answer: 0, explanation: "State = which behaviour applies now; inventory = what the machine holds." }),
  mcq({ ...q(VENDINGMACHINE), id: "sd.lve.q6", type: "concept", difficulty: "hard", stem: "You need to add an \"OutOfService\" mode. Which design change does the State pattern require?", options: ["Add one new State class and the transitions into it; existing states stay unchanged apart from where they transition", ["Rewrite every method with an extra if-branch", "That is what the pattern avoids."], ["Add a global variable", "Hides the state."], ["Create a subclass of Machine for each mode", "Machines do not change class at run time."]], answer: 0, explanation: "This is the Open/Closed benefit of the State pattern." }),
];

// ---------------------------------------------------------------------------------------
const ELEVATOR = "sd.lld-elevator";
const elevator = sdTopic({
  id: ELEVATOR, title: "LLD Practice: Elevator System", level: 'core', estMinutes: 55, prerequisites: ["sd.requirements"], related: ["os.io-management", "sd.lld-vending-machine", "cpp.solid-patterns"],
  summary: "Request handling, LOOK scheduling, state and multi-elevator dispatch.",
  objectives: ["Define the entities of an elevator system and separate hall calls from cabin requests.", "Implement a single-elevator controller with the LOOK (elevator) policy and compare it with FCFS and nearest-first.", "Describe multi-elevator dispatch with a cost function and the Strategy pattern.", "Model the elevator and its door as state machines and discuss concurrency."],
  sections: [
    { id: "requirements", kind: "concept", title: "1. Requirements and scope", bodyMd: `**Functional:** a building with N floors and one or more elevators; users press **hall buttons** (up/down on a floor) and **cabin buttons** (destination); elevators move, stop at requested floors in a sensible order, open and close doors; a display shows the floor and direction.
**Non-functional:** responsive (don't make people wait unnecessarily), fair (no request starves), safe (doors, overload), extensible scheduling.
**Out of scope:** emergency modes, VIP/express elevators, physical hardware drivers.

**Ask:** how many elevators and floors? Capacity/weight limit? Do we optimise wait time or energy? Are there express zones?` },
    { id: "entities", kind: "concept", title: "2. Core entities and class diagram", bodyMd: `\`\`\`
ElevatorSystem (controller) ──has many──> Elevator (id, floor, direction, state, stops)
ElevatorSystem ──uses──> DispatchStrategy «interface»  (NearestIdle / LeastCost / ZoneBased)
Elevator ──uses──> SchedulingPolicy «interface»  (FCFS / SSTF / LOOK)
Request: HallCall(floor, direction) | CabinRequest(elevatorId, floor)
Elevator states: IDLE, MOVING_UP, MOVING_DOWN, DOORS_OPEN, OUT_OF_SERVICE
\`\`\`
A **hall call** is assigned to *some* elevator by the dispatcher; a **cabin request** goes to a specific elevator. Once assigned, both become a floor in that elevator's stop set.` },
    { id: "decisions", kind: "concept", title: "3. Key design decisions", bodyMd: `- **Scheduling policy (one elevator):** this is the disk-scheduling problem in a building.
  - **FCFS:** serve in arrival order: simple, fair, but wasteful zig-zagging. Stops requested as 3, 1, 5 from floor 0 travel 3 + 2 + 4 = **9 floors**.
  - **SSTF/nearest-first:** closest next: less travel but can starve far floors.
  - **LOOK / SCAN ("elevator algorithm"):** keep going in the current direction serving every stop on the way, reverse when none remain ahead: from 0 serve 1, 3, 5 in order = **5 floors**; no starvation and good throughput. This is the standard answer.
- **Data structure:** an ordered set of stops (\`TreeSet\`/\`std::set\`): find the next stop above or below the current floor in O(log n) (\`ceiling/floor\`, \`lower_bound/upper_bound\`).
- **Direction handling:** a hall call "up from floor 4" should be picked up by an elevator **travelling up** that will pass floor 4, not by one heading down.
- **Multi-elevator dispatch (Strategy):** compute a **cost** for each elevator (distance, direction compatibility, current load/queue length, door state) and assign to the lowest cost. Nearest-idle is a baseline; zoning (low/high floors) helps in tall buildings.
- **State machines:** the elevator (idle/moving/doors) and the door (open/closing/closed/blocked); the State pattern keeps rules like "never move with the door open" in one place.
- **Concurrency:** requests arrive from many threads (buttons) while a simulation/motor thread moves the cabin. Either guard the stop set with a lock, or funnel all requests through a thread-safe queue consumed by the elevator's own control loop (actor style). Simulate time with a \`step()\` method for testing.` },
    { id: 'code-cpp', kind: 'code', title: "4. C++ skeleton", bodyMd: "A single elevator with the LOOK policy using an ordered set of stops. After serving 1, 3, 5 on the way up, new requests for 2 and 4 are served on the way down (4 then 2).", code: [cpp(`
#include <iostream>
#include <iterator>
#include <set>
using namespace std;

enum class Dir { Up, Down };

class Elevator {
    int floor = 0;
    Dir dir = Dir::Up;
    set<int> stops;                                   // requested floors (cabin buttons and hall calls)
public:
    void request(int f) { if (f != floor) stops.insert(f); }
    // LOOK policy: keep going in the current direction while there are stops ahead, then reverse.
    void run() {
        while (!stops.empty()) {
            if (dir == Dir::Up) {
                auto it = stops.lower_bound(floor);   // nearest stop at or above
                if (it == stops.end()) { dir = Dir::Down; continue; }
                floor = *it; stops.erase(it);
            } else {
                auto it = stops.upper_bound(floor);   // first stop above; the one before it is the nearest at or below
                if (it == stops.begin()) { dir = Dir::Up; continue; }
                --it; floor = *it; stops.erase(it);
            }
            cout << "stop at " << floor << (dir == Dir::Up ? " (up)" : " (down)") << "\\n";
        }
    }
};

int main() {
    Elevator e;
    e.request(3); e.request(1); e.request(5);
    e.run();
    e.request(2);
    e.request(4);
    e.run();
}`, "C++", "stop at 1 (up)\nstop at 3 (up)\nstop at 5 (up)\nstop at 4 (down)\nstop at 2 (down)")] },
    { id: 'code-java', kind: 'code', title: "5. Java skeleton", bodyMd: "The same controller using a `TreeSet`: `ceiling(floor)` finds the next stop going up and `floor(floor)` the next going down.", code: [java(`
import java.util.*;

public class Main {
    enum Dir { UP, DOWN }

    static class Elevator {
        private int floor = 0;
        private Dir dir = Dir.UP;
        private final TreeSet<Integer> stops = new TreeSet<>();      // requested floors (cabin buttons and hall calls)

        void request(int f) { if (f != floor) stops.add(f); }

        // LOOK policy: keep going in the current direction while there are stops ahead, then reverse.
        void run() {
            while (!stops.isEmpty()) {
                Integer next = (dir == Dir.UP) ? stops.ceiling(floor) : stops.floor(floor);
                if (next == null) { dir = (dir == Dir.UP) ? Dir.DOWN : Dir.UP; continue; }
                floor = next;
                stops.remove(next);
                System.out.println("stop at " + floor + (dir == Dir.UP ? " (up)" : " (down)"));
            }
        }
    }

    public static void main(String[] args) {
        Elevator e = new Elevator();
        e.request(3); e.request(1); e.request(5);
        e.run();
        e.request(2);
        e.request(4);
        e.run();
    }
}`, "Java", "stop at 1 (up)\nstop at 3 (up)\nstop at 5 (up)\nstop at 4 (down)\nstop at 2 (down)")] },
    { id: "extensions", kind: "concept", title: "6. Extensions and expectations", bodyMd: `- **Multiple elevators:** an \`ElevatorSystem\` with a \`DispatchStrategy\`; each elevator runs the LOOK policy on its own stops.
- **Capacity/overload:** a weight sensor refuses new stops while full.
- **Door and safety:** door sensor re-opens on obstruction; emergency stop; out-of-service state.
- **Observer:** displays and logs subscribe to floor/direction changes.
- **Peak modes:** morning up-peak parks idle cars at the lobby.

**New-grad vs senior:** a new grad should separate requests from elevators, justify LOOK over FCFS, and give the state machine. Seniors design the dispatch cost function, concurrency model, failure/safety cases and performance metrics (average wait, energy).` },
    { id: "mistakes", kind: "mistakes", title: "Common mistakes", bodyMd: `1. Serving requests strictly first-come-first-served and zig-zagging.
2. Ignoring direction: picking up a "going up" passenger with a car that is heading down.
3. Not distinguishing hall calls from cabin requests.
4. One huge \`Elevator\` class mixing scheduling, doors and display.
5. No answer for concurrent requests while the cabin is moving.
6. Letting far-away requests starve under nearest-first.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: "Design an elevator system.", answerMd: "An ElevatorSystem receives hall calls and dispatches each to the best Elevator using a cost-based DispatchStrategy. Each Elevator keeps an ordered set of stops and uses the LOOK policy: continue in the current direction serving stops on the way, reverse when none remain. Elevator and door are state machines, requests are thread-safe, and scheduling and dispatch are strategies so they can be swapped." },
    { id: 'iq2', q: "Why LOOK/SCAN instead of FCFS for an elevator?", answerMd: "FCFS makes the cabin zig-zag between floors in arrival order, wasting travel and time. LOOK serves everything in the direction of travel before reversing, which reduces total movement and waiting time and prevents starvation, unlike nearest-first." },
    { id: 'iq3', q: "How do you assign a hall call to one of several elevators?", answerMd: "Compute a cost per elevator: distance to the floor, whether it is moving toward the caller in the right direction, its current queue length and load, door state. Assign to the lowest cost; baseline strategies are nearest idle or zoning, implemented behind a Strategy interface." },
    { id: 'iq4', q: "How do you handle requests arriving while the elevator is moving?", answerMd: "Insert the floor into the elevator's ordered stop set (under a lock or via a thread-safe queue read by the elevator's control loop). The LOOK policy then picks it up if it lies ahead in the current direction, otherwise on the return sweep." },
  ],
  revision: { notesMd: "- Entities: ElevatorSystem, Elevator (floor, direction, state, stops), HallCall vs CabinRequest; strategies for scheduling and dispatch.\n- LOOK: serve stops in the current direction, reverse when none ahead; ordered set (ceiling/floor).\n- Stops 3,1,5 from floor 0: FCFS travels 9 floors, LOOK travels 5.\n- Dispatch: lowest cost (distance, direction, load); states: IDLE/MOVING/DOORS_OPEN.\n- Concurrency: lock or request queue; simulate time with step().", flashcards: [
    { id: 'f1', front: "Elevator algorithm name?", backMd: "LOOK (or SCAN): serve in one direction, then reverse." },
    { id: 'f2', front: "Total floors travelled for stops 3,1,5 from 0 under FCFS vs LOOK?", backMd: "9 vs 5." },
    { id: 'f3', front: "Data structure for stops?", backMd: "Ordered set (TreeSet/std::set) for next stop above or below." },
    { id: 'f4', front: "Hall call vs cabin request?", backMd: "Hall call: floor + direction, dispatched to some car; cabin request: a destination in a specific car." },
    { id: 'f5', front: "Pattern for choosing which car serves a call?", backMd: "Strategy (dispatch cost function)." },
  ] },
  resources: [{ title: 'Refactoring Guru: State pattern', url: 'https://refactoring.guru/design-patterns/state', kind: 'article' }, { title: 'Refactoring Guru: Strategy pattern', url: 'https://refactoring.guru/design-patterns/strategy', kind: 'article' }],
});

const elevatorMcqs: MCQ[] = [
  mcq({ ...q(ELEVATOR), id: "sd.lel.q1", type: "concept", difficulty: "easy", stem: "Which scheduling policy is commonly called the \"elevator algorithm\"?", options: ["SCAN/LOOK: continue in one direction serving stops, then reverse", ["FCFS: serve requests strictly in arrival order", "Simple but zig-zags."], ["Random selection", "Not a scheduling policy used for this."], ["Shortest job first", "A CPU scheduling term, not this."]], answer: 0, explanation: "It is the same idea as disk SCAN/LOOK." }),
  mcq({ ...q(ELEVATOR), id: "sd.lel.q2", type: "complexity", difficulty: "medium", stem: "An elevator starts at floor 0 with stops requested in the order 3, 1, 5. How many floors does it travel under FCFS and under LOOK (going up first)?", options: ["FCFS 9 floors; LOOK 5 floors", ["FCFS 5; LOOK 9", "Reversed."], ["Both 5", "FCFS goes 0→3→1→5."], ["Both 9", "LOOK visits 1, 3, 5 in order."]], answer: 0, explanation: "FCFS: 3 + 2 + 4 = 9. LOOK: 0→1→3→5 = 5." }),
  mcq({ ...q(ELEVATOR), id: "sd.lel.q3", type: "concept", difficulty: "medium", stem: "Which data structure lets an elevator find \"the nearest requested floor above the current one\" efficiently?", options: ["An ordered set of stops (ceiling / lower_bound query)", ["An unsorted list scanned from the start", "O(n) per query."], ["A queue in arrival order", "No ordering by floor."], ["A hash set", "Unordered: cannot answer ceiling queries."]], answer: 0, explanation: "TreeSet.ceiling or std::set::lower_bound give O(log n)." }),
  mcq({ ...q(ELEVATOR), id: "sd.lel.q4", type: "concept", difficulty: "medium", stem: "A passenger on floor 6 presses \"up\" while elevator A is heading down past floor 8 and elevator B is idle on floor 2. A sensible dispatch cost function would usually choose:", options: ["B, since A is moving in the wrong direction for this call", ["A, because it is closer in distance", "It must finish its downward sweep first."], ["Always A", "Ignores direction."], ["Neither; make the passenger wait", "Unnecessary delay."]], answer: 0, explanation: "Cost accounts for direction compatibility, not just distance." }),
  mcq({ ...q(ELEVATOR), id: "sd.lel.q5", type: "concept", difficulty: "hard", stem: "Under a nearest-first policy, requests for floors close to the cabin keep arriving. What problem can occur?", options: ["Starvation of requests for far floors", ["Deadlock between doors", "Unrelated."], ["Memory leak", "Unrelated."], ["Integer overflow", "Unrelated."]], answer: 0, explanation: "LOOK avoids it because every sweep serves all pending stops in that direction." }),
  mcq({ ...q(ELEVATOR), id: "sd.lel.q6", type: "concept", difficulty: "medium", stem: "Button presses arrive on many threads while the elevator moves. Which approach keeps the design safe and simple?", options: ["Funnel requests through a thread-safe queue (or lock the stop set) consumed by the elevator's control loop", ["Let every thread modify the stop set without synchronisation", "Data race."], ["Disable buttons while moving", "Unusable."], ["Create a new elevator per press", "Nonsense."]], answer: 0, explanation: "Serialising updates to the stop set avoids races and keeps the policy logic single-threaded." }),
];

// ---------------------------------------------------------------------------------------
const RATELIMITERCLASS = "sd.lld-rate-limiter";
const rateLimiterClass = sdTopic({
  id: RATELIMITERCLASS, title: "LLD Practice: Rate Limiter Class", level: 'core', estMinutes: 45, prerequisites: ["sd.rate-limiting"], related: ["sd.case-rate-limiter", "os.concurrency-multithreading", "sd.lld-parking-lot"],
  summary: "An in-process token-bucket limiter: interface, clock injection and thread safety.",
  objectives: ["Design a `RateLimiter` interface with swappable algorithms (token bucket, sliding window).", "Implement a lazily refilled token bucket per key and trace it by hand.", "Make it testable with an injected clock and safe under concurrency.", "Handle memory (idle keys), configuration per client tier and richer results (remaining, retry-after)."],
  sections: [
    { id: "requirements", kind: "concept", title: "1. Requirements and scope", bodyMd: `This is the **class-level** version of the Rate Limiter case study (which covers the distributed system). Design a library class that an API server calls as \`limiter.allow(key)\`.

**Functional:** limit each key (user id, API key, IP) to a burst of \`capacity\` requests and a sustained \`refillPerSec\`; return allow/deny; different rules per key tier.
**Non-functional:** O(1) per call, **thread-safe**, deterministic tests, bounded memory, no background threads needed.
**Out of scope:** distributed counters (see the case study), persistence.` },
    { id: "entities", kind: "concept", title: "2. Classes and diagram", bodyMd: `\`\`\`
RateLimiter «interface»            allow(key) : bool          (or Decision{allowed, remaining, retryAfter})
   ├─ TokenBucketLimiter(capacity, refillPerSec, Clock)   Map<key, Bucket{tokens, lastRefill}>
   ├─ SlidingWindowCounterLimiter(limit, window, Clock)
   └─ FixedWindowLimiter(limit, window, Clock)
Clock «interface»  nowMs()   ◄── SystemClock / FakeClock (tests)
RuleProvider: key -> (capacity, rate)   (tier lookup; cached)
\`\`\`
**Why an interface:** the server depends on \`RateLimiter\`, so the algorithm can change (Strategy) and a no-op or mock limiter is trivial in tests.` },
    { id: "decisions", kind: "concept", title: "3. Key design decisions", bodyMd: `- **Token bucket with lazy refill:** store \`tokens\` and \`lastRefill\` per key; on each call add \`elapsed × rate\` (capped at capacity) instead of running a timer thread. Then if \`tokens ≥ 1\` take one token and allow.
- **Trace:** capacity 3, 1 token/s, bucket starts full. At t = 0 four calls give **true, true, true, false**. At t = 2 s, 2 tokens have refilled, so three calls give **true, true, false**. A denied caller can retry after \`(1 − tokens) / rate\` seconds (for an empty bucket and rate 1/s: **1 s**): that is the \`Retry-After\` value.
- **Inject a Clock:** tests use a \`FakeClock\` and advance time exactly; never call the real clock inside the algorithm.
- **Thread safety:** per-key state is read-modify-write. Options: one lock for the whole limiter (simple, contended), a **lock per bucket** (\`synchronized(bucket)\`), or a concurrent map with atomic \`compute\` (Java \`ConcurrentHashMap.compute\`). Do **not** do \`get\` then \`put\` without atomicity.
- **Memory:** a bucket per key can grow without bound; evict **idle keys** (a bucket that is full and untouched for a while is equivalent to a fresh one), using an LRU or periodic sweep.
- **Rules:** keep \`capacity\` and \`rate\` in a \`RuleProvider\` so premium tiers get larger buckets; cache lookups.
- **Result type:** returning only \`bool\` is minimal; a \`Decision\` with \`remaining\` and \`retryAfter\` lets the server set headers.
- **Floating point:** fine for tokens; or use integer milli-tokens to avoid rounding drift.` },
    { id: 'code-cpp', kind: 'code', title: "4. C++ skeleton", bodyMd: "A `RateLimiter` interface, a `Clock` (with a `FakeClock` for tests) and a token-bucket implementation with lazy refill. The output matches the hand trace above.", code: [cpp(`
#include <algorithm>
#include <iostream>
#include <map>
#include <string>
using namespace std;

struct Clock { virtual ~Clock() {} virtual long nowMs() const = 0; };   // injected, so tests control time
struct FakeClock : Clock { long t = 0; long nowMs() const override { return t; } };

class RateLimiter {                                                        // Strategy: algorithm is replaceable
public:
    virtual ~RateLimiter() {}
    virtual bool allow(const string& key) = 0;
};

class TokenBucketLimiter : public RateLimiter {
    struct Bucket { double tokens; long last; };
    int capacity;
    double refillPerSec;
    const Clock& clock;
    map<string, Bucket> buckets;                                           // one bucket per key (user, API key, IP)
public:
    TokenBucketLimiter(int cap, double rate, const Clock& c) : capacity(cap), refillPerSec(rate), clock(c) {}
    bool allow(const string& key) override {
        long now = clock.nowMs();
        auto it = buckets.find(key);
        if (it == buckets.end()) it = buckets.insert(make_pair(key, Bucket{(double)capacity, now})).first;
        Bucket& b = it->second;
        b.tokens = min((double)capacity, b.tokens + (now - b.last) / 1000.0 * refillPerSec);   // lazy refill
        b.last = now;
        if (b.tokens >= 1.0) { b.tokens -= 1.0; return true; }
        return false;
    }
};

int main() {
    FakeClock clock;
    TokenBucketLimiter limiter(3, 1.0, clock);             // burst of 3, then 1 request per second
    cout << boolalpha;
    cout << "t=0 u1:";
    for (int i = 0; i < 4; ++i) cout << " " << limiter.allow("u1");
    cout << "\\nt=0 u2: " << limiter.allow("u2") << "\\n";
    clock.t = 2000;
    cout << "t=2000 u1:";
    for (int i = 0; i < 3; ++i) cout << " " << limiter.allow("u1");
    cout << "\\n";
}`, "C++", "t=0 u1: true true true false\nt=0 u2: true\nt=2000 u1: true true false")] },
    { id: 'code-java', kind: 'code', title: "5. Java skeleton", bodyMd: "The same in Java; `allow` is `synchronized` for simplicity, and `computeIfAbsent` creates each key's bucket lazily.", code: [java(`
import java.util.*;

public class Main {
    interface Clock { long nowMs(); }                                   // injected, so tests control time
    static class FakeClock implements Clock { long t = 0; public long nowMs() { return t; } }

    interface RateLimiter { boolean allow(String key); }                // Strategy: algorithm is replaceable

    static class TokenBucketLimiter implements RateLimiter {
        private static class Bucket { double tokens; long last; Bucket(double t, long l) { tokens = t; last = l; } }
        private final int capacity;
        private final double refillPerSec;
        private final Clock clock;
        private final Map<String, Bucket> buckets = new HashMap<>();    // one bucket per key (user, API key, IP)

        TokenBucketLimiter(int capacity, double refillPerSec, Clock clock) { this.capacity = capacity; this.refillPerSec = refillPerSec; this.clock = clock; }

        public synchronized boolean allow(String key) {
            long now = clock.nowMs();
            Bucket b = buckets.computeIfAbsent(key, k -> new Bucket(capacity, now));
            b.tokens = Math.min(capacity, b.tokens + (now - b.last) / 1000.0 * refillPerSec);   // lazy refill
            b.last = now;
            if (b.tokens >= 1.0) { b.tokens -= 1.0; return true; }
            return false;
        }
    }

    public static void main(String[] args) {
        FakeClock clock = new FakeClock();
        TokenBucketLimiter limiter = new TokenBucketLimiter(3, 1.0, clock);   // burst of 3, then 1 request per second
        StringBuilder sb = new StringBuilder("t=0 u1:");
        for (int i = 0; i < 4; i++) sb.append(' ').append(limiter.allow("u1"));
        System.out.println(sb);
        System.out.println("t=0 u2: " + limiter.allow("u2"));
        clock.t = 2000;
        sb = new StringBuilder("t=2000 u1:");
        for (int i = 0; i < 3; i++) sb.append(' ').append(limiter.allow("u1"));
        System.out.println(sb);
    }
}`, "Java", "t=0 u1: true true true false\nt=0 u2: true\nt=2000 u1: true true false")] },
    { id: "extensions", kind: "concept", title: "6. Extensions and expectations", bodyMd: `- **Other algorithms** behind the same interface: sliding-window counter, leaky bucket.
- **Composite limiter:** apply per-user **and** per-IP limits, allowing only if both allow (AND-composition, Decorator/Composite).
- **Distributed:** replace the in-memory map with Redis plus an atomic script (see the case study).
- **Metrics hook:** count allowed/denied per rule.

**New-grad vs senior:** a new grad should provide the interface, a correct token bucket with lazy refill, an injected clock and a thread-safety approach. Seniors discuss lock granularity, eviction, precision, composition of limits and distribution.` },
    { id: "mistakes", kind: "mistakes", title: "Common mistakes", bodyMd: `1. Reading the real clock inside the limiter (flaky tests, no control over time).
2. A refill timer thread per limiter, instead of lazy refill.
3. \`get\` then \`put\` on a shared map without atomicity.
4. Forgetting to cap tokens at capacity (an idle key accumulates unlimited burst).
5. Unbounded growth of the key map.
6. Fixed windows without acknowledging the boundary burst.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: "Design a rate limiter class.", answerMd: "Define a RateLimiter interface with allow(key). Implement a token bucket: a map from key to (tokens, lastRefill); on each call add elapsed time times the refill rate, capped at capacity, then consume one token if at least one is available. Inject a Clock for tests, protect per-key updates with a lock or atomic compute, evict idle keys and read capacity and rate from a rule provider." },
    { id: 'iq2', q: "Why refill lazily instead of with a timer?", answerMd: "A timer would need a thread and constant updates for every key. Lazy refill computes the tokens owed from the elapsed time when a request arrives, costing O(1) per call with no background work." },
    { id: 'iq3', q: "How do you test time-dependent logic?", answerMd: "Inject a Clock interface and use a fake implementation that tests advance explicitly, so each scenario (burst, wait 2 seconds, retry) is deterministic and instantaneous." },
    { id: 'iq4', q: "How do you keep the limiter thread-safe without a global lock?", answerMd: "Make each key's read-modify-write atomic: synchronise on the bucket, or use a concurrent map's atomic compute so different keys do not contend; avoid separate get and put calls." },
  ],
  revision: { notesMd: "- RateLimiter interface (Strategy); TokenBucketLimiter(capacity, refillPerSec, Clock); per-key Bucket(tokens, lastRefill).\n- Lazy refill: tokens = min(cap, tokens + elapsed × rate); allow if tokens >= 1.\n- Trace (cap 3, 1/s): t=0: T T T F; t=2s: T T F. retryAfter = (1 − tokens)/rate.\n- Inject Clock; per-key atomic update (lock/compute); evict idle keys; Decision{allowed, remaining, retryAfter}.", flashcards: [
    { id: 'f1', front: "Why inject a Clock?", backMd: "Deterministic tests that control time." },
    { id: 'f2', front: "How is the bucket refilled?", backMd: "Lazily on each call from elapsed time × rate, capped at capacity." },
    { id: 'f3', front: "Retry-After for an empty bucket at 1 token/s?", backMd: "1 second." },
    { id: 'f4', front: "Unbounded memory fix?", backMd: "Evict idle keys (full, untouched buckets are equivalent to new ones)." },
    { id: 'f5', front: "Two limits at once (user and IP)?", backMd: "Composite limiter: allow only if both allow." },
  ] },
  resources: [{ title: 'Refactoring Guru: Strategy pattern', url: 'https://refactoring.guru/design-patterns/strategy', kind: 'article' }, { title: 'Stripe: Scaling your API with rate limiters', url: 'https://stripe.com/blog/rate-limiters', kind: 'article' }],
});

const rateLimiterClassMcqs: MCQ[] = [
  mcq({ ...q(RATELIMITERCLASS), id: "sd.lra.q1", type: "complexity", difficulty: "easy", stem: "A token bucket has capacity 3 and refills 1 token per second; it starts full. At t = 0 a client makes 4 requests. How many are allowed?", options: ["3", ["4", "The fourth finds an empty bucket."], ["1", "The bucket starts with 3 tokens."], ["0", "The bucket starts full."]], answer: 0, explanation: "Three tokens are consumed; the fourth is denied." }),
  mcq({ ...q(RATELIMITERCLASS), id: "sd.lra.q2", type: "complexity", difficulty: "medium", stem: "Same bucket (capacity 3, 1 token/s), emptied at t = 0. At t = 2 s the client sends 3 requests in a row. How many are allowed?", options: ["2", ["3", "Only two tokens have refilled."], ["1", "Two seconds yield two tokens."], ["0", "Tokens have refilled."]], answer: 0, explanation: "2 s × 1 token/s = 2 tokens, so the third request is denied." }),
  mcq({ ...q(RATELIMITERCLASS), id: "sd.lra.q3", type: "concept", difficulty: "medium", stem: "Why is lazy refill (computing tokens from elapsed time on each call) preferred over a timer thread that adds tokens?", options: ["It needs no background thread and costs O(1) per call regardless of the number of keys", ["It is more precise than any other approach", "Both can be precise."], ["It avoids storing the last-refill time", "It requires it."], ["It lets the bucket exceed its capacity", "Capacity is still enforced."]], answer: 0, explanation: "The elapsed time since the last call tells you exactly how many tokens to add." }),
  mcq({ ...q(RATELIMITERCLASS), id: "sd.lra.q4", type: "concept", difficulty: "medium", stem: "Why should the limiter take a `Clock` interface instead of calling the system clock directly?", options: ["Tests can control time with a fake clock and be deterministic", ["System clocks are too slow", "Not the reason."], ["It makes the algorithm faster", "Not the reason."], ["It is required by the token bucket algorithm", "It is a testing/design choice."]], answer: 0, explanation: "Dependency injection of time is the standard way to test time-based logic." }),
  mcq({ ...q(RATELIMITERCLASS), id: "sd.lra.q5", type: "concept", difficulty: "hard", stem: "Two threads call `allow(\"u1\")` at once. The code reads the bucket, computes tokens, then writes it back without synchronisation. What can happen?", options: ["Both can consume the same token (a lost update), allowing more requests than the limit", ["A deadlock", "No locks are involved."], ["The bucket is deleted", "Not caused by this race."], ["Nothing, reads and writes are atomic for objects", "A read-modify-write is not atomic."]], answer: 0, explanation: "Guard each bucket (or use an atomic compute)." }),
  mcq({ ...q(RATELIMITERCLASS), id: "sd.lra.q6", type: "concept", difficulty: "medium", stem: "A bucket for a key has been full and untouched for an hour. Which memory policy is safe?", options: ["Evict it: a full idle bucket is indistinguishable from a freshly created one", ["Never evict anything", "Memory grows without bound."], ["Evict only the busiest keys", "Would reset active limits."], ["Evict before it is full", "Would forgive consumed tokens."]], answer: 0, explanation: "The next request creates a full bucket again." }),
];

// ---------------------------------------------------------------------------------------
const SNAKELADDER = "sd.lld-snake-ladder";
const snakeLadder = sdTopic({
  id: SNAKELADDER, title: "LLD Practice: Snake and Ladder", level: 'core', estMinutes: 45, prerequisites: ["sd.requirements"], related: ["sd.lld-vending-machine", "dsa.graphs", "cpp.solid-patterns"],
  summary: "Board, dice strategy, players, rule variants and testing with scripted dice.",
  objectives: ["Model Board, Dice, Player and Game with clear responsibilities.", "Treat snakes and ladders uniformly as jumps and validate a board.", "Inject the dice (Strategy) so games are deterministic in tests, and support rule variants.", "Compute the minimum number of throws with BFS and connect the LLD to a classic coding problem."],
  sections: [
    { id: "requirements", kind: "concept", title: "1. Requirements and scope", bodyMd: `**Functional:** a board of N squares (commonly 100) with **snakes** (jump down) and **ladders** (jump up); 2+ players take turns rolling a die; a player moves forward by the roll, then follows any snake or ladder on the landing square; the first player to reach the **last square** wins.
**Rules to settle:** must the finish be an **exact roll** (overshoot = stay put, as in our skeleton) or may you overshoot? Does rolling a 6 give another turn? One die or two? Do jumps chain?
**Non-functional:** extensible rules, deterministic testing, easy to add players or board layouts.
**Out of scope:** UI, networking, persistence.` },
    { id: "entities", kind: "concept", title: "2. Classes and diagram", bodyMd: `\`\`\`
Game ──has──> Board (size, jumps: Map<start, end>)      Game ──has many──> Player (name, position)
Game ──uses──> Dice «interface»  ◄── RandomDice / ScriptedDice (tests) / TwoDice
Game ──uses──> RuleSet (exact finish? extra turn on 6?)   (Strategy, optional)
Game.play(): loop turns until a Player reaches Board.last()
\`\`\`
**Snake and ladder are the same concept:** a *jump* from a start square to an end square (up for ladders, down for snakes). One \`Map<int,int>\` handles both; separate Snake and Ladder subclasses add nothing but code.` },
    { id: "decisions", kind: "concept", title: "3. Key design decisions", bodyMd: `- **Board owns the jumps** (\`landOn(position)\` returns the final square), so the Game doesn't know what a snake is.
- **Dice as a Strategy:** real games use \`RandomDice\`; tests use \`ScriptedDice\` returning a fixed sequence, making a whole game reproducible (the skeleton's output is the exact trace of a scripted game).
- **Validation when building a board:** no jump starts on square 1 or on the last square; no two jumps share a start; destinations within range; **avoid cycles** (a ladder ending on a snake head that leads back to the ladder start would loop forever if jumps were chained). Common rule: apply **one** jump per move.
- **Turn loop:** the Game rotates through players; \`Player\` holds only a name and a position (anemic is fine here); win check right after the move.
- **Overshoot rule** is a one-line decision (\`if target <= last\`): put it behind a RuleSet if variants matter.
- **Complexity:** a game of T turns costs O(T); it ends with probability 1 under fair dice but has no worst-case bound.
- **Minimum throws (extension):** model squares as graph nodes with edges for rolls 1–6 (following jumps) and run **BFS** from square 0: the first time you reach the last square is the fewest throws. For the skeleton's 20-square board (ladders 3→12, 8→14; snakes 17→4, 19→7) the fewest throws is **3**: roll 3 (ladder to 12), then 6 (to 18), then 2 (to 20). This is exactly the LeetCode problem *Snakes and Ladders*.` },
    { id: 'code-cpp', kind: 'code', title: "4. C++ skeleton", bodyMd: "A 20-square board with two ladders and two snakes, two players and scripted dice rolls 3, 6, 5, 2, 6, 6. A rolls 3 and climbs a ladder, then slides down a snake on 17, and B wins by landing exactly on 20.", code: [cpp(`
#include <iostream>
#include <map>
#include <string>
#include <vector>
using namespace std;

class Dice {                                            // Strategy: real game uses random, tests use a script
public:
    virtual ~Dice() {}
    virtual int roll() = 0;
};
class ScriptedDice : public Dice {
    vector<int> rolls; size_t i = 0;
public:
    explicit ScriptedDice(vector<int> r) : rolls(r) {}
    int roll() override { return rolls.at(i++); }
};

class Board {
    int size;
    map<int, int> jumps;                                // ladder bottoms and snake heads -> destination
public:
    Board(int n, map<int, int> j) : size(n), jumps(j) {}
    int last() const { return size; }
    int landOn(int pos) const { auto it = jumps.find(pos); return it == jumps.end() ? pos : it->second; }
};

struct Player { string name; int pos = 0; };

class Game {
    Board board; Dice& dice; vector<Player> players;
public:
    Game(Board b, Dice& d, vector<Player> p) : board(b), dice(d), players(p) {}
    string play() {
        for (size_t turn = 0;; ++turn) {
            Player& p = players[turn % players.size()];
            int r = dice.roll();
            int target = p.pos + r;
            if (target <= board.last()) p.pos = board.landOn(target);   // overshooting the last square = stay put
            cout << p.name << " rolled " << r << ", now at " << p.pos << "\\n";
            if (p.pos == board.last()) return p.name;
        }
    }
};

int main() {
    map<int, int> jumps;
    jumps[3] = 12; jumps[8] = 14;                       // ladders
    jumps[17] = 4; jumps[19] = 7;                       // snakes
    ScriptedDice dice({3, 6, 5, 2, 6, 6});
    Player a; a.name = "A";
    Player b; b.name = "B";
    Game game(Board(20, jumps), dice, {a, b});
    cout << game.play() << " wins\\n";
}`, "C++", "A rolled 3, now at 12\nB rolled 6, now at 6\nA rolled 5, now at 4\nB rolled 2, now at 14\nA rolled 6, now at 10\nB rolled 6, now at 20\nB wins")] },
    { id: 'code-java', kind: 'code', title: "5. Java skeleton", bodyMd: "The same game in Java; `Dice` is an interface with a scripted implementation, and `Board.landOn` hides jumps from the game loop.", code: [java(`
import java.util.*;

public class Main {
    interface Dice { int roll(); }                       // Strategy: real game uses random, tests use a script
    static class ScriptedDice implements Dice {
        private final int[] rolls; private int i = 0;
        ScriptedDice(int... rolls) { this.rolls = rolls; }
        public int roll() { return rolls[i++]; }
    }

    static class Board {
        private final int size;
        private final Map<Integer, Integer> jumps;      // ladder bottoms and snake heads -> destination
        Board(int size, Map<Integer, Integer> jumps) { this.size = size; this.jumps = jumps; }
        int last() { return size; }
        int landOn(int pos) { return jumps.getOrDefault(pos, pos); }
    }

    static class Player { final String name; int pos = 0; Player(String name) { this.name = name; } }

    static class Game {
        private final Board board; private final Dice dice; private final List<Player> players;
        Game(Board board, Dice dice, List<Player> players) { this.board = board; this.dice = dice; this.players = players; }
        String play() {
            for (int turn = 0; ; turn++) {
                Player p = players.get(turn % players.size());
                int r = dice.roll();
                int target = p.pos + r;
                if (target <= board.last()) p.pos = board.landOn(target);   // overshooting the last square = stay put
                System.out.println(p.name + " rolled " + r + ", now at " + p.pos);
                if (p.pos == board.last()) return p.name;
            }
        }
    }

    public static void main(String[] args) {
        Map<Integer, Integer> jumps = new HashMap<>();
        jumps.put(3, 12); jumps.put(8, 14);                  // ladders
        jumps.put(17, 4); jumps.put(19, 7);                  // snakes
        Game game = new Game(new Board(20, jumps), new ScriptedDice(3, 6, 5, 2, 6, 6), List.of(new Player("A"), new Player("B")));
        System.out.println(game.play() + " wins");
    }
}`, "Java", "A rolled 3, now at 12\nB rolled 6, now at 6\nA rolled 5, now at 4\nB rolled 2, now at 14\nA rolled 6, now at 10\nB rolled 6, now at 20\nB wins")] },
    { id: "extensions", kind: "concept", title: "6. Extensions and expectations", bodyMd: `- **Rule variants:** extra turn on 6, two dice, bounce back on overshoot, three sixes forfeit: behind a \`RuleSet\` Strategy.
- **Board generation:** random boards that pass validation.
- **Observer:** a UI or logger subscribes to move events instead of the Game printing.
- **Many players / tournaments:** the Game stays the same; add a \`Match\` on top.
- **Analytics:** simulate 100,000 games with random dice to estimate the average length.

**New-grad vs senior:** a new grad should model jumps uniformly, inject the dice, handle the exact-finish rule and test with a script. Seniors discuss validation (cycles), rule extensibility and simulation/analysis.` },
    { id: "mistakes", kind: "mistakes", title: "Common mistakes", bodyMd: `1. Separate Snake and Ladder classes with duplicated logic.
2. Using the random generator directly in the game loop (tests can't be deterministic).
3. Forgetting the overshoot or exact-finish rule.
4. Letting jumps chain without detecting cycles.
5. The Game class doing board layout, dice and printing all at once.
6. Off-by-one at square 1 or at the last square.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: "Design Snake and Ladder.", answerMd: "A Board holds the size and a map of jumps (snake heads and ladder bottoms to destinations); a Dice interface supplies rolls (random in production, scripted in tests); Players hold their position; a Game rotates turns, moves by the roll, applies the board's jump, enforces the finish rule and declares the first player on the last square the winner." },
    { id: 'iq2', q: "Why model snakes and ladders as one concept?", answerMd: "Both are a jump from a start square to an end square; only the direction differs. A single map of jumps makes the board simple and avoids duplicated classes; the game does not care which kind it is." },
    { id: 'iq3', q: "How do you make the game testable?", answerMd: "Inject the Dice as an interface and use a scripted implementation in tests, so every roll is known and the entire game trace is deterministic and assertable." },
    { id: 'iq4', q: "How would you find the minimum number of throws to win?", answerMd: "Treat squares as nodes of a graph; each square has edges to the squares reachable with rolls 1 to 6 after applying jumps. A breadth-first search from the start gives the fewest throws to the last square (the LeetCode Snakes and Ladders problem)." },
  ],
  revision: { notesMd: "- Board(size, jumps), Dice (Strategy), Player(name, pos), Game(turn loop). Snake and ladder = one jump map.\n- Move: target = pos + roll; if target <= last then pos = jumps.get(target) else stay; win at last.\n- Inject ScriptedDice for deterministic tests; validate boards (no cycle, no jump from last square, unique starts).\n- Min throws = BFS over squares; skeleton board needs 3 throws (3→12, 6→18, 2→20).", flashcards: [
    { id: 'f1', front: "How are snakes and ladders modelled?", backMd: "As jumps (start → end) in a single map owned by the Board." },
    { id: 'f2', front: "Why a Dice interface?", backMd: "To script rolls in tests (and to vary dice rules)." },
    { id: 'f3', front: "Overshoot rule in the skeleton?", backMd: "The player stays put unless the roll lands on or before the last square." },
    { id: 'f4', front: "Algorithm for the fewest throws?", backMd: "Breadth-first search over squares." },
    { id: 'f5', front: "Fewest throws on the sample 20-square board?", backMd: "3." },
  ] },
  resources: [{ title: 'Refactoring Guru: Strategy pattern', url: 'https://refactoring.guru/design-patterns/strategy', kind: 'article' }, { title: 'LeetCode: Snakes and Ladders (minimum throws with BFS)', url: 'https://leetcode.com/problems/snakes-and-ladders/', kind: 'practice' }],
});

const snakeLadderMcqs: MCQ[] = [
  mcq({ ...q(SNAKELADDER), id: "sd.lsn.q1", type: "concept", difficulty: "easy", stem: "What is the cleanest way to model snakes and ladders on a board?", options: ["As jumps from a start square to an end square, held in one map by the Board", ["Two unrelated class hierarchies with duplicated move logic", "Both are the same concept."], ["As special players", "They are board features, not players."], ["In the Dice class", "Dice only produces numbers."]], answer: 0, explanation: "A ladder is an upward jump and a snake a downward jump." }),
  mcq({ ...q(SNAKELADDER), id: "sd.lsn.q2", type: "concept", difficulty: "easy", stem: "Why should the `Dice` be an interface injected into the game?", options: ["So tests can supply a scripted sequence and get a deterministic game", ["Because Java and C++ forbid random numbers in classes", "They allow them."], ["To make the game faster", "Not the reason."], ["To avoid having a Board", "Unrelated."]], answer: 0, explanation: "Dependency injection of randomness enables reproducible tests (Strategy pattern)." }),
  mcq({ ...q(SNAKELADDER), id: "sd.lsn.q3", type: "concept", difficulty: "medium", stem: "With the exact-finish rule, a player on square 18 of a 20-square board rolls a 5. What happens?", options: ["The player stays on 18 (the move would overshoot)", ["The player wins", "Overshooting does not win under this rule."], ["The player moves back to 17", "No bounce-back in this variant."], ["The turn is skipped for everyone", "Only this player does not move."]], answer: 0, explanation: "The skeleton moves only when `pos + roll <= last`." }),
  mcq({ ...q(SNAKELADDER), id: "sd.lsn.q4", type: "complexity", difficulty: "medium", stem: "Using the sample board (20 squares; ladders 3→12, 8→14; snakes 17→4, 19→7; die 1–6), what is the minimum number of throws needed to reach square 20 from the start?", options: ["3", ["2", "No two throws can reach 20: after the best first throw (3→12) the maximum is 18."], ["4", "A 3-throw path exists: 3, then 6, then 2."], ["5", "Too many."]], answer: 0, explanation: "0 → 3 (ladder to 12) → 18 (roll 6) → 20 (roll 2)." }),
  mcq({ ...q(SNAKELADDER), id: "sd.lsn.q5", type: "concept", difficulty: "hard", stem: "A board has a ladder ending on a square that is the head of a snake leading back to the ladder's start. If jumps are applied repeatedly, what is the danger and the usual fix?", options: ["An infinite loop; apply at most one jump per move and validate boards for cycles", ["A compile error", "It is a runtime/logic problem."], ["The player wins immediately", "The player would loop forever."], ["Nothing, jumps never repeat", "Chained jumps can cycle."]], answer: 0, explanation: "Most rule sets apply a single jump per move; board validation rejects cyclic layouts." }),
  mcq({ ...q(SNAKELADDER), id: "sd.lsn.q6", type: "concept", difficulty: "medium", stem: "Which algorithm computes the minimum number of throws to finish in general?", options: ["Breadth-first search over squares (edges = rolls 1–6 followed by jumps)", ["Depth-first search without visited marks", "May loop and does not give the shortest path."], ["Binary search on the answer", "Not applicable here."], ["Sorting the jumps", "Does not find a path."]], answer: 0, explanation: "Unweighted shortest path: BFS." }),
];


export const topics: Topic[] = [parkingLot, library, vendingMachine, elevator, rateLimiterClass, snakeLadder];
export const mcqs: MCQ[] = [...parkingLotMcqs, ...libraryMcqs, ...vendingMachineMcqs, ...elevatorMcqs, ...rateLimiterClassMcqs, ...snakeLadderMcqs];
