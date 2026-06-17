const FileSystem = {
    state: { root: {}, currentPath: '/' },
    mount: function() {
        try {
            const saved = localStorage.getItem('hazoom_os_fs');
            this.state.root = saved ? JSON.parse(saved) : this.getDefaultFS();
        } catch (e) { this.state.root = this.getDefaultFS(); }
    },
    getDefaultFS: function() {
        return {
            'Desktop': { type: 'folder', children: {} },
            'Documents': {
                type: 'folder', children: {
                    'Welcome.txt': { type: 'file', content: 'Welcome to HAZOOM OS! 🚀' },
                    'Architect_Private_Memo.txt': { type: 'file', content: 'ARCHITECT PRIVATE MEMO\nOwner: Hazem Soussi' }
                }
            },
            'Downloads': { type: 'folder', children: {} },
            'Pictures': { type: 'folder', children: {} },
            'Music': { type: 'folder', children: {} },
            'Videos': { type: 'folder', children: {} },
            'Projects': {
                type: 'folder', children: {
                    'hazoom': { type: 'folder', children: {} },
                    'hazem-copilot': { type: 'folder', children: {} }
                }
            }
        };
    },
    save: function() {
        localStorage.setItem('hazoom_os_fs', JSON.stringify(this.state.root));
    },
    resetToDefault: function() {
        this.state.root = this.getDefaultFS();
        this.save();
        return true;
    },
    ls: function(path) {
        const node = this.traverse(path);
        if (!node || node.type !== 'folder') return [];
        return Object.entries(node.children || {}).map(([name, item]) => ({ name, type: item.type, path: path === '/' ? '/' + name : path + '/' + name }));
    },
    createFile: function(path, name, content = '') {
        const p = this.traverse(path);
        if (p && p.type === 'folder') { p.children[name] = { type: 'file', content }; this.save(); return true; }
        return false;
    },
    createFolder: function(path, name) {
        const p = this.traverse(path);
        if (p && p.type === 'folder') { p.children[name] = { type: 'folder', children: {} }; this.save(); return true; }
        return false;
    },
    traverse: function(path) {
        if (path === '/') return { type: 'folder', children: this.state.root };
        const parts = path.split('/').filter(p => p);
        let curr = { type: 'folder', children: this.state.root };
        for (const p of parts) {
            if (curr && curr.children && curr.children[p]) curr = curr.children[p];
            else return null;
        }
        return curr;
    },
    search: function(query) {
        const results = [];
        const walk = (node, path) => {
            if (!node || !node.children) return;
            for (const [name, child] of Object.entries(node.children)) {
                const fullPath = path === '/' ? '/' + name : path + '/' + name;
                if (name.toLowerCase().includes(query.toLowerCase())) {
                    results.push({ name, type: child.type, path: fullPath });
                }
                if (child.type === 'folder') walk(child, fullPath);
            }
        };
        walk({ children: this.state.root }, '/');
        return results;
    }
};
FileSystem.mount();
window.FileSystem = FileSystem;
