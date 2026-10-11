import type { MCQ, Resource, Topic } from '../schema';
import { cpp, mcq } from '../helpers';

const MASTERY = { testSize: 6, testMinutes: 10, passPct: 80, minIndependentSolves: 0, minMediumIndependent: 0, retentionDays: 7 };
const OSTEP: Resource = { title: 'Operating Systems: Three Easy Pieces (free book)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/', kind: 'book' };
type TopicInput = Omit<Topic, 'moduleId' | 'status' | 'mastery' | 'mcqIds' | 'problemIds' | 'related'> & { related?: string[] };
const osTopic = (t: TopicInput): Topic => ({ moduleId: 'os', status: 'complete', mastery: MASTERY, mcqIds: [], problemIds: [], related: [], ...t });
const q = (topic: string) => ({ topics: [topic], module: 'os' as const });

// ---------------------------------------------------------------------------------------
const PT = 'os.processes-threads';
const procs = osTopic({
  id: PT, title: 'Processes and Threads', level: 'foundation', estMinutes: 40, prerequisites: [],
  summary: 'Process vs thread, PCB and address spaces.',
  objectives: ['Explain what a process owns and what threads share.', 'Describe the PCB and the process state diagram.', 'Compare context switches between processes and between threads.', 'Explain fork/exec/wait at interview depth.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Process vs thread', bodyMd: `A **process** is a running program with its own **address space** (code, data, heap, stack), open files and other resources, isolated from other processes by the OS.

A **thread** is a unit of execution inside a process. Threads of the same process **share** the address space (code, globals, heap) and open files, but each has its **own stack, registers and program counter**.

| | Process | Thread |
|---|---|---|
| Memory | separate address space | shared within the process |
| Creation and switch cost | higher (new page tables, TLB effects) | lower |
| Communication | IPC (pipes, sockets, shared memory) | shared memory directly (needs synchronisation) |
| Fault isolation | a crash stays in the process | a crash can bring down every thread in the process |` },
    { id: 'pcb', kind: 'concept', title: 'PCB and process states', bodyMd: `The OS keeps a **Process Control Block** per process: PID, state, program counter and registers (saved on a switch), memory-management info (page table pointer), open files, scheduling info.

**States:** New → Ready ⇄ Running → Waiting (blocked on I/O or an event) → Ready … → Terminated. A **context switch** saves the running process's state into its PCB and loads another's. It is pure overhead; for processes it also changes the address space (page table switch, TLB flush or tagging).` },
    { id: 'fork', kind: 'example', title: 'fork, exec and wait (Unix)', bodyMd: '`fork()` creates a child that is a copy of the parent (copy-on-write in practice). It returns 0 in the child and the child\'s PID in the parent. `exec()` replaces the current program image. `wait()` lets the parent reap a child; a finished child that has not been waited on is a **zombie**, and a child whose parent died is an **orphan** (adopted by init/systemd).', code: [cpp(`#include <unistd.h>
#include <sys/wait.h>
#include <cstdio>
int main() {
    pid_t pid = fork();
    if (pid == 0) {                 // child
        execlp("ls", "ls", "-l", (char*)nullptr);
        _exit(1);                   // only reached if exec failed
    }
    waitpid(pid, nullptr, 0);       // parent waits, so no zombie remains
    std::printf("child done\\n");
    return 0;
}`, 'C++ (POSIX)')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Saying threads share their stacks (each thread has its own).
2. Saying processes cannot share memory (they can, via explicit shared memory).
3. Forgetting that fork duplicates the whole process (counting prints: n forks in sequence create 2ⁿ processes).
4. Confusing zombies (finished, not reaped) with orphans (parent gone).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Process vs thread?', answerMd: 'A process has its own address space and resources. Threads are execution units within a process that share its memory and files but have their own stacks and registers. Threads are cheaper to create and switch, and communicate via shared memory, but a bug in one can corrupt or crash the whole process.' },
    { id: 'iq2', q: 'What happens during a context switch?', answerMd: 'The kernel saves the current thread\'s registers, program counter and stack pointer into its control block, selects the next thread, and restores its state. Switching between processes also changes the page table (address space), which affects the TLB, making it costlier than a thread switch.' },
    { id: 'iq3', q: 'What are zombie and orphan processes?', answerMd: 'A zombie has exited, but its parent has not called wait(), so its PID and exit status remain in the process table. An orphan is a running process whose parent exited; it is re-parented to init/systemd, which reaps it.' },
    { id: 'iq4', q: 'How many processes exist after three fork() calls in sequence (no conditionals)?', answerMd: '2³ = 8: every existing process executes each subsequent fork.' },
  ],
  revision: { notesMd: `- A process owns an address space; threads share it (own stack and registers).
- PCB: PID, state, registers, page table, files.
- States: new, ready, running, waiting, terminated.
- fork returns 0 in the child; exec replaces the image; wait reaps.
- Zombie = exited, not reaped; orphan = parent gone.`, flashcards: [
    { id: 'f1', front: 'What do threads of one process share?', backMd: 'Code, heap and globals, open files. Not stacks or registers.' },
    { id: 'f2', front: 'fork() return value in the child?', backMd: '0 (the parent gets the child\'s PID).' },
    { id: 'f3', front: 'Processes after n sequential forks?', backMd: '2ⁿ.' },
    { id: 'f4', front: 'Zombie process?', backMd: 'It exited, but the parent has not called wait().' },
    { id: 'f5', front: 'Why is a process switch costlier than a thread switch?', backMd: 'The address space changes too (page tables, TLB).' },
  ] },
  resources: [OSTEP, { title: 'fork(2) Linux manual page', url: 'https://man7.org/linux/man-pages/man2/fork.2.html', kind: 'official-docs' }],
});

const ptMcqs: MCQ[] = [
  mcq({ ...q(PT), id: 'os.pt.q1', type: 'concept', difficulty: 'easy', stem: 'Which of these is NOT shared between threads of the same process?', options: ['The stack', ['The heap', 'All threads share the heap.'], ['Global variables', 'Shared.'], ['Open file descriptors', 'Shared.']], answer: 0, explanation: 'Each thread has its own stack (and registers and program counter).' }),
  mcq({ ...q(PT), id: 'os.pt.q2', type: 'concept', difficulty: 'medium', stem: 'A program calls `fork()` three times in a row (no if-statements). How many processes exist in total afterwards?', options: ['8', ['3', 'Each fork runs in every process that exists at that point.'], ['4', 'That would be two forks.'], ['6', 'The count doubles each time.']], answer: 0, explanation: 'Each fork doubles the number of processes: 2³ = 8.' }),
  mcq({ ...q(PT), id: 'os.pt.q3', type: 'concept', difficulty: 'easy', stem: 'A process is waiting for a disk read to complete. Which state is it in?', options: ['Waiting (blocked)', ['Ready', 'Ready means it could run if given the CPU.'], ['Running', 'It is not using the CPU.'], ['Terminated', 'It has not finished.']], answer: 0, explanation: 'It moves back to Ready when the I/O completes.' }),
  mcq({ ...q(PT), id: 'os.pt.q4', type: 'scenario', difficulty: 'medium', stem: '`ps` shows many processes in state Z (defunct). What is the likely cause?', options: ['The parent never calls wait()/waitpid(), so finished children are never reaped', ['The children are stuck in an infinite loop', 'Those would be R or S, not Z.'], ['The system is out of memory', 'Unrelated to Z.'], ['The children are orphans', 'Orphans get adopted and reaped by init.']], answer: 0, explanation: 'Zombies hold only a process-table entry; fix the parent (reap children or handle SIGCHLD).' }),
  mcq({ ...q(PT), id: 'os.pt.q5', type: 'concept', difficulty: 'medium', stem: 'Why are threads usually cheaper to switch between than processes?', options: ['Threads of the same process share an address space, so no page-table switch or TLB invalidation is needed', ['Threads do not have registers', 'They do; registers are saved and restored.'], ['The OS does not schedule threads', 'Kernel threads are scheduled by the OS.'], ['Threads never block', 'They do.']], answer: 0, explanation: 'Switching address spaces is the expensive part of a process switch.' }),
  mcq({ ...q(PT), id: 'os.pt.q6', type: 'concept', difficulty: 'easy', stem: 'Which data structure holds a process\'s saved registers, state and scheduling information?', options: ['The Process Control Block (PCB)', ['The page table', 'It holds address translations.'], ['The TLB', 'A translation cache.'], ['The stack', 'It holds call frames.']], answer: 0, explanation: 'The kernel restores the PCB contents when the process is scheduled again.' }),
];

// ---------------------------------------------------------------------------------------
const CS = 'os.cpu-scheduling';
const sched = osTopic({
  id: CS, title: 'CPU Scheduling', level: 'core', estMinutes: 55, prerequisites: ['os.process-states'],
  summary: 'FCFS, SJF, SRTF, priority and round robin; metrics and starvation.',
  objectives: ['Compute completion, turnaround, waiting and response times by hand (Gantt chart).', 'Compare FCFS, SJF, SRTF, priority and round robin.', 'Explain the convoy effect, starvation and aging.', 'Discuss the effect of the time quantum in round robin.'],
  sections: [
    { id: 'metrics', kind: 'concept', title: 'Metrics', bodyMd: `- **Turnaround time** = completion − arrival.
- **Waiting time** = turnaround − burst (time spent ready, not running).
- **Response time** = first time on the CPU − arrival (matters for interactive systems).
- **Throughput** = jobs completed per unit of time; **CPU utilisation** = fraction of time the CPU is busy.

Solve exam problems by drawing a **Gantt chart** first, then reading completion times from it. Check your work with the **CPU scheduling simulator** on the Tools page.` },
    { id: 'algos', kind: 'comparison', title: 'Algorithms', bodyMd: `| Algorithm | Preemptive? | Notes |
|---|---|---|
| FCFS | no | simple; **convoy effect** (short jobs wait behind a long one) |
| SJF | no | optimal average waiting time if bursts are known; long jobs can starve |
| SRTF | yes | preemptive SJF: switch when a shorter job arrives; optimal average waiting time |
| Priority | either | **starvation** of low priority; fix with **aging** (raise priority over time) |
| Round Robin | yes | time quantum q; good response time; q too large means FCFS, too small means context-switch overhead |
| Multilevel (feedback) queue | yes | separate queues by class or behaviour; interactive jobs stay high priority |

Burst times are not known in advance; real systems estimate them (exponential averaging of past bursts).` },
    { id: 'dry-run', kind: 'dry-run', title: 'Worked example: SRTF', bodyMd: `P1 (arrival 0, burst 8), P2 (1, 4), P3 (2, 9), P4 (3, 5).

- t = 0: only P1, which runs. At t = 1, P2 arrives with 4 < 7 remaining for P1, so P2 preempts.
- P2 runs 1→5. At t = 5 the remaining times are P1 7, P3 9, P4 5, so P4 runs 5→10.
- P1 runs 10→17, then P3 runs 17→26.
- Waiting: P1 = 17 − 0 − 8 = 9, P2 = 5 − 1 − 4 = 0, P3 = 26 − 2 − 9 = 15, P4 = 10 − 3 − 5 = 2. **Average = 26 / 4 = 6.5.**` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Computing waiting time without subtracting the arrival time.
2. In round robin, inconsistent queue order when a new process arrives at the same moment the running one is preempted (state the convention; the simulator puts new arrivals first).
3. Forgetting idle CPU periods when no process has arrived yet.
4. Assuming SJF is practical without knowing burst lengths.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Which scheduling algorithm minimises average waiting time?', answerMd: 'SJF (non-preemptive) for jobs available at the same time, and SRTF (preemptive) in general, provided burst times are known. In practice bursts are estimated, and these algorithms can starve long jobs.' },
    { id: 'iq2', q: 'What is the convoy effect?', answerMd: 'In FCFS, many short jobs wait behind one long CPU-bound job, inflating average waiting time and leaving I/O devices idle.' },
    { id: 'iq3', q: 'How does round robin\'s quantum affect performance?', answerMd: 'A very large quantum makes it behave like FCFS (poor response time). A very small quantum gives good responsiveness but excessive context-switch overhead. Typical quanta are in the 10–100 ms range, larger than the switch cost.' },
    { id: 'iq4', q: 'What is starvation and how is it prevented?', answerMd: 'A process waits indefinitely because others keep being chosen (low priority, long jobs). Aging gradually increases the priority of waiting processes until they run.' },
  ],
  revision: { notesMd: `- TAT = CT − AT; WT = TAT − BT; RT = first run − AT.
- FCFS: convoy effect. SJF/SRTF: optimal average WT, starvation.
- Priority + aging prevents starvation.
- RR: quantum trade-off (FCFS-like vs overhead).
- Draw the Gantt chart first.`, flashcards: [
    { id: 'f1', front: 'Waiting time formula?', backMd: 'Turnaround − burst = (completion − arrival) − burst.' },
    { id: 'f2', front: 'Preemptive version of SJF?', backMd: 'SRTF (shortest remaining time first).' },
    { id: 'f3', front: 'Cure for starvation in priority scheduling?', backMd: 'Aging.' },
    { id: 'f4', front: 'RR with a huge quantum behaves like?', backMd: 'FCFS.' },
    { id: 'f5', front: 'Convoy effect occurs in?', backMd: 'FCFS: short jobs stuck behind a long one.' },
  ] },
  resources: [OSTEP, { title: 'Scheduling: Introduction (OSTEP chapter)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-sched.pdf', kind: 'book' }],
});

const csMcqs: MCQ[] = [
  mcq({ ...q(CS), id: 'os.cs.q1', type: 'scenario', difficulty: 'medium', stem: 'P1 (burst 24), P2 (3), P3 (3) all arrive at t = 0 in that order. Average waiting time under FCFS?', options: ['17', ['3', 'That is SJF order (P2, P3, P1).'], ['0', 'Only P1 waits 0.'], ['27', 'That is P3\'s waiting time alone.']], answer: 0, explanation: 'Waiting times: P1 0, P2 24, P3 27, so the average is 51 / 3 = 17.' }),
  mcq({ ...q(CS), id: 'os.cs.q2', type: 'scenario', difficulty: 'medium', stem: 'Same processes (P1 24, P2 3, P3 3, all at t = 0), round robin with quantum 4. Average waiting time?', options: ['About 5.67', ['17', 'That is FCFS.'], ['3', 'That is SJF.'], ['10', 'Check the Gantt chart: P1 waits 6, P2 4, P3 7.']], answer: 0, explanation: 'Gantt: P1 0–4, P2 4–7, P3 7–10, then P1 runs to 30. Waiting: P1 = 30 − 24 = 6, P2 = 4, P3 = 7; average 17/3 ≈ 5.67.' }),
  mcq({ ...q(CS), id: 'os.cs.q3', type: 'scenario', difficulty: 'hard', stem: 'P1 (arrival 0, burst 8), P2 (1, 4), P3 (2, 9), P4 (3, 5). Average waiting time under SRTF?', options: ['6.5', ['7.75', 'That is non-preemptive SJF.'], ['8.75', 'That is FCFS.'], ['5.0', 'Recompute: waits are 9, 0, 15, 2.']], answer: 0, explanation: 'Gantt: P1 0–1, P2 1–5, P4 5–10, P1 10–17, P3 17–26. Waits: 9, 0, 15, 2, average 6.5.' }),
  mcq({ ...q(CS), id: 'os.cs.q4', type: 'concept', difficulty: 'easy', stem: 'Which problem is aging designed to solve?', options: ['Starvation in priority scheduling', ['The convoy effect', 'That is an FCFS issue.'], ['Thrashing', 'A memory issue.'], ['Deadlock', 'A resource-allocation issue.']], answer: 0, explanation: 'Waiting processes gradually gain priority until they run.' }),
  mcq({ ...q(CS), id: 'os.cs.q5', type: 'concept', difficulty: 'medium', stem: 'What happens to round robin as the quantum becomes very large?', options: ['It degenerates to FCFS', ['It becomes SJF', 'It does not consider burst length.'], ['Context-switch overhead explodes', 'That happens with a tiny quantum.'], ['Response time improves', 'Response time gets worse.']], answer: 0, explanation: 'Each process finishes its burst within one quantum, which is FCFS order.' }),
  mcq({ ...q(CS), id: 'os.cs.q6', type: 'concept', difficulty: 'medium', stem: 'Why is pure SJF hard to implement in a real OS?', options: ['The length of the next CPU burst is unknown; it can only be estimated', ['It needs too much memory', 'Memory is not the issue.'], ['It is non-deterministic', 'It is deterministic given bursts.'], ['It cannot handle I/O', 'I/O just ends bursts.']], answer: 0, explanation: 'Systems approximate it with exponential averaging of previous bursts.' }),
];

// ---------------------------------------------------------------------------------------
const SY = 'os.synchronisation';
const sync = osTopic({
  id: SY, title: 'Synchronisation', level: 'core', estMinutes: 55, prerequisites: [PT],
  summary: 'Race conditions, critical sections, mutexes, semaphores and condition variables.',
  objectives: ['Explain race conditions with the read-modify-write example.', 'State the critical-section requirements (mutual exclusion, progress, bounded waiting).', 'Choose between a mutex, a semaphore and a condition variable.', 'Write a bounded producer-consumer with condition variables.'],
  sections: [
    { id: 'race', kind: 'concept', title: 'Race conditions', bodyMd: `\`count++\` is not atomic: it is *load, add, store*. Two threads can both load 5, both add 1 and both store 6, losing an increment. The result depends on timing: a **race condition**.

A **critical section** is code that accesses shared state. A correct solution needs:
1. **Mutual exclusion:** at most one thread inside at a time.
2. **Progress:** if no one is inside, a waiting thread can enter (no needless blocking).
3. **Bounded waiting:** no thread waits forever (no starvation).` },
    { id: 'tools', kind: 'comparison', title: 'Mutex, semaphore, condition variable', bodyMd: `| Tool | What it does | Typical use |
|---|---|---|
| **Mutex (lock)** | one owner at a time; the owner must unlock | protect a critical section |
| **Counting semaphore** | integer counter; wait (P) decrements and blocks at 0, signal (V) increments | limit concurrency to N (connection pool), count free slots |
| **Binary semaphore** | counter of 0/1 | signalling; similar to a mutex but without ownership |
| **Condition variable** | wait until a condition becomes true; always used with a mutex | producer-consumer, "wait until queue not empty" |
| **Spinlock** | busy-waits | very short critical sections on multicore |

Always wait on a condition variable **in a loop** (\`while (!cond) cv.wait(lock)\`), because of spurious wake-ups and other threads changing the state first.` },
    { id: 'code', kind: 'code', title: 'Bounded buffer (producer-consumer)', bodyMd: 'The classic: producers block when the buffer is full, consumers when it is empty.', code: [cpp(`#include <condition_variable>
#include <mutex>
#include <queue>
class BoundedQueue {
    std::queue<int> q;
    size_t cap;
    std::mutex m;
    std::condition_variable notFull, notEmpty;
public:
    explicit BoundedQueue(size_t c) : cap(c) {}
    void put(int x) {
        std::unique_lock<std::mutex> lk(m);
        notFull.wait(lk, [&] { return q.size() < cap; });    // loop handled by the predicate
        q.push(x);
        notEmpty.notify_one();
    }
    int take() {
        std::unique_lock<std::mutex> lk(m);
        notEmpty.wait(lk, [&] { return !q.empty(); });
        int x = q.front(); q.pop();
        notFull.notify_one();
        return x;
    }
};`, 'C++')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Assuming \`x++\` or \`if (!ready) ready = true\` is atomic.
2. Waiting on a condition variable with \`if\` instead of \`while\`.
3. Forgetting to release a lock on an early return or exception (use RAII guards).
4. Using a semaphore where a mutex's ownership semantics are needed.
5. Holding a lock while doing slow I/O.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Mutex vs semaphore?', answerMd: 'A mutex provides mutual exclusion with ownership: only the thread that locked it should unlock it. A semaphore is a counter allowing up to N concurrent holders and can be signalled by any thread, which suits resource counting and signalling.' },
    { id: 'iq2', q: 'What is a race condition? Give an example.', answerMd: 'A bug where the result depends on the interleaving of threads. Example: two threads incrementing a shared counter without a lock lose updates, because increment is a read-modify-write sequence.' },
    { id: 'iq3', q: 'Why must condition-variable waits be in a loop?', answerMd: 'Wake-ups can be spurious, and another thread may consume the state between the notify and the waiter re-acquiring the mutex. Re-checking the predicate in a loop guarantees the condition actually holds.' },
    { id: 'iq4', q: 'What are the three requirements for a critical-section solution?', answerMd: 'Mutual exclusion, progress (no needless blocking when the section is free) and bounded waiting (no starvation).' },
  ],
  revision: { notesMd: `- count++ = load + add + store, so it is not atomic.
- Critical section: mutual exclusion, progress, bounded waiting.
- Mutex: ownership. Semaphore: counter (wait/P, signal/V). CV: wait for a condition with a mutex.
- Always \`while (!cond) wait\`.
- Use RAII lock guards.`, flashcards: [
    { id: 'f1', front: 'Why is `x++` racy?', backMd: 'It is a non-atomic read-modify-write.' },
    { id: 'f2', front: 'Semaphore wait (P) does?', backMd: 'Decrements, blocking while the value is 0.' },
    { id: 'f3', front: 'Condition variable must be used with?', backMd: 'A mutex, and a predicate checked in a loop.' },
    { id: 'f4', front: 'Limit concurrency to 5 workers?', backMd: 'A counting semaphore initialised to 5.' },
    { id: 'f5', front: 'Critical section requirements?', backMd: 'Mutual exclusion, progress, bounded waiting.' },
  ] },
  resources: [OSTEP, { title: 'std::condition_variable (cppreference)', url: 'https://en.cppreference.com/w/cpp/thread/condition_variable', kind: 'official-docs' }],
});

const syMcqs: MCQ[] = [
  mcq({ ...q(SY), id: 'os.sy.q1', type: 'scenario', difficulty: 'easy', stem: 'Two threads each run `count++` 1000 times on a shared int (initially 0) without locking. Which final values are possible?', options: ['Any value from a small number up to 2000; 2000 is not guaranteed', ['Always 2000', 'Increments can be lost.'], ['Always 1000', 'Not deterministic.'], ['Always 0', 'Some increments survive.']], answer: 0, explanation: 'Interleaved load-add-store sequences lose updates; the exact result varies per run.' }),
  mcq({ ...q(SY), id: 'os.sy.q2', type: 'concept', difficulty: 'medium', stem: 'A database connection pool allows at most 10 concurrent connections. Which primitive fits best?', options: ['A counting semaphore initialised to 10', ['A mutex', 'It allows only one holder.'], ['A spinlock', 'It allows one holder and wastes CPU.'], ['A condition variable alone', 'It needs a mutex and a counter.']], answer: 0, explanation: 'Each acquire decrements; the 11th caller blocks until someone releases.' }),
  mcq({ ...q(SY), id: 'os.sy.q3', type: 'debug', difficulty: 'medium', stem: 'A consumer does `if (queue.empty()) cv.wait(lock); item = queue.front();` and occasionally crashes on an empty queue. Why?', options: ['A spurious wake-up, or another consumer emptying the queue first; the check must be a while loop', ['cv.wait releases the lock permanently', 'It re-acquires the lock before returning.'], ['notify_one wakes all threads', 'That is notify_all, and either way the fix is the loop.'], ['The queue must be a stack', 'Unrelated.']], answer: 0, explanation: 'Re-check the condition after waking: while (queue.empty()) cv.wait(lock);' }),
  mcq({ ...q(SY), id: 'os.sy.q4', type: 'concept', difficulty: 'medium', stem: 'Which property is violated if one thread can be overtaken indefinitely while trying to enter a critical section?', options: ['Bounded waiting', ['Mutual exclusion', 'Only one thread is inside at a time; that still holds.'], ['Progress', 'Others are making progress.'], ['Atomicity', 'Not one of the three requirements.']], answer: 0, explanation: 'Bounded waiting limits how many times others can enter before a waiting thread does.' }),
  mcq({ ...q(SY), id: 'os.sy.q5', type: 'concept', difficulty: 'easy', stem: 'What is the key difference between a mutex and a binary semaphore?', options: ['A mutex has ownership (the locker unlocks); a semaphore can be signalled by any thread', ['A semaphore cannot block', 'It blocks at 0.'], ['A mutex allows several holders', 'It allows one.'], ['There is no difference', 'Ownership semantics differ.']], answer: 0, explanation: 'Ownership enables features such as priority inheritance and error checking.' }),
  mcq({ ...q(SY), id: 'os.sy.q6', type: 'scenario', difficulty: 'medium', stem: 'A thread holds a lock while making a 2-second network call. What is the main problem?', options: ['Every other thread needing the lock is blocked for the duration (poor throughput, risk of cascading timeouts)', ['The lock is released automatically after 1 second', 'Locks do not time out by default.'], ['The network call becomes atomic', 'Locks do not make I/O atomic.'], ['Nothing, as long as it is a mutex', 'The type of lock does not fix long hold times.']], answer: 0, explanation: 'Keep critical sections short; do slow I/O outside the lock.' }),
];

// ---------------------------------------------------------------------------------------
const DL = 'os.deadlocks';
const deadlocks = osTopic({
  id: DL, title: 'Deadlocks', level: 'core', estMinutes: 45, prerequisites: [SY],
  summary: "Coffman conditions, prevention, avoidance (Banker's), detection.",
  objectives: ['State the four Coffman conditions and show that breaking any one prevents deadlock.', 'Prevent deadlocks with lock ordering in real code.', 'Run the Banker\'s safety algorithm by hand.', 'Distinguish deadlock, livelock and starvation.'],
  sections: [
    { id: 'conditions', kind: 'concept', title: 'The four necessary conditions', bodyMd: `A deadlock can occur only if **all four** hold simultaneously:
1. **Mutual exclusion:** resources are non-shareable.
2. **Hold and wait:** a process holds resources while waiting for more.
3. **No preemption:** resources cannot be taken away forcibly.
4. **Circular wait:** a cycle of processes, each waiting for a resource held by the next.

**Prevention** breaks one condition. The most practical is breaking circular wait with a **global lock ordering** (always lock A before B). Breaking hold-and-wait means acquiring all resources at once.` },
    { id: 'avoidance', kind: 'concept', title: "Avoidance: Banker's algorithm", bodyMd: `Each process declares its maximum need. A state is **safe** if there is some order in which every process can obtain its remaining need and finish.

Safety check: Work = Available. Repeatedly find an unfinished process whose Need ≤ Work; pretend it finishes (Work += its Allocation). If every process can finish, the state is safe. Grant a request only if the resulting state is safe.

**Detection and recovery:** allow deadlocks, detect cycles in the wait-for graph periodically, then recover by aborting or preempting a victim. This is what databases do.` },
    { id: 'code', kind: 'example', title: 'Lock ordering in code', bodyMd: 'Two transfers in opposite directions can deadlock if each locks its "from" account first. Locking by a consistent order (for example, lower account id first) removes the circular wait.', code: [cpp(`#include <mutex>
struct Account { int id; long balance; std::mutex m; };
void transfer(Account& a, Account& b, long amt) {
    Account& first  = (a.id < b.id) ? a : b;       // global order by id
    Account& second = (a.id < b.id) ? b : a;
    std::lock_guard<std::mutex> l1(first.m);
    std::lock_guard<std::mutex> l2(second.m);
    a.balance -= amt;
    b.balance += amt;
}`, 'C++')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Deadlock vs livelock vs starvation', bodyMd: `- **Deadlock:** processes are blocked forever waiting on each other; no progress, no CPU use.
- **Livelock:** processes keep changing state in response to each other (both repeatedly back off and retry) but make no progress, while using the CPU.
- **Starvation:** some process waits indefinitely while others progress.

A common mistake is "fixing" deadlock with retries that cause livelock; add randomised back-off.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What are the four necessary conditions for deadlock?', answerMd: 'Mutual exclusion, hold and wait, no preemption, and circular wait. All four must hold; preventing any one prevents deadlock.' },
    { id: 'iq2', q: 'How do you prevent deadlocks in multithreaded code?', answerMd: 'Impose a global lock-acquisition order (breaks circular wait), acquire all locks at once (std::lock / std::scoped_lock), use try-lock with back-off, keep critical sections small, and avoid calling unknown code while holding locks.' },
    { id: 'iq3', q: 'Explain the Banker\'s algorithm in one minute.', answerMd: 'It is an avoidance algorithm: before granting a request, simulate it and check whether the system remains in a safe state, meaning some ordering lets every process obtain its maximum need and finish. If not, the request waits.' },
    { id: 'iq4', q: 'Deadlock vs livelock?', answerMd: 'In deadlock, threads are blocked waiting forever. In livelock, threads are active but keep reacting to each other without progress (for example, both repeatedly releasing and retrying locks in lock-step).' },
  ],
  revision: { notesMd: `- Coffman: mutual exclusion, hold and wait, no preemption, circular wait.
- Prevention: break one (lock ordering is the practical choice).
- Avoidance: Banker's safe-state check.
- Detection: wait-for graph cycle, then recover by killing or preempting.
- Livelock = active without progress; starvation = one process never served.`, flashcards: [
    { id: 'f1', front: 'Four deadlock conditions?', backMd: 'Mutual exclusion, hold and wait, no preemption, circular wait.' },
    { id: 'f2', front: 'Most practical prevention in code?', backMd: 'A global lock ordering (no circular wait).' },
    { id: 'f3', front: 'Safe state?', backMd: 'Some order exists in which every process can finish with the available plus released resources.' },
    { id: 'f4', front: 'How do databases handle deadlocks?', backMd: 'Detect cycles in the wait-for graph and abort a victim transaction.' },
    { id: 'f5', front: 'Livelock?', backMd: 'Threads keep changing state but make no progress.' },
  ] },
  resources: [OSTEP, { title: "Banker's algorithm (Wikipedia)", url: "https://en.wikipedia.org/wiki/Banker%27s_algorithm", kind: 'article' }],
});

const dlMcqs: MCQ[] = [
  mcq({ ...q(DL), id: 'os.dl.q1', type: 'concept', difficulty: 'easy', stem: 'Requiring every thread to acquire locks in a fixed global order prevents deadlock by eliminating which condition?', options: ['Circular wait', ['Mutual exclusion', 'Locks are still exclusive.'], ['Hold and wait', 'Threads still hold one lock while waiting for the next.'], ['No preemption', 'Locks still cannot be taken away.']], answer: 0, explanation: 'With a total order no cycle of waiting can form.' }),
  mcq({ ...q(DL), id: 'os.dl.q2', type: 'scenario', difficulty: 'hard', stem: 'Available = 3. P1 holds 2 and may need 4 more; P2 holds 3 and may need 2 more; P3 holds 2 and may need 7 more. Is the state safe?', options: ['Yes: P2 can finish (2 ≤ 3), then P1 (4 ≤ 6), then P3 (7 ≤ 8)', ['No: P3 needs 7 > 3', 'Others can finish first and release resources.'], ['No: total need exceeds available', 'Safety depends on an ordering, not totals.'], ['Cannot be determined', 'The safety algorithm decides it.']], answer: 0, explanation: 'Work 3 → P2 finishes (work 6) → P1 (work 8) → P3 (needs 7 ≤ 8). Safe sequence: P2, P1, P3.' }),
  mcq({ ...q(DL), id: 'os.dl.q3', type: 'scenario', difficulty: 'medium', stem: 'Thread A locks X then Y; thread B locks Y then X. What can happen?', options: ['Deadlock: A holds X waiting for Y while B holds Y waiting for X', ['Livelock', 'Nobody is retrying.'], ['Nothing; mutexes prevent this', 'Mutexes cause it.'], ['A data race', 'The data is protected; the issue is the waiting.']], answer: 0, explanation: 'Opposite lock orders create a circular wait.' }),
  mcq({ ...q(DL), id: 'os.dl.q4', type: 'concept', difficulty: 'medium', stem: 'Two people in a corridor keep stepping aside in the same direction at the same time, forever. This illustrates:', options: ['Livelock', ['Deadlock', 'They are not blocked; they keep moving.'], ['Starvation of one person only', 'Both fail to progress.'], ['A race condition', 'Not the defining concept here.']], answer: 0, explanation: 'Active but no progress; randomised back-off breaks the symmetry.' }),
  mcq({ ...q(DL), id: 'os.dl.q5', type: 'concept', difficulty: 'medium', stem: 'Which approach do most relational databases use for deadlocks between transactions?', options: ['Detection (wait-for graph or timeouts) and aborting a victim transaction', ["Banker's algorithm", 'Transactions do not declare maximum needs in advance.'], ['Preventing mutual exclusion', 'Write locks must be exclusive.'], ['Ignoring them', 'They are detected and resolved.']], answer: 0, explanation: 'The victim is rolled back and the application retries.' }),
  mcq({ ...q(DL), id: 'os.dl.q6', type: 'concept', difficulty: 'easy', stem: 'Requiring a process to request all resources at once before starting breaks which condition?', options: ['Hold and wait', ['Circular wait', 'That is broken by ordering.'], ['No preemption', 'That is broken by taking resources away.'], ['Mutual exclusion', 'Resources remain exclusive.']], answer: 0, explanation: 'A process never holds some resources while waiting for others. The downside is low utilisation.' }),
];

// ---------------------------------------------------------------------------------------
const VM = 'os.virtual-memory';
const vmem = osTopic({
  id: VM, title: 'Virtual Memory', level: 'core', estMinutes: 55, prerequisites: ['os.memory-management'],
  summary: 'Demand paging, page faults, TLB and thrashing.',
  objectives: ['Translate a virtual address into page number and offset.', 'Explain page faults and demand paging.', 'Compute effective access time with a TLB.', 'Explain thrashing and the working set.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Why virtual memory', bodyMd: `Each process sees a private, contiguous **virtual address space**. The MMU translates virtual pages to physical frames using the **page table**. Benefits: isolation, programs larger than RAM, shared libraries mapped once, copy-on-write fork.

**Address split:** with page size 2^k bytes, the lower k bits are the **offset** and the upper bits are the **page number**. For 4 KB pages (2¹²), virtual address 0x3A7F has page number 0x3 and offset 0xA7F.` },
    { id: 'faults', kind: 'concept', title: 'Demand paging and page faults', bodyMd: `Pages are loaded only when touched. Accessing a page that is not in memory raises a **page fault**: the OS finds a free frame (or evicts one using a replacement policy), reads the page from disk, updates the page table and restarts the instruction.

**Thrashing:** if processes do not have enough frames for their **working set** (the pages actively used), they fault constantly and spend more time paging than computing. CPU utilisation collapses. Fixes: reduce the degree of multiprogramming, add RAM, or improve locality.` },
    { id: 'tlb', kind: 'concept', title: 'TLB and effective access time', bodyMd: `The **TLB** is a small cache of recent page-table entries. On a TLB hit the translation is immediate; on a miss the page table is walked (one or more memory accesses).

Effective access time (single-level page table, no page faults):
**EAT = h × (t_TLB + t_mem) + (1 − h) × (t_TLB + 2·t_mem)**

Example: TLB 10 ns, memory 100 ns, hit ratio 0.9: EAT = 0.9 × 110 + 0.1 × 210 = 99 + 21 = **120 ns**.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Confusing a page (virtual) with a frame (physical).
2. Forgetting that a TLB miss needs an extra memory access for the page table.
3. Thinking more processes always increases throughput (thrashing).
4. Mixing up internal fragmentation (paging, the last page partly used) with external fragmentation (segmentation or contiguous allocation).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What happens on a page fault?', answerMd: 'The MMU traps to the OS. The OS checks the access is valid, finds a free frame (evicting one if needed, writing it back if dirty), reads the page from disk, updates the page table, and restarts the faulting instruction.' },
    { id: 'iq2', q: 'What is the TLB and why does it matter?', answerMd: 'A small, fast cache of virtual-to-physical translations. Without it, every memory access would also need page-table lookups. Hit rates are typically above 99% thanks to locality.' },
    { id: 'iq3', q: 'What is thrashing?', answerMd: 'A state where the combined working sets exceed physical memory, so processes page-fault continuously and the system does almost no useful work. Fix it by reducing multiprogramming or adding memory.' },
    { id: 'iq4', q: 'Paging vs segmentation?', answerMd: 'Paging divides memory into fixed-size pages and frames (no external fragmentation, some internal fragmentation). Segmentation uses variable-sized logical segments (code, stack), which is natural for protection but causes external fragmentation. Many systems combine them.' },
  ],
  revision: { notesMd: `- Virtual address = page number + offset (offset bits = log₂ page size).
- Page fault: load the page on first touch (demand paging).
- EAT = h(t_TLB + t_mem) + (1 − h)(t_TLB + 2t_mem).
- Thrashing when working sets exceed RAM.
- Paging: internal fragmentation; segmentation: external.`, flashcards: [
    { id: 'f1', front: 'Offset bits for 4 KB pages?', backMd: '12.' },
    { id: 'f2', front: 'EAT with TLB 10 ns, memory 100 ns, hit ratio 0.9?', backMd: '0.9 × 110 + 0.1 × 210 = 120 ns.' },
    { id: 'f3', front: 'Thrashing?', backMd: 'Excessive paging because working sets do not fit in memory.' },
    { id: 'f4', front: 'Page vs frame?', backMd: 'A page is virtual; a frame is a physical memory slot.' },
    { id: 'f5', front: 'Fragmentation in paging?', backMd: 'Internal (unused part of the last page).' },
  ] },
  resources: [OSTEP, { title: 'Paging: Faster Translations (TLBs) (OSTEP chapter)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-tlbs.pdf', kind: 'book' }],
});

const vmMcqs: MCQ[] = [
  mcq({ ...q(VM), id: 'os.vm.q1', type: 'concept', difficulty: 'medium', stem: 'With 4 KB pages, what are the page number and offset of virtual address 0x3A7F?', options: ['Page 0x3, offset 0xA7F', ['Page 0x3A, offset 0x7F', 'A 4 KB page needs a 12-bit (3 hex digit) offset.'], ['Page 0xA7F, offset 0x3', 'Reversed.'], ['Page 0x3A7, offset 0xF', 'The offset is 12 bits, not 4.']], answer: 0, explanation: '4 KB = 2¹², so the low 12 bits (0xA7F) are the offset and the rest (0x3) is the page number.' }),
  mcq({ ...q(VM), id: 'os.vm.q2', type: 'scenario', difficulty: 'medium', stem: 'TLB lookup 10 ns, memory access 100 ns, TLB hit ratio 0.9, single-level page table. Effective access time?', options: ['120 ns', ['110 ns', 'That ignores TLB misses.'], ['200 ns', 'That assumes every access misses.'], ['100 ns', 'That ignores translation cost.']], answer: 0, explanation: '0.9 × (10 + 100) + 0.1 × (10 + 200) = 99 + 21 = 120 ns.' }),
  mcq({ ...q(VM), id: 'os.vm.q3', type: 'scenario', difficulty: 'medium', stem: 'After increasing the number of running processes, CPU utilisation drops sharply and the disk is constantly busy. Most likely cause?', options: ['Thrashing: the working sets no longer fit in memory', ['A deadlock', 'Deadlocked processes would not keep the disk busy.'], ['The convoy effect', 'A CPU-scheduling issue with different symptoms.'], ['Too large a TLB', 'TLB size does not cause this.']], answer: 0, explanation: 'Processes spend their time waiting on page faults. Reduce multiprogramming.' }),
  mcq({ ...q(VM), id: 'os.vm.q4', type: 'concept', difficulty: 'easy', stem: 'Paging suffers from which kind of fragmentation?', options: ['Internal fragmentation', ['External fragmentation', 'Fixed-size frames avoid external fragmentation.'], ['Both equally', 'Paging avoids external fragmentation.'], ['Neither', 'The last page of a segment is partly unused.']], answer: 0, explanation: 'On average half a page per allocation is wasted.' }),
  mcq({ ...q(VM), id: 'os.vm.q5', type: 'concept', difficulty: 'medium', stem: 'A 32-bit virtual address space with 4 KB pages and 4-byte page-table entries needs how large a single-level page table per process?', options: ['4 MB', ['4 KB', 'There are 2²⁰ entries.'], ['1 MB', 'Each entry is 4 bytes.'], ['16 MB', 'Recompute: 2²⁰ × 4 B = 4 MB.']], answer: 0, explanation: '2³² / 2¹² = 2²⁰ pages × 4 B = 4 MB, which is why multi-level page tables are used.' }),
  mcq({ ...q(VM), id: 'os.vm.q6', type: 'concept', difficulty: 'easy', stem: 'What does demand paging mean?', options: ['A page is loaded into memory only when it is first accessed', ['All pages are loaded at program start', 'That is the opposite.'], ['Pages are loaded in alphabetical order', 'Not meaningful.'], ['The user demands pages via system calls', 'It is automatic.']], answer: 0, explanation: 'The first access causes a page fault that brings the page in.' }),
];

// ---------------------------------------------------------------------------------------
const PR = 'os.page-replacement';
const pageRepl = osTopic({
  id: PR, title: 'Page Replacement', level: 'core', estMinutes: 40, prerequisites: [VM],
  summary: "FIFO, LRU, Optimal, Clock and Belady's anomaly.",
  objectives: ['Simulate FIFO, LRU and Optimal by hand and count faults.', "Explain Belady's anomaly and which algorithms suffer from it.", 'Describe Clock (second chance) as a practical LRU approximation.'],
  sections: [
    { id: 'algos', kind: 'comparison', title: 'Algorithms', bodyMd: `| Algorithm | Evicts | Notes |
|---|---|---|
| **FIFO** | the page loaded earliest | simple; suffers from Belady's anomaly |
| **Optimal (OPT/MIN)** | the page used farthest in the future | provably fewest faults; needs the future, so it is a benchmark only |
| **LRU** | the page least recently used | good approximation of OPT; expensive to implement exactly |
| **Clock / second chance** | circular scan using reference bits | practical LRU approximation used by real OSes |

**Belady's anomaly:** with FIFO, giving a process **more** frames can cause **more** faults. LRU and OPT are *stack algorithms* and never show it.` },
    { id: 'dry-run', kind: 'dry-run', title: 'Worked example', bodyMd: `Reference string 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1 with 3 frames gives **FIFO 15 faults, LRU 12, Optimal 9**. Try it in the page-replacement simulator (Tools page) and step through each eviction.

Belady's anomaly: the string 1 2 3 4 1 2 5 1 2 3 4 5 with FIFO gives **9 faults with 3 frames but 10 with 4 frames**.` },
    { id: 'clock', kind: 'concept', title: 'Clock algorithm', bodyMd: 'Each frame has a reference bit set by hardware on access. A "hand" sweeps the frames: if the bit is 1, clear it and move on (a second chance); if it is 0, evict that page. Frequently used pages keep getting their bit set and survive.' },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Counting hits as faults or forgetting the initial compulsory faults when frames are empty.
2. In LRU, updating recency only on faults (every access counts).
3. Assuming more frames always means fewer faults (Belady's anomaly with FIFO).
4. Confusing OPT ("farthest in the future") with LRU ("least recently in the past").` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Why is the optimal algorithm not used in practice?', answerMd: 'It needs to know the future reference string. It is used as a benchmark to evaluate real algorithms.' },
    { id: 'iq2', q: 'What is Belady\'s anomaly?', answerMd: 'Increasing the number of frames increases the number of page faults for some reference strings under FIFO. Stack algorithms such as LRU and OPT never show it.' },
    { id: 'iq3', q: 'How do OSes approximate LRU cheaply?', answerMd: 'Using hardware reference bits and the clock (second-chance) algorithm, or aging counters, instead of timestamps on every access.' },
    { id: 'iq4', q: 'How would you implement an LRU cache in an interview?', answerMd: 'A hash map from key to a node in a doubly linked list ordered by recency. A hit moves the node to the front; insertion at capacity evicts the tail. O(1) per operation.' },
  ],
  revision: { notesMd: `- FIFO: evict the oldest load; Belady's anomaly.
- OPT: evict the page used farthest in the future (benchmark only).
- LRU: evict the least recently used; no anomaly.
- Clock: reference bits and a second chance.
- 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1 with 3 frames: FIFO 15, LRU 12, OPT 9.`, flashcards: [
    { id: 'f1', front: 'Which algorithm has Belady\'s anomaly?', backMd: 'FIFO.' },
    { id: 'f2', front: 'OPT evicts?', backMd: 'The page whose next use is farthest in the future.' },
    { id: 'f3', front: 'Clock algorithm second chance?', backMd: 'If the reference bit is 1, clear it and skip; evict the first page with bit 0.' },
    { id: 'f4', front: 'LRU cache data structures?', backMd: 'Hash map plus doubly linked list.' },
    { id: 'f5', front: 'Belady example string and frames?', backMd: '1 2 3 4 1 2 5 1 2 3 4 5: FIFO gives 9 faults with 3 frames and 10 with 4.' },
  ] },
  resources: [OSTEP, { title: 'Beyond Physical Memory: Policies (OSTEP chapter)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys-policy.pdf', kind: 'book' }],
});

const prMcqs: MCQ[] = [
  mcq({ ...q(PR), id: 'os.pr.q1', type: 'scenario', difficulty: 'medium', stem: 'Reference string 7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1 with 3 frames. How many page faults does LRU produce?', options: ['12', ['15', 'That is FIFO.'], ['9', 'That is Optimal.'], ['20', 'There are hits as well.']], answer: 0, explanation: 'LRU gives 12 faults on this classic string (FIFO 15, Optimal 9). Verify in the simulator.' }),
  mcq({ ...q(PR), id: 'os.pr.q2', type: 'concept', difficulty: 'medium', stem: 'Which statement about Belady\'s anomaly is true?', options: ['FIFO can produce more faults with more frames; LRU and OPT never do', ['LRU suffers from it', 'LRU is a stack algorithm.'], ['It means OPT is not optimal', 'OPT is optimal.'], ['It only happens with 1 frame', 'It is about increasing frames.']], answer: 0, explanation: 'Example: 1 2 3 4 1 2 5 1 2 3 4 5 gives FIFO 9 faults with 3 frames and 10 with 4.' }),
  mcq({ ...q(PR), id: 'os.pr.q3', type: 'concept', difficulty: 'easy', stem: 'The optimal (OPT) algorithm evicts the page that:', options: ['Will not be used for the longest time in the future', ['Was used least recently', 'That is LRU.'], ['Was loaded first', 'That is FIFO.'], ['Has been used least often', 'That is LFU.']], answer: 0, explanation: 'It is optimal but needs future knowledge.' }),
  mcq({ ...q(PR), id: 'os.pr.q4', type: 'scenario', difficulty: 'medium', stem: 'Reference string 1 2 3 1 4 5 with 3 frames under FIFO. Total faults?', options: ['5', ['6', '1 is a hit the second time (it is still in a frame).'], ['4', '4 and 5 also fault.'], ['3', 'Only the first three loads are compulsory; more faults follow.']], answer: 0, explanation: '1, 2, 3 fault (3); 1 hits; 4 faults (evict 1); 5 faults (evict 2). Total 5.' }),
  mcq({ ...q(PR), id: 'os.pr.q5', type: 'concept', difficulty: 'medium', stem: 'Why do real operating systems use Clock instead of exact LRU?', options: ['Exact LRU needs work on every memory access (timestamps or list moves); Clock only uses a hardware reference bit', ['Clock gives fewer faults than OPT', 'Nothing beats OPT.'], ['LRU suffers from Belady\'s anomaly', 'It does not.'], ['Clock needs future knowledge', 'It does not.']], answer: 0, explanation: 'Clock approximates LRU at a fraction of the cost.' }),
  mcq({ ...q(PR), id: 'os.pr.q6', type: 'scenario', difficulty: 'hard', stem: 'For 1 2 3 4 1 2 5 1 2 3 4 5 under FIFO, how many faults with 3 frames and with 4 frames?', options: ['9 and 10', ['10 and 9', 'This is the anomaly: more frames gives more faults.'], ['9 and 8', 'Count again with 4 frames.'], ['12 and 12', 'There are some hits.']], answer: 0, explanation: 'This is the textbook demonstration of Belady\'s anomaly.' }),
];

export const topics: Topic[] = [procs, sched, sync, deadlocks, vmem, pageRepl];
export const mcqs: MCQ[] = [...ptMcqs, ...csMcqs, ...syMcqs, ...dlMcqs, ...vmMcqs, ...prMcqs];
