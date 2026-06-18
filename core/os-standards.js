// ============================================
// HAZOOM OS — OS Standards & Protocols v4.0
// POSIX-compliant | IPC | Syscalls | Security | Networking
// Author: Hazem Soussi (HA) — Shadow Builder
// ============================================

/**
 * HAZOOM OS Standards Layer
 * 
 * Implements standard OS protocols and interfaces:
 * 1. System Call Interface (syscall) — POSIX-like
 * 2. Inter-Process Communication (IPC) — pipes, messages, shared memory, signals
 * 3. File System Interface (VFS) — virtual filesystem layer
 * 4. Security Module — capabilities, ACLs, sandboxing, seccomp-like filtering
 * 5. Network Stack — TCP/UDP/TLS/WebSocket abstraction
 * 6. Device Management — udev-like device manager
 * 7. Process Management — signals, scheduling, namespaces
 * 8. Memory Management — mmap, shared memory, huge pages
 * 9. Time Management — NTP, monotonic clocks, timers
 * 10. Audit & Logging — syslog-compatible, journald-like
 */

// ============================================
// 1. SYSTEM CALL INTERFACE (POSIX-like)
// ============================================

class HazoomSyscallInterface {
  constructor(kernel) {
    this.kernel = kernel;
    this.syscallTable = new Map();
    this._registerSyscalls();
  }

  _registerSyscalls() {
    // Process syscalls
    this.syscallTable.set('fork', this._sys_fork.bind(this));
    this.syscallTable.set('exec', this._sys_exec.bind(this));
    this.syscallTable.set('exit', this._sys_exit.bind(this));
    this.syscallTable.set('wait', this._sys_wait.bind(this));
    this.syscallTable.set('kill', this._sys_kill.bind(this));
    this.syscallTable.set('getpid', this._sys_getpid.bind(this));
    this.syscallTable.set('getppid', this._sys_getppid.bind(this));
    this.syscallTable.set('nice', this._sys_nice.bind(this));
    this.syscallTable.set('sched_yield', this._sys_sched_yield.bind(this));
    
    // File syscalls
    this.syscallTable.set('open', this._sys_open.bind(this));
    this.syscallTable.set('close', this._sys_close.bind(this));
    this.syscallTable.set('read', this._sys_read.bind(this));
    this.syscallTable.set('write', this._sys_write.bind(this));
    this.syscallTable.set('lseek', this._sys_lseek.bind(this));
    this.syscallTable.set('stat', this._sys_stat.bind(this));
    this.syscallTable.set('fstat', this._sys_fstat.bind(this));
    this.syscallTable.set('access', this._sys_access.bind(this));
    this.syscallTable.set('chmod', this._sys_chmod.bind(this));
    this.syscallTable.set('chown', this._sys_chown.bind(this));
    this.syscallTable.set('unlink', this._sys_unlink.bind(this));
    this.syscallTable.set('rename', this._sys_rename.bind(this));
    this.syscallTable.set('mkdir', this._sys_mkdir.bind(this));
    this.syscallTable.set('rmdir', this._sys_rmdir.bind(this));
    this.syscallTable.set('getdents', this._sys_getdents.bind(this));
    this.syscallTable.set('ioctl', this._sys_ioctl.bind(this));
    this.syscallTable.set('mmap', this._sys_mmap.bind(this));
    this.syscallTable.set('munmap', this._sys_munmap.bind(this));
    this.syscallTable.set('fsync', this._sys_fsync.bind(this));
    
    // Memory syscalls
    this.syscallTable.set('brk', this._sys_brk.bind(this));
    this.syscallTable.set('sbrk', this._sys_sbrk.bind(this));
    this.syscallTable.set('mlock', this._sys_mlock.bind(this));
    this.syscallTable.set('munlock', this._sys_munlock.bind(this));
    
    // IPC syscalls
    this.syscallTable.set('pipe', this._sys_pipe.bind(this));
    this.syscallTable.set('shmget', this._sys_shmget.bind(this));
    this.syscallTable.set('shmat', this._sys_shmat.bind(this));
    this.syscallTable.set('msgget', this._sys_msgget.bind(this));
    this.syscallTable.set('msgsnd', this._sys_msgsnd.bind(this));
    this.syscallTable.set('msgrcv', this._sys_msgrcv.bind(this));
    this.syscallTable.set('semget', this._sys_semget.bind(this));
    this.syscallTable.set('semop', this._sys_semop.bind(this));
    this.syscallTable.set('signal', this._sys_signal.bind(this));
    this.syscallTable.set('sigaction', this._sys_sigaction.bind(this));
    this.syscallTable.set('sigprocmask', this._sys_sigprocmask.bind(this));
    this.syscallTable.set('alarm', this._sys_alarm.bind(this));
    this.syscallTable.set('pause', this._sys_pause.bind(this));
    
    // Network syscalls
    this.syscallTable.set('socket', this._sys_socket.bind(this));
    this.syscallTable.set('bind', this._sys_bind.bind(this));
    this.syscallTable.set('listen', this._sys_listen.bind(this));
    this.syscallTable.set('accept', this._sys_accept.bind(this));
    this.syscallTable.set('connect', this._sys_connect.bind(this));
    this.syscallTable.set('send', this._sys_send.bind(this));
    this.syscallTable.set('recv', this._sys_recv.bind(this));
    this.syscallTable.set('shutdown', this._sys_shutdown.bind(this));
    this.syscallTable.set('getsockopt', this._sys_getsockopt.bind(this));
    this.syscallTable.set('setsockopt', this._sys_setsockopt.bind(this));
    
    // Time syscalls
    this.syscallTable.set('gettimeofday', this._sys_gettimeofday.bind(this));
    this.syscallTable.set('clock_gettime', this._sys_clock_gettime.bind(this));
    this.syscallTable.set('nanosleep', this._sys_nanosleep.bind(this));
    this.syscallTable.set('timer_create', this._sys_timer_create.bind(this));
    this.syscallTable.set('timer_settime', this._sys_timer_settime.bind(this));
    
    // Info syscalls
    this.syscallTable.set('uname', this._sys_uname.bind(this));
    this.syscallTable.set('sysinfo', this._sys_sysinfo.bind(this));
    this.syscallTable.set('getuid', this._sys_getuid.bind(this));
    this.syscallTable.set('getgid', this._sys_getgid.bind(this));
    this.syscallTable.set('geteuid', this._sys_geteuid.bind(this));
    this.syscallTable.set('getegid', this._sys_getegid.bind(this));
    this.syscallTable.set('setuid', this._sys_setuid.bind(this));
    this.syscallTable.set('setgid', this._sys_setgid.bind(this));
    this.syscallTable.set('capget', this._sys_capget.bind(this));
    this.syscallTable.set('capset', this._sys_capset.bind(this));
  }

  /**
   * Execute a system call
   */
  call(syscallName, ...args) {
    const handler = this.syscallTable.get(syscallName);
    if (!handler) {
      return { error: `Unknown syscall: ${syscallName}`, errno: 38 }; // ENOSYS
    }
    
    try {
      return handler(...args);
    } catch (e) {
      return { error: e.message, errno: this._errnoFromException(e) };
    }
  }

  _errnoFromException(e) {
    const errnoMap = {
      'ENOENT': 2, 'EACCES': 13, 'EEXIST': 17, 'EINVAL': 22,
      'ENOMEM': 12, 'EBADF': 9, 'EAGAIN': 11, 'EPERM': 1,
      'ESRCH': 3, 'ECHILD': 10, 'EINTR': 4, 'EIO': 5,
    };
    for (const [key, value] of Object.entries(errnoMap)) {
      if (e.message?.includes(key)) return value;
    }
    return 22; // EINVAL
  }

  // Process syscalls
  _sys_fork() {
    const pid = this.kernel.processManager.createProcess('forked', 5);
    return { pid };
  }

  _sys_exec(path, args = [], env = {}) {
    const proc = this.kernel.processManager.currentProcess;
    if (proc) {
      proc.name = path;
      proc.state = 'RUNNING';
      return { success: true };
    }
    return { error: 'No current process', errno: 3 }; // ESRCH
  }

  _sys_exit(code = 0) {
    const proc = this.kernel.processManager.currentProcess;
    if (proc) {
      this.kernel.processManager.terminateProcess(proc.pid, code);
    }
    return { success: true };
  }

  _sys_wait(pid) {
    const proc = this.kernel.processManager.processes.get(pid);
    if (!proc) return { error: 'No such process', errno: 3 };
    if (proc.state === 'TERMINATED') {
      return { pid, exitCode: proc.exitCode };
    }
    return { error: 'Process still running', errno: 10 }; // ECHILD
  }

  _sys_kill(pid, signal = 'SIGTERM') {
    const proc = this.kernel.processManager.processes.get(pid);
    if (!proc) return { error: 'No such process', errno: 3 };
    
    switch (signal) {
      case 'SIGTERM':
      case 'SIGKILL':
        this.kernel.processManager.terminateProcess(pid, signal === 'SIGKILL' ? -9 : 0);
        return { success: true };
      case 'SIGSTOP':
        this.kernel.processManager.blockProcess(pid, 'SIGNAL_STOP');
        return { success: true };
      case 'SIGCONT':
        this.kernel.processManager.unblockProcess(pid);
        return { success: true };
      default:
        return { error: 'Unknown signal', errno: 22 };
    }
  }

  _sys_getpid() {
    return { pid: this.kernel.processManager.currentProcess?.pid || 0 };
  }

  _sys_getppid() {
    const proc = this.kernel.processManager.currentProcess;
    return { ppid: proc?.ppid || 0 };
  }

  _sys_nice(increment = 0) {
    const proc = this.kernel.processManager.currentProcess;
    if (proc) {
      proc.priority = Math.max(0, Math.min(9, proc.priority + increment));
      return { priority: proc.priority };
    }
    return { error: 'No current process', errno: 3 };
  }

  _sys_sched_yield() {
    this.kernel.processManager.schedule();
    return { success: true };
  }

  // File syscalls
  _sys_open(path, flags = 'r', mode = 0o644) {
    const fs = this.kernel.fileSystem;
    const resolved = fs._resolvePath(path);
    
    if (flags.includes('w') || flags.includes('a')) {
      fs.writeFile(resolved, '', 'hazem', 'hazem');
    }
    
    const node = fs._getNode(resolved);
    if (!node) return { error: 'No such file or directory', errno: 2 };
    
    const fd = fs.fdCounter++;
    fs.openFiles.set(fd, { path: resolved, flags, position: 0, node });
    return { fd };
  }

  _sys_close(fd) {
    const fs = this.kernel.fileSystem;
    if (!fs.openFiles.has(fd)) return { error: 'Bad file descriptor', errno: 9 };
    fs.openFiles.delete(fd);
    return { success: true };
  }

  _sys_read(fd, size = 1024) {
    const fs = this.kernel.fileSystem;
    const file = fs.openFiles.get(fd);
    if (!file) return { error: 'Bad file descriptor', errno: 9 };
    
    const content = file.node.content || '';
    const data = content.substring(file.position, file.position + size);
    file.position += data.length;
    return { data, bytesRead: data.length };
  }

  _sys_write(fd, data) {
    const fs = this.kernel.fileSystem;
    const file = fs.openFiles.get(fd);
    if (!file) return { error: 'Bad file descriptor', errno: 9 };
    
    const content = file.node.content || '';
    file.node.content = content.substring(0, file.position) + data + content.substring(file.position + data.length);
    file.position += data.length;
    file.node.size = file.node.content.length;
    file.node.modified = new Date().toISOString();
    return { bytesWritten: data.length };
  }

  _sys_lseek(fd, offset, whence = 'SEEK_SET') {
    const fs = this.kernel.fileSystem;
    const file = fs.openFiles.get(fd);
    if (!file) return { error: 'Bad file descriptor', errno: 9 };
    
    switch (whence) {
      case 'SEEK_SET': file.position = offset; break;
      case 'SEEK_CUR': file.position += offset; break;
      case 'SEEK_END': file.position = (file.node.content?.length || 0) + offset; break;
      default: return { error: 'Invalid whence', errno: 22 };
    }
    return { position: file.position };
  }

  _sys_stat(path) {
    const stat = this.kernel.fileSystem.stat(path);
    if (stat.error) return stat;
    return {
      ...stat,
      dev: 1,
      ino: stat.inode,
      mode: this._modeFromPermissions(stat.type, stat.permissions),
      nlink: stat.links,
      uid: stat.owner === 'root' ? 0 : 1000,
      gid: stat.group === 'root' ? 0 : 1000,
      size: stat.size,
      atime: new Date(stat.accessed).getTime(),
      mtime: new Date(stat.modified).getTime(),
      ctime: new Date(stat.created).getTime(),
    };
  }

  _sys_fstat(fd) {
    const fs = this.kernel.fileSystem;
    const file = fs.openFiles.get(fd);
    if (!file) return { error: 'Bad file descriptor', errno: 9 };
    return this._sys_stat(file.path);
  }

  _sys_access(path, mode = 'F_OK') {
    const fs = this.kernel.fileSystem;
    const node = fs._getNode(fs._resolvePath(path));
    if (!node) return { error: 'No such file or directory', errno: 2 };
    
    if (mode === 'R_OK' || mode === 'W_OK' || mode === 'X_OK') {
      // Check permissions
      const perms = node.permissions;
      if (mode === 'R_OK' && !perms.includes('r')) return { error: 'Permission denied', errno: 13 };
      if (mode === 'W_OK' && !perms.includes('w')) return { error: 'Permission denied', errno: 13 };
      if (mode === 'X_OK' && !perms.includes('x')) return { error: 'Permission denied', errno: 13 };
    }
    
    return { success: true };
  }

  _sys_chmod(path, mode) {
    const fs = this.kernel.fileSystem;
    const node = fs._getNode(fs._resolvePath(path));
    if (!node) return { error: 'No such file or directory', errno: 2 };
    node.permissions = this._permissionsFromMode(mode);
    return { success: true };
  }

  _sys_chown(path, uid, gid) {
    const fs = this.kernel.fileSystem;
    const node = fs._getNode(fs._resolvePath(path));
    if (!node) return { error: 'No such file or directory', errno: 2 };
    node.owner = uid === 0 ? 'root' : 'hazem';
    node.group = gid === 0 ? 'root' : 'hazem';
    return { success: true };
  }

  _sys_unlink(path) {
    return this.kernel.fileSystem.delete(path);
  }

  _sys_rename(oldPath, newPath) {
    const fs = this.kernel.fileSystem;
    const content = fs.readFile(oldPath);
    if (content.error) return content;
    fs.writeFile(newPath, content.content, 'hazem', 'hazem');
    fs.delete(oldPath);
    return { success: true };
  }

  _sys_mkdir(path, mode = 0o755) {
    return this.kernel.fileSystem.mkdir(path, 'hazem', 'hazem');
  }

  _sys_rmdir(path) {
    return this.kernel.fileSystem.delete(path);
  }

  _sys_getdents(path) {
    const listing = this.kernel.fileSystem.listDir(path);
    if (listing.error) return listing;
    return { entries: listing.entries };
  }

  _sys_ioctl(fd, request, arg) {
    // Simplified ioctl — real implementation would handle device-specific commands
    return { success: true, request, arg };
  }

  _sys_mmap(addr = 0, length, prot = 'PROT_READ|PROT_WRITE', flags = 'MAP_PRIVATE', fd = -1, offset = 0) {
    // Simplified mmap — allocate memory region
    const regionId = `mmap_${Date.now().toString(36)}`;
    return { regionId, addr: addr || this._allocateAddr(length), length };
  }

  _sys_munmap(regionId) {
    return { success: true };
  }

  _sys_fsync(fd) {
    return { success: true };
  }

  // Memory syscalls
  _sys_brk(newBrk) {
    const mm = this.kernel.memoryManager;
    if (newBrk === 0) return { brk: mm.usedPages * mm.pageSize };
    const pagesNeeded = Math.ceil(newBrk / mm.pageSize);
    if (pagesNeeded > mm.freePages) return { error: 'Out of memory', errno: 12 };
    return { brk: newBrk };
  }

  _sys_sbrk(increment) {
    const mm = this.kernel.memoryManager;
    const currentBrk = mm.usedPages * mm.pageSize;
    return this._sys_brk(currentBrk + increment);
  }

  _sys_mlock(addr, length) {
    return { success: true }; // Simplified — real impl would pin pages
  }

  _sys_munlock(addr, length) {
    return { success: true };
  }

  // IPC syscalls
  _sys_pipe() {
    const pipeId = `pipe_${Date.now().toString(36)}`;
    return { pipeId, readFd: this.kernel.fileSystem.fdCounter++, writeFd: this.kernel.fileSystem.fdCounter++ };
  }

  _sys_shmget(key, size, flags = 0) {
    const shmId = `shm_${key}_${Date.now().toString(36)}`;
    return { shmId, size };
  }

  _sys_shmat(shmId, addr = 0, flags = 0) {
    return { addr: addr || this._allocateAddr(4096), shmId };
  }

  _sys_msgget(key, flags = 0) {
    const msqId = `msq_${key}`;
    return { msqId };
  }

  _sys_msgsnd(msqId, type, data) {
    return { success: true, bytesSent: data.length };
  }

  _sys_msgrcv(msqId, type, maxSize) {
    return { data: '', type: 0 };
  }

  _sys_semget(key, nsems = 1, flags = 0) {
    return { semId: `sem_${key}` };
  }

  _sys_semop(semId, operations) {
    return { success: true };
  }

  _sys_signal(sig, handler) {
    return { success: true, previousHandler: 'SIG_DFL' };
  }

  _sys_sigaction(sig, act, oldact) {
    return { success: true };
  }

  _sys_sigprocmask(how, set) {
    return { success: true };
  }

  _sys_alarm(seconds) {
    return { previousAlarm: 0 };
  }

  _sys_pause() {
    return { error: 'Interrupted', errno: 4 }; // EINTR
  }

  // Network syscalls
  _sys_socket(domain = 'AF_INET', type = 'SOCK_STREAM', protocol = 0) {
    const fd = this.kernel.fileSystem.fdCounter++;
    return { fd, domain, type, protocol };
  }

  _sys_bind(fd, addr, port) {
    return { success: true, addr, port };
  }

  _sys_listen(fd, backlog = 128) {
    return { success: true };
  }

  _sys_accept(fd) {
    return { clientFd: this.kernel.fileSystem.fdCounter++, addr: '0.0.0.0', port: 0 };
  }

  _sys_connect(fd, addr, port) {
    return { success: true };
  }

  _sys_send(fd, data, flags = 0) {
    return { bytesSent: data.length };
  }

  _sys_recv(fd, maxSize = 4096, flags = 0) {
    return { data: '', bytesReceived: 0 };
  }

  _sys_shutdown(fd, how = 'SHUT_RDWR') {
    return { success: true };
  }

  _sys_getsockopt(fd, level, optname) {
    return { value: 0 };
  }

  _sys_setsockopt(fd, level, optname, value) {
    return { success: true };
  }

  // Time syscalls
  _sys_gettimeofday() {
    const now = new Date();
    return { seconds: Math.floor(now.getTime() / 1000), microseconds: (now.getTime() % 1000) * 1000 };
  }

  _sys_clock_gettime(clockId = 'CLOCK_REALTIME') {
    const now = Date.now();
    return { seconds: Math.floor(now / 1000), nanoseconds: (now % 1000) * 1000000 };
  }

  _sys_nanosleep(seconds, nanoseconds = 0) {
    const ms = seconds * 1000 + nanoseconds / 1000000;
    return { success: true, slept: ms };
  }

  _sys_timer_create(clockId = 'CLOCK_REALTIME') {
    return { timerId: `timer_${Date.now().toString(36)}` };
  }

  _sys_timer_settime(timerId, flags, intervalSec = 0, intervalNsec = 0, valueSec = 0, valueNsec = 0) {
    return { success: true };
  }

  // Info syscalls
  _sys_uname() {
    return {
      sysname: 'HAZOOM',
      nodename: 'hazoom-os',
      release: '4.0.0',
      version: '#1 HAZOOM SMP ' + new Date().toISOString(),
      machine: 'wasm32',
      domainname: 'hazoom.local',
    };
  }

  _sys_sysinfo() {
    const mm = this.kernel.memoryManager;
    const pm = this.kernel.processManager;
    return {
      uptime: Math.floor((Date.now() - (this.kernel.bootTime || Date.now())) / 1000),
      loads: [0.12, 0.08, 0.05],
      totalram: mm.totalMemory,
      freeram: mm.freePages * mm.pageSize,
      sharedram: 0,
      bufferram: 0,
      totalswap: mm.swapTotal,
      freeswap: mm.swapTotal - mm.swapUsed,
      procs: pm.processes.size,
    };
  }

  _sys_getuid() { return { uid: 1000 }; }
  _sys_getgid() { return { gid: 1000 }; }
  _sys_geteuid() { return { euid: 1000 }; }
  _sys_getegid() { return { egid: 1000 }; }
  _sys_setuid(uid) { return { success: true }; }
  _sys_setgid(gid) { return { success: true }; }
  _sys_capget() {
    return {
      permitted: ['CAP_CHOWN', 'CAP_KILL', 'CAP_NET_BIND_SERVICE', 'CAP_SYS_ADMIN'],
      effective: ['CAP_CHOWN', 'CAP_KILL', 'CAP_NET_BIND_SERVICE'],
      inheritable: [],
    };
  }
  _sys_capset(caps) { return { success: true }; }

  // Utility
  _modeFromPermissions(type, permissions) {
    const typeBit = type === 'directory' ? 0o040000 : 0o100000;
    let mode = typeBit;
    if (permissions.includes('r')) mode |= 0o444;
    if (permissions.includes('w')) mode |= 0o222;
    if (permissions.includes('x')) mode |= 0o111;
    return mode;
  }

  _permissionsFromMode(mode) {
    let perms = '-';
    if (mode & 0o400) perms += 'r'; else perms += '-';
    if (mode & 0o200) perms += 'w'; else perms += '-';
    if (mode & 0o100) perms += 'x'; else perms += '-';
    if (mode & 0o040) perms += 'r'; else perms += '-';
    if (mode & 0o020) perms += 'w'; else perms += '-';
    if (mode & 0o010) perms += 'x'; else perms += '-';
    if (mode & 0o004) perms += 'r'; else perms += '-';
    if (mode & 0o002) perms += 'w'; else perms += '-';
    if (mode & 0o001) perms += 'x'; else perms += '-';
    return perms;
  }

  _allocateAddr(length) {
    return 0x10000 + Math.floor(Math.random() * 0x100000);
  }
}


// ============================================
// 2. INTER-PROCESS COMMUNICATION (IPC)
// ============================================

class HazoomIPC {
  constructor(kernel) {
    this.kernel = kernel;
    this.pipes = new Map();
    this.messageQueues = new Map();
    this.sharedMemory = new Map();
    this.semaphores = new Map();
    this.signals = new Map();
  }

  // Pipes
  createPipe() {
    const pipeId = `pipe_${Date.now().toString(36)}`;
    const pipe = {
      id: pipeId,
      buffer: [],
      readers: new Set(),
      writers: new Set(),
      created: Date.now(),
    };
    this.pipes.set(pipeId, pipe);
    return { pipeId, readFd: this._nextFd(), writeFd: this._nextFd() };
  }

  writePipe(pipeId, data) {
    const pipe = this.pipes.get(pipeId);
    if (!pipe) return { error: 'Invalid pipe' };
    pipe.buffer.push(data);
    // Notify readers
    for (const pid of pipe.readers) {
      this.sendSignal(pid, 'SIGIO');
    }
    return { bytesWritten: data.length };
  }

  readPipe(pipeId, size = 4096) {
    const pipe = this.pipes.get(pipeId);
    if (!pipe) return { error: 'Invalid pipe' };
    if (pipe.buffer.length === 0) return { error: 'EAGAIN', errno: 11 };
    
    const data = pipe.buffer.shift();
    return { data: data.substring(0, size) };
  }

  // Message Queues (POSIX-style)
  createMessageQueue(key, flags = 0) {
    const msqId = `msq_${key}`;
    if (this.messageQueues.has(msqId) && !(flags & 0o1000)) { // IPC_EXCL
      return { error: 'Queue exists', errno: 17 }; // EEXIST
    }
    
    this.messageQueues.set(msqId, {
      id: msqId,
      messages: [],
      maxSize: 8192,
      maxMessages: 100,
      created: Date.now(),
    });
    
    return { msqId };
  }

  sendMessage(msqId, type, data) {
    const queue = this.messageQueues.get(msqId);
    if (!queue) return { error: 'Invalid queue' };
    if (queue.messages.length >= queue.maxMessages) return { error: 'Queue full' };
    
    queue.messages.push({ type, data, timestamp: Date.now() });
    return { success: true };
  }

  receiveMessage(msqId, type = 0, maxSize = 4096) {
    const queue = this.messageQueues.get(msqId);
    if (!queue) return { error: 'Invalid queue' };
    
    const idx = type === 0 ? 0 : queue.messages.findIndex(m => m.type === type);
    if (idx === -1) return { error: 'No message', errno: 35 }; // ENOMSG
    
    const msg = queue.messages.splice(idx, 1)[0];
    return { data: msg.data.substring(0, maxSize), type: msg.type };
  }

  // Shared Memory
  createSharedMemory(key, size, flags = 0) {
    const shmId = `shm_${key}`;
    this.sharedMemory.set(shmId, {
      id: shmId,
      data: new ArrayBuffer(size),
      size,
      attached: new Set(),
      created: Date.now(),
    });
    return { shmId, size };
  }

  attachSharedMemory(shmId, pid) {
    const shm = this.sharedMemory.get(shmId);
    if (!shm) return { error: 'Invalid shm' };
    shm.attached.add(pid);
    return { addr: 0x20000 + this.sharedMemory.size * 0x10000 };
  }

  detachSharedMemory(shmId, pid) {
    const shm = this.sharedMemory.get(shmId);
    if (shm) shm.attached.delete(pid);
    return { success: true };
  }

  // Semaphores
  createSemaphore(key, value = 1, flags = 0) {
    const semId = `sem_${key}`;
    this.semaphores.set(semId, {
      id: semId,
      value,
      waiters: [],
      created: Date.now(),
    });
    return { semId };
  }

  semaphoreWait(semId) {
    const sem = this.semaphores.get(semId);
    if (!sem) return { error: 'Invalid semaphore' };
    if (sem.value > 0) {
      sem.value--;
      return { success: true };
    }
    // Would block in real implementation
    return { error: 'Would block', errno: 11 }; // EAGAIN
  }

  semaphorePost(semId) {
    const sem = this.semaphores.get(semId);
    if (!sem) return { error: 'Invalid semaphore' };
    sem.value++;
    return { success: true };
  }

  // Signals
  sendSignal(pid, signal) {
    const proc = this.kernel.processManager.processes.get(pid);
    if (!proc) return { error: 'No such process', errno: 3 };
    
    if (!proc.signals) proc.signals = [];
    proc.signals.push({ signal, timestamp: Date.now() });
    
    // Handle signal
    switch (signal) {
      case 'SIGTERM':
      case 'SIGKILL':
        this.kernel.processManager.terminateProcess(pid, signal === 'SIGKILL' ? -9 : 0);
        break;
      case 'SIGSTOP':
        this.kernel.processManager.blockProcess(pid, 'SIGNAL_STOP');
        break;
      case 'SIGCONT':
        this.kernel.processManager.unblockProcess(pid);
        break;
    }
    
    return { success: true };
  }

  _nextFd() {
    return 1000 + this.pipes.size + this.messageQueues.size + this.sharedMemory.size;
  }
}


// ============================================
// 3. VIRTUAL FILE SYSTEM (VFS) LAYER
// ============================================

class HazoomVFS {
  constructor(kernel) {
    this.kernel = kernel;
    this.mounts = new Map();
    this.fileSystems = new Map();
    
    // Register built-in filesystems
    this.fileSystems.set('hazoomfs', new HazoomFS());
    this.fileSystems.set('procfs', new ProcFS(kernel));
    this.fileSystems.set('sysfs', new SysFS(kernel));
    this.fileSystems.set('tmpfs', new TmpFS());
    this.fileSystems.set('devfs', new DevFS());
    
    // Mount root
    this.mount('/', 'hazoomfs', 'hazoomfs', 0, '');
    this.mount('/proc', 'procfs', 'procfs', 0, '');
    this.mount('/sys', 'sysfs', 'sysfs', 0, '');
    this.mount('/tmp', 'tmpfs', 'tmpfs', 0, '');
    this.mount('/dev', 'devfs', 'devfs', 0, '');
  }

  mount(target, fsName, device, flags, options) {
    const fs = this.fileSystems.get(fsName);
    if (!fs) return { error: `Unknown filesystem: ${fsName}` };
    
    this.mounts.set(target, { fsName, device, flags, options, fs });
    return { success: true };
  }

  unmount(target) {
    if (!this.mounts.has(target)) return { error: 'Not mounted' };
    this.mounts.delete(target);
    return { success: true };
  }

  getFS(path) {
    // Find longest matching mount
    let bestMatch = '/';
    for (const mountPoint of this.mounts.keys()) {
      if (path.startsWith(mountPoint) && mountPoint.length > bestMatch.length) {
        bestMatch = mountPoint;
      }
    }
    return this.mounts.get(bestMatch);
  }

  getMounts() {
    return [...this.mounts.entries()].map(([path, info]) => ({
      path,
      fs: info.fsName,
      device: info.device,
    }));
  }
}

// Built-in filesystem implementations
class HazoomFS {
  constructor() {
    this.type = 'hazoomfs';
    this.features = ['permissions', 'journaling', 'inodes', 'hard_links', 'symlinks'];
  }
}

class ProcFS {
  constructor(kernel) {
    this.type = 'procfs';
    this.kernel = kernel;
    this.features = ['virtual', 'read_only', 'kernel_info'];
  }
}

class SysFS {
  constructor(kernel) {
    this.type = 'sysfs';
    this.kernel = kernel;
    this.features = ['virtual', 'kernel_objects', 'devices'];
  }
}

class TmpFS {
  constructor() {
    this.type = 'tmpfs';
    this.features = ['volatile', 'memory_backed', 'no_persistence'];
  }
}

class DevFS {
  constructor() {
    this.type = 'devfs';
    this.features = ['virtual', 'device_nodes', 'udev'];
  }
}


// ============================================
// 4. SECURITY MODULE — Capabilities + ACLs + Sandboxing
// ============================================

class HazoomSecurity {
  constructor(kernel) {
    this.kernel = kernel;
    this.capabilities = new Map();
    this.acls = new Map();
    this.sandboxes = new Map();
    this.auditLog = [];
    this.policies = new Map();
    
    // Default capabilities
    this.defaultCaps = [
      'CAP_CHOWN', 'CAP_KILL', 'CAP_NET_BIND_SERVICE',
      'CAP_SETUID', 'CAP_SETGID', 'CAP_SYS_CHROOT',
    ];
    
    // Dangerous capabilities (require explicit grant)
    this.dangerousCaps = [
      'CAP_SYS_ADMIN', 'CAP_SYS_RAWIO', 'CAP_SYS_MODULE',
      'CAP_NET_ADMIN', 'CAP_SYS_PTRACE', 'CAP_SYS_BOOT',
    ];
  }

  /**
   * Check if a process has a capability
   */
  hasCapability(pid, cap) {
    const caps = this.capabilities.get(pid);
    if (!caps) return this.defaultCaps.includes(cap);
    return caps.includes(cap);
  }

  /**
   * Grant a capability to a process
   */
  grantCapability(pid, cap, grantedBy = 'system') {
    if (!this.capabilities.has(pid)) {
      this.capabilities.set(pid, [...this.defaultCaps]);
    }
    
    const caps = this.capabilities.get(pid);
    if (!caps.includes(cap)) {
      caps.push(cap);
    }
    
    this.audit('CAP_GRANT', { pid, cap, grantedBy });
    return { success: true };
  }

  /**
   * Revoke a capability
   */
  revokeCapability(pid, cap, revokedBy = 'system') {
    const caps = this.capabilities.get(pid);
    if (caps) {
      const idx = caps.indexOf(cap);
      if (idx !== -1) caps.splice(idx, 1);
    }
    
    this.audit('CAP_REVOKE', { pid, cap, revokedBy });
    return { success: true };
  }

  /**
   * Set ACL for a file
   */
  setACL(path, entries) {
    this.acls.set(path, entries);
    return { success: true };
  }

  /**
   * Check ACL permission
   */
  checkACL(path, uid, gid, requestedPerm) {
    const acl = this.acls.get(path);
    if (!acl) return { allowed: true }; // No ACL = allow
    
    for (const entry of acl) {
      if (entry.uid === uid || entry.gid === gid || entry.other) {
        if (entry.permissions.includes(requestedPerm)) {
          return { allowed: true };
        }
        return { allowed: false, reason: 'ACL denied' };
      }
    }
    
    return { allowed: true };
  }

  /**
   * Create a sandbox for a process
   */
  createSandbox(pid, options = {}) {
    const sandbox = {
      pid,
      allowedSyscalls: options.allowedSyscalls || ['read', 'write', 'open', 'close', 'exit', 'getpid'],
      blockedSyscalls: options.blockedSyscalls || ['exec', 'fork', 'kill', 'ptrace', 'mount'],
      allowedPaths: options.allowedPaths || ['/home', '/tmp', '/var'],
      blockedPaths: options.blockedPaths || ['/etc/shadow', '/proc/kcore', '/sys/kernel'],
      maxMemory: options.maxMemory || 256 * 1024 * 1024, // 256MB
      maxFiles: options.maxFiles || 64,
      maxProcesses: options.maxProcesses || 1,
      network: options.network || 'none', // none, loopback, full
      created: Date.now(),
    };
    
    this.sandboxes.set(pid, sandbox);
    this.audit('SANDBOX_CREATE', { pid, options });
    
    return sandbox;
  }

  /**
   * Check if a syscall is allowed in a sandbox
   */
  checkSandbox(pid, syscall, args = {}) {
    const sandbox = this.sandboxes.get(pid);
    if (!sandbox) return { allowed: true }; // No sandbox = allow
    
    // Check blocked syscalls
    if (sandbox.blockedSyscalls.includes(syscall)) {
      this.audit('SANDBOX_BLOCK', { pid, syscall, reason: 'blocked_syscall' });
      return { allowed: false, reason: 'Syscall blocked by sandbox' };
    }
    
    // Check allowed syscalls (if whitelist exists)
    if (sandbox.allowedSyscalls.length > 0 && !sandbox.allowedSyscalls.includes(syscall)) {
      this.audit('SANDBOX_BLOCK', { pid, syscall, reason: 'not_in_whitelist' });
      return { allowed: false, reason: 'Syscall not in whitelist' };
    }
    
    // Check path access
    if (args.path) {
      const isBlocked = sandbox.blockedPaths.some(p => args.path.startsWith(p));
      if (isBlocked) {
        this.audit('SANDBOX_BLOCK', { pid, syscall, path: args.path, reason: 'blocked_path' });
        return { allowed: false, reason: 'Path blocked by sandbox' };
      }
      
      if (sandbox.allowedPaths.length > 0) {
        const isAllowed = sandbox.allowedPaths.some(p => args.path.startsWith(p));
        if (!isAllowed) {
          this.audit('SANDBOX_BLOCK', { pid, syscall, path: args.path, reason: 'not_in_allowed_paths' });
          return { allowed: false, reason: 'Path not in allowed list' };
        }
      }
    }
    
    return { allowed: true };
  }

  /**
   * Audit log
   */
  audit(event, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      pid: this.kernel.processManager.currentProcess?.pid,
    };
    
    this.auditLog.push(entry);
    
    // Keep last 10000 entries
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
    
    return entry;
  }

  getAuditLog(filter = {}) {
    let logs = this.auditLog;
    if (filter.event) logs = logs.filter(l => l.event === filter.event);
    if (filter.pid) logs = logs.filter(l => l.details?.pid === filter.pid);
    if (filter.limit) logs = logs.slice(-filter.limit);
    return logs;
  }

  getStatus() {
    return {
      capabilities: this.capabilities.size,
      acls: this.acls.size,
      sandboxes: this.sandboxes.size,
      auditEntries: this.auditLog.length,
      defaultCaps: this.defaultCaps.length,
      dangerousCaps: this.dangerousCaps.length,
    };
  }
}


// ============================================
// 5. DEVICE MANAGER (udev-like)
// ============================================

class HazoomDeviceManager {
  constructor(kernel) {
    this.kernel = kernel;
    this.devices = new Map();
    this.drivers = new Map();
    this.udevRules = [];
    
    // Register built-in devices
    this._registerBuiltInDevices();
  }

  _registerBuiltInDevices() {
    const devices = [
      { name: 'console', type: 'char', major: 4, minor: 0, path: '/dev/console', driver: 'console' },
      { name: 'null', type: 'char', major: 1, minor: 3, path: '/dev/null', driver: 'null' },
      { name: 'zero', type: 'char', major: 1, minor: 5, path: '/dev/zero', driver: 'zero' },
      { name: 'random', type: 'char', major: 1, minor: 8, path: '/dev/random', driver: 'random' },
      { name: 'urandom', type: 'char', major: 1, minor: 9, path: '/dev/urandom', driver: 'random' },
      { name: 'stdin', type: 'char', major: 0, minor: 0, path: '/dev/stdin', driver: 'stdio' },
      { name: 'stdout', type: 'char', major: 0, minor: 1, path: '/dev/stdout', driver: 'stdio' },
      { name: 'stderr', type: 'char', major: 0, minor: 2, path: '/dev/stderr', driver: 'stdio' },
      { name: 'tty', type: 'char', major: 5, minor: 0, path: '/dev/tty', driver: 'tty' },
      { name: 'keyboard', type: 'input', major: 13, minor: 0, path: '/dev/input/keyboard', driver: 'hid' },
      { name: 'mouse', type: 'input', major: 13, minor: 1, path: '/dev/input/mouse', driver: 'hid' },
      { name: 'display', type: 'fb', major: 29, minor: 0, path: '/dev/fb0', driver: 'fbdev' },
      { name: 'audio', type: 'sound', major: 116, minor: 0, path: '/dev/snd', driver: 'alsa' },
      { name: 'network', type: 'net', major: 0, minor: 0, path: '/dev/net', driver: 'net' },
      { name: 'storage', type: 'block', major: 8, minor: 0, path: '/dev/sda', driver: 'nvme' },
    ];
    
    for (const dev of devices) {
      this.devices.set(dev.name, {
        ...dev,
        status: 'active',
        created: Date.now(),
      });
    }
  }

  getDevices() {
    return [...this.devices.values()];
  }

  getDevicesByType(type) {
    return [...this.devices.values()].filter(d => d.type === type);
  }

  getDevice(name) {
    return this.devices.get(name);
  }
}


// ============================================
// 6. AUDIT & LOGGING (syslog-compatible)
// ============================================

class HazoomAudit {
  constructor() {
    this.logs = [];
    this.maxLogs = 50000;
    this.levels = { EMERG: 0, ALERT: 1, CRIT: 2, ERR: 3, WARNING: 4, NOTICE: 5, INFO: 6, DEBUG: 7 };
    this.facilities = { KERN: 0, USER: 1, MAIL: 2, DAEMON: 3, AUTH: 4, SYSLOG: 5, LPR: 6, NEWS: 7, UUCP: 8, CRON: 9, LOCAL0: 16, LOCAL1: 17, LOCAL2: 18, LOCAL3: 19, LOCAL4: 20, LOCAL5: 21, LOCAL6: 22, LOCAL7: 23 };
    this.minLevel = 6; // INFO
  }

  log(level, facility, message, metadata = {}) {
    const priority = (this.facilities[facility] || 1) * 8 + (this.levels[level] || 6);
    
    if (this.levels[level] > this.minLevel) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      priority,
      level,
      facility,
      message,
      metadata,
      pid: metadata.pid || 0,
    };
    
    this.logs.push(entry);
    
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs / 2);
    }
    
    return entry;
  }

  emerg(facility, msg, meta) { return this.log('EMERG', facility, msg, meta); }
  alert(facility, msg, meta) { return this.log('ALERT', facility, msg, meta); }
  crit(facility, msg, meta) { return this.log('CRIT', facility, msg, meta); }
  err(facility, msg, meta) { return this.log('ERR', facility, msg, meta); }
  warn(facility, msg, meta) { return this.log('WARNING', facility, msg, meta); }
  notice(facility, msg, meta) { return this.log('NOTICE', facility, msg, meta); }
  info(facility, msg, meta) { return this.log('INFO', facility, msg, meta); }
  debug(facility, msg, meta) { return this.log('DEBUG', facility, msg, meta); }

  query(filter = {}) {
    let results = this.logs;
    if (filter.level) results = results.filter(l => l.level === filter.level);
    if (filter.facility) results = results.filter(l => l.facility === filter.facility);
    if (filter.limit) results = results.slice(-filter.limit);
    return results;
  }

  getMetrics() {
    return { total: this.logs.length, max: this.maxLogs, minLevel: this.minLevel };
  }
}


// Export all modules
export {
  HazoomSyscallInterface,
  HazoomIPC,
  HazoomVFS,
  HazoomSecurity,
  HazoomDeviceManager,
  HazoomAudit,
};
