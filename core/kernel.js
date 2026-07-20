/**
 * HAZOOM OS v4.0 — Core Kernel
 * Copyright © 2024-2026 Hazem Soussi. All Rights Reserved.
 *
 * Architecture:
 *   Boot → Kernel Init → Process Manager → Memory Manager → File System → Device I/O → Scheduler
 *
 * Based on real OS principles:
 *   - Process states: NEW → READY → RUNNING → WAITING → TERMINATED
 *   - CPU scheduling: Round-Robin with priority queues
 *   - Memory: Virtual memory with paging and swap
 *   - File system: Unix-like hierarchical with permissions, inodes, journaling
 *   - I/O: Interrupt-driven with device drivers
 *   - Security: Ring-based isolation (Ring 0 kernel, Ring 3 user)
 */

// ===== PROCESS MANAGER =====
class ProcessManager {
    constructor() {
        this.processes = new Map();
        this.pidCounter = 1;
        this.initPid = 1;
        this.readyQueue = [];
        this.blockedQueue = [];
        this.currentProcess = null;
        this.maxProcesses = 1024;
        this.timeQuantum = 100; // ms
        this.schedulerType = 'round-robin'; // round-robin | priority | mlfq

        // Process states (matching real OS theory)
        this.STATES = {
            NEW: 'NEW',
            READY: 'READY',
            RUNNING: 'RUNNING',
            WAITING: 'WAITING',
            TERMINATED: 'TERMINATED'
        };

        // Process Control Block template
        this.PCBTemplate = () => ({
            pid: 0,
            ppid: 0,
            name: '',
            state: this.STATES.NEW,
            priority: 5,        // 0-9, 0 = highest
            cpuTime: 0,
            memoryUsed: 0,
            openFiles: [],
            registers: { pc: 0, sp: 0, ax: 0, bx: 0, cx: 0, dx: 0 },
            pageTable: [],
            creationTime: Date.now(),
            exitCode: null
        });
    }

    createProcess(name, priority = 5, parentPid = 0) {
        if (this.processes.size >= this.maxProcesses) {
            return { error: 'Max process limit reached (1024)' };
        }
        const pid = this.pidCounter++;
        const pcb = this.PCBTemplate();
        pcb.pid = pid;
        pcb.ppid = parentPid || this.initPid;
        pcb.name = name;
        pcb.priority = priority;
        pcb.state = this.STATES.READY;
        this.processes.set(pid, pcb);
        this.readyQueue.push(pid);
        return { pid, name, state: pcb.state };
    }

    terminateProcess(pid, exitCode = 0) {
        const proc = this.processes.get(pid);
        if (!proc) return { error: `Process ${pid} not found` };
        proc.state = this.STATES.TERMINATED;
        proc.exitCode = exitCode;
        // Remove from queues
        this.readyQueue = this.readyQueue.filter(p => p !== pid);
        this.blockedQueue = this.blockedQueue.filter(p => p !== pid);
        // Terminate children
        for (const [childPid, child] of this.processes) {
            if (child.ppid === pid && child.state !== this.STATES.TERMINATED) {
                this.terminateProcess(childPid, -1);
            }
        }
        return { pid, exitCode, cpuTime: proc.cpuTime };
    }

    blockProcess(pid, reason = 'I/O_WAIT') {
        const proc = this.processes.get(pid);
        if (!proc) return { error: `Process ${pid} not found` };
        proc.state = this.STATES.WAITING;
        proc.blockReason = reason;
        this.readyQueue = this.readyQueue.filter(p => p !== pid);
        if (!this.blockedQueue.includes(pid)) this.blockedQueue.push(pid);
        return { pid, state: proc.state, reason };
    }

    unblockProcess(pid) {
        const proc = this.processes.get(pid);
        if (!proc) return { error: `Process ${pid} not found` };
        proc.state = this.STATES.READY;
        delete proc.blockReason;
        this.blockedQueue = this.blockedQueue.filter(p => p !== pid);
        if (!this.readyQueue.includes(pid)) this.readyQueue.push(pid);
        return { pid, state: proc.state };
    }

    schedule() {
        if (this.readyQueue.length === 0) return null;
        // Round-robin: pick first from ready queue
        const nextPid = this.readyQueue.shift();
        const proc = this.processes.get(nextPid);
        if (!proc || proc.state === this.STATES.TERMINATED) return this.schedule();

        // Preempt current
        if (this.currentProcess && this.currentProcess.state === this.STATES.RUNNING) {
            this.currentProcess.state = this.STATES.READY;
            this.readyQueue.push(this.currentProcess.pid);
        }

        proc.state = this.STATES.RUNNING;
        this.currentProcess = proc;
        return proc;
    }

    tick(quantum = this.timeQuantum) {
        if (!this.currentProcess) this.schedule();
        if (!this.currentProcess) return { idle: true };
        this.currentProcess.cpuTime += quantum;
        // Simulate time quantum expiration
        if (this.currentProcess.cpuTime % (quantum * 10) < quantum) {
            this.currentProcess.state = this.STATES.READY;
            this.readyQueue.push(this.currentProcess.pid);
            this.currentProcess = null;
            this.schedule();
        }
        return {
            running: this.currentProcess?.pid,
            readyCount: this.readyQueue.length,
            blockedCount: this.blockedQueue.length,
            totalProcesses: this.processes.size
        };
    }

    getStats() {
        const states = { NEW: 0, READY: 0, RUNNING: 0, WAITING: 0, TERMINATED: 0 };
        let totalCpu = 0, totalMem = 0;
        for (const [, p] of this.processes) {
            states[p.state]++;
            totalCpu += p.cpuTime;
            totalMem += p.memoryUsed;
        }
        return {
            total: this.processes.size,
            states,
            totalCpuTime: totalCpu,
            totalMemory: totalMem,
            currentPid: this.currentProcess?.pid || null,
            readyQueue: this.readyQueue.length,
            blockedQueue: this.blockedQueue.length
        };
    }

    getProcessList() {
        return Array.from(this.processes.values())
            .filter(p => p.state !== this.STATES.TERMINATED)
            .map(p => ({
                pid: p.pid, ppid: p.ppid, name: p.name,
                state: p.state, priority: p.priority,
                cpuTime: p.cpuTime, memory: p.memoryUsed
            }))
            .sort((a, b) => a.pid - b.pid);
    }
}


// ===== MEMORY MANAGER =====
class MemoryManager {
    constructor(totalMemory = 16 * 1024 * 1024 * 1024) { // 16GB default
        this.totalMemory = totalMemory;
        this.pageSize = 4096; // 4KB pages
        this.totalPages = Math.floor(totalMemory / this.pageSize);
        this.freePages = this.totalPages - Math.floor((2 * 1024 * 1024 * 1024) / this.pageSize); // 2GB used by kernel
        this.usedPages = this.totalPages - this.freePages;
        this.pageTable = new Map(); // pid -> [frame numbers]
        this.frameTable = new Array(this.totalPages).fill(null); // frame -> pid
        this.swapUsed = 0;
        this.swapTotal = 4 * 1024 * 1024 * 1024; // 4GB swap
        this.pageFaults = 0;
        this.allocations = 0;
        this.deallocations = 0;

        // Mark kernel frames as used (first 512MB)
        const kernelFrames = Math.floor((512 * 1024 * 1024) / this.pageSize);
        for (let i = 0; i < kernelFrames; i++) {
            this.frameTable[i] = 0; // pid 0 = kernel
        }
    }

    allocate(size, pid) {
        const pagesNeeded = Math.ceil(size / this.pageSize);
        if (pagesNeeded > this.freePages) {
            // Try to swap out
            this._swapOut();
        }
        if (pagesNeeded > this.freePages) {
            return { error: 'Out of memory', requested: size, available: this.freePages * this.pageSize };
        }
        const frames = [];
        for (let i = 0; i < this.totalPages && frames.length < pagesNeeded; i++) {
            if (this.frameTable[i] === null) {
                this.frameTable[i] = pid;
                frames.push(i);
            }
        }
        this.freePages -= pagesNeeded;
        this.usedPages += pagesNeeded;
        this.allocations++;
        if (!this.pageTable.has(pid)) this.pageTable.set(pid, []);
        this.pageTable.get(pid).push(...frames);
        return { frames: frames.length, bytes: frames.length * this.pageSize };
    }

    free(pid) {
        const frames = this.pageTable.get(pid) || [];
        for (const frame of frames) {
            this.frameTable[frame] = null;
        }
        const freed = frames.length;
        this.freePages += freed;
        this.usedPages -= freed;
        this.deallocations++;
        this.pageTable.delete(pid);
        return { freed: freed, bytes: freed * this.pageSize };
    }

    _swapOut() {
        // Simple swap: find a non-kernel process and swap out its oldest pages
        for (const [pid, frames] of this.pageTable) {
            if (pid === 0) continue;
            if (frames.length > 1) {
                const swapFrames = frames.splice(0, Math.min(10, frames.length));
                for (const f of swapFrames) this.frameTable[f] = null;
                this.freePages += swapFrames.length;
                this.usedPages -= swapFrames.length;
                this.swapUsed += swapFrames.length * this.pageSize;
                this.pageFaults++;
                return true;
            }
        }
        return false;
    }

    accessPage(pid, pageNum) {
        const frames = this.pageTable.get(pid);
        if (!frames || pageNum >= frames.length) {
            this.pageFaults++;
            return { fault: true, message: 'Page fault — segment not found' };
        }
        return { frame: frames[pageNum], fault: false };
    }

    getStats() {
        return {
            total: this.totalMemory,
            used: this.usedPages * this.pageSize,
            free: this.freePages * this.pageSize,
            pageSize: this.pageSize,
            totalPages: this.totalPages,
            usedPages: this.usedPages,
            freePages: this.freePages,
            swapUsed: this.swapUsed,
            swapTotal: this.swapTotal,
            pageFaults: this.pageFaults,
            allocations: this.allocations,
            deallocations: this.deallocations,
            usagePercent: ((this.usedPages / this.totalPages) * 100).toFixed(2)
        };
    }
}


// ===== FILE SYSTEM =====
class FileSystem {
    constructor() {
        this.root = this._createInode('/', 'directory', 'root', 'root', 'drwxr-xr-x');
        this.currentPath = '/home/hazem';
        this.openFiles = new Map();
        this.fdCounter = 3; // 0=stdin, 1=stdout, 2=stderr
        this.journal = [];
        this.mounts = new Map();
        this._initUnixTree();
    }

    _createInode(name, type, owner, group, permissions, content = '') {
        return {
            name, type, owner, group, permissions, content,
            size: type === 'directory' ? 4096 : content.length,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            accessed: new Date().toISOString(),
            inode: Math.floor(Math.random() * 999999),
            children: type === 'directory' ? {} : null,
            links: type === 'directory' ? 2 : 1
        };
    }

    _initUnixTree() {
        const dirs = [
            '/bin', '/boot', '/dev', '/etc', '/home', '/lib', '/lib64',
            '/media', '/mnt', '/opt', '/proc', '/root', '/run', '/sbin',
            '/srv', '/sys', '/tmp', '/usr', '/var',
            '/usr/bin', '/usr/lib', '/usr/local', '/usr/share',
            '/var/log', '/var/tmp', '/var/cache',
            '/home/hazem', '/home/hazem/Desktop', '/home/hazem/Documents',
            '/home/hazem/Downloads', '/home/hazem/Pictures', '/home/hazem/Music',
            '/home/hazem/Videos', '/home/hazem/Projects',
            '/home/hazem/Projects/hazoom-os', '/home/hazem/Projects/mario-gta6',
            '/home/hazem/Projects/portfolio'
        ];
        for (const path of dirs) this.mkdir(path, 'hazem', 'hazem');

        // System files
        this.writeFile('/etc/os-release',
            'NAME="HAZOOM OS"\nVERSION="4.0.0"\nID=hazoom\nPRETTY_NAME="HAZOOM Operating System 4.0.0"\nHOME_URL="https://github.com/hazem-soussi-HA/hazoom-os"\n', 'root', 'root');

        this.writeFile('/etc/hostname', 'hazoom-os\n', 'root', 'root');
        this.writeFile('/etc/passwd',
            'root:x:0:0:root:/root:/bin/bash\nhazem:x:1000:1000:Hazem Soussi:/home/hazem:/bin/bash\n', 'root', 'root');

        // User files
        this.writeFile('/home/hazem/README.md',
            '# HAZOOM OS v4.0\n\nBrowser-based operating system with AI at its core.\n\nCopyright © 2024-2026 Hazem Soussi. All Rights Reserved.\n', 'hazem', 'hazem');

        this.writeFile('/home/hazem/.bashrc',
            '# HAZOOM Shell Configuration\nexport PS1="\\u@\\h:\\w$ "\nexport PATH="/usr/local/bin:/usr/bin:/bin"\nalias ll="ls -la"\nalias ..="cd .."\n', 'hazem', 'hazem');

        this.writeFile('/home/hazem/Projects/hazoom-os/main.py',
            '#!/usr/bin/env python3\n"""HAZOOM OS v4.0 — Main Entry"""\nprint("HAZOOM OS v4.0 — System Online")\n', 'hazem', 'hazem');

        this.writeFile('/var/log/syslog',
            `[${new Date().toISOString()}] HAZOOM OS v4.0 boot initiated\n[${new Date().toISOString()}] Kernel initialized\n[${new Date().toISOString()}] All subsystems online\n`, 'root', 'root');
    }

    _resolvePath(path) {
        if (!path.startsWith('/')) path = this.currentPath + '/' + path;
        const parts = path.split('/').filter(p => p && p !== '.');
        const resolved = [];
        for (const part of parts) {
            if (part === '..') resolved.pop();
            else resolved.push(part);
        }
        return '/' + resolved.join('/');
    }

    _getNode(path) {
        const resolved = this._resolvePath(path);
        if (resolved === '/') return this.root;
        const parts = resolved.split('/').filter(p => p);
        let current = this.root;
        for (const part of parts) {
            if (!current.children || !current.children[part]) return null;
            current = current.children[part];
        }
        return current;
    }

    _getParent(path) {
        const resolved = this._resolvePath(path);
        const parts = resolved.split('/').filter(p => p);
        if (parts.length === 0) return null;
        parts.pop();
        const parentPath = '/' + parts.join('/');
        return { node: parentPath === '/' ? this.root : this._getNode(parentPath), name: parts[parts.length - 1] || resolved.split('/').pop() };
    }

    _journalEntry(operation, path, details = '') {
        this.journal.push({
            timestamp: new Date().toISOString(),
            operation, path, details
        });
        if (this.journal.length > 1000) this.journal.shift();
    }

    mkdir(path, owner = 'hazem', group = 'hazem') {
        const resolved = this._resolvePath(path);
        if (this._getNode(resolved)) return { error: 'Already exists' };
        const parts = resolved.split('/').filter(p => p);
        const name = parts.pop();
        const parentPath = '/' + parts.join('/');
        const parent = parentPath === '/' ? this.root : this._getNode(parentPath);
        if (!parent || parent.type !== 'directory') return { error: 'Parent directory not found' };
        parent.children[name] = this._createInode(name, 'directory', owner, group, 'drwxr-xr-x');
        parent.modified = new Date().toISOString();
        this._journalEntry('mkdir', resolved);
        return { path: resolved, created: true };
    }

    writeFile(path, content, owner = 'hazem', group = 'hazem') {
        const resolved = this._resolvePath(path);
        let node = this._getNode(resolved);
        if (node) {
            if (node.type === 'directory') return { error: 'Is a directory' };
            node.content = content;
            node.size = content.length;
            node.modified = new Date().toISOString();
            this._journalEntry('write', resolved, `${content.length} bytes`);
            return { path: resolved, size: content.length, written: true };
        }
        const parts = resolved.split('/').filter(p => p);
        const name = parts.pop();
        const parentPath = '/' + parts.join('/');
        const parent = parentPath === '/' ? this.root : this._getNode(parentPath);
        if (!parent) return { error: 'Parent directory not found' };
        parent.children[name] = this._createInode(name, 'file', owner, group, '-rw-r--r--', content);
        parent.modified = new Date().toISOString();
        this._journalEntry('create', resolved, `${content.length} bytes`);
        return { path: resolved, size: content.length, created: true };
    }

    readFile(path) {
        const resolved = this._resolvePath(path);
        const node = this._getNode(resolved);
        if (!node) return { error: 'No such file or directory' };
        if (node.type === 'directory') return { error: 'Is a directory' };
        node.accessed = new Date().toISOString();
        return { content: node.content, size: node.size, inode: node.inode };
    }

    delete(path) {
        const resolved = this._resolvePath(path);
        if (resolved === '/') return { error: 'Cannot delete root' };
        const node = this._getNode(resolved);
        if (!node) return { error: 'No such file or directory' };
        if (node.type === 'directory' && Object.keys(node.children).length > 0) {
            return { error: 'Directory not empty' };
        }
        const parts = resolved.split('/').filter(p => p);
        const name = parts.pop();
        const parentPath = '/' + parts.join('/');
        const parent = parentPath === '/' ? this.root : this._getNode(parentPath);
        delete parent.children[name];
        parent.modified = new Date().toISOString();
        this._journalEntry('delete', resolved);
        return { path: resolved, deleted: true };
    }

    listDir(path = this.currentPath) {
        const resolved = this._resolvePath(path);
        const node = this._getNode(resolved);
        if (!node) return { error: 'No such directory' };
        if (node.type !== 'directory') return { error: 'Not a directory' };
        const entries = [];
        for (const [name, child] of Object.entries(node.children)) {
            entries.push({
                name,
                type: child.type,
                size: child.size,
                permissions: child.permissions,
                owner: child.owner,
                modified: child.modified,
                inode: child.inode
            });
        }
        return { path: resolved, entries };
    }

    cd(path) {
        const resolved = this._resolvePath(path);
        const node = this._getNode(resolved);
        if (!node) return { error: 'No such directory' };
        if (node.type !== 'directory') return { error: 'Not a directory' };
        this.currentPath = resolved;
        return { path: resolved };
    }

    stat(path) {
        const resolved = this._resolvePath(path);
        const node = this._getNode(resolved);
        if (!node) return { error: 'No such file or directory' };
        return {
            name: node.name, type: node.type, size: node.size,
            permissions: node.permissions, owner: node.owner, group: node.group,
            inode: node.inode, links: node.links,
            created: node.created, modified: node.modified, accessed: node.accessed
        };
    }

    getStats() {
        let files = 0, dirs = 0, totalSize = 0;
        const count = (node) => {
            if (node.type === 'file') { files++; totalSize += node.size; }
            else { dirs++; if (node.children) for (const c of Object.values(node.children)) count(c); }
        };
        count(this.root);
        return { files, directories: dirs, totalSize, journalEntries: this.journal.length, currentPath: this.currentPath };
    }
}


// ===== DEVICE I/O MANAGER =====
class DeviceManager {
    constructor() {
        this.devices = new Map();
        this.interruptQueue = [];
        this.drivers = new Map();
        this._initDevices();
    }

    _initDevices() {
        this.registerDevice('console', 'character', 'HAZOOM Console v4');
        this.registerDevice('keyboard', 'character', 'PS/2 Keyboard');
        this.registerDevice('display', 'framebuffer', 'WebGL Framebuffer');
        this.registerDevice('disk0', 'block', 'Virtual Block Device');
        this.registerDevice('net0', 'network', 'Virtual Network Interface');
        this.registerDevice('timer', 'system', 'System Timer (PIT)');
    }

    registerDevice(name, type, description) {
        this.devices.set(name, {
            name, type, description,
            status: 'online',
            interrupts: 0,
            readCount: 0,
            writeCount: 0,
            errorCount: 0
        });
    }

    sendInterrupt(device, type = 'DATA_READY') {
        const dev = this.devices.get(device);
        if (!dev) return { error: 'Device not found' };
        dev.interrupts++;
        this.interruptQueue.push({ device, type, timestamp: Date.now() });
        return { device, type, queueLength: this.interruptQueue.length };
    }

    read(device) {
        const dev = this.devices.get(device);
        if (!dev) return { error: 'Device not found' };
        dev.readCount++;
        this.sendInterrupt(device, 'READ_COMPLETE');
        return { device, status: 'ok', data: null };
    }

    write(device, data) {
        const dev = this.devices.get(device);
        if (!dev) return { error: 'Device not found' };
        dev.writeCount++;
        this.sendInterrupt(device, 'WRITE_COMPLETE');
        return { device, status: 'ok', bytes: data ? data.length : 0 };
    }

    getStats() {
        const devices = {};
        for (const [name, dev] of this.devices) {
            devices[name] = { ...dev };
        }
        return { devices, interruptQueue: this.interruptQueue.length };
    }
}


// ===== SECURITY MANAGER =====
class SecurityManager {
    constructor() {
        this.users = new Map();
        this.groups = new Map();
        this.sessions = new Map();
        this.auditLog = [];
        this._initUsers();
    }

    _initUsers() {
        this.users.set('root', { uid: 0, gid: 0, username: 'root', home: '/root', shell: '/bin/bash', role: 'admin' });
        this.users.set('hazem', { uid: 1000, gid: 1000, username: 'hazem', home: '/home/hazem', shell: '/bin/bash', role: 'user' });
        this.groups.set('root', { gid: 0, members: ['root'] });
        this.groups.set('hazem', { gid: 1000, members: ['hazem'] });
        this.groups.set('sudo', { gid: 27, members: ['hazem'] });
    }

    authenticate(username) {
        const user = this.users.get(username);
        if (!user) return { error: 'User not found' };
        const sessionId = 'sess_' + Math.random().toString(36).substr(2, 9);
        this.sessions.set(sessionId, { username, uid: user.uid, loginTime: Date.now() });
        this._audit('LOGIN', username, 'Session started');
        return { sessionId, user: { username: user.username, uid: user.uid, role: user.role } };
    }

    checkPermission(sessionId, resource, action) {
        const session = this.sessions.get(sessionId);
        if (!session) return { allowed: false, reason: 'No session' };
        if (session.uid === 0) return { allowed: true, reason: 'root' };
        // Simplified: user can read/write own files
        this._audit('PERM_CHECK', session.username, `${action} ${resource}`);
        return { allowed: true, reason: 'user' };
    }

    _audit(action, user, details) {
        this.auditLog.push({ timestamp: new Date().toISOString(), action, user, details });
        if (this.auditLog.length > 500) this.auditLog.shift();
    }

    getStats() {
        return {
            users: this.users.size,
            groups: this.groups.size,
            activeSessions: this.sessions.size,
            auditEntries: this.auditLog.length
        };
    }
}


// ===== MAIN KERNEL =====
class HazoomKernel {
    constructor() {
        this.version = '4.0.0';
        this.name = 'HAZOOM OS';
        this.subtitle = 'Refactored Operating System';
        this.bootTime = null;
        this.uptime = 0;
        this.tickCount = 0;
        this.running = false;
        this.logBuffer = [];
        this.maxLogLines = 500;

        // Subsystems
        this.processManager = new ProcessManager();
        this.memoryManager = new MemoryManager();
        this.fileSystem = new FileSystem();
        this.deviceManager = new DeviceManager();
        this.security = new SecurityManager();

        // Service Manager — the OS brain orchestrates the fullstack projects
        // (planet_earth, PEN, birds, hazoom_pod, collaborative_beat) as OS
        // services, delegated to the proven loopback-only hazoom-os-launch.sh.
        this.serviceManager = null;
        try {
            const { ServiceManager } = require('./services');
            this.serviceManager = new ServiceManager(this, {
                launchScript: this._servicesLaunchScript(),
                persistencePath: 'data/services',
            });
        } catch (e) {
            this.log('WARN', `[SVC] ServiceManager not loaded: ${e.message}`);
        }

        // Intelligence Core — the REAL reasoning engine (local Ollama / ornith:35b).
        // Additive: sits alongside the symbolic consciousness, does not replace it.
        this.intelligence = null;
        try {
            const { IntelligenceCore } = require('./intelligence-core');
            const icCfg = (this._config && this._config.intelligence) || {};
            this.intelligence = new IntelligenceCore({
                enabled: icCfg.enabled !== false,
                model: icCfg.model,
                baseUrl: icCfg.baseUrl
            });
            this.log('INFO', '[INTEL] Intelligence Core loaded (local Ollama; offline-safe)');
            // Resolve the best responsive local model now (so /api/status shows it).
            this.intelligence._selectModel().then(m => {
                if (m) this.log('INFO', `[INTEL] Reasoning model selected: ${m}`);
                else this.log('WARN', '[INTEL] No responsive local model — core is offline');
            });
        } catch (e) {
            this.log('WARN', `[INTEL] Intelligence Core not loaded: ${e.message}`);
        }

        // Pascal Engine (ported from .pas kernel modules)

        // Boot sequence state
        this.bootStage = 'OFF';
        this.bootStages = ['OFF', 'BIOS', 'BOOTLOADER', 'KERNEL_INIT', 'MEMORY_INIT', 'FS_INIT', 'SERVICES', 'ONLINE'];
    }

    log(level, message) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            tick: this.tickCount
        };
        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.maxLogLines) this.logBuffer.shift();
        return entry;
    }

    boot() {
        this.logBuffer = [];
        this.bootStage = 'BIOS';
        this.log('INFO', `[BOOT] ${this.name} v${this.version} — ${this.subtitle}`);
        this.log('INFO', '[BOOT] Power-On Self-Test (POST)...');

        // BIOS stage
        this.bootStage = 'BIOS';
        this.log('INFO', '[BIOS] CPU: Virtual Multi-Core Processor');
        this.log('INFO', '[BIOS] Memory: 16384 MB detected');
        this.log('INFO', '[BIOS] Storage: Virtual Block Device (disk0) online');
        this.log('INFO', '[BIOS] Network: Virtual NIC (net0) online');
        this.log('INFO', '[BIOS] POST complete — all hardware nominal');

        // Bootloader
        this.bootStage = 'BOOTLOADER';
        this.log('INFO', '[BOOTLOADER] GRUB v2.0 — loading kernel...');
        this.log('INFO', '[BOOTLOADER] Kernel image loaded at 0x00100000');
        this.log('INFO', '[BOOTLOADER] Initializing protected mode...');
        this.log('INFO', '[BOOTLOADER] Transferring control to kernel...');

        // Kernel init
        this.bootStage = 'KERNEL_INIT';
        this.log('INFO', '[KERNEL] HAZOOM Kernel v4.0.0 initializing...');
        this.log('INFO', '[KERNEL] Setting up interrupt descriptor table (IDT)...');
        this.log('INFO', '[KERNEL] Setting up global descriptor table (GDT)...');
        this.log('INFO', '[KERNEL] Configuring CPU rings (Ring 0: kernel, Ring 3: user)...');

        // Memory init
        this.bootStage = 'MEMORY_INIT';
        this.log('INFO', '[MM] Initializing Memory Manager...');
        this.log('INFO', `[MM] Total: ${this._formatBytes(this.memoryManager.totalMemory)}`);
        this.log('INFO', `[MM] Page size: ${this.memoryManager.pageSize} bytes`);
        this.log('INFO', `[MM] Total pages: ${this.memoryManager.totalPages}`);
        this.log('INFO', '[MM] Page table initialized');
        this.log('INFO', '[MM] Swap space: 4GB');

        // File system init
        this.bootStage = 'FS_INIT';
        this.log('INFO', '[FS] Mounting root file system...');
        this.log('INFO', '[FS] File system: hazoomfs (journaled)');
        this.log('INFO', '[FS] Root mounted at /');
        this.log('INFO', '[FS] Standard Unix directories created');
        this.log('INFO', '[FS] System files initialized');

        // Create init process
        const init = this.processManager.createProcess('init', 0);
        this.log('INFO', `[PROC] Init process created (PID: ${init.pid})`);

        // Create system processes
        const kthreadd = this.processManager.createProcess('kthreadd', 1, init.pid);
        const syslogd = this.processManager.createProcess('syslogd', 3, init.pid);
        const sshd = this.processManager.createProcess('sshd', 5, init.pid);
        const shell = this.processManager.createProcess('hazoom-sh', 5, init.pid);
        this.log('INFO', `[PROC] System processes started: kthreadd(${kthreadd.pid}), syslogd(${syslogd.pid}), sshd(${sshd.pid}), shell(${shell.pid})`);

        // Allocate memory for init
        this.memoryManager.allocate(1024 * 1024, init.pid); // 1MB for init
        this.log('INFO', '[MM] Memory allocated for init process (1MB)');

        // Services
        this.bootStage = 'SERVICES';
        this.log('INFO', '[SVC] Starting system services...');
        this.log('INFO', '[SVC] Device Manager: 6 devices registered');
        this.log('INFO', '[SVC] Security Manager: 2 users, 3 groups');
        this.log('INFO', '[SVC] Scheduler: Round-Robin, quantum=100ms');

        // HAZOOM OS as the brain: bring the fullstack projects online
        // (planet_earth, PEN, birds, hazoom_pod, collaborative_beat) via the
        // proven loopback-only launcher. This is the "everything under
        // HAZOOM OS" integration point.
        if (this.serviceManager) {
            try {
                this.log('INFO', '[SVC] Orchestrating HAZOOM fullstack (6 services, 127.0.0.1)...');
                this.serviceManager.startAll().then(r => {
                    this.log('INFO', `[SVC] Fullstack launcher: ${r.ok ? 'ok' : 'error'}`);
                });
            } catch (e) {
                this.log('WARN', `[SVC] Fullstack start deferred: ${e.message}`);
            }
        } else {
            this.log('INFO', '[SVC] ServiceManager not loaded (fullstack launch skipped)');
        }

        // Pascal Engine initialization (ported from Pascal kernel modules)
        try {
            const { PascalEngine } = require('./pascal-engine');
            this.pascalEngine = new PascalEngine();
            this.pascalEngine.initialize();
            this.log('INFO', '[PASCAL] Aether Engine: 4 nodes, 3 flows, Flowing state');
            this.log('INFO', '[PASCAL] Neural Core: 1 thought, 3 concepts active');
            this.log('INFO', '[PASCAL] Deep Consciousness: initialized, self-awareness bootstrapped');
            this.log('INFO', '[PASCAL] SynapseOS: PheromoneNet + PulseOS + EmpathyEngine + DreamWeaver online');
        } catch (e) {
            this.log('WARN', `[PASCAL] Engine not loaded: ${e.message}`);
        }

        // Consciousness initialization (self-contained AI, no external LLM)
        try {
            const ConMod = require('./consciousness');
            const Consciousness = ConMod.default || ConMod;
            this.consciousness = new Consciousness(this);
            this.log('INFO', '[CONSCIOUSNESS] Self-contained AI initialized');
            this.log('INFO', '[CONSCIOUSNESS] Memory system: filesystem-backed');
            this.log('INFO', '[CONSCIOUSNESS] Thought processing: Pascal Engine neural core');
            this.log('INFO', '[CONSCIOUSNESS] Status: dormant (say "awaken" to activate)');
        } catch (e) {
            this.log('WARN', `[CONSCIOUSNESS] Not loaded: ${e.message}`);
        }

        // Online
        this.bootStage = 'ONLINE';
        this.bootTime = Date.now();
        this.running = true;
        this.log('INFO', '═══════════════════════════════════════════');
        this.log('INFO', `[BOOT] ${this.name} v${this.version} is ONLINE`);
        this.log('INFO', `[BOOT] Uptime counter started`);
        this.log('INFO', '═══════════════════════════════════════════');

        return { status: 'online', bootTime: this.bootTime };
    }

    tick() {
        if (!this.running) return { error: 'Kernel not running' };
        this.tickCount++;
        this.uptime = Date.now() - this.bootTime;

        // Run scheduler
        const schedResult = this.processManager.tick();

        // Run Pascal Engine tick
        if (this.pascalEngine) this.pascalEngine.tick();

        // Simulate occasional interrupts
        if (this.tickCount % 50 === 0) {
            this.deviceManager.sendInterrupt('timer', 'TIMER_TICK');
        }

        return {
            tick: this.tickCount,
            uptime: this.uptime,
            scheduler: schedResult
        };
    }

    shutdown() {
        this.log('INFO', '[SHUTDOWN] Initiating system shutdown...');
        this.log('INFO', '[SHUTDOWN] Stopping all processes...');
        const procs = this.processManager.getProcessList();
        for (const p of procs) {
            this.processManager.terminateProcess(p.pid, 0);
        }
        this.log('INFO', '[SHUTDOWN] All processes terminated');
        this.log('INFO', '[SHUTDOWN] Unmounting file systems...');
        this.log('INFO', '[SHUTDOWN] Flushing journal...');
        this.log('INFO', '[SHUTDOWN] Power off');
        this.running = false;
        this.bootStage = 'OFF';
        return { status: 'shutdown', uptime: this.uptime, totalTicks: this.tickCount };
    }

    getSystemState() {
        const state = {
            version: this.version,
            name: this.name,
            bootStage: this.bootStage,
            running: this.running,
            uptime: this.uptime,
            tickCount: this.tickCount,
            bootTime: this.bootTime,
            processManager: this.processManager.getStats(),
            memoryManager: this.memoryManager.getStats(),
            fileSystem: this.fileSystem.getStats(),
            deviceManager: this.deviceManager.getStats(),
            security: this.security.getStats(),
            logLines: this.logBuffer.length
        };

        if (this.serviceManager) state.services = {
            stats: this.serviceManager.getStats(),
            list: this.serviceManager.list(),
        };
        if (this.pascalEngine) {
            state.pascalEngine = this.pascalEngine.getFullStatus();
        }
        if (this.consciousness) {
            state.consciousness = this.consciousness.getStatus();
        }
        if (this.intelligence) {
            state.intelligence = this.intelligence.getStatus();
        }
        return state;
    }

    _servicesLaunchScript() {
        // Single source of truth for launching the fullstack projects.
        // Override via env HAZOOM_LAUNCH or config services.launchScript.
        if (process.env.HAZOOM_LAUNCH) return process.env.HAZOOM_LAUNCH;
        const cfg = this._config && this._config.services && this._config.services.launchScript;
        return cfg || '/mnt/c/Users/HP/Desktop/planet_earth/hazoom-os-launch.sh';
    }

    _formatBytes(bytes) {
        if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
        if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return bytes + ' B';
    }
}

// Export for use in Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HazoomKernel, ProcessManager, MemoryManager, FileSystem, DeviceManager, SecurityManager };
}

// ===== AI-NATIVE KERNEL EXTENSION (v4.0 Superintelligence) =====
// AI modules are loaded separately via ai-kernel.js
// To enable AI capabilities, import and initialize AIKernelExtension:
//
//   import { AIKernelExtension } from './ai-kernel.js';
//   const kernel = new HazoomKernel();
//   await kernel.boot();
//   const aiExt = new AIKernelExtension(kernel);
//   await aiExt.boot();
//
// This keeps the base kernel clean while enabling AI superintelligence.

console.log('[HAZOOM-OS] v4.0 — AI-Native Extension available (import ai-kernel.js to enable)');
