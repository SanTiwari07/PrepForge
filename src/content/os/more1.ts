import type { MCQ, Topic } from '../schema';
import { cpp, mcq } from '../helpers';
import { OSTEP, manpage, osTopic, q } from './common';

// OS batch 2a: process states and fork/exec/wait, classic synchronisation problems, memory
// management and system calls. Numeric answers (fit strategies, address translation,
// fragmentation, fork counts) are recomputed in tests/os-cn-facts.test.ts.

// ---------------------------------------------------------------------------------------
const PS = 'os.process-states';
const states = osTopic({
  id: PS, title: 'Process States and Context Switching', level: 'foundation', estMinutes: 45, prerequisites: ['os.processes-threads'], related: ['os.cpu-scheduling', 'os.linux-essentials', 'os.ipc'],
  summary: 'State diagram, context switches, fork/exec/wait.',
  objectives: ['Draw the five-state process diagram and name what triggers each transition.', 'Explain what a context switch saves and restores, and why it is costly.', 'Predict the output and process count of programs that call fork().', 'Explain exec, wait, zombies, orphans and copy-on-write.'],
  sections: [
    { id: 'states', kind: 'concept', title: 'The process state diagram', bodyMd: `| State | Meaning |
|---|---|
| **New** | being created (PCB allocated) |
| **Ready** | runnable, waiting in the ready queue for a CPU |
| **Running** | executing on a CPU |
| **Waiting / Blocked** | waiting for an event (I/O completion, a lock, a child) |
| **Terminated** | finished; the PCB lingers until the parent collects the exit status |

Transitions:
- New → Ready: admitted.
- **Ready → Running:** the **scheduler dispatches** it.
- **Running → Ready:** **preempted** (time slice expired or a higher-priority process arrived).
- **Running → Waiting:** it makes a blocking call (disk read, \`wait\`, lock).
- **Waiting → Ready:** the event completes (I/O interrupt). It does **not** go straight to Running: it must be picked by the scheduler again.
- Running → Terminated: \`exit\` or fatal signal.

Modern OSes add **Suspended** states (swapped out). On Linux you see these as \`R\` (running/runnable), \`S\` (interruptible sleep), \`D\` (uninterruptible sleep, usually disk I/O), \`T\` (stopped) and \`Z\` (zombie) in \`ps\`.` },
    { id: 'context-switch', kind: 'concept', title: 'Context switching', bodyMd: `A **context switch** stops one task and resumes another. The kernel saves the outgoing task's **CPU context** (program counter, stack pointer, general registers, flags) in its **PCB** (Linux: \`task_struct\`) and loads the incoming task's saved context. Between *processes* it also switches the **address space** (page-table base register).

**Why it is expensive:**
- **Direct cost:** saving/restoring registers, running the scheduler (usually a few microseconds or less).
- **Indirect cost (often larger):** a new address space means the **TLB** is flushed or tagged out, and the CPU **caches** are cold for the new working set, so the next instructions run slowly until they are warmed up.
- Switching between **threads of the same process** keeps the address space, so it is cheaper.

A context switch is triggered by a timer interrupt (preemption), a blocking system call, or an I/O interrupt that wakes a higher-priority task. Too many switches (too small a time slice, too many runnable threads) means the CPU spends its time switching instead of working.

Note the difference: a **mode switch** (user → kernel on a system call) happens within the same process and is much cheaper than a full context switch.` },
    { id: 'fork-exec', kind: 'concept', title: 'fork, exec, wait (Linux)', bodyMd: `- **\`fork()\`** creates a near-identical child. It is called once and **returns twice**: **0 in the child**, the child's PID in the parent, and -1 on failure. Memory is shared **copy-on-write**: pages are not copied until one side writes to them, so fork is cheap.
- **\`exec*()\`** (\`execve\`, \`execl\`, ...) **replaces** the current process image with a new program. The PID stays, open file descriptors are kept (unless close-on-exec), and on success it **never returns**. A shell starts a command with *fork, then exec in the child*.
- **\`wait()/waitpid()\`** makes the parent block until a child terminates and **reaps** it (collects the exit status).
- **Zombie:** a child that has exited but whose parent has not yet called \`wait\`. It uses no CPU or memory except its process-table entry (\`Z\` in \`ps\`); many zombies leak PIDs. Fix: the parent must \`wait\` (or ignore \`SIGCHLD\`).
- **Orphan:** a child whose parent exits first is adopted by \`init\`/\`systemd\` (PID 1), which reaps it.

**Counting processes:** \`n\` unconditional \`fork()\` calls in a row give **2ⁿ** processes in total (including the original), so \`fork(); fork(); fork();\` creates 7 new processes (8 in all).` },
    { id: 'code', kind: 'code', title: 'fork and waitpid', bodyMd: 'The parent waits for the child and reads its exit code. The child prints first because the parent blocks in `waitpid`.', code: [cpp(`#include <cstdio>
#include <unistd.h>
#include <sys/wait.h>
int main() {
    pid_t pid = fork();
    if (pid == 0) {                       // child: fork() returned 0
        std::printf("child\\n");
        return 7;                         // exit status 7
    }
    int status = 0;
    waitpid(pid, &status, 0);             // parent blocks until the child exits
    std::printf("parent: child exited with %d\\n", WEXITSTATUS(status));
    return 0;
}`, 'C++ on Linux', 'child\nparent: child exited with 7'), cpp(`#include <cstdio>
#include <unistd.h>
#include <sys/wait.h>
// How a shell runs "ls -l": fork, exec in the child, wait in the parent.
int run(const char* path, char* const argv[]) {
    pid_t pid = fork();
    if (pid == 0) {
        execv(path, argv);                // only returns on failure
        std::perror("execv");
        _exit(127);
    }
    int status = 0;
    waitpid(pid, &status, 0);
    return WIFEXITED(status) ? WEXITSTATUS(status) : -1;
}`, 'A tiny shell step')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Drawing Waiting → Running (it must go through Ready).
2. Saying fork returns the child's PID "to the child" (the child gets 0).
3. Thinking fork copies all memory immediately (copy-on-write).
4. Forgetting that output buffered before \`fork()\` is duplicated in both processes when stdout is not a terminal.
5. Counting \`n\` forks as \`n\` processes instead of 2ⁿ (when unconditional).
6. Confusing a mode switch (system call) with a context switch.
7. Leaving zombies by never calling \`wait\`.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Describe the process states and transitions.', answerMd: 'New, Ready, Running, Waiting and Terminated. The scheduler moves Ready to Running; preemption moves Running back to Ready; a blocking call moves Running to Waiting; the awaited event moves Waiting to Ready (never directly to Running); exit moves Running to Terminated.' },
    { id: 'iq2', q: 'What happens during a context switch and why is it expensive?', answerMd: 'The kernel saves the running task\'s registers, program counter and stack pointer in its PCB, chooses another task, and restores that task\'s context (and switches page tables if it is another process). The direct cost is small; the indirect cost of cold caches and TLB entries for the new working set is usually larger.' },
    { id: 'iq3', q: 'What does fork() return and how many processes does `fork(); fork();` create?', answerMd: 'It returns 0 in the child, the child\'s PID in the parent, and -1 on error. Two unconditional forks give 2² = 4 processes in total (3 new ones), because the child created by the first fork also executes the second.' },
    { id: 'iq4', q: 'Fork vs exec?', answerMd: 'fork duplicates the calling process (copy-on-write) and returns in both; exec replaces the current process image with a different program in the same process and does not return on success. A shell runs commands by forking and then exec-ing in the child.' },
    { id: 'iq5', q: 'What is a zombie process and how do you get rid of it?', answerMd: 'A terminated child whose exit status has not been collected, so its process-table entry remains. The parent must call wait/waitpid (or handle SIGCHLD); if the parent dies, init adopts and reaps the zombie. Killing a zombie does nothing, since it is already dead.' },
  ],
  revision: { notesMd: `- States: New → Ready ⇄ Running → Terminated; Running → Waiting → Ready (never straight to Running).
- Context switch: save/restore registers + PC + SP in the PCB; switch page tables for processes; cost mostly cache/TLB warm-up.
- fork returns 0 in the child, PID in the parent; copy-on-write. exec replaces the image, same PID. wait reaps.
- Zombie = exited, not reaped. Orphan = parent died; adopted by PID 1.
- n unconditional forks → 2ⁿ processes. Mode switch (syscall) ≠ context switch.`, flashcards: [
    { id: 'f1', front: 'What does fork() return in the child?', backMd: '0 (the parent gets the child\'s PID, -1 means failure).' },
    { id: 'f2', front: 'Can a Waiting process go directly to Running?', backMd: 'No. It becomes Ready when the event completes, then the scheduler dispatches it.' },
    { id: 'f3', front: 'Total processes after three unconditional fork() calls?', backMd: '8 (2³), i.e. 7 new ones.' },
    { id: 'f4', front: 'What is a zombie?', backMd: 'A finished process whose parent has not called wait() yet.' },
    { id: 'f5', front: 'Why is copy-on-write used for fork?', backMd: 'Pages are shared read-only and copied only on write, so fork is cheap (especially when exec follows).' },
    { id: 'f6', front: 'Where is the context saved?', backMd: 'In the process control block (task_struct on Linux).' },
  ] },
  resources: [OSTEP, manpage('fork'), manpage('execve'), manpage('waitpid')],
});

const psMcqs: MCQ[] = [
  mcq({ ...q(PS), id: 'os.ps.q1', type: 'concept', difficulty: 'easy', stem: 'A process waiting for a disk read completes its I/O. Which state does it enter next?', options: ['Ready', ['Running', 'It must be chosen by the scheduler first.'], ['Terminated', 'Completing I/O does not end the process.'], ['New', 'New applies only at creation.']], answer: 0, explanation: 'Waiting → Ready; the scheduler then decides when it runs.' }),
  mcq({ ...q(PS), id: 'os.ps.q2', type: 'concept', difficulty: 'easy', stem: 'After a successful `fork()`, what value does the child process see as the return value?', options: ['0', ['The parent\'s PID', 'The parent receives the child\'s PID, not the child.'], ['The child\'s own PID', 'The child gets 0 and can call getpid() for its PID.'], ['-1', '-1 means fork failed and no child exists.']], answer: 0, explanation: 'fork returns once in each process: 0 in the child, the child\'s PID in the parent.' }),
  mcq({ ...q(PS), id: 'os.ps.q3', type: 'scenario', difficulty: 'medium', stem: 'A program executes `fork(); fork(); fork();` unconditionally. How many processes exist at the end, counting the original?', options: ['8', ['3', 'Each existing process forks again, so the count doubles each time.'], ['6', 'That is not a power of two.'], ['9', 'Each fork doubles the number: 2³ = 8.']], answer: 0, explanation: '1 → 2 → 4 → 8; seven are new.' }),
  mcq({ ...q(PS), id: 'os.ps.q4', type: 'concept', difficulty: 'medium', stem: 'What does `execv()` do on success?', options: ['Replaces the process image with a new program and does not return', ['Creates a child that runs the new program', 'That is fork followed by exec.'], ['Returns 0 to the caller', 'There is no caller image left to return to.'], ['Waits for the new program to finish', 'It is not a wait call.']], answer: 0, explanation: 'The PID and (most) file descriptors persist, but code, data and stack are replaced.' }),
  mcq({ ...q(PS), id: 'os.ps.q5', type: 'concept', difficulty: 'medium', stem: 'A process shows state `Z` in `ps`. What does this mean and what resolves it?', options: ['It has exited but its parent has not called wait(); the parent must reap it', ['It is using 100% CPU; kill it', 'A zombie uses no CPU.'], ['It is swapped out; add RAM', 'That is a different condition.'], ['It is stopped by Ctrl+Z; resume it with `fg`', 'A stopped job shows `T`.']], answer: 0, explanation: 'Only the process-table entry remains. Killing a zombie has no effect; fix the parent or end it so init reaps the child.' }),
  mcq({ ...q(PS), id: 'os.ps.q6', type: 'concept', difficulty: 'medium', stem: 'Why is a context switch between two threads of the same process cheaper than between two processes?', options: ['No address-space change, so page tables stay and the TLB and caches stay mostly valid', ['Threads have no registers to save', 'Every thread has its own register state.'], ['The kernel is not involved', 'Kernel threads are switched by the kernel.'], ['Threads never block', 'Threads can block like processes.']], answer: 0, explanation: 'The indirect cost (TLB and cache refill) is what is mostly avoided.' }),
  mcq({ ...q(PS), id: 'os.ps.q7', type: 'concept', difficulty: 'hard', stem: 'Why is `fork()` followed immediately by `exec()` cheap even for a process with a 4 GB heap?', options: ['Copy-on-write means the pages are shared and almost none are copied before exec discards the address space', ['fork only copies the stack', 'The whole address space is logically duplicated, lazily.'], ['The heap is shared read-write between parent and child', 'Writes would be visible to both processes; CoW prevents that.'], ['exec copies the heap back', 'exec replaces the image and copies nothing back.']], answer: 0, explanation: 'Page tables are duplicated, but data pages are copied only if written.' }),
  mcq({ ...q(PS), id: 'os.ps.q8', type: 'concept', difficulty: 'easy', stem: 'A child process is still running when its parent exits. What happens to the child?', options: ['It becomes an orphan and is adopted by init/systemd (PID 1)', ['It is killed immediately', 'Orphans normally keep running.'], ['It becomes a zombie at once', 'A zombie is a terminated child, not a running one.'], ['It is frozen until a new parent exists', 'It keeps running with a new parent.']], answer: 0, explanation: 'PID 1 adopts orphans and reaps them when they exit.' }),
];

// ---------------------------------------------------------------------------------------
const CP = 'os.classic-problems';
const classic = osTopic({
  id: CP, title: 'Classic Synchronisation Problems', level: 'core', estMinutes: 55, prerequisites: ['os.synchronisation'], related: ['os.deadlocks', 'os.concurrency-multithreading'],
  summary: 'Producer-consumer, readers-writers and dining philosophers.',
  objectives: ['Solve the bounded buffer with semaphores and give the initial values and correct order of waits.', 'Explain readers-writers and the starvation trade-off between reader and writer preference.', 'Show how dining philosophers deadlock and give three fixes, naming the Coffman condition each breaks.', 'Recognise these patterns in real systems (queues, read-write locks, lock ordering).'],
  sections: [
    { id: 'pc', kind: 'concept', title: 'Producer-consumer (bounded buffer)', bodyMd: `Producers add items to a buffer of capacity \`N\`, consumers remove them. A producer must wait when the buffer is **full**; a consumer must wait when it is **empty**; and buffer access needs **mutual exclusion**.

\`\`\`
semaphore empty = N;   // free slots
semaphore full  = 0;   // filled slots
semaphore mutex = 1;   // protects the buffer

producer:                    consumer:
  produce(item)                wait(full)       // is there an item?
  wait(empty)   // free slot?   wait(mutex)
  wait(mutex)                  item = remove()
  insert(item)                 signal(mutex)
  signal(mutex)                signal(empty)    // one more free slot
  signal(full)                 consume(item)
\`\`\`

**The order matters:** wait on the counting semaphore (\`empty\`/\`full\`) **before** the mutex. If a producer took \`mutex\` first and then blocked on \`empty\` (buffer full), it would hold the mutex while sleeping, and no consumer could ever enter to make room: **deadlock**. Signals can be in any order.

In practice you use a **blocking queue** (Java \`BlockingQueue\`, Python \`queue.Queue\`, a mutex plus two condition variables in C++). It is also the model behind thread pools, message queues and Kafka-style pipelines.` },
    { id: 'rw', kind: 'concept', title: 'Readers-writers', bodyMd: `Many threads may **read** shared data at the same time, but a **writer** needs exclusive access (no readers, no other writers).

- **Readers-preference (first problem):** a new reader may join as long as other readers are active. Maximum read concurrency, but **writers can starve** if readers keep arriving.
- **Writers-preference (second problem):** once a writer is waiting, new readers are held back. Writers do not starve, but readers can.
- **Fair** versions queue requests in arrival order, trading some concurrency for no starvation.

\`\`\`
// readers-preference with a reader count
reader:                       writer:
  wait(rcMutex)                 wait(roomEmpty)
  if (++readers == 1)           write()
      wait(roomEmpty)           signal(roomEmpty)
  signal(rcMutex)
  read()
  wait(rcMutex)
  if (--readers == 0)
      signal(roomEmpty)
  signal(rcMutex)
\`\`\`

The first reader locks writers out and the last reader lets them in. Real equivalents: \`std::shared_mutex\`, Java \`ReentrantReadWriteLock\`, database shared/exclusive locks. A read-write lock only pays off when reads greatly outnumber writes and the critical section is not tiny.` },
    { id: 'dp', kind: 'concept', title: 'Dining philosophers', bodyMd: `Five philosophers sit around a table with one fork between each pair; to eat, a philosopher needs the **two adjacent forks**. The naive solution (pick up left, then right) **deadlocks** if all five pick up their left fork at the same moment: each holds one and waits for a neighbour's fork, forming a **circular wait**.

| Fix | Idea | Coffman condition broken |
|---|---|---|
| **Resource ordering** | Number the forks; always pick up the lower-numbered one first | circular wait |
| **Limit to N−1 diners** (a semaphore of N−1) | At least one philosopher can always get both forks | circular wait (no full cycle can form) |
| **Asymmetric** | Odd philosophers go left-first, even right-first | circular wait |
| **Pick up both or none** (lock both atomically, e.g. \`std::lock\`) | no holding one while waiting for the other | hold and wait |
| **Waiter / arbitrator** | A central mutex grants permission | hold and wait |

Watch for **livelock** (philosophers repeatedly put the fork down and pick it up in sync, so nobody eats) and **starvation** (a philosopher never gets both forks even though there is no deadlock).

It is the textbook model of **lock ordering**: in real code, always acquire multiple locks in one global order.` },
    { id: 'code', kind: 'code', title: 'Dining philosophers with resource ordering', bodyMd: 'Each of 5 threads eats 3 times. Locking the lower-numbered fork first removes the circular wait, so the program always finishes with 15 meals.', code: [cpp(`#include <algorithm>
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>
int main() {
    const int N = 5, ROUNDS = 3;
    std::mutex forks[N];
    std::mutex mealsLock;
    int meals = 0;
    std::vector<std::thread> ts;
    for (int i = 0; i < N; ++i) {
        ts.emplace_back([&, i] {
            int a = i, b = (i + 1) % N;
            if (a > b) std::swap(a, b);            // global order: lower fork first
            for (int r = 0; r < ROUNDS; ++r) {
                std::lock_guard<std::mutex> first(forks[a]);
                std::lock_guard<std::mutex> second(forks[b]);
                std::lock_guard<std::mutex> m(mealsLock);
                ++meals;                           // "eat"
            }
        });
    }
    for (auto& t : ts) t.join();
    std::cout << "total meals: " << meals << "\\n";
}`, 'C++ (std::thread)', 'total meals: 15')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Taking the mutex before the counting semaphore in the bounded buffer (deadlock).
2. Initialising \`empty\` to 0 and \`full\` to N (backwards).
3. Believing readers-writers has one "correct" answer: every variant trades fairness against concurrency.
4. Fixing dining philosophers with a timeout or random delay and calling it solved (that only makes deadlock unlikely; livelock remains possible).
5. Using \`notify\` or \`signal\` without re-checking the condition in a loop.
6. Holding a lock while sleeping or doing I/O.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Implement a bounded buffer with semaphores. What are the initial values?', answerMd: 'empty = N (free slots), full = 0 (filled slots), mutex = 1. A producer does wait(empty), wait(mutex), insert, signal(mutex), signal(full); a consumer does wait(full), wait(mutex), remove, signal(mutex), signal(empty). The counting semaphore must be waited on before the mutex to avoid holding the mutex while blocked.' },
    { id: 'iq2', q: 'What goes wrong if the producer waits on the mutex before the empty semaphore?', answerMd: 'When the buffer is full, the producer holds the mutex while blocked on empty. A consumer then cannot acquire the mutex to remove an item and signal empty, so both wait forever: deadlock.' },
    { id: 'iq3', q: 'Explain readers-writers and its starvation problem.', answerMd: 'Any number of readers may share access, but a writer needs exclusivity. With reader preference, a steady stream of readers can keep a writer waiting forever. Writer preference avoids that but can starve readers. Fair, queue-based locks avoid both at some cost in concurrency.' },
    { id: 'iq4', q: 'How do the dining philosophers deadlock, and how do you fix it?', answerMd: 'If every philosopher picks up the left fork first, all can hold one fork and wait for the other, a circular wait. Fixes: order the forks and always take the lower one first, allow only N-1 philosophers to try at once, make one philosopher pick right-first, or acquire both forks atomically.' },
    { id: 'iq5', q: 'Where do you see these problems in real systems?', answerMd: 'Producer-consumer is every work queue, thread pool and message broker. Readers-writers appears in read-write locks and database shared/exclusive locks. Dining philosophers is the general multiple-lock problem, solved in practice with a global lock order or try-lock with back-off.' },
  ],
  revision: { notesMd: `- Bounded buffer: empty = N, full = 0, mutex = 1; wait(counting) BEFORE wait(mutex).
- Readers-writers: readers share, writers exclusive. Reader preference starves writers; writer preference starves readers.
- Dining philosophers deadlock = circular wait. Fixes: ordering, N-1 seats, asymmetry (break circular wait), atomic pickup/waiter (break hold-and-wait).
- Also watch livelock and starvation. Real life: blocking queues, shared_mutex, global lock order.`, flashcards: [
    { id: 'f1', front: 'Initial semaphore values for a buffer of size N?', backMd: 'empty = N, full = 0, mutex = 1.' },
    { id: 'f2', front: 'Why must wait(empty) precede wait(mutex)?', backMd: 'Otherwise a blocked producer holds the mutex and consumers can never free a slot: deadlock.' },
    { id: 'f3', front: 'Which readers-writers variant can starve writers?', backMd: 'Reader preference.' },
    { id: 'f4', front: 'Easiest fix for dining philosophers in real code?', backMd: 'Impose a global lock order (lower-numbered fork first).' },
    { id: 'f5', front: 'Which Coffman condition does resource ordering break?', backMd: 'Circular wait.' },
    { id: 'f6', front: 'What is livelock?', backMd: 'Threads keep reacting to each other and make no progress, though none is blocked.' },
  ] },
  resources: [OSTEP, { title: 'OSTEP: Semaphores (producer/consumer, readers-writers, dining philosophers)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/threads-sema.pdf', kind: 'book' }, { title: 'std::shared_mutex (cppreference)', url: 'https://en.cppreference.com/w/cpp/thread/shared_mutex', kind: 'official-docs' }],
});

const cpMcqs: MCQ[] = [
  mcq({ ...q(CP), id: 'os.cp.q1', type: 'concept', difficulty: 'easy', stem: 'For a bounded buffer of size N solved with semaphores, which are the correct initial values for (empty, full, mutex)?', options: ['(N, 0, 1)', ['(0, N, 1)', 'Backwards: empty counts free slots, so it starts at N.'], ['(N, N, 1)', 'full counts filled slots, which starts at 0.'], ['(1, 1, N)', 'The mutex is a binary semaphore.']], answer: 0, explanation: 'All N slots are free at the start, none are filled, and the mutex is available.' }),
  mcq({ ...q(CP), id: 'os.cp.q2', type: 'debug', difficulty: 'medium', stem: 'A producer runs `wait(mutex); wait(empty); insert(); signal(mutex); signal(full);`. With the buffer full, what happens?', options: ['Deadlock: the producer sleeps on `empty` while holding `mutex`, so consumers cannot enter', ['Nothing, the producer simply waits and consumers continue', 'Consumers need the mutex the producer is holding.'], ['The buffer overflows', 'The semaphore prevents overflow, but at the cost of the deadlock.'], ['The producer skips the insert', 'Semaphores block; they do not skip.']], answer: 0, explanation: 'Always wait on the counting semaphore first, then take the mutex.' }),
  mcq({ ...q(CP), id: 'os.cp.q3', type: 'concept', difficulty: 'medium', stem: 'In the readers-preference solution, which can happen?', options: ['A writer waits indefinitely while readers keep arriving', ['Two writers write at once', 'Writers are mutually exclusive.'], ['A reader blocks other readers', 'Readers run concurrently.'], ['Readers wait forever', 'In reader preference readers are served first.']], answer: 0, explanation: 'As long as at least one reader is active, a new reader joins and the writer never gets the room.' }),
  mcq({ ...q(CP), id: 'os.cp.q4', type: 'concept', difficulty: 'medium', stem: 'Five philosophers each pick up their left fork simultaneously, then wait for the right fork. This is an example of:', options: ['Deadlock caused by circular wait', ['Starvation caused by an unfair scheduler', 'No process is running, so it is not just unfair scheduling.'], ['Livelock', 'Nobody is actively changing state; all are blocked.'], ['A race condition on a counter', 'There is no shared counter involved.']], answer: 0, explanation: 'Each philosopher holds one resource and waits for one held by a neighbour, forming a cycle.' }),
  mcq({ ...q(CP), id: 'os.cp.q5', type: 'concept', difficulty: 'medium', stem: 'Which change prevents the dining philosophers deadlock by breaking circular wait?', options: ['Number the forks and always pick up the lower-numbered fork first', ['Make philosophers eat faster', 'Speed does not remove the cycle.'], ['Add more philosophers', 'More philosophers make the cycle possible again.'], ['Use a timeout of 1 ms and retry', 'That reduces deadlock odds but invites livelock and does not break the condition.']], answer: 0, explanation: 'A global order makes a cycle in the wait-for graph impossible.' }),
  mcq({ ...q(CP), id: 'os.cp.q6', type: 'concept', difficulty: 'hard', stem: 'Why does allowing at most N−1 of N philosophers to sit down avoid deadlock?', options: ['With N−1 diners and N forks, at least one diner can always obtain two forks', ['It gives every philosopher three forks', 'Each still needs exactly two forks.'], ['It removes mutual exclusion on forks', 'Forks are still exclusive.'], ['It forces alternate eating order', 'There is no fixed order.']], answer: 0, explanation: 'Pigeonhole: if all N−1 seated hold one fork, one fork remains free next to someone, who can then eat and release.' }),
  mcq({ ...q(CP), id: 'os.cp.q7', type: 'scenario', difficulty: 'medium', stem: 'A cache is read thousands of times per second and updated about once a minute. Which primitive best fits?', options: ['A read-write (shared/exclusive) lock', ['A plain mutex only', 'It works but serialises all the readers needlessly.'], ['A counting semaphore of 1', 'Same as a mutex: no read concurrency.'], ['Busy-waiting on a flag', 'Wastes CPU and is not safe by itself.']], answer: 0, explanation: 'Readers proceed in parallel; the rare writer takes exclusive access.' }),
  mcq({ ...q(CP), id: 'os.cp.q8', type: 'concept', difficulty: 'hard', stem: 'Two philosophers repeatedly pick up a fork, notice the other is taken, put it down, wait the same time and retry, so nobody ever eats although nothing is blocked. This is:', options: ['Livelock', ['Deadlock', 'In deadlock threads are blocked, not repeatedly acting.'], ['Priority inversion', 'That involves a low-priority thread holding a lock for a high-priority one.'], ['A memory leak', 'Unrelated.']], answer: 0, explanation: 'Livelock: threads stay active but make no progress. Randomised back-off helps.' }),
];

// ---------------------------------------------------------------------------------------
const MM = 'os.memory-management';
const memory = osTopic({
  id: MM, title: 'Memory Management', level: 'core', estMinutes: 55, prerequisites: ['os.processes-threads'], related: ['os.virtual-memory', 'os.page-replacement', 'cpp.memory-raii'],
  summary: 'Allocation, fragmentation, paging and segmentation.',
  objectives: ['Place processes with first, best and worst fit and tell internal from external fragmentation.', 'Translate a logical address with paging (page number, offset, frame) and compute page table size.', 'Compare paging with segmentation and explain base/limit protection.', 'Explain why the OS uses address translation (isolation, relocation) and what the MMU does.'],
  sections: [
    { id: 'contiguous', kind: 'concept', title: 'Contiguous allocation and fragmentation', bodyMd: `In the simplest scheme every process occupies **one contiguous block**. Hardware protection uses a **base** (relocation) register and a **limit** register: every logical address \`a\` is checked \`a < limit\` and mapped to \`base + a\`.

For **variable partitions**, free memory is a list of **holes**. Placement strategies:
- **First fit:** the first hole big enough (fast, tends to chop up the front).
- **Best fit:** the smallest hole that fits (leaves the smallest leftover, but scans everything and leaves tiny useless holes).
- **Worst fit:** the largest hole (leftover stays large enough to use, but destroys big holes).
- **Next fit:** first fit that continues from the last placement.

**Fragmentation:**
- **External:** enough total free memory exists, but in non-contiguous holes. Fix: **compaction** (move processes, costly) or **non-contiguous allocation (paging)**.
- **Internal:** memory *inside* an allocated block is wasted (a fixed partition or the last page of a process is only partly used).

Example: holes **100, 500, 200, 300, 600 KB** (in memory order) and requests **212, 417, 112, 426 KB**: first fit places 212→500, 417→600, 112→the 288 left over from the 500, and **426 cannot be placed**; best fit places 212→300, 417→500, 112→200, 426→600 (**all four fit**); worst fit also fails on 426.` },
    { id: 'paging', kind: 'concept', title: 'Paging', bodyMd: `**Paging** removes external fragmentation: physical memory is split into fixed-size **frames**, logical memory into **pages** of the same size (a power of two, commonly 4 KB), and any page can go in any free frame. A **page table** maps *page number → frame number*.

A logical address splits into **page number** (high bits) and **offset** (low bits):

\`\`\`
page number = address / page size       offset = address mod page size
physical address = frame × page size + offset
\`\`\`

**Worked example:** page size 1 KB (1024 B), logical address **3000** → page 2, offset 952. If the page table says page 2 → frame 7, the physical address is 7 × 1024 + 952 = **8120**.

**Sizes:** with a 32-bit logical address and 4 KB pages: offset = 12 bits, page number = 20 bits → **2²⁰ page-table entries**; at 4 bytes each that is **4 MB per process**, which is why real systems use **multi-level** or hashed/inverted page tables (see Virtual Memory).

**Internal fragmentation:** a process of 72,766 bytes with 2,048-byte pages needs ⌈72766 / 2048⌉ = **36 pages** (73,728 bytes), wasting **962 bytes** in the last page. On average about half a page per process is wasted, so bigger pages waste more but need smaller tables and fewer TLB misses.

The **MMU** performs the translation in hardware on every access, with the **TLB** caching recent page→frame mappings. Per-entry bits (valid, read/write/execute, user/supervisor) give **protection**: this is how a process is stopped from touching another's memory or writing its own code.` },
    { id: 'segmentation', kind: 'comparison', title: 'Segmentation and paging compared', bodyMd: `**Segmentation** divides the address space into **variable-sized logical units** (code, heap, stack, library), and a logical address is *(segment number, offset)*. The segment table holds each segment's **base** and **limit**; an offset beyond the limit raises a fault.

| | **Paging** | **Segmentation** |
|---|---|---|
| Unit | fixed-size page | variable-sized segment |
| Visible to the programmer | no | yes (logical structure) |
| External fragmentation | none | yes |
| Internal fragmentation | yes (last page) | none |
| Sharing / protection | per page | natural per segment (share the code segment) |

Modern 64-bit systems use **paging** with a mostly flat address space. Intel's older **segmentation + paging** combination is largely unused for protection today. The **buddy allocator** (powers-of-two blocks, split and merge) manages physical frames in Linux, with a **slab allocator** on top for small kernel objects.

**Stack vs heap vs static (process view):** the code and static data sizes are fixed at load time; the **stack** grows with calls, and the **heap** grows with \`malloc/new\` (via \`brk\`/\`mmap\`). Running out of address space or memory shows up as allocation failure, a stack overflow or OOM-kill.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Saying paging has no fragmentation at all (it has internal fragmentation in the last page).
2. Mixing up internal and external fragmentation.
3. Dividing the address by the page size and forgetting the offset, or using decimal instead of the bit split.
4. Believing best fit is always the best (it leaves many tiny, unusable holes and is slower).
5. Forgetting that the page table itself consumes memory.
6. Calling the base/limit scheme "paging".` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Internal vs external fragmentation?', answerMd: 'Internal fragmentation is unused space inside an allocated block (for example the unfilled tail of a process\'s last page). External fragmentation is free space split into many small holes that are individually too small, though their total would suffice. Paging eliminates external fragmentation; compaction or paging fixes it for contiguous allocation.' },
    { id: 'iq2', q: 'How does paging translate an address?', answerMd: 'The MMU splits the logical address into page number and offset, looks the page number up in the page table (or TLB) to get a frame number, and forms the physical address frame × page size + offset, checking valid and protection bits on the way.' },
    { id: 'iq3', q: 'Why are page sizes powers of two?', answerMd: 'Then the page number and offset are just the high and low bits of the address, so translation needs no division or modulo, only bit slicing and a table lookup.' },
    { id: 'iq4', q: 'Paging vs segmentation?', answerMd: 'Paging uses fixed-size, invisible units and removes external fragmentation but has internal fragmentation. Segmentation uses variable-sized logical units visible to the programmer, supports natural sharing and protection per segment, but suffers external fragmentation. Most modern systems use paging.' },
    { id: 'iq5', q: 'Compare first fit, best fit and worst fit.', answerMd: 'First fit takes the first adequate hole and is fast; best fit takes the smallest adequate hole, minimising leftover per allocation but leaving tiny unusable holes and needing a full search; worst fit takes the largest hole hoping the remainder stays usable. In practice first fit and best fit perform similarly and both beat worst fit.' },
  ],
  revision: { notesMd: `- Contiguous: base + limit; first / best / worst fit; external fragmentation → compaction.
- Paging: fixed pages/frames; page# = addr / size, offset = addr mod size; physical = frame × size + offset.
- 32-bit, 4 KB pages: 20-bit page#, 12-bit offset, 2²⁰ entries (4 MB at 4 B each).
- Internal fragmentation ≈ half a page per process; paging has no external fragmentation.
- Segmentation: (segment, offset), base/limit per segment; external fragmentation.`, flashcards: [
    { id: 'f1', front: 'Paging: which fragmentation remains?', backMd: 'Internal (the last page of each process).' },
    { id: 'f2', front: '32-bit address, 4 KB pages: page number bits?', backMd: '20 (and 12 bits of offset).' },
    { id: 'f3', front: 'Physical address formula?', backMd: 'frame × page size + offset.' },
    { id: 'f4', front: 'What does the limit register do?', backMd: 'Rejects logical addresses beyond the process size (protection).' },
    { id: 'f5', front: 'External fragmentation fix?', backMd: 'Compaction, or non-contiguous allocation such as paging.' },
    { id: 'f6', front: 'Why are page sizes powers of two?', backMd: 'Address bits split cleanly into page number and offset.' },
  ] },
  resources: [OSTEP, { title: 'OSTEP: Paging introduction', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf', kind: 'book' }, { title: 'Linux kernel docs: Memory management concepts', url: 'https://www.kernel.org/doc/html/latest/admin-guide/mm/concepts.html', kind: 'official-docs' }],
});

const mmMcqs: MCQ[] = [
  mcq({ ...q(MM), id: 'os.mm.q1', type: 'scenario', difficulty: 'medium', stem: 'Free holes in memory order are 100, 500, 200, 300 and 600 KB. Processes of 212, 417, 112 and 426 KB arrive in that order. Which placement strategy places all four?', options: ['Best fit', ['First fit', 'After 212→500 and 417→600, the 426 KB request finds no hole large enough.'], ['Worst fit', '212→600 leaves no hole of 426 KB for the last request.'], ['None of them', 'Best fit succeeds.']], answer: 0, explanation: 'Best fit: 212→300, 417→500, 112→200, 426→600. First and worst fit both fail on the 426 KB request.' }),
  mcq({ ...q(MM), id: 'os.mm.q2', type: 'complexity', difficulty: 'easy', stem: 'Page size is 1 KB. A process accesses logical address 3000. What are the page number and offset?', options: ['Page 2, offset 952', ['Page 3, offset 0', '3000 / 1024 is 2.93, so the page is 2.'], ['Page 2, offset 3000', 'The offset is the remainder, not the whole address.'], ['Page 29, offset 0', 'That divides by 100, not the page size.']], answer: 0, explanation: '3000 = 2 × 1024 + 952.' }),
  mcq({ ...q(MM), id: 'os.mm.q3', type: 'complexity', difficulty: 'medium', stem: 'Page size is 1 KB and the page table maps page 2 to frame 7. What is the physical address for logical address 3000?', options: ['8120', ['7952', 'That uses frame 7 minus the offset incorrectly.'], ['2048', 'That is page 2 × 1024, ignoring the frame.'], ['7168', 'That is the frame base without the offset.']], answer: 0, explanation: '7 × 1024 + 952 = 8120.' }),
  mcq({ ...q(MM), id: 'os.mm.q4', type: 'complexity', difficulty: 'medium', stem: 'A 32-bit system uses 4 KB pages and 4-byte page-table entries with a single-level page table. How large is one process\'s page table?', options: ['4 MB', ['4 KB', 'That is a single page, not a table with 2²⁰ entries.'], ['16 MB', 'That would be 4 bytes × 2²² entries.'], ['1 MB', 'That would be 2¹⁸ entries.']], answer: 0, explanation: '2³² / 2¹² = 2²⁰ entries × 4 B = 4 MB, which motivates multi-level page tables.' }),
  mcq({ ...q(MM), id: 'os.mm.q5', type: 'complexity', difficulty: 'medium', stem: 'A process needs 72,766 bytes and the page size is 2,048 bytes. How many bytes are wasted by internal fragmentation?', options: ['962', ['0', 'The size is not a multiple of the page size.'], ['2,048', 'That is a full page; only part of the last page is wasted.'], ['1,086', 'A different remainder; compute 36 × 2048 − 72,766.']], answer: 0, explanation: '⌈72766/2048⌉ = 36 pages = 73,728 bytes; 73,728 − 72,766 = 962.' }),
  mcq({ ...q(MM), id: 'os.mm.q6', type: 'concept', difficulty: 'easy', stem: 'Which scheme suffers from external fragmentation?', options: ['Contiguous variable-size allocation (and segmentation)', ['Paging', 'Paging has internal, not external, fragmentation.'], ['Fixed-size page frames only', 'Equal-size frames can always be reused.'], ['A TLB', 'A TLB is a cache, not an allocation scheme.']], answer: 0, explanation: 'Variable-sized blocks leave holes that may be too small for later requests.' }),
  mcq({ ...q(MM), id: 'os.mm.q7', type: 'concept', difficulty: 'medium', stem: 'Why must the page size be a power of two?', options: ['So that the page number and offset are simply the high and low bits of an address', ['To make pages fit into the TLB', 'The TLB holds entries regardless of the page size.'], ['Because disks have power-of-two blocks only', 'Unrelated to the page size requirement.'], ['To avoid internal fragmentation', 'Powers of two do not remove internal fragmentation.']], answer: 0, explanation: 'Translation then needs no division, only bit slicing.' }),
  mcq({ ...q(MM), id: 'os.mm.q8', type: 'concept', difficulty: 'medium', stem: 'What is an advantage of segmentation over paging?', options: ['Segments match logical units (code, stack), so sharing and protection can be applied per unit', ['It eliminates external fragmentation', 'Variable-sized segments cause external fragmentation.'], ['It needs no hardware support', 'It needs segment tables and bounds checks.'], ['Segments are always the same size', 'Segments vary in size.']], answer: 0, explanation: 'Segments follow program structure, but variable sizes bring external fragmentation, which is why paging dominates.' }),
];

// ---------------------------------------------------------------------------------------
const SC = 'os.system-calls';
const syscalls = osTopic({
  id: SC, title: 'System Calls and Kernel Mode', level: 'core', estMinutes: 40, prerequisites: ['os.processes-threads'], related: ['os.process-states', 'os.io-management', 'os.linux-essentials'],
  summary: 'User vs kernel mode, traps and interrupts.',
  objectives: ['Explain dual-mode operation, privileged instructions and why they exist.', 'Trace a system call from a library wrapper through the trap into the kernel and back.', 'Distinguish interrupts, exceptions (faults) and traps.', 'Explain why a mode switch is cheaper than a context switch and how buffering reduces system calls.'],
  sections: [
    { id: 'modes', kind: 'concept', title: 'User mode and kernel mode', bodyMd: `The CPU runs in at least two privilege levels, selected by a **mode bit**:
- **User mode:** application code. It can use only unprivileged instructions and **cannot touch hardware or other processes' memory directly**.
- **Kernel mode (supervisor):** the OS. Full access to **privileged instructions** (I/O, changing page tables, enabling or disabling interrupts, halting the CPU).

This protects the system: a buggy or hostile program cannot overwrite the kernel or another program, and cannot monopolise the CPU (the kernel arms a **timer interrupt** to regain control). A user program that executes a privileged instruction triggers an exception, and the kernel typically kills it (\`SIGILL\`/\`SIGSEGV\`).

(Modern x86 has four *rings*, but OSes use only ring 0 for the kernel and ring 3 for user code.)` },
    { id: 'syscall-flow', kind: 'concept', title: 'How a system call works', bodyMd: `A **system call** is a program's controlled request for a kernel service (file I/O, process creation, memory mapping, networking). Typical Linux examples: \`open\`, \`read\`, \`write\`, \`close\`, \`fork\`, \`execve\`, \`mmap\`, \`brk\`, \`socket\`, \`exit\`.

Flow for \`read(fd, buf, n)\`:
1. The program calls the **C library wrapper** (\`read\` in libc), an ordinary function call.
2. The wrapper puts the **system call number** and arguments in registers (x86-64: number in \`rax\`) and executes the **trap instruction** (\`syscall\`; older: \`int 0x80\`).
3. The CPU switches to **kernel mode**, saves the user context, and jumps to the kernel's entry point, which indexes a **system call table** with the number.
4. The kernel **validates the arguments** (never trusting user pointers), performs the work (possibly blocking the process, so another one runs), and places the result in a register.
5. It returns to user mode (\`sysret\`/\`iret\`). The wrapper returns the result; on failure it returns **-1 and sets \`errno\`**.

This is a **mode switch inside the same process**, far cheaper than a context switch but still hundreds of nanoseconds to a few microseconds (mitigations make it dearer). Some calls such as \`gettimeofday\` are served from user space via the **vDSO** with no kernel entry at all.

**Reducing syscalls:** \`printf\`/\`fwrite\` use a user-space **buffer** (stdio) and call \`write\` only when it fills or on a newline for terminals, so 1000 small prints can become one \`write\`. Likewise batch I/O, use \`readv/writev\`, memory-mapped files or \`io_uring\`. \`strace\` shows every system call a program makes.` },
    { id: 'interrupts', kind: 'comparison', title: 'Interrupts, exceptions and traps', bodyMd: `| Kind | Cause | Synchronous? | Examples |
|---|---|---|---|
| **Interrupt** | external hardware signal | **asynchronous** (any time, unrelated to the current instruction) | timer tick, disk or network I/O completion, keyboard |
| **Exception / fault** | the current instruction cannot complete | synchronous | page fault, divide by zero, invalid opcode, protection violation |
| **Trap (software interrupt)** | deliberate instruction | synchronous | system call, breakpoint |

On any of these the CPU saves state, switches to kernel mode and uses the **interrupt vector table (IDT)** to find the handler, runs it, and returns (re-executing the faulting instruction after a recoverable page fault).

Interrupt handlers are split in two: a quick **top half** (acknowledge the device, schedule work) and a deferrable **bottom half** (softirq/tasklet/workqueue) that does the heavy lifting with interrupts enabled. A **page fault** is the classic *recoverable* exception: the kernel loads the page and the instruction restarts; an invalid access becomes \`SIGSEGV\`.` },
    { id: 'code', kind: 'code', title: 'Library call vs raw system call', bodyMd: '`write(2)` is the system call; `printf` is a library function that formats and buffers. Both end in the same kernel entry.', code: [cpp(`#include <unistd.h>
int main() {
    const char msg[] = "hello from write\\n";
    write(1, msg, sizeof(msg) - 1);    // fd 1 = stdout; one system call, no buffering
    return 0;
}`, 'C++ on Linux', 'hello from write'), { lang: 'bash', label: 'Observe system calls', code: `strace -c ls /tmp > /dev/null       # summary table: which syscalls, how many, time
strace -e trace=openat,read,write cat /etc/hostname
strace -f -o trace.txt ./server        # follow forks and threads, save to a file` }] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Equating a system call with a context switch (it is a mode switch in the same process; a context switch only happens if the call blocks and the scheduler picks someone else).
2. Calling every kernel entry an "interrupt" (interrupts are asynchronous and external; system calls are traps).
3. Thinking library functions such as \`printf\` or \`malloc\` are system calls (they use \`write\` or \`brk/mmap\` underneath).
4. Believing user programs run privileged instructions "with the OS's permission" instead of trapping into the kernel.
5. Ignoring the cost of tiny unbuffered reads and writes in loops.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Why does an OS need dual-mode operation?', answerMd: 'To protect the system from faulty or malicious programs. Only the kernel runs privileged instructions (I/O, page tables, interrupt control), so user code cannot access hardware or other processes directly and must request services through system calls, which the kernel validates.' },
    { id: 'iq2', q: 'Walk through what happens when a program calls read().', answerMd: 'The libc wrapper loads the syscall number and arguments into registers and executes the trap instruction. The CPU switches to kernel mode and jumps into the kernel, which dispatches via the syscall table, validates the arguments, performs the read (blocking the process and scheduling another if data is not ready), stores the result and returns to user mode. The wrapper returns the value or -1 with errno set.' },
    { id: 'iq3', q: 'Interrupt vs exception vs trap?', answerMd: 'An interrupt is an asynchronous signal from hardware (timer, I/O). An exception is synchronous and caused by the current instruction (page fault, divide by zero). A trap is a deliberate software-generated one, such as a system call or breakpoint. All of them switch to kernel mode and run a handler found through the interrupt vector table.' },
    { id: 'iq4', q: 'Is a system call the same as a context switch?', answerMd: 'No. A system call is a mode switch within the same process: the CPU enters kernel mode, runs kernel code on the process\'s behalf, and returns. A context switch changes which task is running. They coincide only if the call blocks and the scheduler picks another task.' },
    { id: 'iq5', q: 'Why does printing in a loop with printf cost fewer system calls than write?', answerMd: 'printf writes into a user-space stdio buffer and calls write only when the buffer fills, on newline for terminals, or on flush. Each direct write call enters the kernel, so thousands of tiny writes cost far more than a few buffered ones.' },
  ],
  revision: { notesMd: `- Mode bit: user vs kernel. Privileged instructions (I/O, page tables, interrupts) only in kernel mode.
- Syscall: libc wrapper → trap (\`syscall\`) → kernel table by number → validate → run → return; -1 + errno on error.
- Interrupt = async hardware; exception/fault = sync from the instruction (page fault); trap = deliberate (syscall).
- Mode switch ≠ context switch. vDSO avoids kernel entry for gettimeofday. stdio buffering cuts write calls.
- strace shows system calls.`, flashcards: [
    { id: 'f1', front: 'Name three privileged operations.', backMd: 'Direct I/O access, changing page tables/MMU state, disabling interrupts or halting the CPU.' },
    { id: 'f2', front: 'Which instruction enters the kernel on x86-64 Linux?', backMd: 'syscall (older: int 0x80).' },
    { id: 'f3', front: 'Is a timer tick an interrupt, exception or trap?', backMd: 'An interrupt (asynchronous, from hardware).' },
    { id: 'f4', front: 'What does a failed system call return?', backMd: '-1 and sets errno.' },
    { id: 'f5', front: 'Page fault: interrupt or exception?', backMd: 'An exception (fault): synchronous, caused by the instruction.' },
    { id: 'f6', front: 'Tool to list a program\'s system calls?', backMd: 'strace.' },
  ] },
  resources: [OSTEP, { title: 'OSTEP: Limited Direct Execution', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf', kind: 'book' }, manpage('syscalls'), manpage('write')],
});

const scMcqs: MCQ[] = [
  mcq({ ...q(SC), id: 'os.sc.q1', type: 'concept', difficulty: 'easy', stem: 'What happens if a user-mode program executes a privileged instruction?', options: ['The CPU raises an exception and the kernel usually terminates the process', ['The instruction runs normally', 'That would defeat protection.'], ['The CPU switches to kernel mode and runs it for the program', 'Only a deliberate trap enters kernel mode, and only at kernel-defined entry points.'], ['The instruction is silently skipped', 'It generates an exception.']], answer: 0, explanation: 'Dual-mode operation lets the kernel trap and handle illegal attempts.' }),
  mcq({ ...q(SC), id: 'os.sc.q2', type: 'concept', difficulty: 'medium', stem: 'Which of these is asynchronous with respect to the running program?', options: ['A disk controller signalling that an I/O transfer finished', ['A system call', 'The program issues it deliberately, so it is synchronous.'], ['A divide-by-zero', 'It is caused by the current instruction.'], ['A page fault', 'It occurs on the instruction accessing the page.']], answer: 0, explanation: 'Interrupts from hardware can arrive at any instruction boundary, independent of what the program is doing.' }),
  mcq({ ...q(SC), id: 'os.sc.q3', type: 'concept', difficulty: 'easy', stem: 'How does user code deliberately enter the kernel to request a service?', options: ['By executing a trap/system-call instruction', ['By jumping to any kernel address it knows', 'The hardware only allows entry at registered entry points.'], ['By setting the mode bit itself', 'Changing the mode is a privileged operation.'], ['By calling `malloc`', 'malloc is a library function that may call brk/mmap.']], answer: 0, explanation: 'The trap switches to kernel mode and jumps to a fixed, kernel-controlled entry point.' }),
  mcq({ ...q(SC), id: 'os.sc.q4', type: 'concept', difficulty: 'medium', stem: 'Which statement about system calls and context switches is correct?', options: ['A system call is a mode switch in the same process; a context switch happens only if the scheduler then picks another task', ['Every system call forces a context switch', 'Many calls return immediately to the same process.'], ['A context switch is cheaper than a system call', 'A context switch is typically more expensive.'], ['System calls only occur in kernel threads', 'User processes make system calls.']], answer: 0, explanation: 'A blocking call such as reading a not-yet-ready socket does lead to a context switch.' }),
  mcq({ ...q(SC), id: 'os.sc.q5', type: 'scenario', difficulty: 'medium', stem: 'A program prints 10,000 short lines to a file with `printf`. `strace -c` shows only about a few dozen `write` calls. Why?', options: ['stdio buffers output in user space and writes it in large chunks', ['The kernel merges the writes after the fact', 'Each write call is still counted separately by strace.'], ['printf does not use the kernel', 'It eventually calls the write system call.'], ['strace misses most calls', 'strace records every traced call.']], answer: 0, explanation: 'Buffering turns many small library calls into a few large system calls.' }),
  mcq({ ...q(SC), id: 'os.sc.q6', type: 'concept', difficulty: 'medium', stem: 'A system call fails. What does the C library wrapper typically do?', options: ['Returns -1 and stores an error code in `errno`', ['Throws a C++ exception', 'The C library has no exceptions.'], ['Terminates the process', 'The program decides how to react.'], ['Returns the error in the kernel log only', 'The caller gets the status immediately.']], answer: 0, explanation: 'Always check the return value; `perror` or `strerror(errno)` describe the error.' }),
  mcq({ ...q(SC), id: 'os.sc.q7', type: 'concept', difficulty: 'hard', stem: 'Why must the kernel validate pointers passed in system call arguments?', options: ['A user program could pass a kernel address or invalid pointer and trick the kernel into reading or writing memory it should not', ['Because pointers are 64-bit', 'Pointer size is irrelevant to the risk.'], ['To make syscalls faster', 'Validation adds a little cost.'], ['Only the library needs to validate them', 'The kernel cannot trust any user input.']], answer: 0, explanation: 'The kernel runs with full privilege; it copies data with checked routines such as `copy_from_user`.' }),
  mcq({ ...q(SC), id: 'os.sc.q8', type: 'concept', difficulty: 'medium', stem: 'After a page fault on a valid but not-yet-loaded page is handled, what happens to the faulting instruction?', options: ['It is restarted and now succeeds', ['It is skipped', 'The program must get the data it asked for.'], ['The process is terminated', 'Only an invalid access is fatal.'], ['It always becomes a system call', 'The fault handler is part of the kernel; no call is needed.']], answer: 0, explanation: 'Faults are recoverable exceptions: the OS fixes the cause and re-executes the instruction.' }),
];

export const topics: Topic[] = [states, classic, memory, syscalls];
export const mcqs: MCQ[] = [...psMcqs, ...cpMcqs, ...mmMcqs, ...scMcqs];
