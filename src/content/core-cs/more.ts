import type { MCQ, Topic } from '../schema';
import { java, mcq } from '../helpers';

// Core CS: concurrency concepts as they are asked in interviews (the OS module has the
// mechanics; this topic is the vocabulary and the "what goes wrong" questions). Java samples are
// compiled and run by scripts/verify-code.ts.

const MASTERY = { testSize: 6, testMinutes: 10, passPct: 80, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 7 };
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
const cTopic = (t: TopicInput): Topic => ({ moduleId: 'core-cs', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
const q = (topic: string) => ({ topics: [topic], module: 'core-cs' as const });

// ---------------------------------------------------------------------------------------
const CQ = 'core.concurrency-qa';
const concurrencyQa = cTopic({
  id: CQ, title: 'Concurrency Concepts', level: 'core', estMinutes: 50, prerequisites: [], related: ['os.synchronisation', 'os.deadlocks', 'os.concurrency-multithreading', 'os.classic-problems'],
  summary: 'Deadlock vs livelock vs starvation and thread safety.',
  objectives: ['Define race condition, data race, deadlock, livelock, starvation and priority inversion, and tell them apart from symptoms.', 'Explain what thread-safe means and list the standard ways to achieve it.', 'Explain visibility and ordering (the Java memory model idea) and what `volatile`, `synchronized` and atomics guarantee.', 'Answer the usual interview questions with a short, correct example for each.'],
  sections: [
    { id: 'vocabulary', kind: 'comparison', title: 'The vocabulary, side by side', bodyMd: `| Term | What happens | Threads are… | Typical cause | Fix |
|---|---|---|---|---|
| **Race condition** | the result depends on timing/interleaving | running | check-then-act (\`if (x == null) x = new ...\`), read-modify-write (\`count++\`) | make the whole operation atomic (lock, atomic class), or avoid sharing |
| **Data race** | two threads access the same variable at once, at least one writes, **no synchronisation** | running | unsynchronised shared field | synchronise; (in C++ it is undefined behaviour) |
| **Deadlock** | a cycle of threads each waiting for a lock another holds: none can proceed | **blocked** forever | locks acquired in different orders | global lock ordering, try-lock with timeout, fewer/shorter locks |
| **Livelock** | threads keep reacting to each other and change state but make **no progress** | **running** (busy) | two polite threads repeatedly back off and retry in lockstep | randomised back-off, a tie-breaker/priority |
| **Starvation** | a thread never gets the resource it needs although others progress | waiting indefinitely (or runnable but never scheduled) | unfair locks, strict priorities, greedy readers | fair locks/queues, aging |
| **Priority inversion** | a high-priority thread waits on a lock held by a low-priority one that a medium-priority thread keeps pre-empting | blocked | priorities + locks | priority inheritance |

A **race condition** is a *logic* bug (wrong outcome from timing); a **data race** is a *memory-model* violation (missing synchronisation). You can have a race condition without a data race (two properly locked operations that must be one atomic step) and vice versa (a benign-looking racy flag).

**Deadlock needs all four Coffman conditions:** mutual exclusion, hold and wait, no pre-emption, circular wait. Break any one to prevent it (lock ordering breaks circular wait).

**Detecting them:** a deadlock shows as threads in \`BLOCKED\`/\`WAITING\` forever with CPU idle; take a **thread dump** (\`jstack <pid>\`, \`kill -3\`, \`gdb\` + \`thread apply all bt\`), which even prints the lock cycle in Java. A livelock shows **high CPU and no progress**. Starvation shows one worker's throughput at zero while others work.` },
    { id: 'thread-safety', kind: 'concept', title: 'What "thread-safe" means and how to get it', bodyMd: `Code is **thread-safe** if it behaves correctly when called from multiple threads at once, **without callers adding their own synchronisation**. It is about *invariants*: shared state must never be observed or modified in an inconsistent state.

Ways to achieve it, **in order of preference**:
1. **Don't share:** keep data **thread-confined** (local variables, \`ThreadLocal\`, per-request objects, message passing between threads/actors).
2. **Share only immutable data:** \`final\` fields, immutable objects (\`String\`, \`List.of\`, records) are safe to publish freely.
3. **Use existing concurrent structures:** \`ConcurrentHashMap\`, \`BlockingQueue\`, \`CopyOnWriteArrayList\`, \`AtomicInteger/LongAdder\`.
4. **Lock around every access** to shared mutable state (\`synchronized\`, \`ReentrantLock\`, \`ReadWriteLock\`), with the **same lock** for every access and for compound actions.
5. **Lock-free algorithms** (CAS loops): hard; leave to libraries.

Compound actions are the usual trap: even if \`get\` and \`put\` are each thread-safe, \`if (!map.containsKey(k)) map.put(k, v)\` is a **check-then-act race**; use \`putIfAbsent\`/\`computeIfAbsent\`. **Lazy singletons** need care too: use the initialisation-on-demand holder idiom, an \`enum\`, or \`volatile\` double-checked locking.

**Reentrancy:** a lock is **reentrant** if the thread holding it can acquire it again (Java's \`synchronized\` and \`ReentrantLock\` are); otherwise calling one synchronised method from another would deadlock itself. A *reentrant function* (C) uses no static/shared state and is safe to call recursively or from a signal handler: different from thread-safe.

**Costs:** locks serialise work (Amdahl), contend under load, and can deadlock; keep critical sections **short**, don't call unknown code (callbacks) or do I/O while holding a lock, and prefer **fine-grained** or **striped** locking only when measured.` },
    { id: 'memory-model', kind: 'concept', title: 'Visibility and ordering (the memory model)', bodyMd: `Races are not only about interleaving. Each core has **caches and store buffers**, and compilers/CPUs **reorder** instructions, so one thread may not **see** another thread's write, or may see writes in a different order. Languages define a **memory model** with a **happens-before** relation: if action A happens-before B, B is guaranteed to see A's effects.

In Java, happens-before edges come from:
- **\`synchronized\`:** unlocking a monitor happens-before every later locking of the same monitor (so both **mutual exclusion and visibility**).
- **\`volatile\`:** a write to a volatile variable happens-before every later read of it. It gives **visibility and ordering**, but **not atomicity of compound actions**: \`volatile int count; count++\` is still a race.
- **Thread start/join**, \`java.util.concurrent\` handoffs (executor submit → task, \`Future.get\`), \`final\` field safe publication.

Classic bug: a worker loops on \`while (!stopped) { ... }\` with a plain boolean; the JIT may hoist the read out of the loop and **never see** the update. Fix: make \`stopped\` \`volatile\` (or use an interrupt/atomic).

**Atomics** (\`AtomicInteger.incrementAndGet\`, \`compareAndSet\`) use hardware compare-and-swap for **lock-free atomic updates** with visibility. In C++ the equivalents are \`std::atomic\` and mutexes (and \`volatile\` is **not** a synchronisation tool there).

**Safe publication:** an object whose fields are mutable may be seen half-constructed by another thread if it is shared through a plain field. Publish through a volatile/final field, a lock, a concurrent collection or a thread-start/join edge.` },
    { id: 'code', kind: 'code', title: 'A race, and three correct fixes', bodyMd: 'Two threads each increment a shared counter 10,000 times. The unsynchronised version loses updates; the others always print 20000. Only the correct versions are run to produce the output shown.', code: [java(`import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    static int plain = 0;                                  // racy: ++ is read-modify-write
    static int locked = 0;
    static final Object LOCK = new Object();
    static final AtomicInteger atomic = new AtomicInteger();

    public static void main(String[] args) throws Exception {
        Runnable work = () -> {
            for (int i = 0; i < 10_000; i++) {
                plain++;                                   // data race: result may be < 20000
                synchronized (LOCK) { locked++; }          // mutual exclusion + visibility
                atomic.incrementAndGet();                  // lock-free atomic update
            }
        };
        Thread a = new Thread(work), b = new Thread(work);
        a.start(); b.start();
        a.join(); b.join();                                // join gives happens-before for the reads below
        System.out.println("locked=" + locked);
        System.out.println("atomic=" + atomic.get());
        System.out.println("plain<=20000: " + (plain <= 20000));
    }
}`, 'Java', 'locked=20000\natomic=20000\nplain<=20000: true'), java(`import java.util.concurrent.locks.ReentrantLock;

public class Main {
    static final ReentrantLock[] LOCKS = { new ReentrantLock(), new ReentrantLock() };   // index = account id - 1

    // Deadlock-free: whatever the direction of the transfer, always lock the LOWER account id first.
    static void transfer(int idFrom, int idTo, Runnable action) {
        int lo = Math.min(idFrom, idTo), hi = Math.max(idFrom, idTo);
        LOCKS[lo - 1].lock();
        try {
            LOCKS[hi - 1].lock();
            try { action.run(); } finally { LOCKS[hi - 1].unlock(); }
        } finally { LOCKS[lo - 1].unlock(); }
    }

    public static void main(String[] args) throws Exception {
        int[] moved = {0};
        Thread t1 = new Thread(() -> { for (int i = 0; i < 1000; i++) transfer(1, 2, () -> moved[0]++); });
        Thread t2 = new Thread(() -> { for (int i = 0; i < 1000; i++) transfer(2, 1, () -> moved[0]++); });
        t1.start(); t2.start(); t1.join(); t2.join();
        System.out.println("moved=" + moved[0]);            // always 2000, never deadlocks
    }
}`, 'Lock ordering avoids deadlock', 'moved=2000')] },
    { id: 'diagnose', kind: 'recognition', title: 'Diagnose from the symptom', bodyMd: `| Symptom | Likely problem | First check |
|---|---|---|
| Counter or total occasionally wrong, hard to reproduce | race condition / data race | find unsynchronised shared fields and compound actions |
| Service hangs, CPU idle, thread dump shows threads BLOCKED on each other's locks | **deadlock** | the lock cycle in \`jstack\`; enforce lock ordering |
| CPU at 100%, nothing progresses, threads RUNNABLE in retry loops | **livelock** | add randomised back-off or a tie-breaker |
| One request type or thread never completes while others run | **starvation** | lock fairness, priorities, queue discipline |
| A flag set in one thread is never noticed by another | **visibility** bug | make it \`volatile\`/atomic or synchronise |
| High-priority task is slow only when a low-priority task holds a lock | **priority inversion** | priority inheritance, shorter critical sections |
| Slowdown when adding threads | contention / false sharing / Amdahl | profile lock wait time; reduce shared state |
| Works on one core, fails on many | missing synchronisation exposed by true parallelism | review the memory-model edges |` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Saying "deadlock and starvation are the same" (a deadlock blocks everyone in the cycle forever; starvation is selective unfairness).
2. Treating \`volatile\` as atomic for \`count++\`.
3. Synchronising on different lock objects for the same data (or on \`this\` in some methods and a private lock in others).
4. Locking a method but leaving another path to the same field unsynchronised.
5. \`if (!map.containsKey(k)) map.put(k, v)\` on a concurrent map.
6. Calling callbacks or doing I/O while holding a lock.
7. "Fixing" a race with \`Thread.sleep\`.
8. Believing a test that passes once proves a concurrent program correct.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Deadlock vs livelock vs starvation?', answerMd: 'In a deadlock, threads are blocked forever waiting for each other\'s locks in a cycle. In a livelock, threads are active but keep undoing or retrying in response to each other and make no progress. In starvation, one thread is perpetually denied a resource while others proceed, usually through unfair locks or priorities. Deadlock needs all four Coffman conditions; livelock is fixed with randomised back-off; starvation with fairness or aging.' },
    { id: 'iq2', q: 'What is a race condition and how is it different from a data race?', answerMd: 'A race condition is when the correctness of a result depends on the timing of operations, for example check-then-act or a read-modify-write on shared state. A data race is the specific memory-model violation of unsynchronised concurrent access with at least one write. Code can have race conditions with fully locked accesses (if the compound action is not atomic), and data races that happen to give the right answer.' },
    { id: 'iq3', q: 'What does thread-safe mean and how do you achieve it?', answerMd: 'The code stays correct under concurrent use without extra synchronisation from callers. Prefer not sharing (thread confinement), then immutability, then proven concurrent collections and atomics, then locks guarding all access to shared mutable state with a consistent lock, and keep compound actions atomic.' },
    { id: 'iq4', q: 'What does volatile guarantee in Java?', answerMd: 'Visibility and ordering: a write to a volatile variable happens-before later reads of it, so other threads see the latest value and the writes before it. It does not make compound actions such as count++ atomic; use an atomic class or a lock for that.' },
    { id: 'iq5', q: 'How do you prevent and diagnose a deadlock?', answerMd: 'Prevent it by acquiring locks in a single global order, holding fewer locks for shorter times, using try-lock with timeouts, or avoiding nested locks entirely. Diagnose by taking a thread dump (jstack) and looking for threads blocked on each other\'s monitors; Java\'s dump prints the detected cycle.' },
  ],
  revision: { notesMd: `- Race condition = timing-dependent wrong result; data race = unsynchronised access with a write (UB in C++).
- Deadlock: blocked in a cycle (4 Coffman conditions; fix: lock ordering/timeouts). Livelock: running, no progress (random back-off). Starvation: one thread never served (fair locks, aging). Priority inversion: priority inheritance.
- Thread-safe: confine > immutable > concurrent collections/atomics > locks (same lock everywhere); beware check-then-act.
- Java: synchronized = exclusion + visibility; volatile = visibility/order, NOT atomic count++; atomics use CAS; join/start give happens-before.
- Diagnose with thread dumps (jstack); livelock = high CPU, no progress.`, flashcards: [
    { id: 'f1', front: 'Deadlock vs livelock in one line?', backMd: 'Deadlock: blocked forever in a cycle. Livelock: active but making no progress.' },
    { id: 'f2', front: 'Is `volatile int x; x++` thread-safe?', backMd: 'No: visibility yes, atomicity no. Use AtomicInteger or a lock.' },
    { id: 'f3', front: 'Easiest way to prevent lock-order deadlock?', backMd: 'Always acquire locks in a global order.' },
    { id: 'f4', front: 'What fixes priority inversion?', backMd: 'Priority inheritance.' },
    { id: 'f5', front: 'First preference for thread safety?', backMd: 'Do not share mutable state (confinement/immutability).' },
    { id: 'f6', front: 'How do you inspect a hung Java process?', backMd: 'jstack <pid> (thread dump), which reports deadlock cycles.' },
  ] },
  resources: [{ title: 'Java Tutorials: Concurrency (Oracle)', url: 'https://docs.oracle.com/javase/tutorial/essential/concurrency/', kind: 'official-docs' }, { title: 'JLS §17: Threads and Locks (the Java memory model)', url: 'https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html', kind: 'official-docs' }, { title: 'Operating Systems: Three Easy Pieces (concurrency part)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', kind: 'book' }],
});

const cqMcqs: MCQ[] = [
  mcq({ ...q(CQ), id: 'core.cq.q1', type: 'concept', difficulty: 'easy', stem: 'Two threads are stuck forever, each holding one lock and waiting for the other\'s lock. CPU use is near zero. What is this?', options: ['Deadlock', ['Livelock', 'Livelock threads are busy and burn CPU.'], ['Starvation', 'Only one thread is being denied while others progress.'], ['A data race', 'Not a blocking problem.']], answer: 0, explanation: 'A cycle of threads waiting for resources held by each other is a deadlock; the idle CPU confirms they are blocked.' }),
  mcq({ ...q(CQ), id: 'core.cq.q2', type: 'concept', difficulty: 'medium', stem: 'Two polite threads each step aside when they detect the other, then retry at the same moment, over and over, burning CPU and getting nowhere. What is this?', options: ['Livelock', ['Deadlock', 'They are not blocked; they keep running.'], ['Priority inversion', 'No lock holder with lower priority is involved.'], ['A memory leak', 'Unrelated.']], answer: 0, explanation: 'Threads are active but make no progress. Randomised back-off or a tie-breaker fixes it.' }),
  mcq({ ...q(CQ), id: 'core.cq.q3', type: 'concept', difficulty: 'medium', stem: 'Which scenario is starvation?', options: ['Readers keep arriving under a reader-preference lock, so a waiting writer never gets in', ['Two threads hold locks the other needs', 'That is deadlock.'], ['A counter loses updates', 'That is a race condition.'], ['A thread loops forever on a flag it never sees change', 'That is a visibility bug.']], answer: 0, explanation: 'The system as a whole progresses, but one thread is indefinitely denied the resource.' }),
  mcq({ ...q(CQ), id: 'core.cq.q4', type: 'concept', difficulty: 'medium', stem: 'Which is NOT one of the four conditions required for a deadlock?', options: ['Starvation of a low-priority thread', ['Mutual exclusion', 'It is one of the four.'], ['Hold and wait', 'It is one of the four.'], ['Circular wait', 'It is one of the four.']], answer: 0, explanation: 'The Coffman conditions: mutual exclusion, hold and wait, no pre-emption, circular wait.' }),
  mcq({ ...q(CQ), id: 'core.cq.q5', type: 'concept', difficulty: 'medium', stem: 'In Java, `volatile int count;` is incremented with `count++` by 4 threads. What is true?', options: ['Updates can still be lost: volatile gives visibility, not atomicity of read-modify-write', ['It is thread-safe', 'The increment is three steps: read, add, write.'], ['It is thread-safe on 64-bit JVMs only', 'Word size does not change the race.'], ['The compiler rejects it', 'It compiles.']], answer: 0, explanation: 'Use `AtomicInteger.incrementAndGet()` or a lock.' }),
  mcq({ ...q(CQ), id: 'core.cq.q6', type: 'concept', difficulty: 'medium', stem: 'Which code has a check-then-act race even though `ConcurrentHashMap` is thread-safe?', options: ['`if (!map.containsKey(k)) map.put(k, v);`', ['`map.putIfAbsent(k, v);`', 'It is a single atomic operation.'], ['`map.computeIfAbsent(k, f);`', 'Atomic for the key.'], ['`map.get(k);`', 'A single read is safe.']], answer: 0, explanation: 'Two threads can both see the key absent and both put; combine the steps into one atomic call.' }),
  mcq({ ...q(CQ), id: 'core.cq.q7', type: 'code-output', difficulty: 'medium', stem: 'Two threads each execute the loop below 10,000 times and are then joined. Which statement about the final output is correct?', code: java(`import java.util.concurrent.atomic.AtomicInteger;

public class Main {
    static final AtomicInteger n = new AtomicInteger();
    public static void main(String[] args) throws Exception {
        Runnable r = () -> { for (int i = 0; i < 10_000; i++) n.incrementAndGet(); };
        Thread a = new Thread(r), b = new Thread(r);
        a.start(); b.start();
        a.join(); b.join();
        System.out.println(n.get());
    }
}`, 'Java', '20000'), options: ['It always prints 20000', ['It prints a value between 10000 and 20000', 'incrementAndGet is atomic, so no updates are lost.'], ['It may print 0', 'Both threads are joined before the read.'], ['It does not compile', 'It compiles.']], answer: 0, explanation: 'Atomic increments cannot be lost, and join() makes the final value visible to the main thread.', verified: 'compiled' }),
  mcq({ ...q(CQ), id: 'core.cq.q8', type: 'concept', difficulty: 'hard', stem: 'A worker thread runs `while (!stop) { doWork(); }` where `stop` is a plain `boolean` set to true by another thread. Sometimes the worker never stops. Why, and what is the fix?', options: ['There is no happens-before edge, so the worker may never see the new value; declare `stop` volatile (or use an atomic/interrupt)', ['Booleans cannot be shared between threads', 'They can.'], ['The JVM schedules the worker too rarely', 'The problem is visibility, not scheduling.'], ['The method doWork is too slow', 'Unrelated.']], answer: 0, explanation: 'Without synchronisation the JIT may hoist the read of `stop` out of the loop; volatile creates the needed visibility and ordering.' }),
  mcq({ ...q(CQ), id: 'core.cq.q9', type: 'concept', difficulty: 'medium', stem: 'Two methods update the same field: one is `synchronized` on `this`, the other locks a private `lock` object. What is the problem?', options: ['They do not exclude each other, so the field is still accessed concurrently without a common lock', ['Nothing, both are locked', 'Different locks provide no mutual exclusion between them.'], ['A guaranteed deadlock', 'No cycle is created.'], ['The code will not compile', 'It compiles.']], answer: 0, explanation: 'All accesses to a piece of shared state must use the same lock.' }),
];

export const topics: Topic[] = [concurrencyQa];
export const mcqs: MCQ[] = [...cqMcqs];
