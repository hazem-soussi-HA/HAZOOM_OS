/**
 * Hazoom Operating System - Terminal Emulator
 * Copyright © 2025 Hazem Soussi - All Rights Reserved
 * 
 * Unix-like terminal with command interpreter
 */

class HazoomTerminal {
    constructor() {
        this.history = [];
        this.historyIndex = -1;
        this.commandHistory = [];
        this.commands = this.initializeCommands();
        this.environment = {
            PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
            HOME: '/home/hazem',
            USER: 'hazem',
            SHELL: '/bin/hazoom-sh',
            TERM: 'xterm-256color',
            LANG: 'en_US.UTF-8'
        };
    }
    
    initializeCommands() {
        return {
            help: this.cmdHelp.bind(this),
            clear: this.cmdClear.bind(this),
            ls: this.cmdLs.bind(this),
            cd: this.cmdCd.bind(this),
            pwd: this.cmdPwd.bind(this),
            cat: this.cmdCat.bind(this),
            mkdir: this.cmdMkdir.bind(this),
            touch: this.cmdTouch.bind(this),
            rm: this.cmdRm.bind(this),
            echo: this.cmdEcho.bind(this),
            date: this.cmdDate.bind(this),
            whoami: this.cmdWhoami.bind(this),
            hostname: this.cmdHostname.bind(this),
            uname: this.cmdUname.bind(this),
            uptime: this.cmdUptime.bind(this),
            ps: this.cmdPs.bind(this),
            free: this.cmdFree.bind(this),
            df: this.cmdDf.bind(this),
            man: this.cmdMan.bind(this),
            history: this.cmdHistory.bind(this),
            env: this.cmdEnv.bind(this),
            export: this.cmdExport.bind(this),
            which: this.cmdWhich.bind(this),
            stat: this.cmdStat.bind(this),
            tree: this.cmdTree.bind(this),
            neofetch: this.cmdNeofetch.bind(this)
        };
    }
    
    executeCommand(input) {
        input = input.trim();
        
        if (!input) return '';
        
        // Add to history
        this.commandHistory.push(input);
        this.historyIndex = this.commandHistory.length;
        
        // Parse command and arguments
        const parts = this.parseCommand(input);
        const command = parts[0];
        const args = parts.slice(1);
        
        // Check if command exists
        if (this.commands[command]) {
            try {
                return this.commands[command](args);
            } catch (error) {
                return `Error executing ${command}: ${error.message}`;
            }
        } else {
            return `hazoom-sh: command not found: ${command}`;
        }
    }
    
    parseCommand(input) {
        const parts = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        
        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            
            if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
            } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                quoteChar = '';
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    parts.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current) {
            parts.push(current);
        }
        
        return parts;
    }
    
    // Command implementations
    cmdHelp(args) {
        return `
Available commands:

File System:
  ls [path]           - List directory contents
  cd <path>          - Change directory
  pwd                - Print working directory
  cat <file>         - Display file contents
  mkdir <dir>        - Create directory
  touch <file>       - Create empty file
  rm <path>          - Remove file or directory
  tree [path]        - Display directory tree
  stat <path>        - Display file/directory status

System Information:
  uname              - Show system information
  hostname           - Show hostname
  whoami             - Show current user
  uptime             - Show system uptime
  date               - Show current date/time
  ps                 - Show running processes
  free               - Show memory usage
  df                 - Show disk usage
  neofetch           - Display system information with style

Utilities:
  echo <text>        - Display text
  man <command>      - Show manual for command
  history            - Show command history
  env                - Show environment variables
  export VAR=value   - Set environment variable
  which <command>    - Show command location
  clear              - Clear terminal screen
  help               - Show this help message

For detailed information about a command, type: man <command>
`;
    }
    
    cmdClear(args) {
        return '__CLEAR__';
    }
    
    cmdLs(args) {
        const path = args[0] || '.';
        const options = { all: args.includes('-a') || args.includes('--all') };
        const result = window.hazoomFS.ls(path, options);
        
        if (result.error) return result.error;
        
        const files = result.files;
        if (files.length === 0) return '';
        
        // Format output
        let output = '';
        files.forEach(file => {
            const icon = file.type === 'directory' ? '📁' : '📄';
            const color = file.type === 'directory' ? 'color: #66b3ff;' : 'color: #a8d3ff;';
            output += `<span style="${color}">${icon} ${file.name}</span>  `;
        });
        
        return output;
    }
    
    cmdCd(args) {
        const path = args[0] || '~';
        const result = window.hazoomFS.cd(path);
        
        if (result.error) return result.error;
        
        // Update prompt
        this.updatePrompt();
        return '';
    }
    
    cmdPwd(args) {
        return window.hazoomFS.pwd();
    }
    
    cmdCat(args) {
        if (args.length === 0) {
            return 'cat: missing file operand';
        }
        
        const result = window.hazoomFS.cat(args[0]);
        if (result.error) return result.error;
        
        return result.content;
    }
    
    cmdMkdir(args) {
        if (args.length === 0) {
            return 'mkdir: missing operand';
        }
        
        const result = window.hazoomFS.mkdir(args[0]);
        if (result.error) return result.error;
        
        return '';
    }
    
    cmdTouch(args) {
        if (args.length === 0) {
            return 'touch: missing file operand';
        }
        
        const result = window.hazoomFS.touch(args[0]);
        if (result.error) return result.error;
        
        return '';
    }
    
    cmdRm(args) {
        if (args.length === 0) {
            return 'rm: missing operand';
        }
        
        const options = { recursive: args.includes('-r') || args.includes('-rf') };
        const path = args.find(arg => !arg.startsWith('-'));
        
        if (!path) return 'rm: missing operand';
        
        const result = window.hazoomFS.rm(path, options);
        if (result.error) return result.error;
        
        return '';
    }
    
    cmdEcho(args) {
        return args.join(' ');
    }
    
    cmdDate(args) {
        return new Date().toString();
    }
    
    cmdWhoami(args) {
        return window.hazoomKernel.currentUser.username;
    }
    
    cmdHostname(args) {
        return 'hazoom';
    }
    
    cmdUname(args) {
        if (args.includes('-a')) {
            return 'Hazoom 1.0.0 hazoom x86_64 GNU/Linux';
        }
        return 'Hazoom';
    }
    
    cmdUptime(args) {
        const info = window.hazoomKernel.getSystemInfo();
        return `up ${info.uptimeFormatted}, 1 user, load average: 0.12, 0.08, 0.05`;
    }
    
    cmdPs(args) {
        const processes = window.hazoomKernel.getProcessList();
        
        let output = 'PID    USER     STATE    MEM      COMMAND\n';
        output += '─'.repeat(50) + '\n';
        
        // Add init process
        output += '1      root     running  2048     /sbin/init\n';
        
        processes.forEach(proc => {
            const pid = String(proc.pid).padEnd(7);
            const user = (proc.user || 'hazem').padEnd(9);
            const state = (proc.state || 'running').padEnd(9);
            const mem = String(proc.memory || 0).padEnd(9);
            const cmd = proc.command || 'kernel';
            
            output += `${pid}${user}${state}${mem}${cmd}\n`;
        });
        
        return output;
    }
    
    cmdFree(args) {
        const mem = window.hazoomKernel.memoryManager.getStats();
        const toGB = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(2);
        
        return `               total        used        free
Mem:          ${toGB(mem.total)}GB     ${toGB(mem.used)}GB     ${toGB(mem.free)}GB
Usage:        ${mem.percentage}%`;
    }
    
    cmdDf(args) {
        return `Filesystem     Size   Used   Avail  Use%  Mounted on
/dev/sda1      500G   120G   380G   24%   /
tmpfs          8.0G   1.2G   6.8G   15%   /tmp
/dev/sda2      1.0T   450G   550G   45%   /home`;
    }
    
    cmdMan(args) {
        if (args.length === 0) {
            return 'What manual page do you want?';
        }
        
        const manuals = {
            ls: 'ls - list directory contents\n\nSYNOPSIS\n  ls [OPTION]... [FILE]...\n\nDESCRIPTION\n  List information about FILEs.\n\nOPTIONS\n  -a, --all    do not ignore entries starting with .',
            cd: 'cd - change directory\n\nSYNOPSIS\n  cd [DIR]\n\nDESCRIPTION\n  Change the current directory to DIR.',
            cat: 'cat - concatenate files and print\n\nSYNOPSIS\n  cat [FILE]...\n\nDESCRIPTION\n  Concatenate FILE(s) to standard output.',
            help: 'help - display help information\n\nSYNOPSIS\n  help\n\nDESCRIPTION\n  Display available commands and their usage.'
        };
        
        const cmd = args[0];
        if (manuals[cmd]) {
            return manuals[cmd];
        }
        
        return `No manual entry for ${cmd}`;
    }
    
    cmdHistory(args) {
        return this.commandHistory.map((cmd, i) => `${i + 1}  ${cmd}`).join('\n');
    }
    
    cmdEnv(args) {
        return Object.entries(this.environment)
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');
    }
    
    cmdExport(args) {
        if (args.length === 0) {
            return this.cmdEnv(args);
        }
        
        const assignment = args[0];
        const [key, value] = assignment.split('=');
        
        if (key && value) {
            this.environment[key] = value;
            return '';
        }
        
        return 'export: invalid syntax';
    }
    
    cmdWhich(args) {
        if (args.length === 0) {
            return 'which: missing operand';
        }
        
        const cmd = args[0];
        if (this.commands[cmd]) {
            return `/usr/bin/${cmd}`;
        }
        
        return '';
    }
    
    cmdStat(args) {
        if (args.length === 0) {
            return 'stat: missing operand';
        }
        
        const result = window.hazoomFS.stat(args[0]);
        if (result.error) return result.error;
        
        return `  File: ${result.path}
  Type: ${result.type}
  Size: ${result.size}
  Permissions: ${result.permissions}
  Owner: ${result.owner}:${result.group}
  Modified: ${result.modified.toLocaleString()}`;
    }
    
    cmdTree(args) {
        const path = args[0] || '.';
        const node = window.hazoomFS.getNode(path);
        
        if (!node) {
            return `tree: ${path}: No such file or directory`;
        }
        
        if (node.type === 'file') {
            return node.name;
        }
        
        let output = node.name || path + '\n';
        output += this.buildTree(node, '', true);
        return output;
    }
    
    buildTree(node, prefix, isLast) {
        if (!node.children) return '';
        
        const children = Object.values(node.children);
        let output = '';
        
        children.forEach((child, index) => {
            const isLastChild = index === children.length - 1;
            const connector = isLastChild ? '└── ' : '├── ';
            const icon = child.type === 'directory' ? '📁' : '📄';
            
            output += prefix + connector + icon + ' ' + child.name + '\n';
            
            if (child.type === 'directory') {
                const newPrefix = prefix + (isLastChild ? '    ' : '│   ');
                output += this.buildTree(child, newPrefix, isLastChild);
            }
        });
        
        return output;
    }
    
    cmdNeofetch(args) {
        const info = window.hazoomKernel.getSystemInfo();
        const mem = info.memory;
        
        return `
<span style="color: #66b3ff; font-weight: bold;">
    ╭─────────────────────────────────╮
    │  🖥️  Hazoom Operating System   │
    ╰─────────────────────────────────╯
</span>
<span style="color: #a8d3ff;">User@Hostname:</span> ${info.user.username}@hazoom
<span style="color: #a8d3ff;">OS:</span> Hazoom OS 1.0.0
<span style="color: #a8d3ff;">Kernel:</span> ${info.kernel}
<span style="color: #a8d3ff;">Uptime:</span> ${info.uptimeFormatted}
<span style="color: #a8d3ff;">Shell:</span> hazoom-sh
<span style="color: #a8d3ff;">Memory:</span> ${(mem.used / (1024**3)).toFixed(2)}GB / ${(mem.total / (1024**3)).toFixed(2)}GB (${mem.percentage}%)
<span style="color: #a8d3ff;">Processes:</span> ${info.processes}

<span style="color: #ff6b6b;">●</span> <span style="color: #4ecdc4;">●</span> <span style="color: #ffe66d;">●</span> <span style="color: #95e1d3;">●</span> <span style="color: #f38181;">●</span> <span style="color: #aa96da;">●</span> <span style="color: #fcbad3;">●</span> <span style="color: #a8e6cf;">●</span>
`;
    }
    
    updatePrompt() {
        const promptElement = document.querySelector('.prompt');
        if (promptElement) {
            const path = window.hazoomFS.pwd();
            const shortPath = path.replace('/home/hazem', '~');
            promptElement.textContent = `hazem@hazoom:${shortPath}$`;
        }
    }
    
    getPreviousCommand() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            return this.commandHistory[this.historyIndex];
        }
        return null;
    }
    
    getNextCommand() {
        if (this.historyIndex < this.commandHistory.length - 1) {
            this.historyIndex++;
            return this.commandHistory[this.historyIndex];
        } else {
            this.historyIndex = this.commandHistory.length;
            return '';
        }
    }
}

// Initialize global terminal
window.hazoomTerminal = new HazoomTerminal();