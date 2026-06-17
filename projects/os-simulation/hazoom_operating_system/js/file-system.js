/**
 * Hazoom Operating System - File System Simulation
 * Copyright © 2025 Hazem Soussi - All Rights Reserved
 * 
 * Unix-like file system implementation using browser storage
 */

class HazoomFileSystem {
    constructor() {
        this.currentPath = '/home/hazem';
        this.fileTree = this.initializeFileSystem();
        this.openFiles = new Map();
        this.fileDescriptorCounter = 3; // 0, 1, 2 reserved for stdin, stdout, stderr
    }
    
    initializeFileSystem() {
        // Create initial file system structure
        const fs = {
            '/': {
                type: 'directory',
                name: '/',
                permissions: 'drwxr-xr-x',
                owner: 'root',
                group: 'root',
                size: 4096,
                modified: new Date(),
                children: {}
            }
        };
        
        // Create standard Unix directories
        const directories = [
            '/bin', '/boot', '/dev', '/etc', '/home', '/lib', '/media',
            '/mnt', '/opt', '/proc', '/root', '/run', '/sbin', '/srv',
            '/sys', '/tmp', '/usr', '/var',
            '/home/hazem', '/home/hazem/Desktop', '/home/hazem/Documents',
            '/home/hazem/Downloads', '/home/hazem/Pictures', '/home/hazem/Music',
            '/home/hazem/Videos', '/home/hazem/Projects'
        ];
        
        directories.forEach(path => this.createDirectory(path, fs));
        
        // Create some sample files
        this.createFileInTree(fs, '/home/hazem/README.md', 
            '# Welcome to Hazoom OS\n\nA transformative operating system with Unix kernel web interface.\n\nCopyright © 2025 Hazem Soussi - All Rights Reserved',
            'hazem', 'hazem');
        
        this.createFileInTree(fs, '/home/hazem/Documents/notes.txt',
            'My personal notes and ideas...\n',
            'hazem', 'hazem');
        
        this.createFileInTree(fs, '/etc/os-release',
            'NAME="Hazoom OS"\nVERSION="1.0.0"\nID=hazoom\nPRETTY_NAME="Hazoom Operating System 1.0.0"\n',
            'root', 'root');
        
        this.createFileInTree(fs, '/etc/hostname',
            'hazoom\n',
            'root', 'root');
        
        return fs;
    }
    
    createDirectory(path, tree = this.fileTree) {
        const parts = path.split('/').filter(p => p);
        let current = tree['/'];
        let currentPath = '';
        
        for (const part of parts) {
            currentPath += '/' + part;
            
            if (!current.children[part]) {
                current.children[part] = {
                    type: 'directory',
                    name: part,
                    path: currentPath,
                    permissions: 'drwxr-xr-x',
                    owner: 'hazem',
                    group: 'hazem',
                    size: 4096,
                    modified: new Date(),
                    children: {}
                };
            }
            current = current.children[part];
        }
    }
    
    createFileInTree(tree, path, content, owner = 'hazem', group = 'hazem') {
        const parts = path.split('/').filter(p => p);
        const fileName = parts.pop();
        const dirPath = '/' + parts.join('/');
        
        let current = tree['/'];
        for (const part of parts) {
            if (current.children[part]) {
                current = current.children[part];
            }
        }
        
        current.children[fileName] = {
            type: 'file',
            name: fileName,
            path: path,
            permissions: '-rw-r--r--',
            owner: owner,
            group: group,
            size: content.length,
            modified: new Date(),
            content: content
        };
    }
    
    resolvePath(path) {
        if (path.startsWith('/')) {
            return path;
        }
        
        if (path === '~') {
            return '/home/hazem';
        }
        
        if (path.startsWith('~/')) {
            return '/home/hazem/' + path.slice(2);
        }
        
        if (path === '.') {
            return this.currentPath;
        }
        
        if (path === '..') {
            return this.getParentPath(this.currentPath);
        }
        
        // Relative path
        const resolved = this.currentPath + '/' + path;
        return this.normalizePath(resolved);
    }
    
    normalizePath(path) {
        const parts = path.split('/').filter(p => p);
        const normalized = [];
        
        for (const part of parts) {
            if (part === '..') {
                normalized.pop();
            } else if (part !== '.') {
                normalized.push(part);
            }
        }
        
        return '/' + normalized.join('/');
    }
    
    getParentPath(path) {
        if (path === '/') return '/';
        const parts = path.split('/').filter(p => p);
        parts.pop();
        return '/' + parts.join('/');
    }
    
    getNode(path) {
        const resolvedPath = this.resolvePath(path);
        
        if (resolvedPath === '/') {
            return this.fileTree['/'];
        }
        
        const parts = resolvedPath.split('/').filter(p => p);
        let current = this.fileTree['/'];
        
        for (const part of parts) {
            if (!current.children || !current.children[part]) {
                return null;
            }
            current = current.children[part];
        }
        
        return current;
    }
    
    // File operations
    ls(path = '.', options = {}) {
        const node = this.getNode(path);
        
        if (!node) {
            return { error: `ls: cannot access '${path}': No such file or directory` };
        }
        
        if (node.type === 'file') {
            return { files: [node] };
        }
        
        const files = Object.values(node.children || {});
        
        if (!options.all) {
            return { files: files.filter(f => !f.name.startsWith('.')) };
        }
        
        return { files: files };
    }
    
    cd(path) {
        const node = this.getNode(path);
        
        if (!node) {
            return { error: `cd: ${path}: No such file or directory` };
        }
        
        if (node.type !== 'directory') {
            return { error: `cd: ${path}: Not a directory` };
        }
        
        this.currentPath = this.resolvePath(path);
        return { success: true, path: this.currentPath };
    }
    
    pwd() {
        return this.currentPath;
    }
    
    cat(path) {
        const node = this.getNode(path);
        
        if (!node) {
            return { error: `cat: ${path}: No such file or directory` };
        }
        
        if (node.type === 'directory') {
            return { error: `cat: ${path}: Is a directory` };
        }
        
        return { content: node.content };
    }
    
    mkdir(path) {
        const resolvedPath = this.resolvePath(path);
        const parts = resolvedPath.split('/').filter(p => p);
        const dirName = parts.pop();
        
        let current = this.fileTree['/'];
        for (const part of parts) {
            if (!current.children[part]) {
                return { error: `mkdir: cannot create directory '${path}': No such file or directory` };
            }
            current = current.children[part];
        }
        
        if (current.children[dirName]) {
            return { error: `mkdir: cannot create directory '${path}': File exists` };
        }
        
        current.children[dirName] = {
            type: 'directory',
            name: dirName,
            path: resolvedPath,
            permissions: 'drwxr-xr-x',
            owner: 'hazem',
            group: 'hazem',
            size: 4096,
            modified: new Date(),
            children: {}
        };
        
        return { success: true };
    }
    
    touch(path) {
        const resolvedPath = this.resolvePath(path);
        const parts = resolvedPath.split('/').filter(p => p);
        const fileName = parts.pop();
        
        let current = this.fileTree['/'];
        for (const part of parts) {
            if (!current.children[part]) {
                return { error: `touch: cannot touch '${path}': No such file or directory` };
            }
            current = current.children[part];
        }
        
        if (current.children[fileName]) {
            // Update modified time
            current.children[fileName].modified = new Date();
        } else {
            // Create new file
            current.children[fileName] = {
                type: 'file',
                name: fileName,
                path: resolvedPath,
                permissions: '-rw-r--r--',
                owner: 'hazem',
                group: 'hazem',
                size: 0,
                modified: new Date(),
                content: ''
            };
        }
        
        return { success: true };
    }
    
    rm(path, options = {}) {
        const resolvedPath = this.resolvePath(path);
        const parts = resolvedPath.split('/').filter(p => p);
        const targetName = parts.pop();
        
        let current = this.fileTree['/'];
        for (const part of parts) {
            if (!current.children[part]) {
                return { error: `rm: cannot remove '${path}': No such file or directory` };
            }
            current = current.children[part];
        }
        
        if (!current.children[targetName]) {
            return { error: `rm: cannot remove '${path}': No such file or directory` };
        }
        
        const target = current.children[targetName];
        
        if (target.type === 'directory' && !options.recursive) {
            return { error: `rm: cannot remove '${path}': Is a directory` };
        }
        
        delete current.children[targetName];
        return { success: true };
    }
    
    writeFile(path, content) {
        const node = this.getNode(path);
        
        if (node && node.type === 'directory') {
            return { error: `Cannot write to directory: ${path}` };
        }
        
        if (node) {
            node.content = content;
            node.size = content.length;
            node.modified = new Date();
            return { success: true };
        }
        
        // Create new file
        return this.touch(path);
    }
    
    stat(path) {
        const node = this.getNode(path);
        
        if (!node) {
            return { error: `stat: cannot stat '${path}': No such file or directory` };
        }
        
        return {
            path: node.path || path,
            type: node.type,
            size: node.size,
            permissions: node.permissions,
            owner: node.owner,
            group: node.group,
            modified: node.modified
        };
    }
}

// Initialize global file system
window.hazoomFS = new HazoomFileSystem();

// Link file system to kernel
if (window.hazoomKernel) {
    window.hazoomKernel.fileSystem = window.hazoomFS;
}