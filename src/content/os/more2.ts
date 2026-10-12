import type { MCQ, Topic } from '../schema';
import { cpp, mcq } from '../helpers';
import { OSTEP, manpage, osTopic, q } from './common';

// OS batch 2b: IPC, file systems, I/O and disk scheduling, concurrency, Linux essentials.
// Numeric answers (disk head movement, inode file-size limits, rotational latency, Amdahl's
// law) are recomputed in tests/os-cn-facts.test.ts.

// ---------------------------------------------------------------------------------------
const IP = 'os.ipc';
const ipc = osTopic({
  id: IP, title: 'Inter-Process Communication', level: 'core', estMinutes: 45, prerequisites: ['os.processes-threads'], related: ['os.process-states', 'os.synchronisation', 'cn.sockets'],
  summary: 'Pipes, message queues, shared memory and signals.',
  objectives: ['Explain why processes need IPC and compare shared memory with message passing.', 'Use pipes (anonymous and named), and know their blocking and EOF behaviour.', 'Compare message queues, shared memory, sockets and signals by speed, structure and synchronisation needs.', 'Name the common Unix signals and which ones cannot be caught.'],
  sections: [
    { id: 'models', kind: 'concept', title: 'Two models: message passing and shared memory', bodyMd: `Processes have separate address spaces, so they need the kernel's help to cooperate.

- **Message passing:** processes exchange data through the kernel (\`send\`/\`receive\`). Easy to reason about and works across machines, but each message costs **system calls and copies**.
- **Shared memory:** the kernel maps the **same physical pages** into several address spaces. After setup, communication is plain memory access: **the fastest IPC**, but **you must synchronise** yourself (mutexes or semaphores placed in the shared region, or process-shared primitives) or you get race conditions.

Threads of one process already share memory, so the issues of the Synchronisation topic apply to them directly.` },
    { id: 'mechanisms', kind: 'comparison', title: 'The mechanisms', bodyMd: `| Mechanism | What it is | Notes |
|---|---|---|
| **Anonymous pipe** (\`pipe()\`, a shell pipeline) | One-way byte stream between related processes (parent/child) | Kernel buffer (64 KB on Linux). **Reader blocks when empty, writer blocks when full.** Reading returns 0 (EOF) only after *all* write ends are closed |
| **Named pipe / FIFO** (\`mkfifo\`) | A pipe with a file-system name | Unrelated processes on one host |
| **Message queue** (POSIX \`mq_*\`, System V) | Kernel-held queue of discrete, typed messages | Message boundaries are preserved; asynchronous; size limits |
| **Shared memory** (\`shm_open\`+\`mmap\`, \`shmget\`) | Pages mapped into several processes | Fastest; needs explicit synchronisation |
| **Memory-mapped file** (\`mmap\`) | A file mapped into memory | Shared if \`MAP_SHARED\`; also used for fast file I/O |
| **Sockets** | Unix-domain (same host) or TCP/UDP (network) | Bidirectional; the only choice across machines (see Sockets) |
| **Signals** | Tiny asynchronous notifications | Carry no data (just the number); see below |

Pick by need: **bulk data on one host → shared memory (+ semaphore)**; **simple producer→consumer chain → pipe**; **structured messages → queue or socket**; **different machines → sockets/RPC**; **"something happened" → signal**.

**Pipe shell example:** \`ps aux | grep java | wc -l\` starts three processes with the stdout of each wired to the next one's stdin through pipes; all run concurrently, and back-pressure from full pipes keeps them in step.` },
    { id: 'signals', kind: 'concept', title: 'Signals', bodyMd: `A **signal** is an asynchronous notification delivered to a process. Its default action is to terminate, ignore, stop or dump core, and a process can install a **handler** (with \`sigaction\`).

| Signal | Number | Meaning | Catchable? |
|---|---|---|---|
| \`SIGINT\` | 2 | Ctrl+C: interrupt | yes |
| \`SIGTERM\` | 15 | polite "please terminate" (default of \`kill\`) | yes: allows graceful shutdown |
| \`SIGKILL\` | 9 | forced kill | **no** |
| \`SIGSTOP\` | 19 (Linux x86) | pause | **no** (Ctrl+Z sends the catchable \`SIGTSTP\`) |
| \`SIGSEGV\` | 11 | invalid memory access | yes, but usually fatal |
| \`SIGCHLD\` | 17 | a child exited or stopped | yes: reap children here |
| \`SIGHUP\` | 1 | terminal closed; often "reload config" | yes |
| \`SIGUSR1/2\` | 10 / 12 | application-defined | yes |

Handler rules: keep them tiny, use only **async-signal-safe** functions (\`write\`, not \`printf\` or \`malloc\`), and communicate with the main code through a \`volatile sig_atomic_t\` flag. Signals are not queued per-instance for standard signals (several identical pending ones coalesce), and which thread receives a signal in a multithreaded process is not for you to rely on.

**Good shutdown practice:** handle \`SIGTERM\` (finish requests, close files), and leave \`SIGKILL\` as the last resort. Containers send \`SIGTERM\`, then \`SIGKILL\` after a grace period.` },
    { id: 'code', kind: 'code', title: 'A pipe between parent and child; a signal handler', bodyMd: 'The parent writes into the pipe and closes its write end, which gives the child an EOF after the data.', code: [cpp(`#include <cstdio>
#include <unistd.h>
#include <sys/wait.h>
int main() {
    int fd[2];
    if (pipe(fd) == -1) return 1;            // fd[0] = read end, fd[1] = write end
    pid_t pid = fork();
    if (pid == 0) {
        close(fd[1]);                         // child only reads
        char buf[16] = {0};
        ssize_t n = read(fd[0], buf, sizeof(buf) - 1);   // blocks until data arrives
        std::printf("child got: %s (%d bytes)\\n", buf, (int)n);
        return 0;
    }
    close(fd[0]);                              // parent only writes
    if (write(fd[1], "ping", 4) != 4) return 1;
    close(fd[1]);                              // closing the last write end gives the reader EOF
    wait(nullptr);
    return 0;
}`, 'C++ on Linux', 'child got: ping (4 bytes)'), cpp(`#include <signal.h>
#include <unistd.h>
#include <cstdio>
static volatile sig_atomic_t got = 0;
static void onUsr1(int) { got = 1; }          // tiny handler: set a flag only
int main() {
    struct sigaction sa = {};
    sa.sa_handler = onUsr1;
    sigaction(SIGUSR1, &sa, nullptr);
    raise(SIGUSR1);                            // the signal is delivered before raise returns
    std::printf("got=%d\\n", (int)got);
    return 0;
}`, 'C++ on Linux', 'got=1')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Forgetting to close the unused pipe ends: the reader never sees EOF because another process still holds a write end.
2. Using shared memory without any synchronisation.
3. Calling \`printf\`, \`malloc\` or locks inside signal handlers.
4. Trying to catch \`SIGKILL\` or \`SIGSTOP\`.
5. Assuming pipes carry messages (they are byte streams without boundaries).
6. Reaching for TCP sockets for two processes on one machine when a pipe or Unix socket is simpler and faster.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Shared memory vs message passing?', answerMd: 'Shared memory maps the same pages into several processes, so data exchange is just memory access (fastest) but needs explicit synchronisation. Message passing goes through kernel calls (pipes, queues, sockets), is simpler to get right and works across machines, but each message costs a system call and a copy.' },
    { id: 'iq2', q: 'What happens when you read from an empty pipe?', answerMd: 'The reader blocks until data arrives. If every write end has been closed, read returns 0 (end of file). Similarly, a writer blocks when the pipe buffer is full, and writing to a pipe with no readers raises SIGPIPE/EPIPE.' },
    { id: 'iq3', q: 'SIGTERM vs SIGKILL?', answerMd: 'SIGTERM asks a process to terminate and can be caught, so it can clean up (flush files, finish requests). SIGKILL cannot be caught, blocked or ignored: the kernel just removes the process, with no cleanup. Use SIGTERM first and SIGKILL only if it does not exit.' },
    { id: 'iq4', q: 'How does a shell implement `a | b`?', answerMd: 'It creates a pipe, forks two children, connects the first child\'s stdout to the pipe\'s write end and the second child\'s stdin to the read end (with dup2), closes the spare descriptors, and exec-s each program. Both run concurrently, with the pipe buffer providing back-pressure.' },
    { id: 'iq5', q: 'What can you safely do inside a signal handler?', answerMd: 'Very little: set a volatile sig_atomic_t flag or call async-signal-safe functions such as write. Anything that takes locks or uses non-reentrant state (printf, malloc) can deadlock or corrupt data if the signal interrupted the same function in the main flow.' },
  ],
  revision: { notesMd: `- Models: message passing (kernel copies) vs shared memory (fastest, needs sync).
- Pipe: one-way byte stream, blocks when empty/full; EOF when all write ends closed. FIFO = named pipe.
- Queue = discrete messages; sockets = bidirectional, network-capable; signals = notifications without data.
- SIGINT 2, SIGKILL 9 (uncatchable), SIGSEGV 11, SIGTERM 15, SIGSTOP uncatchable, SIGCHLD.
- Handlers: tiny, async-signal-safe only, volatile sig_atomic_t flag.`, flashcards: [
    { id: 'f1', front: 'Fastest IPC mechanism?', backMd: 'Shared memory (after setup, no kernel call per transfer), but it needs synchronisation.' },
    { id: 'f2', front: 'Which signals cannot be caught?', backMd: 'SIGKILL and SIGSTOP.' },
    { id: 'f3', front: 'When does read() on a pipe return 0?', backMd: 'When the pipe is empty and all write ends are closed (EOF).' },
    { id: 'f4', front: 'Default signal sent by `kill pid`?', backMd: 'SIGTERM (15).' },
    { id: 'f5', front: 'Pipe vs message queue?', backMd: 'A pipe is a byte stream; a queue preserves message boundaries.' },
    { id: 'f6', front: 'IPC across machines?', backMd: 'Sockets (or RPC built on them).' },
  ] },
  resources: [OSTEP, manpage('pipe'), manpage('signal', 7), manpage('shm_overview', 7)],
});

const ipMcqs: MCQ[] = [
  mcq({ ...q(IP), id: 'os.ip.q1', type: 'concept', difficulty: 'easy', stem: 'Which IPC mechanism is generally the fastest for exchanging large amounts of data on one machine?', options: ['Shared memory', ['Anonymous pipes', 'Each transfer goes through kernel calls and copies.'], ['Signals', 'Signals carry no data.'], ['TCP sockets on localhost', 'They add protocol and copy overhead.']], answer: 0, explanation: 'After the mapping is set up, processes read and write the same pages directly. The price is explicit synchronisation.' }),
  mcq({ ...q(IP), id: 'os.ip.q2', type: 'concept', difficulty: 'medium', stem: 'A parent creates a pipe, forks, and the child loops on `read` until it returns 0. The parent writes data but never closes its copy of the write end. What happens after the data is consumed?', options: ['The child blocks forever: a write end is still open, so there is no EOF', ['The child gets EOF immediately', 'EOF requires all write ends to be closed.'], ['The pipe closes automatically', 'Pipes live while any descriptor is open.'], ['The kernel sends SIGKILL', 'Nothing kills the child.']], answer: 0, explanation: 'Always close the unused ends of a pipe in both processes.' }),
  mcq({ ...q(IP), id: 'os.ip.q3', type: 'concept', difficulty: 'easy', stem: 'Which signals cannot be caught, blocked or ignored by a process?', options: ['SIGKILL and SIGSTOP', ['SIGINT and SIGTERM', 'Both can be caught.'], ['SIGSEGV and SIGCHLD', 'Both can be handled.'], ['SIGHUP and SIGUSR1', 'Both can be handled.']], answer: 0, explanation: 'These two let the kernel always stop or kill a process.' }),
  mcq({ ...q(IP), id: 'os.ip.q4', type: 'scenario', difficulty: 'medium', stem: 'A server should flush its logs and close connections when an operator runs `kill <pid>`. What should it do?', options: ['Install a SIGTERM handler that triggers a graceful shutdown', ['Install a SIGKILL handler', 'SIGKILL cannot be caught.'], ['Ignore all signals', 'Then it can never be stopped politely.'], ['Poll a file every second', 'Unnecessary; signals exist for this.']], answer: 0, explanation: '`kill` sends SIGTERM by default, which the server can catch to shut down cleanly.' }),
  mcq({ ...q(IP), id: 'os.ip.q5', type: 'concept', difficulty: 'medium', stem: 'What is true of a Unix pipe?', options: ['It is a one-way byte stream with no message boundaries, backed by a bounded kernel buffer', ['It preserves message boundaries like a message queue', 'Pipes are byte streams.'], ['It is bidirectional by default', 'A normal pipe is one-way; use two pipes or a socketpair for two-way.'], ['It stores data permanently on disk', 'It lives only in kernel memory.']], answer: 0, explanation: 'Writers block when the buffer is full and readers block when it is empty.' }),
  mcq({ ...q(IP), id: 'os.ip.q6', type: 'concept', difficulty: 'hard', stem: 'Why should a signal handler avoid calling `printf` or `malloc`?', options: ['The signal may interrupt the same non-reentrant function in the main flow, causing deadlock or corruption', ['They are not available in C++', 'They exist; they are just unsafe in handlers.'], ['They are too slow', 'Safety, not speed, is the issue.'], ['Handlers run in kernel mode', 'Handlers run in user mode.']], answer: 0, explanation: 'Only async-signal-safe functions (such as `write`) are allowed in handlers.' }),
  mcq({ ...q(IP), id: 'os.ip.q7', type: 'concept', difficulty: 'medium', stem: 'Two processes on different machines must exchange data. Which mechanism applies?', options: ['Sockets', ['Shared memory', 'Memory cannot be shared between machines by the OS.'], ['Anonymous pipes', 'They link related processes on one host.'], ['Signals', 'Signals are local to a host.']], answer: 0, explanation: 'Network communication uses TCP/UDP sockets (or higher-level RPC built on them).' }),
  mcq({ ...q(IP), id: 'os.ip.q8', type: 'concept', difficulty: 'medium', stem: 'Which statement distinguishes a POSIX message queue from a pipe?', options: ['A queue preserves discrete message boundaries, while a pipe is an unstructured byte stream', ['A queue only works between parent and child', 'Queues work between unrelated processes by name.'], ['A queue is faster than shared memory', 'Shared memory avoids kernel copies.'], ['A pipe stores messages with priorities', 'Priorities are a message-queue feature.']], answer: 0, explanation: 'Receiving from a queue returns one whole message, which also makes framing unnecessary.' }),
];

// ---------------------------------------------------------------------------------------
const FS = 'os.file-systems';
const fsys = osTopic({
  id: FS, title: 'File Systems', level: 'core', estMinutes: 55, prerequisites: ['os.memory-management'], related: ['os.io-management', 'os.system-calls', 'dbms.storage-recovery'],
  summary: 'Inodes, directories, allocation, journaling and links.',
  objectives: ['Describe what an inode stores, what a directory maps, and how a path is resolved.', 'Compare contiguous, linked (FAT) and indexed allocation and compute maximum file size for an inode with direct and indirect pointers.', 'Explain hard links vs symbolic links and what deleting a file really does.', 'Explain journaling, fsync and why crash consistency is hard.'],
  sections: [
    { id: 'inodes', kind: 'concept', title: 'Files, inodes and directories', bodyMd: `A file system turns a block device into **named files in directories**.

- An **inode** (index node) stores everything about a file *except its name*: type, **permissions**, owner, **size**, timestamps, **link count** and **pointers to its data blocks**.
- A **directory** is a special file mapping **names → inode numbers**.
- Resolving \`/home/ann/a.txt\` walks the path: read the root directory (inode 2 by convention) → find \`home\` → read that directory → find \`ann\` → find \`a.txt\` → load its inode → read its blocks. Directory and inode caches make this fast.
- **Free space** is tracked with a **bitmap** (one bit per block) or extent lists.

When a process opens a file, the kernel creates an entry in its **file-descriptor table** that points to a system-wide **open file description** (current **offset**, flags), which points to the inode. After \`fork()\` parent and child share the *same* open file description, so they **share the offset**; two independent \`open()\` calls get separate offsets.

Data is cached in the **page cache**: writes usually return as soon as they reach memory, and are flushed to disk later. \`fsync(fd)\` forces a file's data and metadata to stable storage.` },
    { id: 'allocation', kind: 'comparison', title: 'Allocation methods', bodyMd: `| Method | Idea | Pros | Cons |
|---|---|---|---|
| **Contiguous** | A file occupies consecutive blocks | Fast sequential and random access, simple | External fragmentation, hard to grow |
| **Linked** | Each block points to the next | No external fragmentation, easy growth | Random access is O(n), pointer loss breaks the chain |
| **FAT** | Linked list kept in a table in memory/disk | Random access by table walk | Table must be cached; large for big disks |
| **Indexed (inode)** | An index of block pointers | Fast random access, grows well | Index overhead; need indirect blocks for large files |
| **Extents** (ext4, NTFS, XFS) | (start block, length) ranges | Compact metadata for big contiguous files | |

**The classic Unix inode** has **12 direct pointers**, one **single-indirect** (a block full of pointers), one **double-indirect** and one **triple-indirect**.

**Maximum file size** with 4 KB blocks and 4-byte pointers (so **1024 pointers per block**):
- direct: 12 × 4 KB = **48 KB**
- single indirect: 1024 × 4 KB = **4 MB**
- double indirect: 1024² × 4 KB = **4 GB**
- triple indirect: 1024³ × 4 KB = **4 TB**
- total ≈ 4 TB + 4 GB + 4 MB + 48 KB.

Small files (the common case) need only direct pointers, with no extra reads. Locating byte 10 MB of a file needs the double-indirect path, which costs up to two extra block reads (usually cached).` },
    { id: 'links', kind: 'concept', title: 'Hard links, symbolic links and deletion', bodyMd: `| | **Hard link** | **Symbolic (soft) link** |
|---|---|---|
| What it is | another **directory entry** pointing to the **same inode** | a tiny file (its **own inode**) containing a **path** |
| Command | \`ln a b\` | \`ln -s /path/a b\` |
| Across file systems | no (inode numbers are per file system) | yes |
| Links to directories | not allowed (would create cycles) | allowed |
| If the original name is removed | data survives, still reachable via the other name | the link **dangles** (broken) |
| Link count | increments the inode's count | unchanged |

**What \`rm\` really does:** \`unlink\` removes the *name* and decrements the inode's **link count**. The inode and blocks are freed only when the **link count is 0 and no process still has the file open**. That is why deleting a huge log that a running process holds open does **not** free disk space until the process closes it (or restarts); \`lsof +L1\` finds such files.` },
    { id: 'journaling', kind: 'concept', title: 'Crash consistency and journaling', bodyMd: `Creating or extending a file updates several structures (the bitmap, the inode, a directory block, the data). A crash between those writes leaves the file system **inconsistent** (for example, a block marked used but unreferenced, or referenced by two files). The old fix was a full-disk **\`fsck\`** scan at boot, which takes ages on big disks.

**Journaling (write-ahead logging):** before changing the real structures, write a description of the whole operation to a **journal** and commit it with a commit record; then apply it; then mark the journal entry done. After a crash, recovery **replays committed entries and discards incomplete ones** in seconds.

- **Metadata-only journaling** (ext4 "ordered" mode, the default): only metadata goes through the journal, with data blocks written first. Fast, keeps the file system consistent but a file's *contents* may still be lost.
- **Full data journaling:** data is logged too: safest, but writes everything twice.
- **Copy-on-write file systems** (ZFS, Btrfs, APFS) never overwrite live data in place and switch to the new tree atomically.

Applications that need durability must call **\`fsync\`** (and sync the containing directory when creating files): the kernel's page cache and the disk's write cache both delay real persistence. Databases use the same write-ahead idea in their own logs.` },
    { id: 'commands', kind: 'example', title: 'Commands', bodyMd: 'Inspect inodes, links and open files on Linux.', code: [{ lang: 'bash', label: 'Links and inodes', code: `echo hi > a.txt
ln a.txt hard.txt            # hard link: same inode
ln -s a.txt soft.txt         # symbolic link: new inode holding the path
ls -li a.txt hard.txt soft.txt   # -i shows inode numbers; link count of a.txt is now 2
rm a.txt
cat hard.txt                 # still prints "hi"
cat soft.txt                 # error: dangling symlink
stat hard.txt                # size, blocks, inode, link count, timestamps
df -i                        # inode usage per file system (can run out before disk space!)
lsof +L1                     # deleted-but-still-open files that hold space` }] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Thinking a file's name is stored in its inode (it is in the directory).
2. Believing \`rm\` frees space immediately (open handles and other hard links keep the data).
3. Mixing up hard links and symbolic links, especially "hard links can cross file systems".
4. Treating a successful \`write\` as durable (it only reached the page cache; use \`fsync\`).
5. Forgetting that a file system can run out of **inodes** while free space remains (millions of tiny files).
6. Assuming journaling protects file *contents* in the default mode.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is an inode and what does it contain?', answerMd: 'The file system\'s per-file metadata record: type, permissions, owner, size, timestamps, link count and pointers to the data blocks. It does not contain the file name; directories map names to inode numbers.' },
    { id: 'iq2', q: 'Hard link vs symbolic link?', answerMd: 'A hard link is another directory entry for the same inode, so the file lives on until every name is gone; it cannot cross file systems or point to directories. A symbolic link is a separate small file holding a path; it can cross file systems and point to directories but dangles if the target is removed.' },
    { id: 'iq3', q: 'You deleted a 50 GB log but `df` shows no free space gained. Why?', answerMd: 'A running process still has the file open, so the inode and its blocks are retained until that last reference closes. Find it with lsof +L1, then restart or truncate the process\'s log (or truncate instead of deleting next time).' },
    { id: 'iq4', q: 'How does journaling help after a crash?', answerMd: 'Changes are first written to a journal with a commit record. On recovery the file system replays committed transactions and ignores incomplete ones, restoring consistency in seconds instead of running a full fsck. Metadata-only journaling protects the structure but not necessarily the latest data.' },
    { id: 'iq5', q: 'How large can a file be with 12 direct pointers, one single and one double indirect pointer, 4 KB blocks and 4-byte pointers?', answerMd: 'Each indirect block holds 1024 pointers. Direct: 48 KB; single indirect: 4 MB; double indirect: 4 GB. The total is about 4 GB + 4 MB + 48 KB (adding a triple indirect block would give about 4 TB more).' },
  ],
  revision: { notesMd: `- inode = metadata + block pointers (no name); directory = name → inode number; link count.
- Open file: fd table → open file description (offset) → inode. Fork shares the offset.
- Allocation: contiguous (fragmentation), linked/FAT (slow random), indexed/inode (direct + single/double/triple indirect), extents.
- 4 KB blocks, 4-byte pointers: 1024 per block → 48 KB + 4 MB + 4 GB + 4 TB.
- Hard link = same inode (not across file systems); symlink = own inode with a path.
- unlink frees data when link count = 0 AND no open fds. Journaling = write-ahead log; fsync for durability.`, flashcards: [
    { id: 'f1', front: 'Where is the file name stored?', backMd: 'In the directory entry, not in the inode.' },
    { id: 'f2', front: 'Pointers per 4 KB block with 4-byte pointers?', backMd: '1024.' },
    { id: 'f3', front: 'What does the inode link count track?', backMd: 'How many directory entries (hard links) reference it.' },
    { id: 'f4', front: 'When are a deleted file\'s blocks freed?', backMd: 'When its link count is 0 and no process has it open.' },
    { id: 'f5', front: 'Why journal?', backMd: 'To restore consistency quickly after a crash by replaying committed operations.' },
    { id: 'f6', front: 'Does a successful write() mean the data is on disk?', backMd: 'No: it is in the page cache until flushed; use fsync for durability.' },
  ] },
  resources: [OSTEP, { title: 'OSTEP: File System Implementation', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/file-implementation.pdf', kind: 'book' }, { title: 'OSTEP: Crash Consistency (fsck and journaling)', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/file-journaling.pdf', kind: 'book' }, manpage('inode', 7), manpage('fsync')],
});

const fsMcqs: MCQ[] = [
  mcq({ ...q(FS), id: 'os.fs.q1', type: 'concept', difficulty: 'easy', stem: 'Where is a file\'s name stored?', options: ['In its directory entry, which maps the name to an inode number', ['In the inode', 'The inode holds the metadata but not the name.'], ['In the data blocks of the file', 'File data is the file\'s content.'], ['In the superblock', 'The superblock describes the whole file system.']], answer: 0, explanation: 'This is why one inode can have several names (hard links).' }),
  mcq({ ...q(FS), id: 'os.fs.q2', type: 'scenario', difficulty: 'medium', stem: '`a.txt` has a hard link `h` and a symbolic link `s`. After `rm a.txt`, what happens?', options: ['`cat h` still works; `cat s` fails because the symlink dangles', ['Both still work', 'The symlink stores only the path "a.txt", which no longer exists.'], ['Both fail', 'The hard link keeps the inode alive.'], ['`cat s` works and `cat h` fails', 'It is the other way round.']], answer: 0, explanation: 'Removing a name only decrements the link count; the data persists while another hard link remains.' }),
  mcq({ ...q(FS), id: 'os.fs.q3', type: 'complexity', difficulty: 'medium', stem: 'An inode has 12 direct pointers, one single-indirect and one double-indirect pointer. Block size is 4 KB, pointer size 4 bytes. What is the maximum file size, approximately?', options: ['About 4 GB (4 GB + 4 MB + 48 KB)', ['About 4 MB', 'That is only the single-indirect contribution.'], ['About 48 KB', 'That is only the direct blocks.'], ['About 4 TB', 'That would need the triple-indirect pointer.']], answer: 0, explanation: '12×4 KB + 1024×4 KB + 1024²×4 KB = 48 KB + 4 MB + 4 GB.' }),
  mcq({ ...q(FS), id: 'os.fs.q4', type: 'concept', difficulty: 'medium', stem: 'A process has a 50 GB log file open. An admin runs `rm` on the file, yet `df` shows the same used space. Why?', options: ['The inode and blocks stay allocated while the process still holds the file open', ['`rm` only deletes the first block', '`rm` removes the name; space is freed later.'], ['The file system is read-only', '`rm` would have failed.'], ['`df` is cached for one hour', 'There is no such cache.']], answer: 0, explanation: 'Space is freed when the link count is 0 and the last file descriptor closes.' }),
  mcq({ ...q(FS), id: 'os.fs.q5', type: 'concept', difficulty: 'easy', stem: 'What is the main benefit of journaling?', options: ['Fast recovery to a consistent state after a crash', ['Faster writes', 'Writes usually cost more because of the log.'], ['Larger maximum file size', 'Size limits come from the inode or extent design.'], ['Compression of data', 'Journaling does not compress.']], answer: 0, explanation: 'After a crash the journal is replayed or discarded instead of scanning the whole disk with fsck.' }),
  mcq({ ...q(FS), id: 'os.fs.q6', type: 'concept', difficulty: 'medium', stem: 'Which statement about hard links is correct?', options: ['They cannot cross file systems because inode numbers are only unique within one', ['They can link to directories to build shortcuts', 'Directory hard links would create cycles and are disallowed.'], ['They create a new inode with the path', 'That describes a symbolic link.'], ['Deleting any one name deletes the data', 'Data survives until the last link is removed.']], answer: 0, explanation: 'A hard link is just another name for an inode in the same file system.' }),
  mcq({ ...q(FS), id: 'os.fs.q7', type: 'concept', difficulty: 'hard', stem: 'A server writes a record, `write()` returns success, and the machine loses power a second later. The record is gone. Why is this possible, and what is the fix?', options: ['The data was only in the OS page cache (or disk write cache); call `fsync` for durability', ['write() fails silently on all systems', 'It succeeded by writing to the cache.'], ['Journaling must be disabled', 'Journaling does not make a cached write durable immediately.'], ['Files must be opened with O_RDONLY', 'That prevents writing.']], answer: 0, explanation: 'Durability requires forcing data (and, for new files, the directory entry) to stable storage.' }),
  mcq({ ...q(FS), id: 'os.fs.q8', type: 'concept', difficulty: 'medium', stem: 'A directory contains millions of tiny files and writes fail with "No space left on device", but `df -h` shows 40% free. What is the likely cause?', options: ['The file system ran out of inodes (`df -i`)', ['The disk is physically failing', 'Failing hardware would show I/O errors.'], ['The page size is too large', 'Page size is a memory concept.'], ['The swap file is full', 'Swap is a separate resource.']], answer: 0, explanation: 'A fixed inode table (ext4) can be exhausted before blocks are.' }),
];

// ---------------------------------------------------------------------------------------
const IO = 'os.io-management';
const io = osTopic({
  id: IO, title: 'I/O and Disk Scheduling', level: 'advanced', estMinutes: 45, prerequisites: ['os.file-systems'], related: ['os.system-calls', 'os.virtual-memory'],
  summary: 'Interrupts vs polling, DMA, and disk scheduling.',
  objectives: ['Compare programmed I/O with polling, interrupt-driven I/O and DMA.', 'Compute disk access time from seek, rotational latency and transfer time.', 'Compute total head movement for FCFS, SSTF, SCAN and LOOK.', 'Explain why SSDs change the picture and what block-layer scheduling does today.'],
  sections: [
    { id: 'io-methods', kind: 'concept', title: 'Talking to devices: polling, interrupts, DMA', bodyMd: `A **device controller** has registers the CPU reaches through **port-mapped** or **memory-mapped I/O**; a **driver** hides the details from the kernel.

| Method | How | When it is good |
|---|---|---|
| **Polling** (programmed I/O) | CPU repeatedly reads a status register | Very fast devices and tiny waits (high-speed NICs and NVMe polling), but it burns CPU |
| **Interrupt-driven** | Device raises an interrupt when done; CPU runs something else meanwhile | Slow or unpredictable devices (keyboard, disk, network packets arriving) |
| **DMA** (direct memory access) | CPU programs the DMA controller with address, count and direction; the controller moves the data between device and memory by itself and interrupts **once** at the end | Bulk transfers (disk blocks, network frames): the CPU does not copy every byte |

Techniques around them: **buffering** (match speeds, double buffering), **caching** (page cache), **spooling** (printer queues), **interrupt coalescing / NAPI** (under heavy network load the Linux kernel switches from one interrupt per packet to polling to avoid interrupt storms), and **zero-copy** paths such as \`sendfile\` (disk → network without passing through user space).` },
    { id: 'disk', kind: 'concept', title: 'Disk access time', bodyMd: `For a spinning disk:

**access time = seek time + rotational latency + transfer time**

- **Seek:** moving the arm to the right track (typically several ms).
- **Rotational latency:** waiting for the sector to rotate under the head. On average **half a rotation**: at 7200 RPM one rotation takes 60 / 7200 = 8.33 ms, so the average is **4.17 ms**.
- **Transfer:** reading the bytes at the media rate (microseconds for 4 KB).

Example: 5 ms seek, 7200 RPM, 4 KB at 100 MB/s: 5 + 4.17 + 0.04 ≈ **9.2 ms** per random read, i.e. only about **100–110 random IOPS**. Sequential access avoids seeks and rotation, which is why disks (and file systems) work so hard to keep data contiguous and why databases prefer sequential logs and B+ trees.

**SSDs** have no moving parts: random reads take about 0.05–0.1 ms, giving tens of thousands to millions of IOPS. But flash cells must be **erased in large blocks** before rewrite, so SSDs use a translation layer, **wear levelling** and **garbage collection** (and \`TRIM\` tells them which blocks are free). Seek-minimising schedulers are pointless on them.` },
    { id: 'scheduling', kind: 'concept', title: 'Disk scheduling algorithms', bodyMd: `With many pending requests the OS reorders them to cut head movement. Example: cylinders 0–199, head at **53** moving toward higher numbers, queue **98, 183, 37, 122, 14, 124, 65, 67**.

| Algorithm | Rule | Head movement for the example |
|---|---|---|
| **FCFS** | in arrival order | 45+85+146+85+108+110+59+2 = **640** |
| **SSTF** (shortest seek first) | nearest request next: 65, 67, 37, 14, 98, 122, 124, 183 | **236** |
| **SCAN** (elevator) | sweep to one end servicing requests, then reverse | going down first: 53→0 then 0→183 = **236** |
| **LOOK** | like SCAN but reverses at the last request instead of the disk edge | going down first: 53→14 then 14→183 = **208** |
| **C-SCAN / C-LOOK** | sweep one direction only, then jump back and sweep again | more uniform waiting time |

- **FCFS** is fair but slow. **SSTF** is near-optimal in total movement but can **starve** far-away requests. **SCAN/LOOK** bound the waiting time and avoid starvation. **C-SCAN** gives more uniform response, since requests near the edges are not favoured.
- Linux's block layer uses schedulers like **mq-deadline**, **BFQ** and **none** (for NVMe), because on SSDs the goal shifts from minimising seeks to fairness, latency deadlines and merging adjacent requests.` },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Counting rotational latency as a full rotation instead of half on average.
2. Forgetting that SCAN goes all the way to the edge but LOOK stops at the last request.
3. Claiming SSTF is optimal and starvation-free (it is greedy and can starve).
4. Saying DMA means no interrupts (there is one at the end of the transfer).
5. Applying seek-based scheduling reasoning to SSDs.
6. Reading the direction of the initial sweep wrong in SCAN/LOOK questions: it must be stated.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Polling vs interrupts vs DMA?', answerMd: 'Polling has the CPU spin on a status register: simple and low-latency for fast devices but wasteful. Interrupts let the CPU work until the device signals completion, which suits slow or unpredictable devices. DMA lets a controller move whole blocks to or from memory without the CPU copying each word, interrupting once when finished; it is used for bulk transfers.' },
    { id: 'iq2', q: 'What makes up the time to read a block from a spinning disk?', answerMd: 'Seek time to move the arm, rotational latency (on average half a rotation) for the sector to arrive under the head, and transfer time. Seek and rotation dominate, which is why sequential access is much faster than random access.' },
    { id: 'iq3', q: 'Compare SSTF and SCAN.', answerMd: 'SSTF always serves the nearest request, minimising immediate seek distance and total movement, but requests far from the head can starve. SCAN sweeps the head back and forth like an elevator, giving bounded waiting and no starvation at a slightly higher total movement. LOOK is SCAN without travelling to the disk edges.' },
    { id: 'iq4', q: 'Why does disk scheduling matter less on SSDs?', answerMd: 'SSDs have no seek or rotation, so reordering for head movement gains nothing. Schedulers instead aim at fairness, latency deadlines and request merging; NVMe devices often use no scheduler (none) and rely on their own deep queues.' },
    { id: 'iq5', q: 'What is an interrupt storm and how is it mitigated?', answerMd: 'When a very busy device raises one interrupt per event (for example per packet), the CPU can spend all its time in interrupt handlers. Interrupt coalescing batches events, and mechanisms such as NAPI switch to polling under load.' },
  ],
  revision: { notesMd: `- Polling (CPU spins) vs interrupt (device signals) vs DMA (controller copies; one interrupt at the end).
- Disk access = seek + rotational latency (avg ½ rotation: 7200 RPM → 4.17 ms) + transfer.
- Example head 53, queue 98 183 37 122 14 124 65 67: FCFS 640, SSTF 236, SCAN (down first) 236, LOOK (down first) 208.
- SSTF can starve; SCAN/LOOK bounded waiting; C-SCAN more uniform.
- SSDs: no seek/rotation; erase-before-write, wear levelling, TRIM; schedulers: none / mq-deadline / BFQ.`, flashcards: [
    { id: 'f1', front: 'Average rotational latency at 7200 RPM?', backMd: 'About 4.17 ms (half of 8.33 ms).' },
    { id: 'f2', front: 'What does DMA save the CPU from?', backMd: 'Copying every byte of a transfer; it only sets up the transfer and handles one completion interrupt.' },
    { id: 'f3', front: 'Which algorithm can starve far requests?', backMd: 'SSTF.' },
    { id: 'f4', front: 'SCAN vs LOOK?', backMd: 'SCAN goes to the disk edge before reversing; LOOK reverses at the last request.' },
    { id: 'f5', front: 'Disk access time formula?', backMd: 'Seek + rotational latency + transfer time.' },
    { id: 'f6', front: 'Why is sequential I/O faster on HDDs?', backMd: 'It avoids repeated seeks and rotational waits.' },
  ] },
  resources: [OSTEP, { title: 'OSTEP: Hard Disk Drives', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/file-disks.pdf', kind: 'book' }, { title: 'OSTEP: I/O Devices', url: 'https://pages.cs.wisc.edu/~remzi/OSTEP/file-devices.pdf', kind: 'book' }],
});

const ioMcqs: MCQ[] = [
  mcq({ ...q(IO), id: 'os.io.q1', type: 'concept', difficulty: 'easy', stem: 'For a large disk-to-memory transfer, which approach avoids the CPU copying every byte?', options: ['DMA', ['Polling', 'The CPU would read each status and data word itself.'], ['Programmed I/O', 'The CPU performs the copy.'], ['Spooling', 'Spooling queues output for slow devices such as printers.']], answer: 0, explanation: 'The DMA controller moves the block and raises one interrupt on completion.' }),
  mcq({ ...q(IO), id: 'os.io.q2', type: 'complexity', difficulty: 'medium', stem: 'A disk spins at 7200 RPM. What is its average rotational latency?', options: ['About 4.17 ms', ['About 8.33 ms', 'That is a full rotation; on average only half is needed.'], ['About 0.5 ms', 'Too small for 7200 RPM.'], ['About 16.7 ms', 'That is a rotation at 3600 RPM.']], answer: 0, explanation: 'One rotation takes 60/7200 s = 8.33 ms; the average wait is half of that.' }),
  mcq({ ...q(IO), id: 'os.io.q3', type: 'complexity', difficulty: 'medium', stem: 'Head at cylinder 53, request queue 98, 183, 37, 122, 14, 124, 65, 67. What is the total head movement under FCFS?', options: ['640', ['236', 'That is SSTF.'], ['208', 'That is LOOK going down first.'], ['322', 'Not the sum of consecutive distances in arrival order.']], answer: 0, explanation: '|53-98| + |98-183| + |183-37| + |37-122| + |122-14| + |14-124| + |124-65| + |65-67| = 640.' }),
  mcq({ ...q(IO), id: 'os.io.q4', type: 'complexity', difficulty: 'medium', stem: 'Same queue and head position (53). What is the total head movement under SSTF?', options: ['236', ['640', 'That is FCFS.'], ['208', 'That is LOOK.'], ['299', 'Check the order: 65, 67, 37, 14, 98, 122, 124, 183.']], answer: 0, explanation: '12 + 2 + 30 + 23 + 84 + 24 + 2 + 59 = 236.' }),
  mcq({ ...q(IO), id: 'os.io.q5', type: 'complexity', difficulty: 'hard', stem: 'Same queue, head at 53 moving toward cylinder 0 first, LOOK algorithm. Total head movement?', options: ['208', ['236', 'That is SCAN, which travels to cylinder 0 before reversing.'], ['640', 'That is FCFS.'], ['169', 'That is only the second leg (14 to 183).']], answer: 0, explanation: '53→14 is 39, then 14→183 is 169: 39 + 169 = 208. SCAN would go to 0 first (236).' }),
  mcq({ ...q(IO), id: 'os.io.q6', type: 'concept', difficulty: 'medium', stem: 'What is the main drawback of SSTF?', options: ['Starvation of requests far from the current head position', ['Very high total head movement', 'SSTF is usually close to minimal in total movement.'], ['It needs a rotating disk to be reversed', 'Unrelated.'], ['It cannot handle more than 8 requests', 'No such limit.']], answer: 0, explanation: 'A steady stream of nearby requests can keep a distant one waiting.' }),
  mcq({ ...q(IO), id: 'os.io.q7', type: 'concept', difficulty: 'medium', stem: 'When is polling preferable to interrupts?', options: ['When the device is extremely fast and events are so frequent that interrupt overhead would dominate', ['For a keyboard', 'Keystrokes are rare, so interrupts are efficient.'], ['When the CPU has other work to do', 'That favours interrupts.'], ['Never, because polling is always slower', 'High-rate devices (NVMe, 100 Gbit NICs) use polling modes.']], answer: 0, explanation: 'At high event rates a few polls cost less than a context-disrupting interrupt per event.' }),
  mcq({ ...q(IO), id: 'os.io.q8', type: 'concept', difficulty: 'medium', stem: 'Why is seek-minimising disk scheduling mostly irrelevant for SSDs?', options: ['SSDs have no moving head, so access time does not depend on block position', ['SSDs cannot be scheduled', 'The OS still queues and merges requests.'], ['SSDs always run FCFS in hardware', 'They have internal parallelism and their own firmware logic.'], ['SSD data is stored in RAM', 'It is flash storage.']], answer: 0, explanation: 'Schedulers for SSDs target fairness, deadlines and merging instead.' }),
];

// ---------------------------------------------------------------------------------------
const CM = 'os.concurrency-multithreading';
const concurrency = osTopic({
  id: CM, title: 'Concurrency and Multithreading', level: 'core', estMinutes: 55, prerequisites: ['os.synchronisation'], related: ['os.classic-problems', 'os.deadlocks', 'cpp.memory-raii'],
  summary: 'Concurrency vs parallelism, thread pools, false sharing and atomics.',
  objectives: ['Distinguish concurrency from parallelism and I/O-bound from CPU-bound work.', 'Size a thread pool and apply Amdahl\'s law.', 'Explain data races, atomics, compare-and-swap and why `volatile` is not a synchronisation tool in C++.', 'Explain false sharing, priority inversion and the GIL at interview depth.'],
  sections: [
    { id: 'concepts', kind: 'concept', title: 'Concurrency vs parallelism', bodyMd: `- **Concurrency** is *structure*: dealing with many things at once, with tasks that overlap in time. It can run on **one core** by interleaving.
- **Parallelism** is *execution*: several tasks truly running at the same instant on **multiple cores**.

A web server with 10,000 connections on one thread (an event loop) is concurrent but not parallel; matrix multiplication across 8 cores is parallel.

- **CPU-bound** work (compute) benefits from parallelism up to the number of cores.
- **I/O-bound** work (network, disk) spends most of its time waiting, so it benefits from concurrency (threads blocking, or async I/O) even on one core.

**Amdahl's law:** if a fraction \`p\` of the work can be parallelised across \`n\` workers, the maximum speed-up is **1 / ((1 − p) + p / n)**. With p = 0.9 and n = 8 the speed-up is about **4.7×**, and even with infinitely many cores it can never exceed **1 / (1 − p) = 10×**. The serial part is the bottleneck, and lock contention makes it larger.` },
    { id: 'pools', kind: 'concept', title: 'Thread pools and sizing', bodyMd: `Creating a thread per task is costly (stack memory, kernel work, scheduling) and unbounded (10,000 tasks → 10,000 threads → thrashing or out-of-memory). A **thread pool** keeps a fixed set of worker threads that pull tasks from a (bounded) **blocking queue**.

**Sizing rules of thumb:**
- CPU-bound: about **number of cores** (or cores + 1).
- I/O-bound: **cores × (1 + wait time / compute time)**. A task that computes 10 ms and waits 90 ms on I/O gives 8 × (1 + 9) = **80 threads** on 8 cores.
- Always bound the **queue** and choose a **rejection policy** (block, drop, run in caller), otherwise a traffic spike turns into an out-of-memory crash. Use separate pools for slow and fast work so one cannot starve the other.

Related models: **async/event loop** (Node.js, Python asyncio: one thread, non-blocking I/O, great for many idle connections, bad for CPU-heavy callbacks), **work stealing** (Java \`ForkJoinPool\`, Go scheduler), **green threads/goroutines** (millions of cheap user-level tasks multiplexed on few OS threads), and **actors/message passing** to avoid sharing state. In CPython the **GIL** lets only one thread execute Python bytecode at a time: threads help I/O-bound code but not CPU-bound code (use processes).` },
    { id: 'atomics', kind: 'concept', title: 'Data races, atomics and memory ordering', bodyMd: `A **data race** is two threads accessing the same memory location concurrently, at least one writing, with no synchronisation. In C++ it is **undefined behaviour**, not just "a wrong number".

- **Atomic operations** (\`std::atomic<int>\`, Java \`AtomicInteger\`) make read-modify-write indivisible using special CPU instructions (\`lock xadd\`, \`cmpxchg\`). A counter incremented from many threads with \`fetch_add\` is correct and usually much faster than a mutex.
- **Compare-and-swap (CAS):** "if the value is still \`expected\`, set it to \`desired\`; report whether it worked". Retry loops built on CAS give **lock-free** data structures. Watch out for the **ABA problem** (value changed A→B→A, so CAS wrongly succeeds).
- **Visibility and ordering:** CPUs and compilers reorder operations, and caches delay visibility. Atomics and locks provide **happens-before** guarantees. \`std::atomic\` defaults to sequential consistency; weaker orderings (\`acquire/release\`, \`relaxed\`) are an expert tool.
- **\`volatile\` is not atomic in C++** and gives no ordering between threads. (Java's \`volatile\` gives visibility and ordering for a single variable, but \`volatile int x; x++\` is still not atomic.)
- Immutable data and thread-confined data need no synchronisation at all: the cheapest fix is to **not share**.` },
    { id: 'false-sharing', kind: 'concept', title: 'False sharing and other performance traps', bodyMd: `CPU caches move data in **cache lines** (64 bytes on x86). If two threads on different cores update **different variables that sit on the same cache line**, each write invalidates the other core's copy and the line bounces between cores even though no data is logically shared. This is **false sharing**, and it can make a "parallel" loop slower than the serial one.

Fix: pad or align hot per-thread data to its own line (\`alignas(64)\`, Java \`@Contended\`), or accumulate into **thread-local** variables and combine at the end.

Other classics:
- **Lock contention:** many threads fighting for one lock serialise (Amdahl). Shrink critical sections, shard locks, use read-write locks or lock-free structures.
- **Priority inversion:** a low-priority thread holds a lock that a high-priority thread needs, while a medium-priority thread keeps preempting the holder (the Mars Pathfinder reset). Fix: **priority inheritance**.
- **Deadlock** (lock-order cycles), **livelock** and **starvation**: see Deadlocks and Classic Problems.
- **Thread safety vs reentrancy:** a function is *thread-safe* if concurrent calls are correct; *reentrant* if it can be re-entered (even from a signal handler) because it uses no shared or static state.` },
    { id: 'code', kind: 'code', title: 'Atomic counter and false-sharing padding', bodyMd: 'Four threads each add 1000 times; with `std::atomic` the answer is always 4000, while a plain `int` would be a data race.', code: [cpp(`#include <atomic>
#include <iostream>
#include <thread>
#include <vector>
int main() {
    std::atomic<int> counter(0);
    std::vector<std::thread> ts;
    for (int t = 0; t < 4; ++t)
        ts.emplace_back([&] { for (int i = 0; i < 1000; ++i) counter.fetch_add(1); });
    for (auto& th : ts) th.join();
    std::cout << counter.load() << "\\n";
}`, 'C++ (std::atomic)', '4000'), cpp(`#include <atomic>
// Each counter owns a full 64-byte cache line, so threads updating different counters
// do not invalidate each other's cache lines (no false sharing).
struct alignas(64) PaddedCounter {
    std::atomic<long> value{0};
};
PaddedCounter perThread[8];`, 'Avoiding false sharing')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Using \`volatile\` in C++ as a thread-safety tool.
2. Using one thread per request with no upper bound.
3. Using more threads for CPU-bound work than cores and expecting a speed-up.
4. Ignoring Amdahl's law (and hidden serial parts such as shared locks or allocators).
5. Per-thread counters packed in one array (false sharing).
6. Assuming a data race is "just a wrong number" (it is undefined behaviour in C++).
7. Holding a lock while calling unknown code (callbacks), which leads to deadlock.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Concurrency vs parallelism?', answerMd: 'Concurrency is about structuring a program as independently progressing tasks that may interleave, even on one core. Parallelism is executing multiple tasks at the same instant on multiple cores. I/O-bound systems need concurrency; CPU-bound ones need parallelism.' },
    { id: 'iq2', q: 'How do you size a thread pool?', answerMd: 'For CPU-bound tasks use about the number of cores. For I/O-bound tasks use cores × (1 + wait/compute). Then validate under load, bound the queue, pick a rejection policy, and separate pools for different workload types so slow dependencies cannot starve everything.' },
    { id: 'iq3', q: 'What is false sharing?', answerMd: 'Independent variables used by different threads share a cache line, so every write by one core invalidates the line in the other cores\' caches and the line ping-pongs, slowing both. Pad or align the variables to separate cache lines or use thread-local accumulators.' },
    { id: 'iq4', q: 'What does compare-and-swap do, and what is the ABA problem?', answerMd: 'CAS atomically sets a location to a new value only if it still holds an expected value, returning success or failure, and is the basis of lock-free algorithms. ABA happens when the value changes from A to B and back to A between a thread\'s read and its CAS, so the CAS succeeds even though the state changed; versioned pointers or hazard pointers fix it.' },
    { id: 'iq5', q: 'What does Amdahl\'s law say?', answerMd: 'The speed-up from parallelising is limited by the serial fraction: speed-up = 1 / ((1 - p) + p/n). If 10% of the work is serial, no number of cores gives more than 10×; typically contention and coordination reduce it further.' },
  ],
  revision: { notesMd: `- Concurrency = overlapping tasks (structure); parallelism = simultaneous execution (cores).
- CPU-bound ≈ cores threads; I/O-bound ≈ cores × (1 + wait/compute). Bound queues; reject policy.
- Amdahl: speed-up = 1 / ((1 − p) + p/n); p = 0.9, n = 8 → 4.7×; limit 1/(1−p) = 10×.
- Data race = UB in C++. Atomics / CAS for lock-free; volatile ≠ atomic (C++). ABA problem.
- False sharing: same 64-byte cache line → pad with alignas(64) or use thread-local state.
- Priority inversion → priority inheritance. Python GIL: threads don't speed up CPU-bound code.`, flashcards: [
    { id: 'f1', front: 'Amdahl speed-up with p = 0.9 and n = 8?', backMd: 'About 4.7×.' },
    { id: 'f2', front: 'Upper limit of speed-up if 10% is serial?', backMd: '10×.' },
    { id: 'f3', front: 'Cache line size on x86?', backMd: '64 bytes.' },
    { id: 'f4', front: 'Is `volatile int` thread-safe in C++?', backMd: 'No: it is neither atomic nor ordered between threads; use std::atomic.' },
    { id: 'f5', front: 'Thread pool size for CPU-bound work?', backMd: 'About the number of cores.' },
    { id: 'f6', front: 'Fix for priority inversion?', backMd: 'Priority inheritance.' },
  ] },
  resources: [OSTEP, { title: 'std::atomic (cppreference)', url: 'https://en.cppreference.com/w/cpp/atomic/atomic', kind: 'official-docs' }, { title: 'Java Concurrency: java.util.concurrent (Oracle tutorial)', url: 'https://docs.oracle.com/javase/tutorial/essential/concurrency/', kind: 'official-docs' }],
});

const cmMcqs: MCQ[] = [
  mcq({ ...q(CM), id: 'os.cm.q1', type: 'concept', difficulty: 'easy', stem: 'A single-threaded Node.js server handles thousands of open connections by interleaving them with non-blocking I/O. This is best described as:', options: ['Concurrency without (necessarily) parallelism', ['Parallelism without concurrency', 'Interleaved tasks are concurrent by definition.'], ['Neither', 'Many tasks are in progress at once.'], ['Multiprocessing', 'It uses one thread in one process.']], answer: 0, explanation: 'Tasks overlap in time on one core; nothing runs at the same instant.' }),
  mcq({ ...q(CM), id: 'os.cm.q2', type: 'complexity', difficulty: 'medium', stem: '90% of a program can be parallelised. By Amdahl\'s law, what is the speed-up with 8 cores?', options: ['About 4.7×', ['8×', 'That assumes the serial 10% does not exist.'], ['About 9×', 'That ignores that 8 cores do not reach the 10× limit.'], ['10×', 'The limit for infinite cores, not for 8.']], answer: 0, explanation: '1 / (0.1 + 0.9/8) = 1 / 0.2125 ≈ 4.71.' }),
  mcq({ ...q(CM), id: 'os.cm.q3', type: 'complexity', difficulty: 'medium', stem: 'A server has 8 cores. Each request computes for 10 ms and then waits 90 ms for a database. Using cores × (1 + wait/compute), how many worker threads fit this workload?', options: ['80', ['8', 'That is only right for purely CPU-bound work.'], ['16', 'The wait ratio is 9, not 1.'], ['800', 'That multiplies by an extra factor of 10.']], answer: 0, explanation: '8 × (1 + 90/10) = 80 threads keep the cores busy while others wait.' }),
  mcq({ ...q(CM), id: 'os.cm.q4', type: 'debug', difficulty: 'medium', stem: 'In C++, several threads increment a `volatile int counter` 1000 times each. What is true?', options: ['It is a data race (undefined behaviour); updates can be lost, so use `std::atomic<int>` or a mutex', ['volatile makes increments atomic, so it always ends at the right total', 'In C++ volatile gives neither atomicity nor inter-thread ordering.'], ['It is safe on x86', 'The language rules still make it undefined; compilers may also reorder.'], ['The compiler rejects the program', 'It compiles; the bug is silent.']], answer: 0, explanation: '`counter++` is read-modify-write; only atomics or locks make it indivisible.' }),
  mcq({ ...q(CM), id: 'os.cm.q5', type: 'concept', difficulty: 'medium', stem: 'Four threads each update their own counter stored in `long counters[4]`. Adding more threads makes the program slower, not faster. What is the likely cause?', options: ['False sharing: the counters share one cache line, so the line bounces between cores', ['Deadlock', 'The threads take no locks.'], ['A memory leak', 'No allocation is involved.'], ['The GIL', 'This is C++, not CPython.']], answer: 0, explanation: 'Pad each counter to its own 64-byte cache line (alignas(64)) or use thread-local accumulators.' }),
  mcq({ ...q(CM), id: 'os.cm.q6', type: 'concept', difficulty: 'hard', stem: 'A low-priority thread holds a mutex needed by a high-priority thread, and a medium-priority thread keeps pre-empting the low-priority one. Which problem is this and what fixes it?', options: ['Priority inversion; priority inheritance', ['Deadlock; lock ordering', 'There is no cycle of waiting; the holder is just starved of CPU.'], ['Livelock; random back-off', 'Threads are not repeatedly reacting to each other.'], ['False sharing; padding', 'It is not about cache lines.']], answer: 0, explanation: 'Temporarily raising the holder\'s priority to that of the waiter lets it finish and release the lock.' }),
  mcq({ ...q(CM), id: 'os.cm.q7', type: 'concept', difficulty: 'medium', stem: 'Why does adding threads to a CPU-bound pure-Python program (CPython) not speed it up?', options: ['The Global Interpreter Lock lets only one thread execute Python bytecode at a time', ['Python has no threads', 'It has threads; they just do not run bytecode in parallel.'], ['Threads are limited to 4 per process', 'No such limit.'], ['The OS forbids multithreaded Python', 'It does not.']], answer: 0, explanation: 'Use multiprocessing or native extensions for CPU-bound parallelism; threads still help I/O-bound code.' }),
  mcq({ ...q(CM), id: 'os.cm.q8', type: 'concept', difficulty: 'hard', stem: 'In a lock-free stack a thread reads the top node A, is pre-empted, other threads pop A, pop B, and push A back, then the first thread performs `CAS(top, A, next)`. What is this hazard called?', options: ['The ABA problem', ['A deadlock', 'No thread is blocked.'], ['Spurious wake-up', 'That concerns condition variables.'], ['Starvation', 'The CAS succeeds; the issue is correctness.']], answer: 0, explanation: 'The value looks unchanged (A) though the structure changed; tagged/versioned pointers or hazard pointers prevent it.' }),
];

// ---------------------------------------------------------------------------------------
const LX = 'os.linux-essentials';
const linux = osTopic({
  id: LX, title: 'Linux Process and Memory Essentials', level: 'core', estMinutes: 50, prerequisites: ['os.process-states'], related: ['devops.linux', 'os.virtual-memory', 'os.ipc', 'cn.troubleshooting'],
  summary: 'ps/top, signals, /proc, the OOM killer and load average.',
  objectives: ['Inspect processes and resource use with ps, top, free, vmstat and /proc.', 'Read load average and memory numbers correctly (free vs available, buffers/cache).', 'Explain the OOM killer, exit codes 137 and 143, and container memory limits.', 'Diagnose "high load, low CPU", "server slow", and "process disappeared" scenarios.'],
  sections: [
    { id: 'processes', kind: 'concept', title: 'Looking at processes', bodyMd: `\`\`\`
ps aux                 # all processes: USER PID %CPU %MEM VSZ RSS STAT START TIME COMMAND
ps -ef --forest        # parent/child tree
top / htop             # live view; press M to sort by memory, P by CPU
pstree -p              # process tree with PIDs
\`\`\`

**STAT** column: \`R\` running/runnable, \`S\` interruptible sleep (waiting for an event), \`D\` **uninterruptible sleep** (usually disk or NFS I/O; cannot be killed until it returns), \`T\` stopped, \`Z\` zombie; extra letters: \`s\` session leader, \`l\` multithreaded, \`+\` foreground.

**Memory columns:** **VSZ** (virtual size, everything mapped, including unused and shared libraries) is rarely meaningful; **RSS** (resident set size) is the physical memory the process occupies right now.

**Controlling processes:** \`kill -15 PID\` (SIGTERM, graceful), \`kill -9 PID\` (SIGKILL, last resort), \`kill -STOP/-CONT\`, \`pkill name\`, \`nice -n 10 cmd\` / \`renice\` (priority: -20 highest to 19 lowest), \`nohup cmd &\` or \`systemd\`/\`tmux\` for long jobs, \`lsof -i :8080\` or \`ss -tlnp\` to find who owns a port.

**Exit codes:** 0 success; non-zero error; a process killed by signal N exits with **128 + N**: **137 = SIGKILL (128+9)**, **143 = SIGTERM (128+15)**, **139 = SIGSEGV (128+11)**.` },
    { id: 'proc', kind: 'concept', title: '/proc and memory numbers', bodyMd: `\`/proc\` is a **virtual file system**: the kernel exposes live process and system state as files (no disk involved).

- \`/proc/<pid>/status\` (state, memory, threads), \`/proc/<pid>/cmdline\`, \`/proc/<pid>/fd/\` (open files), \`/proc/<pid>/maps\` (address-space layout), \`/proc/<pid>/limits\`.
- \`/proc/meminfo\`, \`/proc/cpuinfo\`, \`/proc/loadavg\`, \`/proc/sys/vm/*\` (tunables such as \`swappiness\`).

**\`free -h\` and what matters:**
- Linux uses spare RAM as a **page cache** for files, so "free" is usually small on a healthy system.
- **\`available\`** estimates memory that can be used without swapping (free + reclaimable cache). **Watch \`available\`, not \`free\`.**
- **Swap** is disk space used when RAM is short. Constant swapping (\`si\`/\`so\` columns of \`vmstat 1\` non-zero) means **thrashing**: the machine crawls.
- A process's memory is demand-paged: \`malloc(10 GB)\` may succeed (virtual) and only fail when pages are actually touched (**overcommit**).` },
    { id: 'oom', kind: 'concept', title: 'The OOM killer and container limits', bodyMd: `When RAM and swap are exhausted and the kernel cannot reclaim enough, the **OOM killer** picks a victim by **\`oom_score\`** (mostly memory use, adjustable with \`oom_score_adj\`) and sends it **SIGKILL**. The process gets **no chance to clean up or log**, which is why "my service just vanished" is a classic symptom. Confirm with \`dmesg -T | grep -i 'killed process'\` or \`journalctl -k\`.

**Containers:** Docker/Kubernetes set a **cgroup memory limit**. A process exceeding it is OOM-killed *by that cgroup*, even if the host has plenty of RAM; Kubernetes reports **\`OOMKilled\`** with **exit code 137**. Fixes: raise the limit, find leaks, tune heap sizes (the JVM's \`-Xmx\` must be below the container limit, since it also needs off-heap memory). CPU limits behave differently: processes are **throttled**, not killed.

**ulimits** (\`ulimit -a\`) cap open files (\`nofile\`: "too many open files"), processes (\`nproc\`) and stack size per process.` },
    { id: 'load', kind: 'concept', title: 'Load average and CPU numbers', bodyMd: `\`uptime\` prints three **load averages** (1, 5, 15 minutes). On Linux, load = the average number of tasks that are **runnable (R) or in uninterruptible sleep (D)**.

- Compare to the **number of cores**: load 8 on an 8-core box is fully busy, not overloaded; load 24 means about three tasks per core.
- Trend: 1-min > 15-min means load is rising; the reverse means it is falling.
- Because **D-state tasks count**, **high load with low CPU usage** points to **I/O waiting** (slow disk or NFS), not CPU. Check \`top\` for \`%wa\` (I/O wait), \`iostat -x 1\`, \`vmstat 1\` (columns \`r\` runnable, \`b\` blocked, \`wa\`).
- \`top\` CPU fields: \`us\` user, \`sy\` kernel (system calls, interrupts), \`ni\` nice, \`id\` idle, \`wa\` I/O wait, \`st\` stolen by the hypervisor (noisy neighbour on a VM).

**Triage order for "the server is slow":** 1) \`uptime\`/load; 2) \`top\`: CPU-bound (high \`us\`), kernel-bound (high \`sy\`), or I/O-bound (high \`wa\`)? 3) \`free -h\`/\`vmstat\`: swapping? 4) \`iostat\`, \`ss -s\`/network; 5) per-process: \`pidstat\`, \`strace -p\`, application logs.` },
    { id: 'drills', kind: 'example', title: 'Scenario drills', bodyMd: `**1. Load average 12 on 4 cores, but CPU is 90% idle.** Many tasks are in D state waiting on I/O: look at \`vmstat 1\` (\`b\` and \`wa\` high) and \`iostat -x\` (disk saturated, high await). It is a storage problem, not a CPU problem.

**2. \`free\` shows 200 MB free of 16 GB; is it out of memory?** Look at the \`available\` column. If it is ~10 GB, the rest is reclaimable page cache and all is well.

**3. The service restarts every few hours with no error logs.** Check \`dmesg -T | grep -i oom\` and \`journalctl -k\`; exit status 137 from systemd or Kubernetes confirms an OOM kill. Profile memory growth or raise the limit.

**4. Port 8080 "address already in use".** \`ss -tlnp | grep 8080\` or \`lsof -i :8080\` names the PID; stop it or choose another port.

**5. "Too many open files".** \`ls /proc/<pid>/fd | wc -l\` versus \`ulimit -n\`; either leak (not closing sockets/files) or raise \`nofile\`.

**6. A process in D state cannot be killed.** It is blocked inside the kernel on I/O (often a hung NFS mount or failing disk); fix the I/O path, since signals are not delivered until the call returns.` },
    { id: 'commands', kind: 'example', title: 'Command cheat sheet', bodyMd: 'Read-only commands that are safe to run on a production Linux host.', code: [{ lang: 'bash', label: 'Triage toolkit', code: `uptime                                  # load averages
nproc                                   # number of cores
top -o %MEM                             # sort by memory
free -h                                 # look at "available"
vmstat 1 5                              # r/b queues, si/so swapping, us/sy/id/wa
ps -eo pid,ppid,stat,%cpu,%mem,rss,cmd --sort=-rss | head
cat /proc/$$/status | head -20          # this shell's state and memory
cat /proc/loadavg
dmesg -T | grep -i -E 'out of memory|killed process'
ls /proc/<pid>/fd | wc -l               # open files of a process
ss -tlnp                                # who listens on which port` }] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Panicking about low "free" memory without reading \`available\`.
2. Reading load average without dividing by the core count.
3. Assuming high load means high CPU (D-state I/O waits count).
4. Using \`kill -9\` first, which skips cleanup and can leave locks, temp files or corrupted state.
5. Judging memory by VSZ.
6. Forgetting that a container can be OOM-killed while the host has free RAM.
7. Looking for application logs after an OOM kill (the kernel log has the evidence).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'What is load average and how do you interpret it?', answerMd: 'The exponentially averaged count of tasks that are runnable or in uninterruptible sleep, over 1, 5 and 15 minutes. Compare it with the number of cores: a load equal to the core count means the CPUs are fully used. Because I/O-blocked tasks count, high load with low CPU use points to a disk or network storage bottleneck.' },
    { id: 'iq2', q: 'free shows almost no free memory. Is that a problem?', answerMd: 'Usually not. Linux fills spare RAM with the page cache, which it releases when applications need memory. Look at the available column and at swap activity (vmstat si/so). Trouble is low available memory with heavy swapping or OOM kills.' },
    { id: 'iq3', q: 'A process disappeared without logging an error. What do you check?', answerMd: 'Whether the kernel OOM killer SIGKILLed it: dmesg or journalctl -k for "Out of memory: Killed process", exit status 137, and in containers the OOMKilled reason. Also check for crashes (core dumps, exit 139), a supervisor restart policy, or an operator or deployment sending SIGTERM (143).' },
    { id: 'iq4', q: 'What is the difference between kill, kill -15 and kill -9?', answerMd: 'kill and kill -15 send SIGTERM, which a process can catch for graceful shutdown. kill -9 sends SIGKILL, which cannot be caught or ignored: the kernel terminates the process immediately without cleanup. Try TERM first and use KILL as a last resort.' },
    { id: 'iq5', q: 'What is /proc?', answerMd: 'A virtual file system the kernel uses to expose live information about processes (/proc/<pid>/status, fd, maps) and the system (meminfo, cpuinfo, loadavg) as readable files, and some tunables under /proc/sys. Tools like ps, top and free read from it.' },
  ],
  revision: { notesMd: `- ps STAT: R, S, D (uninterruptible I/O), T, Z. RSS = resident memory; VSZ = virtual.
- Exit code = 128 + signal: 137 (KILL), 143 (TERM), 139 (SEGV).
- free: read "available", not "free"; page cache is reclaimable; swapping (si/so) = trouble.
- OOM killer sends SIGKILL (no logs from the app; see dmesg); container cgroup limits → OOMKilled 137.
- Load average = R + D tasks per 1/5/15 min; compare to cores; high load + low CPU → I/O wait.
- /proc: virtual FS for process and kernel state. ulimit -n: open files.`, flashcards: [
    { id: 'f1', front: 'Exit code of a process killed by SIGKILL?', backMd: '137 (128 + 9).' },
    { id: 'f2', front: 'Which memory column should you watch in free?', backMd: 'available.' },
    { id: 'f3', front: 'What does state D in ps mean?', backMd: 'Uninterruptible sleep, usually blocked on disk or NFS I/O; it counts toward load.' },
    { id: 'f4', front: 'Where do you find evidence of an OOM kill?', backMd: 'dmesg / journalctl -k (and exit code 137, Kubernetes OOMKilled).' },
    { id: 'f5', front: 'Load average 8 on an 8-core machine means?', backMd: 'About one runnable task per core: fully used, not overloaded.' },
    { id: 'f6', front: 'RSS vs VSZ?', backMd: 'RSS is physical memory in use; VSZ is all virtual address space mapped.' },
  ] },
  resources: [OSTEP, { title: 'Brendan Gregg: Linux Performance', url: 'https://www.brendangregg.com/linuxperf.html', kind: 'article' }, manpage('proc', 5), manpage('free', 1), manpage('signal', 7)],
});

const lxMcqs: MCQ[] = [
  mcq({ ...q(LX), id: 'os.lx.q1', type: 'scenario', difficulty: 'medium', stem: '`uptime` shows a load average of 12 on a 4-core server, but `top` shows the CPUs 90% idle and high `%wa`. What is the most likely bottleneck?', options: ['Storage or other I/O: many tasks are blocked in uninterruptible sleep', ['A CPU-bound process', 'The CPUs are mostly idle.'], ['Too little RAM for the page cache', 'Possible, but the evidence (high iowait) points to the I/O path.'], ['A fork bomb', 'It would show high CPU and process counts.']], answer: 0, explanation: 'Linux load counts D-state tasks, so slow disk or NFS raises load without using CPU.' }),
  mcq({ ...q(LX), id: 'os.lx.q2', type: 'concept', difficulty: 'easy', stem: '`free -h` shows 150 MB free but 11 GB available out of 16 GB. What does this mean?', options: ['The system is healthy: most memory is reclaimable page cache', ['The system is about to run out of memory', 'Available memory is plentiful.'], ['11 GB of swap is in use', 'Swap is a separate line.'], ['A memory leak exists', 'Nothing here suggests a leak.']], answer: 0, explanation: 'Linux caches files in spare RAM; the cache is released when applications need memory.' }),
  mcq({ ...q(LX), id: 'os.lx.q3', type: 'concept', difficulty: 'medium', stem: 'A container exits with status 137 and Kubernetes reports `OOMKilled`. What happened?', options: ['The process exceeded its memory limit and was sent SIGKILL (128 + 9)', ['It exited normally', 'Normal exit is 0.'], ['It received SIGTERM from a rolling update', 'SIGTERM yields 143.'], ['It crashed with a segmentation fault', 'SIGSEGV yields 139.']], answer: 0, explanation: 'Exit code = 128 + signal number. The cgroup limit, not host RAM, triggered the kill.' }),
  mcq({ ...q(LX), id: 'os.lx.q4', type: 'concept', difficulty: 'medium', stem: 'Which signal can a service catch to flush its buffers before exiting?', options: ['SIGTERM', ['SIGKILL', 'It cannot be caught.'], ['SIGSTOP', 'It cannot be caught either.'], ['None; signals cannot be handled', 'Most signals can be handled.']], answer: 0, explanation: 'SIGTERM requests termination politely; SIGKILL removes the process immediately.' }),
  mcq({ ...q(LX), id: 'os.lx.q5', type: 'concept', difficulty: 'medium', stem: 'A process is stuck in state `D` and does not respond to `kill -9`. Why?', options: ['It is in an uninterruptible kernel wait (typically I/O), so the signal is acted on only when it returns', ['Zombies cannot be killed', 'That describes state Z.'], ['SIGKILL is blocked by the process', 'SIGKILL cannot be blocked.'], ['It is a kernel thread that ignores signals', 'Not the usual explanation for a user process.']], answer: 0, explanation: 'Fix the underlying I/O (hung NFS mount, failing disk) and it will then die.' }),
  mcq({ ...q(LX), id: 'os.lx.q6', type: 'concept', difficulty: 'easy', stem: 'Which `ps` column best reflects the physical memory a process is using right now?', options: ['RSS', ['VSZ', 'It includes all mapped virtual memory, much of it unused or shared.'], ['TIME', 'That is accumulated CPU time.'], ['PID', 'That is the process id.']], answer: 0, explanation: 'RSS is the resident set size; VSZ is virtual size.' }),
  mcq({ ...q(LX), id: 'os.lx.q7', type: 'scenario', difficulty: 'medium', stem: 'A service dies every few hours with nothing in its own logs. Which check is most informative first?', options: ['`dmesg -T | grep -i "killed process"` for OOM-killer messages', ['`ping` the server', 'Network reachability does not explain a process death.'], ['`df -h`', 'Disk space rarely kills a process silently.'], ['`ls /proc/loadavg`', 'It lists the file but shows no content.']], answer: 0, explanation: 'The OOM killer sends SIGKILL, which the process cannot log; the kernel log records the event.' }),
  mcq({ ...q(LX), id: 'os.lx.q8', type: 'concept', difficulty: 'medium', stem: 'What is `/proc`?', options: ['A virtual file system exposing live process and kernel information as files', ['A directory for process backup files on disk', 'Nothing is stored on disk.'], ['The directory holding all executables', 'That is /bin or /usr/bin.'], ['A swap partition', 'Swap is separate.']], answer: 0, explanation: 'Reading `/proc/<pid>/status` or `/proc/meminfo` asks the kernel for current data.' }),
];

export const topics: Topic[] = [ipc, fsys, io, concurrency, linux];
export const mcqs: MCQ[] = [...ipMcqs, ...fsMcqs, ...ioMcqs, ...cmMcqs, ...lxMcqs];
