const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data.json');

const DEFAULT_CATEGORIES = {
  code: {
    label: 'Code',
    icon: '💻',
    color: '#3b82f6',
    defaultType: 'code',
    subcategories: ['React', 'Hooks', 'Vue', 'Next.js', 'Node.js', 'TypeScript', 'JavaScript', 'CSS', 'HTML', 'SQL', 'Python', 'Algorithm', 'Utils', 'Other'],
  },
  ui: {
    label: 'UI',
    icon: '🎨',
    color: '#8b5cf6',
    defaultType: 'code',
    subcategories: ['Components', 'Cards', 'Buttons', 'Navigation', 'Forms', 'Modals', 'Layouts', 'Tables', 'Dropdowns', 'Hero', 'Other'],
  },
  design: {
    label: 'Design',
    icon: '✨',
    color: '#ec4899',
    defaultType: 'color',
    subcategories: ['Colors', 'Gradients', 'Typography', 'Shadows', 'Icons', 'Spacing', 'Palettes', 'Tokens', 'Other'],
  },
  motion: {
    label: 'Motion',
    icon: '⚡',
    color: '#f97316',
    defaultType: 'animation',
    subcategories: ['Animations', 'Transitions', 'Keyframes', 'Gestures', 'Hover Effects', 'Framer Motion', 'Tailwind Animation', 'Other'],
  },
  prompts: {
    label: 'Prompts',
    icon: '💬',
    color: '#a855f7',
    defaultType: 'prompt',
    subcategories: ['Coding', 'Refactoring', 'Debugging', 'Architecture', 'Testing', 'Documentation', 'System Design', 'Other'],
  },
  commands: {
    label: 'Commands',
    icon: '⌨️',
    color: '#10b981',
    defaultType: 'command',
    subcategories: ['Git', 'Docker', 'NPM/Yarn', 'Terminal', 'Linux', 'Database', 'AWS/Cloud', 'Deploy', 'Other'],
  },
  resources: {
    label: 'Resources',
    icon: '📚',
    color: '#06b6d4',
    defaultType: 'code',
    subcategories: ['Tools', 'Documentation', 'Libraries', 'Cheatsheets', 'APIs', 'Articles', 'Templates', 'Other'],
  },
  notes: {
    label: 'Notes',
    icon: '📝',
    color: '#eab308',
    defaultType: 'note',
    subcategories: ['Architecture', 'Ideas', 'Best Practices', 'TIL', 'Meeting Notes', 'Setup Guide', 'Checklists', 'Other'],
  },
};

// Initialize data store
let db = {
  users: [
    { _id: 'user-1', name: 'Saviyo', email: 'demo@devvault.app', password: 'password123' }
  ],
  categories: DEFAULT_CATEGORIES,
  items: [
    {
      _id: 'seed-1',
      title: 'Custom Hook: useDebounce',
      category: 'code',
      subcategory: 'React',
      content: 'function useDebounce(value, delay) {\n  const [debouncedValue, setDebouncedValue] = useState(value);\n  useEffect(() => {\n    const handler = setTimeout(() => setDebouncedValue(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debouncedValue;\n}',
      type: 'code',
      language: 'javascript',
      tags: ['react', 'hooks'],
      isFavorite: true,
      isPinned: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'seed-2',
      title: 'Brand Indigo Palette',
      category: 'design',
      subcategory: 'Colors',
      type: 'color',
      colorData: { hex: '#4f46e5' },
      content: '#4f46e5',
      tags: ['colors', 'brand'],
      isFavorite: true,
      isPinned: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'seed-3',
      title: 'Git Wipe Untracked Files',
      category: 'commands',
      subcategory: 'Git',
      type: 'command',
      content: 'git clean -fd\ngit checkout -- .',
      tags: ['git', 'cli'],
      isFavorite: false,
      isPinned: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ]
};

// Load existing data if available
if (fs.existsSync(DATA_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.warn('Error reading data.json, using defaults');
  }
}

function persist() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Failed to save data.json', e);
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () => {
    let jsonBody = {};
    if (body) {
      try { jsonBody = JSON.parse(body); } catch (e) {}
    }

    // 1. Auth: Login
    if (req.method === 'POST' && pathname === '/api/auth/login') {
      const email = jsonBody.email || 'developer@devvault.app';
      let user = db.users.find(u => u.email === email);
      if (!user) {
        user = { _id: 'u-' + Date.now(), name: email.split('@')[0], email };
        db.users.push(user);
        persist();
      }
      return sendJson(res, 200, {
        token: 'devvault_jwt_' + Date.now(),
        user: { _id: user._id, name: user.name || 'Developer', email: user.email }
      });
    }

    // 2. Auth: Register
    if (req.method === 'POST' && pathname === '/api/auth/register') {
      const email = jsonBody.email || 'new@devvault.app';
      const name = jsonBody.name || email.split('@')[0];
      const newUser = { _id: 'u-' + Date.now(), name, email, password: jsonBody.password };
      db.users.push(newUser);
      persist();
      return sendJson(res, 201, {
        token: 'devvault_jwt_' + Date.now(),
        user: { _id: newUser._id, name: newUser.name, email: newUser.email }
      });
    }

    // 3. Auth: Me
    if (req.method === 'GET' && pathname === '/api/auth/me') {
      const user = db.users[0] || { _id: '1', name: 'Saviyo', email: 'demo@devvault.app' };
      return sendJson(res, 200, { user });
    }

    // 4. Items: Get All (supports filters)
    if (req.method === 'GET' && pathname === '/api/items') {
      let result = [...db.items];
      if (query.category && query.category !== 'all') {
        result = result.filter(i => i.category === query.category);
      }
      if (query.favorite === 'true') {
        result = result.filter(i => i.isFavorite);
      }
      if (query.pinned === 'true') {
        result = result.filter(i => i.isPinned);
      }
      if (query.q) {
        const q = query.q.toLowerCase();
        result = result.filter(i => (i.title || '').toLowerCase().includes(q) || (i.content || '').toLowerCase().includes(q));
      }
      // Sort newest first
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      return sendJson(res, 200, { items: result });
    }

    // 5. Items: Stats
    if (req.method === 'GET' && pathname === '/api/items/stats') {
      const stats = {
        total: db.items.length,
        favorites: db.items.filter(i => i.isFavorite).length,
        pinned: db.items.filter(i => i.isPinned).length,
        categories: [...new Set(db.items.map(i => i.category))],
        recentlyAdded: db.items.slice(0, 5)
      };
      return sendJson(res, 200, { stats });
    }

    // 6. Items: Get By ID
    const itemMatch = pathname.match(/^\/api\/items\/([^/]+)$/);
    if (req.method === 'GET' && itemMatch) {
      const item = db.items.find(i => i._id === itemMatch[1]);
      if (item) return sendJson(res, 200, { item });
      return sendJson(res, 404, { message: 'Item not found' });
    }

    // 7. Items: Create
    if (req.method === 'POST' && pathname === '/api/items') {
      const now = new Date().toISOString();
      const newItem = {
        _id: 'item-' + Date.now(),
        ...jsonBody,
        createdAt: now,
        updatedAt: now
      };
      db.items.unshift(newItem);
      persist();
      return sendJson(res, 201, { item: newItem });
    }

    // 8. Items: Update
    if (req.method === 'PUT' && itemMatch) {
      const id = itemMatch[1];
      const idx = db.items.findIndex(i => i._id === id);
      if (idx !== -1) {
        db.items[idx] = { ...db.items[idx], ...jsonBody, updatedAt: new Date().toISOString() };
        persist();
        return sendJson(res, 200, { item: db.items[idx] });
      }
      return sendJson(res, 404, { message: 'Item not found' });
    }

    // 9. Items: Delete
    if (req.method === 'DELETE' && itemMatch) {
      const id = itemMatch[1];
      db.items = db.items.filter(i => i._id !== id);
      persist();
      return sendJson(res, 200, { message: 'Deleted successfully' });
    }

    // 10. Items: Favorite toggle
    const favMatch = pathname.match(/^\/api\/items\/([^/]+)\/favorite$/);
    if (req.method === 'PATCH' && favMatch) {
      const id = favMatch[1];
      const item = db.items.find(i => i._id === id);
      if (item) {
        item.isFavorite = jsonBody.isFavorite !== undefined ? jsonBody.isFavorite : !item.isFavorite;
        persist();
        return sendJson(res, 200, { item });
      }
      return sendJson(res, 404, { message: 'Item not found' });
    }

    // 11. Items: Pin toggle
    const pinMatch = pathname.match(/^\/api\/items\/([^/]+)\/pin$/);
    if (req.method === 'PATCH' && pinMatch) {
      const id = pinMatch[1];
      const item = db.items.find(i => i._id === id);
      if (item) {
        item.isPinned = jsonBody.isPinned !== undefined ? jsonBody.isPinned : !item.isPinned;
        persist();
        return sendJson(res, 200, { item });
      }
      return sendJson(res, 404, { message: 'Item not found' });
    }

    // 12. Categories API
    if (req.method === 'GET' && pathname === '/api/categories') {
      return sendJson(res, 200, {
        categories: db.categories || DEFAULT_CATEGORIES
      });
    }

    if (req.method === 'POST' && pathname === '/api/categories') {
      if (jsonBody.categories && typeof jsonBody.categories === 'object') {
        db.categories = jsonBody.categories;
        persist();
        return sendJson(res, 200, { success: true, categories: db.categories });
      }
      return sendJson(res, 400, { message: 'Invalid categories payload' });
    }

    // Fallback 404
    sendJson(res, 404, { message: 'Route not found' });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=========================================`);
  console.log(`🚀 CodeLoom DevVault Backend Server Running!`);
  console.log(`   Port:     http://localhost:${PORT}`);
  console.log(`   API Base: http://localhost:${PORT}/api`);
  console.log(`   Network:  Ready for Desktop & Mobile`);
  console.log(`=========================================\n`);
});
