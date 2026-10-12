import type { MCQ, Topic } from '../schema';
import { mcq } from '../helpers';
import { dTopic, dockerfile, q, sh, yaml } from './common';
import * as more from './more';

// ---------------------------------------------------------------------------------------
const LX = 'devops.linux';
const linux = dTopic({
  id: LX, title: 'Linux Fundamentals', level: 'foundation', estMinutes: 50, prerequisites: [],
  summary: 'Filesystem, permissions, processes, signals, pipes and shell scripting.',
  objectives: ['Read and set permissions (rwx, octal, umask).', 'Inspect and control processes and signals.', 'Combine commands with pipes and redirection.', 'Find things fast: grep, find, du/df, logs.'],
  sections: [
    { id: 'perms', kind: 'concept', title: 'Permissions', bodyMd: `\`-rwxr-xr--\` = file type, then **owner**, **group**, **others**, each with read (4), write (2), execute (1). So \`rwxr-xr--\` = **754**.

- \`chmod 640 secrets.env\`: owner rw, group r, others nothing. \`chmod +x deploy.sh\` adds execute.
- \`chown app:app file\` changes the owner and group.
- On a **directory**, x means "can enter/traverse" and r means "can list".
- **umask** removes bits from the default (666 for files, 777 for directories): umask 022 gives files **644** and directories **755**.` },
    { id: 'procs', kind: 'concept', title: 'Processes and signals', bodyMd: `- \`ps aux\`, \`top\`/\`htop\`, \`pgrep -f name\`; \`/proc/<pid>/\` exposes process details.
- **SIGTERM (15)**: polite request to exit (default for \`kill\`), which a program can catch to shut down gracefully. **SIGKILL (9)**: immediate, cannot be caught (no cleanup). **SIGINT (2)**: Ctrl-C. **SIGHUP (1)**: terminal closed, often used to mean "reload config".
- Always try SIGTERM before SIGKILL; containers and Kubernetes send SIGTERM, then SIGKILL after a grace period.
- **Load average** = the average number of runnable (plus uninterruptible) tasks over 1, 5 and 15 minutes; compare it with the CPU count.` },
    { id: 'pipes', kind: 'example', title: 'Pipes, redirection and everyday commands', bodyMd: 'Small tools combined with pipes solve most log-analysis tasks:', code: [sh(`grep -i "error" app.log | wc -l                      # count error lines
grep -o 'status=[0-9]*' access.log | sort | uniq -c | sort -rn | head   # status code histogram
find /var/log -name "*.log" -mtime -1                  # logs modified in the last day
du -sh * | sort -h | tail                              # biggest entries in this directory
df -h                                                  # free disk space per filesystem
cmd > out.txt 2> err.txt                               # stdout and stderr to separate files
cmd > all.txt 2>&1                                     # both to one file
tail -f /var/log/syslog                                # follow a log`)] },
    { id: 'script', kind: 'code', title: 'A safe shell script', bodyMd: 'Start scripts with strict mode so failures are not silently ignored:', code: [sh(`#!/usr/bin/env bash
set -euo pipefail          # exit on error, on unset variables, and on failures inside pipes

backup_dir="/backups/$(date +%F)"
mkdir -p "$backup_dir"     # quote variables: paths may contain spaces
for f in /etc/myapp/*.conf; do
  cp "$f" "$backup_dir/"
done
echo "backed up to $backup_dir"`, 'Bash')] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. \`chmod 777\` to "fix" a permission problem.
2. \`kill -9\` first, skipping graceful shutdown (corrupted state, lost buffers).
3. Unquoted variables in scripts (\`rm -rf $DIR/\` with an empty DIR).
4. Writing \`2>&1 > file\` (wrong order: stderr still goes to the terminal).
5. Confusing \`df\` (filesystem free space) with \`du\` (space used by files).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'SIGTERM vs SIGKILL?', answerMd: 'SIGTERM asks the process to terminate and can be caught, so the program can finish requests, flush data and exit cleanly. SIGKILL is handled by the kernel, cannot be caught or ignored, and kills immediately. Send SIGTERM first and SIGKILL only if it does not exit.' },
    { id: 'iq2', q: 'What does chmod 750 mean?', answerMd: 'Owner rwx (7), group r-x (5), others no access (0).' },
    { id: 'iq3', q: 'The disk is full. How do you find what is using the space?', answerMd: '`df -h` to find the full filesystem, then `du -sh /* | sort -h` and drill down (often logs, core dumps or Docker images). Also check for deleted files still held open by a process (`lsof | grep deleted`), which use space until the process restarts.' },
    { id: 'iq4', q: 'What does load average tell you?', answerMd: 'The average number of tasks running or waiting (for CPU or uninterruptible I/O) over 1, 5 and 15 minutes. On a 4-core machine, a load of 4 means fully busy; much higher means queueing.' },
  ],
  revision: { notesMd: `- r = 4, w = 2, x = 1; owner/group/others; 754 = rwxr-xr--.
- umask 022 → files 644, dirs 755.
- SIGTERM (15) graceful; SIGKILL (9) immediate; SIGINT (2) Ctrl-C.
- \`> file 2>&1\` sends both streams to the file.
- set -euo pipefail; quote variables.`, flashcards: [
    { id: 'f1', front: 'Octal for rw-r-----?', backMd: '640.' },
    { id: 'f2', front: 'Signal that cannot be caught?', backMd: 'SIGKILL (9) (and SIGSTOP).' },
    { id: 'f3', front: 'Files created with umask 022 get?', backMd: '644.' },
    { id: 'f4', front: 'x permission on a directory means?', backMd: 'Permission to enter/traverse it.' },
    { id: 'f5', front: 'Redirect stdout and stderr to one file?', backMd: '`cmd > file 2>&1`.' },
  ] },
  resources: [{ title: 'The Linux Command Line (free book)', url: 'https://linuxcommand.org/tlcl.php', kind: 'book' }, { title: 'signal(7) manual page', url: 'https://man.archlinux.org/man/signal.7', kind: 'official-docs' }],
});

const lxMcqs: MCQ[] = [
  mcq({ ...q(LX), id: 'devops.lx.q1', type: 'concept', difficulty: 'easy', stem: 'What permissions does `chmod 754 file` set?', options: ['rwxr-xr--', ['rwxr-xr-x', 'That is 755.'], ['rw-r-xr--', 'That is 654.'], ['rwxrw-r--', 'That is 764.']], answer: 0, explanation: '7 = rwx, 5 = r-x, 4 = r--.' }),
  mcq({ ...q(LX), id: 'devops.lx.q2', type: 'concept', difficulty: 'medium', stem: 'With umask 027, what permissions does a newly created regular file get by default?', options: ['640 (rw-r-----)', ['750', 'That is for directories (777 − 027).'], ['644', 'That is umask 022.'], ['600', 'That is umask 077.']], answer: 0, explanation: 'Files start from 666; removing 027 gives 640.' }),
  mcq({ ...q(LX), id: 'devops.lx.q3', type: 'scenario', difficulty: 'medium', stem: 'You need to stop a web server so it finishes in-flight requests. Which signal?', options: ['SIGTERM', ['SIGKILL', 'It cannot be handled; requests are cut off.'], ['SIGSTOP', 'It pauses the process.'], ['SIGSEGV', 'A segmentation fault signal.']], answer: 0, explanation: 'SIGTERM can be caught to drain connections and exit cleanly.' }),
  mcq({ ...q(LX), id: 'devops.lx.q4', type: 'debug', difficulty: 'medium', stem: 'You run `./script.sh > out.log 2>&1` vs `./script.sh 2>&1 > out.log`. In the second form, where do errors go?', options: ['To the terminal: stderr was pointed at the old stdout before stdout was redirected', ['To out.log, same as the first', 'Order matters.'], ['Nowhere; they are discarded', 'They go to the terminal.'], ['To a file called 2', 'That would be `2>`.']], answer: 0, explanation: 'Redirections apply left to right.' }),
  mcq({ ...q(LX), id: 'devops.lx.q5', type: 'scenario', difficulty: 'medium', stem: '`df -h` shows the disk 100% full, but `du` totals much less. Likely cause?', options: ['A process still holds open a deleted (large) file, e.g. a rotated log', ['du is always wrong', 'It counts visible files.'], ['The disk is failing', 'Not indicated.'], ['Too many inodes', 'That shows as "no space" with df -i, not this mismatch.']], answer: 0, explanation: 'Find it with `lsof | grep deleted`; restart or signal the process to reopen logs.' }),
  mcq({ ...q(LX), id: 'devops.lx.q6', type: 'concept', difficulty: 'easy', stem: 'What does `set -e` do in a bash script?', options: ['Exits the script when a command fails', ['Echoes each command', 'That is set -x.'], ['Exports all variables', 'That is set -a.'], ['Enables extended globbing', 'That is shopt -s extglob.']], answer: 0, explanation: 'Combine with -u (unset variables) and -o pipefail.' }),
];

// ---------------------------------------------------------------------------------------
const GT = 'devops.git';
const git = dTopic({
  id: GT, title: 'Git', level: 'foundation', estMinutes: 45, prerequisites: [],
  summary: 'Branching, merge vs rebase, conflicts, reset vs revert and workflows.',
  objectives: ['Explain the working tree, index (staging) and commits.', 'Choose merge vs rebase and explain the golden rule.', 'Undo safely with restore, reset and revert.', 'Resolve conflicts and recover with reflog.'],
  sections: [
    { id: 'model', kind: 'concept', title: 'The model', bodyMd: `Git stores **snapshots** as commits; each commit points to its parent(s). A **branch** is just a movable pointer to a commit; **HEAD** points to the current branch.

Three areas: **working tree** (your files) → \`git add\` → **index/staging** → \`git commit\` → **repository**.` },
    { id: 'merge-rebase', kind: 'comparison', title: 'Merge vs rebase', bodyMd: `| | Merge | Rebase |
|---|---|---|
| What it does | creates a merge commit joining two histories | replays your commits on top of another branch (new commit IDs) |
| History | true, possibly messy | linear, clean |
| Safety | never rewrites existing commits | rewrites history |

**Golden rule:** do not rebase commits that others have already pulled (shared branches). Rebasing your own local feature branch onto \`main\` before a PR is fine. A **fast-forward** merge just moves the pointer when there is no divergence.` },
    { id: 'undo', kind: 'comparison', title: 'Undoing things', bodyMd: `| Goal | Command |
|---|---|
| Discard local changes to a file | \`git restore file\` |
| Unstage a file | \`git restore --staged file\` |
| Undo the last commit, keep changes staged | \`git reset --soft HEAD~1\` |
| Undo the last commit, keep changes unstaged | \`git reset HEAD~1\` (mixed, the default) |
| Throw away the last commit and its changes | \`git reset --hard HEAD~1\` (destructive) |
| Undo a commit already pushed/shared | \`git revert <sha>\` (new commit that inverts it) |
| Find "lost" commits after a bad reset | \`git reflog\` |`, code: [sh(`git switch -c feature/login          # create and switch to a branch
git fetch origin && git rebase origin/main   # update a local feature branch
git merge --no-ff feature/login      # merge with an explicit merge commit
git log --oneline --graph --all      # see the history
git stash push -m "wip" && git stash pop     # shelve and restore work`)] },
    { id: 'conflicts', kind: 'concept', title: 'Conflicts', bodyMd: 'A conflict happens when both sides changed the same lines. Git marks them with `<<<<<<<`, `=======` and `>>>>>>>`. Edit to the intended result, `git add` the file, then `git commit` (merge) or `git rebase --continue`. To give up: `git merge --abort` or `git rebase --abort`.' },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. \`git reset --hard\` or force-pushing on a shared branch.
2. Rebasing a branch others are working on.
3. Committing secrets; deleting the file in a later commit does not remove it from history (rotate the secret).
4. Giant commits mixing unrelated changes.
5. Forgetting that \`git pull\` = fetch + merge (or rebase, if configured).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Merge vs rebase?', answerMd: 'Merge joins histories with a merge commit and never rewrites existing commits. Rebase replays commits onto a new base, producing a linear history but new commit IDs. Rebase local work for cleanliness; never rebase commits others already have.' },
    { id: 'iq2', q: 'reset vs revert?', answerMd: 'reset moves the branch pointer back (soft/mixed/hard decide what happens to changes), rewriting history: fine locally, dangerous once pushed. revert adds a new commit that undoes a previous commit, which is safe on shared branches.' },
    { id: 'iq3', q: 'You ran git reset --hard and lost a commit. Can you recover it?', answerMd: 'Usually yes: `git reflog` lists where HEAD has been; find the commit hash and `git reset --hard <sha>` or create a branch at it. Uncommitted changes that were never committed are not recoverable this way.' },
    { id: 'iq4', q: 'You pushed an API key to GitHub. What do you do?', answerMd: 'Revoke and rotate the key immediately (assume it is compromised). Then remove it from history (git filter-repo or BFG) and force-push in coordination with the team, and add secret scanning so it does not happen again.' },
  ],
  revision: { notesMd: `- Working tree → index → commit. Branch = pointer.
- Merge keeps history; rebase rewrites (never on shared commits).
- reset --soft (keep staged) / mixed (keep unstaged) / --hard (discard).
- revert = new inverse commit (safe for shared).
- reflog rescues lost commits.`, flashcards: [
    { id: 'f1', front: 'Undo last commit but keep changes staged?', backMd: '`git reset --soft HEAD~1`.' },
    { id: 'f2', front: 'Safe way to undo a pushed commit?', backMd: '`git revert <sha>`.' },
    { id: 'f3', front: 'Golden rule of rebasing?', backMd: 'Never rebase commits others have pulled.' },
    { id: 'f4', front: 'Recover a commit after a bad reset?', backMd: '`git reflog`, then reset or branch to the hash.' },
    { id: 'f5', front: 'git pull equals?', backMd: 'git fetch + git merge (or rebase).' },
  ] },
  resources: [{ title: 'Pro Git (free book)', url: 'https://git-scm.com/book/en/v2', kind: 'book' }, { title: 'git-reset documentation', url: 'https://git-scm.com/docs/git-reset', kind: 'official-docs' }],
});

const gtMcqs: MCQ[] = [
  mcq({ ...q(GT), id: 'devops.gt.q1', type: 'scenario', difficulty: 'easy', stem: 'A bad commit is already on the shared `main` branch. How do you undo it safely?', options: ['`git revert <sha>` and push the new commit', ['`git reset --hard HEAD~1` and force-push', 'Rewrites shared history.'], ['Delete the repository', 'No.'], ['`git checkout <sha>`', 'Only moves HEAD locally.']], answer: 0, explanation: 'revert records an inverse commit without rewriting history.' }),
  mcq({ ...q(GT), id: 'devops.gt.q2', type: 'concept', difficulty: 'medium', stem: 'After `git reset --soft HEAD~1`, where are the changes from the undone commit?', options: ['Staged in the index', ['Unstaged in the working tree', 'That is the default (mixed) reset.'], ['Deleted', 'That is --hard.'], ['In the stash', 'reset does not stash.']], answer: 0, explanation: 'Soft reset only moves the branch pointer.' }),
  mcq({ ...q(GT), id: 'devops.gt.q3', type: 'concept', difficulty: 'medium', stem: 'Why should you not rebase a branch that teammates have already pulled?', options: ['Rebase creates new commits with new IDs; teammates\' history diverges and duplicates appear', ['Rebase deletes the branch', 'It does not.'], ['Rebase is slower than merge', 'Speed is not the issue.'], ['Rebase cannot handle conflicts', 'It can.']], answer: 0, explanation: 'Rewriting shared history forces everyone to reconcile.' }),
  mcq({ ...q(GT), id: 'devops.gt.q4', type: 'scenario', difficulty: 'medium', stem: 'You accidentally ran `git reset --hard HEAD~3`. What is the first command to recover?', options: ['`git reflog` to find the previous HEAD', ['`git revert HEAD~3`', 'The commits are no longer on the branch.'], ['`git stash pop`', 'Nothing was stashed.'], ['`git clean -fd`', 'Deletes untracked files; makes things worse.']], answer: 0, explanation: 'Then `git reset --hard <sha>` back to it.' }),
  mcq({ ...q(GT), id: 'devops.gt.q5', type: 'concept', difficulty: 'easy', stem: 'What is a Git branch, internally?', options: ['A movable pointer to a commit', ['A full copy of the repository', 'Branches are cheap pointers.'], ['A folder', 'No.'], ['A list of changed files', 'No.']], answer: 0, explanation: 'Committing moves the current branch pointer forward.' }),
  mcq({ ...q(GT), id: 'devops.gt.q6', type: 'concept', difficulty: 'medium', stem: 'When does `git merge` perform a fast-forward?', options: ['When the current branch has no commits that the other branch lacks (no divergence)', ['Always', 'Not with divergent histories.'], ['Only with --squash', 'Different option.'], ['When there are conflicts', 'Conflicts require a real merge.']], answer: 0, explanation: 'The pointer simply moves ahead; use --no-ff to force a merge commit.' }),
];

// ---------------------------------------------------------------------------------------
const DK = 'devops.docker';
const docker = dTopic({
  id: DK, title: 'Docker', level: 'core', estMinutes: 50, prerequisites: [LX],
  summary: 'Images, containers, Dockerfiles, layers, volumes, networks and Compose.',
  objectives: ['Explain images vs containers and containers vs VMs.', 'Write a cache-friendly, small, multi-stage Dockerfile.', 'Persist data with volumes and connect services with networks.', 'Debug a container that will not start.'],
  sections: [
    { id: 'concept', kind: 'concept', title: 'Images, containers, and VMs', bodyMd: `An **image** is a read-only, layered filesystem plus metadata (entry command, env). A **container** is a running instance of an image with a thin writable layer, isolated with Linux **namespaces** (PID, network, mount…) and limited with **cgroups** (CPU, memory).

**Containers vs VMs:** containers share the host kernel, so they start in milliseconds and are small; VMs run a full guest OS on a hypervisor, with stronger isolation and more overhead.` },
    { id: 'dockerfile', kind: 'code', title: 'A good Dockerfile', bodyMd: 'Order instructions from least to most frequently changing so the **layer cache** works, use **multi-stage** builds to ship only runtime files, and run as a non-root user.', code: [dockerfile(`# ---- build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                      # cached unless the dependency files change
COPY . .
RUN npm run build

# ---- runtime stage ----
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
# nginx's official image already defines a sensible CMD`)] },
    { id: 'data-net', kind: 'concept', title: 'Volumes, networks and Compose', bodyMd: `- The container's writable layer disappears with the container. Persist data in **volumes** (managed by Docker) or **bind mounts** (a host directory, handy in development).
- Containers on the same user-defined **network** reach each other by **service name** (\`db:5432\`); \`-p 8080:80\` publishes container port 80 on host port 8080.
- **CMD** gives default arguments that are easy to override; **ENTRYPOINT** fixes the executable. Use the exec form (\`["node", "server.js"]\`) so the process receives signals as PID 1.`, code: [yaml(`services:
  api:
    build: .
    ports: ["8080:8080"]
    environment:
      DATABASE_URL: postgres://app:app@db:5432/app   # "db" resolves on the compose network
    depends_on: [db]
  db:
    image: postgres:16
    environment: { POSTGRES_USER: app, POSTGRES_PASSWORD: app, POSTGRES_DB: app }
    volumes: ["pgdata:/var/lib/postgresql/data"]
volumes:
  pgdata: {}`, 'compose.yaml')] },
    { id: 'debug', kind: 'example', title: 'Debugging containers', bodyMd: 'When a container exits immediately or misbehaves:', code: [sh(`docker ps -a                       # status and exit code
docker logs --tail 100 <container> # what it printed before dying
docker inspect <container>         # config, mounts, network, OOMKilled flag
docker exec -it <container> sh     # shell inside a running container
docker image history <image>       # layer sizes`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. \`COPY . .\` before installing dependencies, so every code change reinstalls everything.
2. Storing data inside the container filesystem.
3. Shell-form CMD (\`CMD node server.js\`), so the app is not PID 1 and misses SIGTERM.
4. Baking secrets into images (they persist in layers).
5. Using \`latest\` tags in production (non-reproducible).
6. Connecting to \`localhost\` from one container to reach another (use the service name).` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Container vs virtual machine?', answerMd: 'Containers share the host kernel and isolate processes with namespaces and cgroups: lightweight and fast to start. VMs virtualise hardware and run a full guest OS: heavier, but with stronger isolation and the ability to run different kernels.' },
    { id: 'iq2', q: 'How do you make Docker builds faster and images smaller?', answerMd: 'Order layers so dependency installation is cached (copy manifests, install, then copy source), use .dockerignore, multi-stage builds that copy only artefacts into a slim runtime image, and pin small base images.' },
    { id: 'iq3', q: 'CMD vs ENTRYPOINT?', answerMd: 'ENTRYPOINT defines the executable that always runs; CMD supplies default arguments (or the default command) that `docker run` arguments override. Use exec form so signals reach the process.' },
    { id: 'iq4', q: 'A container keeps exiting immediately. How do you debug it?', answerMd: '`docker ps -a` for the exit code, `docker logs` for output, `docker inspect` for OOMKilled and config; run it interactively with a shell entrypoint to reproduce; check that the main process stays in the foreground.' },
  ],
  revision: { notesMd: `- Image = layers (read-only); container = running instance + writable layer.
- Namespaces isolate; cgroups limit.
- Cache-friendly order: manifests → install → source.
- Multi-stage builds; non-root; pinned tags; no secrets in layers.
- Volumes persist; service names resolve on compose networks.
- Exec-form CMD/ENTRYPOINT so PID 1 gets SIGTERM.`, flashcards: [
    { id: 'f1', front: 'What limits a container\'s CPU and memory?', backMd: 'cgroups.' },
    { id: 'f2', front: 'What isolates a container\'s view of processes and network?', backMd: 'Namespaces.' },
    { id: 'f3', front: 'Why copy package.json before the source?', backMd: 'So the dependency-install layer stays cached when only code changes.' },
    { id: 'f4', front: 'Where should a database container keep its data?', backMd: 'In a volume.' },
    { id: 'f5', front: '`-p 8080:80` means?', backMd: 'Host port 8080 → container port 80.' },
  ] },
  resources: [{ title: 'Docker docs: Get started', url: 'https://docs.docker.com/get-started/', kind: 'official-docs' }, { title: 'Docker docs: Building best practices', url: 'https://docs.docker.com/build/building/best-practices/', kind: 'official-docs' }],
});

const dkMcqs: MCQ[] = [
  mcq({ ...q(DK), id: 'devops.dk.q1', type: 'debug', difficulty: 'medium', stem: 'Every code change triggers a full `npm ci` during `docker build`. The Dockerfile has `COPY . .` then `RUN npm ci`. Fix?', options: ['Copy package.json/package-lock.json and run `npm ci` before copying the rest of the source', ['Use a bigger base image', 'Unrelated.'], ['Add --no-cache', 'Makes it worse.'], ['Use ENTRYPOINT instead of RUN', 'Different purpose.']], answer: 0, explanation: 'Layers after a changed COPY are rebuilt; isolate dependency installation from source changes.' }),
  mcq({ ...q(DK), id: 'devops.dk.q2', type: 'concept', difficulty: 'easy', stem: 'What is the main reason containers start much faster than VMs?', options: ['They share the host kernel instead of booting a guest OS', ['They have no filesystem', 'They do.'], ['They run in the browser', 'No.'], ['They use less network', 'Unrelated.']], answer: 0, explanation: 'Starting a container is starting an isolated process.' }),
  mcq({ ...q(DK), id: 'devops.dk.q3', type: 'scenario', difficulty: 'medium', stem: 'In Docker Compose, the API container fails to connect to `localhost:5432` for Postgres. What should it use?', options: ['The service name, e.g. `db:5432`', ['127.0.0.1:5432', 'Same as localhost: the API container itself.'], ['The host\'s public IP', 'Unnecessary and fragile.'], ['Port 80', 'Wrong port.']], answer: 0, explanation: 'Each container has its own localhost; compose DNS resolves service names.' }),
  mcq({ ...q(DK), id: 'devops.dk.q4', type: 'debug', difficulty: 'medium', stem: '`docker stop` always takes 10 seconds and the app never logs its graceful shutdown. The Dockerfile has `CMD npm start`. Likely cause?', options: ['Shell form: PID 1 is a shell that does not forward SIGTERM, so Docker falls back to SIGKILL after the timeout', ['The image is too large', 'Unrelated.'], ['The port is not exposed', 'Unrelated.'], ['The volume is full', 'Unrelated.']], answer: 0, explanation: 'Use exec form (`CMD ["node", "server.js"]`) or an init process such as tini.' }),
  mcq({ ...q(DK), id: 'devops.dk.q5', type: 'concept', difficulty: 'easy', stem: 'What happens to data written inside a container\'s filesystem (not a volume) when the container is removed?', options: ['It is lost', ['It is saved into the image', 'Images are not modified by running containers.'], ['It moves to a volume automatically', 'No.'], ['It is pushed to the registry', 'No.']], answer: 0, explanation: 'Use volumes for anything that must persist.' }),
  mcq({ ...q(DK), id: 'devops.dk.q6', type: 'concept', difficulty: 'medium', stem: 'What is the benefit of a multi-stage Dockerfile?', options: ['Build tools stay in the build stage; the final image contains only runtime artefacts, so it is smaller and has less attack surface', ['It runs stages in parallel containers at runtime', 'Stages are build-time only.'], ['It encrypts the image', 'No.'], ['It removes the need for a base image', 'Each stage has a base.']], answer: 0, explanation: 'COPY --from copies just the build output.' }),
];

// ---------------------------------------------------------------------------------------
const K8 = 'devops.k8s-core';
const k8s = dTopic({
  id: K8, title: 'Kubernetes Core', level: 'core', estMinutes: 55, prerequisites: [DK],
  summary: 'Pods, Deployments, Services, ConfigMaps, probes and troubleshooting.',
  objectives: ['Explain Pods, Deployments/ReplicaSets and Services.', 'Configure apps with ConfigMaps and Secrets.', 'Use liveness, readiness and startup probes correctly.', 'Troubleshoot CrashLoopBackOff, ImagePullBackOff and Pending pods.'],
  sections: [
    { id: 'objects', kind: 'concept', title: 'Core objects', bodyMd: `- **Pod:** the smallest deployable unit: one or more containers sharing network (one IP) and volumes. Pods are disposable.
- **Deployment → ReplicaSet → Pods:** declares the desired number of replicas and the pod template; handles **rolling updates** and rollbacks.
- **Service:** a stable virtual IP and DNS name that load-balances to pods matching a **label selector**. Types: **ClusterIP** (internal), **NodePort**, **LoadBalancer** (cloud LB). **Ingress** routes HTTP by host/path to Services.
- **ConfigMap / Secret:** configuration and sensitive values injected as env vars or files. (Secrets are only base64-encoded by default; enable encryption at rest and restrict access.)

Kubernetes is **declarative**: controllers continuously reconcile actual state toward the desired state you applied.` },
    { id: 'yaml', kind: 'code', title: 'Deployment + Service', bodyMd: 'A minimal production-shaped manifest with resources and probes:', code: [yaml(`apiVersion: apps/v1
kind: Deployment
metadata: { name: api }
spec:
  replicas: 3
  selector: { matchLabels: { app: api } }
  template:
    metadata: { labels: { app: api } }
    spec:
      containers:
        - name: api
          image: registry.example.com/api:1.4.2
          ports: [{ containerPort: 8080 }]
          resources:
            requests: { cpu: 250m, memory: 256Mi }
            limits: { memory: 512Mi }
          readinessProbe: { httpGet: { path: /ready, port: 8080 }, periodSeconds: 5 }
          livenessProbe: { httpGet: { path: /healthz, port: 8080 }, initialDelaySeconds: 10 }
---
apiVersion: v1
kind: Service
metadata: { name: api }
spec:
  selector: { app: api }
  ports: [{ port: 80, targetPort: 8080 }]`, 'Kubernetes YAML')] },
    { id: 'probes', kind: 'comparison', title: 'Probes', bodyMd: `| Probe | On failure | Use for |
|---|---|---|
| **Readiness** | pod removed from Service endpoints (no traffic) | warming up, dependency temporarily unavailable |
| **Liveness** | container restarted | deadlocked or hung process |
| **Startup** | other probes wait until it passes | slow-starting apps |

Do not make liveness depend on downstream services: a database blip would restart every pod.` },
    { id: 'debug', kind: 'example', title: 'Troubleshooting', bodyMd: `| Symptom | Usual cause | Look at |
|---|---|---|
| **CrashLoopBackOff** | the app exits on start (bad config, missing env, crash) | \`kubectl logs <pod> --previous\` |
| **ImagePullBackOff** | wrong image name/tag or missing registry credentials | \`kubectl describe pod\` events |
| **Pending** | no node has enough requested CPU/memory, or unbound volume | describe events (FailedScheduling) |
| **OOMKilled** | memory limit exceeded | describe → Last State |
| Service returns nothing | selector does not match pod labels, or readiness failing | \`kubectl get endpoints <svc>\` |`, code: [sh(`kubectl get pods -o wide
kubectl describe pod <pod>                 # events: scheduling, pulls, probe failures
kubectl logs <pod> --previous              # logs from the crashed container
kubectl get endpoints api                  # which pod IPs the Service routes to
kubectl rollout status deploy/api && kubectl rollout undo deploy/api`)] },
    { id: 'mistakes', kind: 'mistakes', title: 'Common mistakes', bodyMd: `1. Running bare Pods instead of Deployments (nothing recreates them).
2. No resource requests (bad scheduling) or a CPU limit that throttles the app.
3. Liveness probes that check dependencies (cascading restarts).
4. Treating Secrets as encrypted by default.
5. Service selector labels not matching pod labels.` },
  ],
  interviewQuestions: [
    { id: 'iq1', q: 'Pod vs Deployment vs Service?', answerMd: 'A Pod runs one or more containers sharing an IP. A Deployment manages a ReplicaSet to keep N identical pods running and performs rolling updates. A Service gives those changing pods a stable name and IP and load-balances across the ones matching its selector.' },
    { id: 'iq2', q: 'Liveness vs readiness probe?', answerMd: 'Readiness failing removes the pod from load balancing without restarting it. Liveness failing restarts the container. Use readiness for "not ready to serve yet" and liveness only for "stuck and needs a restart".' },
    { id: 'iq3', q: 'A pod is in CrashLoopBackOff. What do you do?', answerMd: '`kubectl logs <pod> --previous` to see why the last run died, `kubectl describe pod` for events, exit codes and OOMKilled; check config, env vars, Secrets and the command; reproduce the image locally if needed.' },
    { id: 'iq4', q: 'How does a rolling update avoid downtime?', answerMd: 'The Deployment creates new pods gradually (maxSurge) and removes old ones (maxUnavailable) only after new pods pass readiness, so capacity stays up. If the rollout fails, `kubectl rollout undo` returns to the previous ReplicaSet.' },
  ],
  revision: { notesMd: `- Pod (shared IP) → ReplicaSet → Deployment (rolling updates).
- Service = stable IP/DNS via label selector; ClusterIP / NodePort / LoadBalancer; Ingress for HTTP.
- Readiness: no traffic. Liveness: restart. Startup: delay others.
- CrashLoopBackOff → logs --previous. ImagePullBackOff → image/credentials. Pending → resources.`, flashcards: [
    { id: 'f1', front: 'Failed readiness probe effect?', backMd: 'Removed from Service endpoints; not restarted.' },
    { id: 'f2', front: 'Failed liveness probe effect?', backMd: 'Container restarted.' },
    { id: 'f3', front: 'Logs from a crashed container?', backMd: '`kubectl logs <pod> --previous`.' },
    { id: 'f4', front: 'Pod stuck Pending usually means?', backMd: 'Not schedulable: insufficient resources or unbound volume.' },
    { id: 'f5', front: 'Are Secrets encrypted by default?', backMd: 'No, only base64-encoded unless encryption at rest is configured.' },
  ] },
  resources: [{ title: 'Kubernetes docs: Concepts', url: 'https://kubernetes.io/docs/concepts/', kind: 'official-docs' }, { title: 'Kubernetes docs: Configure liveness, readiness and startup probes', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/', kind: 'official-docs' }],
});

const k8Mcqs: MCQ[] = [
  mcq({ ...q(K8), id: 'devops.k8.q1', type: 'concept', difficulty: 'medium', stem: 'A pod\'s readiness probe starts failing. What happens?', options: ['It stops receiving traffic from Services but is not restarted', ['It is restarted', 'That is liveness.'], ['It is deleted permanently', 'No.'], ['The node is drained', 'No.']], answer: 0, explanation: 'Readiness controls endpoint membership.' }),
  mcq({ ...q(K8), id: 'devops.k8.q2', type: 'scenario', difficulty: 'medium', stem: 'A pod is in CrashLoopBackOff. Which command most directly shows why the last run failed?', options: ['`kubectl logs <pod> --previous`', ['`kubectl get nodes`', 'Not specific to the pod.'], ['`kubectl scale deploy --replicas=0`', 'Hides the problem.'], ['`kubectl get svc`', 'Services are unrelated to crashing.']], answer: 0, explanation: '--previous shows output from the terminated container instance.' }),
  mcq({ ...q(K8), id: 'devops.k8.q3', type: 'scenario', difficulty: 'medium', stem: 'A Service has no endpoints, although pods are running and ready. Most likely cause?', options: ['The Service\'s selector does not match the pods\' labels', ['The pods have no CPU limits', 'Unrelated.'], ['The image tag is wrong', 'Then pods would not be running.'], ['The cluster has no Ingress', 'Not needed for endpoints.']], answer: 0, explanation: 'Compare `kubectl get pods --show-labels` with the Service selector.' }),
  mcq({ ...q(K8), id: 'devops.k8.q4', type: 'scenario', difficulty: 'medium', stem: 'New pods stay Pending with a FailedScheduling event: "Insufficient memory". What does that mean?', options: ['No node has enough unreserved memory to satisfy the pods\' memory requests', ['The container used too much memory at runtime', 'That would be OOMKilled.'], ['The image is too big', 'Images do not cause this event.'], ['The liveness probe failed', 'The pod never started.']], answer: 0, explanation: 'Scheduling uses requests; lower requests, add nodes, or enable autoscaling.' }),
  mcq({ ...q(K8), id: 'devops.k8.q5', type: 'concept', difficulty: 'easy', stem: 'Which object keeps a desired number of identical pods running and performs rolling updates?', options: ['Deployment', ['Service', 'Routes traffic.'], ['ConfigMap', 'Holds config.'], ['Ingress', 'HTTP routing.']], answer: 0, explanation: 'It manages ReplicaSets.' }),
  mcq({ ...q(K8), id: 'devops.k8.q6', type: 'debug', difficulty: 'hard', stem: 'During a brief database outage, every API pod restarted repeatedly. The liveness probe calls `/healthz`, which queries the database. What is wrong?', options: ['Liveness must not depend on downstream dependencies; check only the process itself and use readiness for dependency health', ['The probe period is too long', 'Not the root cause.'], ['The pods need more replicas', 'They would all restart too.'], ['The database needs a liveness probe', 'Not the issue here.']], answer: 0, explanation: 'Restarting pods cannot fix the database and causes a cascading failure.' }),
];

export const topics: Topic[] = [linux, git, docker, k8s, ...more.topics];
export const mcqs: MCQ[] = [...lxMcqs, ...gtMcqs, ...dkMcqs, ...k8Mcqs, ...more.mcqs];
