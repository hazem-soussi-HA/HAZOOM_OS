/**
 * Hazoom Operating System - Unix Kernel Simulation
 * Copyright © 2025 Hazem Soussi - All Rights Reserved
 * 
 * Core kernel functionality simulating Unix-like system calls and process management
 */

class HazoomKernel {
    constructor() {
        this.version = '1.0.0';
        this.bootTime = Date.now();
        
        // Process management
        this.processes = new Map();
        this.processCounter = 1000;
        this.initPid = 1;
        
        // Process states
        this.ProcessState = {
            READY: 'READY',
            RUNNING: 'RUNNING',
            BLOCKED: 'BLOCKED',
            TERMINATED: 'TERMINATED'
        };
        
        // Current system state
        this.currentUser = { username: 'hazem', uid: 1000, gid: 1000, home: '/home/hazem' };
        this.users = {
            'root': { uid: 0, gid: 0, username: 'root', home: '/root' },
            'hazem': { uid: 1000, gid: 1000, username: 'hazem', home: '/home/hazem' }
        };
        
        // System limits
        this.maxProcesses = 1024;
        this.maxOpenFiles = 256;
        this.fileSystem = null;
        this.memoryManager = null;
        
        // Scheduler state
        this.currentProcess = null;
        this.readyQueue = [];
        
        // Initialize kernel subsystems
        this.initializeSubsystems();
    }
    
    initializeSubsystems() {
        this.log('INFO', `Initializing Hazoom OS Kernel v${this.version}`);
        
        // Initialize memory manager
        this.memoryManager = {
            totalMemory: 16 * 1024 * 1024 * 1024, // 16GB simulated
            usedMemory: 2 * 1024 * 1024 * 1024,   // 2GB used initially
            freeMemory: 14 * 1024 * 1024 * 1024,  // 14GB free
            
            allocate(size) {
                if (this.freeMemory >= size) {
                    this.freeMemory -= size;
                    this.usedMemory += size;
                    return true;
                }
                return false;
            },
            
            free(size) {
                this.usedMemory -= size;
                this.freeMemory += size;
            },
            
            getStats() {
                return {
                    total: this.totalMemory,
                    used: this.usedMemory,
                    free: this.freeMemory,
                    percentage: ((this.usedMemory / this.totalMemory) * 100).toFixed(2)
                };
            }
        };
        
        this.log('INFO', 'Memory manager initialized');
        this.log('INFO', 'Kernel initialization complete');
    }
    
    /**
     * Boot sequence - initializes VFS and starts system services
     */
    boot() {
        this.log('INFO', 'Starting boot sequence...');
        
        try {
            // Initialize Virtual File System
            if (typeof window.hazoomFS !== 'undefined') {
                this.fileSystem = window.hazoomFS;
                this.log('INFO', 'Virtual File System initialized');
            }
            
            // Create init process (PID 1)
            this.createInitProcess();
            
            // Start shell process
            this.spawn('hazoom-shell', () => {
                this.log('INFO', 'Shell process started');
            });
            
            // Initialize system directories
            this.initializeSystemDirectories();
            
            this.log('INFO', 'Boot sequence completed successfully');
            return { success: true, message: 'System boot completed' };
            
        } catch (error) {
            this.log('ERROR', `Boot sequence failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Create the init process (PID 1)
     */
    createInitProcess() {
        const initProcess = {
            pid: this.initPid,
            ppid: 0,
            state: this.ProcessState.RUNNING,
            priority: 0,
            startTime: Date.now(),
            cpu: 0,
            memory: 2048,
            user: 'root',
            command: '/sbin/init',
            args: [],
            name: 'init',
            parent: null
        };
        
        this.processes.set(this.initPid, initProcess);
        this.currentProcess = initProcess;
        this.log('INFO', `Init process created with PID ${this.initPid}`);
    }
    
    /**
     * Initialize system directories with proper permissions
     */
    initializeSystemDirectories() {
        // Only root can write to these directories
        const systemDirs = ['/bin', '/sbin', '/usr', '/etc', '/var'];
        
        systemDirs.forEach(dir => {
            try {
                if (this.fileSystem) {
                    // Create directory if it doesn't exist
                    const existing = this.fileSystem.getNode(dir);
                    if (!existing) {
                        this.fileSystem.mkdir(dir);
                    }
                }
                this.log('DEBUG', `Initialized system directory: ${dir}`);
            } catch (error) {
                this.log('WARN', `Failed to initialize ${dir}: ${error.message}`);
            }
        });
    }
    
    /**
     * Centralized syscall interface - bridges terminal and filesystem
     */
    syscall(service, action, args = {}) {
        this.log('DEBUG', `Syscall: ${service}.${action}`, args);
        
        try {
            switch (service) {
                case 'fs':
                    return this.handleFileSystemSyscall(action, args);
                case 'proc':
                    return this.handleProcessSyscall(action, args);
                case 'sys':
                    return this.handleSystemSyscall(action, args);
                case 'auth':
                    return this.handleAuthSyscall(action, args);
                default:
                    throw new Error(`Unknown service: ${service}`);
            }
        } catch (error) {
            this.log('ERROR', `Syscall ${service}.${action} failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Handle filesystem-related syscalls
     */
    handleFileSystemSyscall(action, args) {
        if (!this.fileSystem) {
            throw new Error('File system not initialized');
        }
        
        switch (action) {
            case 'mkdir':
                return this.checkPermission(args.path, 'write') ? 
                    this.fileSystem.mkdir(args.path) : 
                    { error: 'Permission denied' };
                    
            case 'write':
                return this.checkPermission(args.path, 'write') ? 
                    this.fileSystem.writeFile(args.path, args.content) : 
                    { error: 'Permission denied' };
                    
            case 'read':
                return this.fileSystem.readFile(args.path);
                
            case 'stat':
                return this.fileSystem.stat(args.path);
                
            default:
                throw new Error(`Unknown filesystem action: ${action}`);
        }
    }
    
    /**
     * Handle process-related syscalls
     */
    handleProcessSyscall(action, args) {
        switch (action) {
            case 'spawn':
                return this.spawn(args.name, args.fn);
                
            case 'kill':
                return this.kill(args.pid, args.signal);
                
            case 'list':
                return this.getProcessTable();
                
            case 'info':
                return this.getProcessInfo(args.pid);
                
            default:
                throw new Error(`Unknown process action: ${action}`);
        }
    }
    
    /**
     * Handle system-related syscalls
     */
    handleSystemSyscall(action, args) {
        switch (action) {
            case 'info':
                return this.getSystemInfo();
                
            case 'uptime':
                return Math.floor((Date.now() - this.bootTime) / 1000);
                
            case 'time':
                return Math.floor(Date.now() / 1000);
                
            default:
                throw new Error(`Unknown system action: ${action}`);
        }
    }
    
    /**
     * Handle authentication-related syscalls
     */
    handleAuthSyscall(action, args) {
        switch (action) {
            case 'whoami':
                return this.currentUser.username;
                
            case 'uid':
                return this.currentUser.uid;
                
            case 'gid':
                return this.currentUser.gid;
                
            case 'switch':
                return this.switchUser(args.username);
                
            default:
                throw new Error(`Unknown auth action: ${action}`);
        }
    }
    
    /**
     * Permission check - only root can write to protected directories
     */
    checkPermission(path, operation = 'read') {
        const protectedPaths = ['/bin', '/sbin', '/usr', '/etc', '/var'];
        const isProtected = protectedPaths.some(protectedPath => path.startsWith(protectedPath));
        
        if (isProtected && operation === 'write') {
            return this.currentUser.uid === 0; // Only root can write
        }
        
        return true; // Allow all other operations
    }
    
    /**
     * Switch current user
     */
    switchUser(username) {
        if (this.users[username]) {
            this.currentUser = this.users[username];
            this.log('INFO', `Switched to user: ${username}`);
            return { success: true };
        }
        return { error: 'User not found' };
    }
    
    /**
     * Spawn a new process
     */
    spawn(name, fn) {
        if (this.processes.size >= this.maxProcesses) {
            throw new Error('Maximum number of processes reached');
        }
        
        const pid = this.processCounter++;
        const process = {
            pid: pid,
            ppid: this.currentProcess ? this.currentProcess.pid : this.initPid,
            state: this.ProcessState.READY,
            priority: Math.floor(Math.random() * 10),
            startTime: Date.now(),
            cpu: 0,
            memory: Math.floor(Math.random() * 50000) + 1000,
            user: this.currentUser.username,
            name: name,
            func: fn,
            args: [],
            parent: this.currentProcess
        };
        
        this.processes.set(pid, process);
        this.readyQueue.push(process);
        
        // Execute the function if provided
        if (typeof fn === 'function') {
            try {
                fn();
                process.state = this.ProcessState.TERMINATED;
                this.processes.delete(pid);
            } catch (error) {
                this.log('ERROR', `Process ${name} (PID ${pid}) failed: ${error.message}`);
                process.state = this.ProcessState.TERMINATED;
                this.processes.delete(pid);
            }
        }
        
        this.log('INFO', `Process ${name} spawned with PID ${pid}`);
        return { success: true, pid: pid };
    }
    
    /**
     * Kill a process
     */
    kill(pid, signal = 'SIGTERM') {
        const process = this.processes.get(pid);
        if (!process) {
            return { error: 'Process not found' };
        }
        
        if (pid === this.initPid) {
            return { error: 'Cannot kill init process' };
        }
        
        this.processes.delete(pid);
        // Remove from ready queue if present
        this.readyQueue = this.readyQueue.filter(p => p.pid !== pid);
        
        this.log('INFO', `Process ${pid} terminated with ${signal}`);
        return { success: true, message: `Process ${pid} terminated with ${signal}` };
    }
    
    /**
     * Get process table - formatted for terminal display
     */
    getProcessTable() {
        const processes = Array.from(this.processes.values());
        
        let output = 'PID    PPID   STATE     PRIORITY  MEMORY    USER       COMMAND\n';
        output += '─'.repeat(65) + '\n';
        
        // Add init process
        output += `${String(this.initPid).padEnd(7)}${String(0).padEnd(7)}${'RUNNING'.padEnd(10)}${String(0).padEnd(9)}${String(2048).padEnd(9)}${'root'.padEnd(11)}${'/sbin/init'}\n`;
        
        processes.forEach(proc => {
            const pid = String(proc.pid).padEnd(7);
            const ppid = String(proc.ppid).padEnd(7);
            const state = proc.state.padEnd(10);
            const priority = String(proc.priority).padEnd(9);
            const memory = String(proc.memory).padEnd(9);
            const user = (proc.user || 'hazem').padEnd(11);
            const command = proc.name || proc.command || 'kernel';
            
            output += `${pid}${ppid}${state}${priority}${memory}${user}${command}\n`;
        });
        
        return output;
    }
    
    /**
     * Get detailed process information
     */
    getProcessInfo(pid) {
        const process = this.processes.get(pid);
        if (!process) {
            return null;
        }
        
        return {
            pid: process.pid,
            ppid: process.ppid,
            name: process.name,
            state: process.state,
            priority: process.priority,
            user: process.user,
            memory: process.memory,
            startTime: new Date(process.startTime).toISOString(),
            uptime: Math.floor((Date.now() - process.startTime) / 1000) + 's'
        };
    }
    
    /**
     * Get list of processes (for backward compatibility)
     */
    getProcessList() {
        return Array.from(this.processes.values());
    }
    
    /**
     * Get system information
     */
    getSystemInfo() {
        const uptime = Math.floor((Date.now() - this.bootTime) / 1000);
        const memStats = this.memoryManager.getStats();
        
        return {
            hostname: 'hazoom',
            kernel: `Hazoom OS ${this.version}`,
            uptime: uptime,
            uptimeFormatted: this.formatUptime(uptime),
            user: this.currentUser,
            processes: this.processes.size,
            memory: memStats,
            bootTime: new Date(this.bootTime).toISOString()
        };
    }
    
    /**
     * Format uptime in human-readable format
     */
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        let result = '';
        if (days > 0) result += `${days}d `;
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        result += `${secs}s`;
        
        return result.trim();
    }
    
    /**
     * Legacy system calls for backward compatibility
     */
    fork() {
        return this.spawn('forked_process', null);
    }
    
    exec(pid, command, args = []) {
        const process = this.processes.get(pid);
        if (!process) return { error: 'Process not found' };
        
        process.command = command;
        process.args = args;
        process.state = this.ProcessState.RUNNING;
        
        return { success: true, pid: pid };
    }
    
    /**
     * Kernel logging with timestamps and levels
     */
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [KERNEL:${level}] ${message}`;
        
        if (data) {
            console.log(logMessage, data);
        } else {
            console.log(logMessage);
        }
    }
}

// Initialize global kernel instance
window.hazoomKernel = new HazoomKernel();

// Auto-boot the system when loaded
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            window.hazoomKernel.boot();
        }, 100);
    });
}