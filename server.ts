import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEAGUE_FILE = path.join(DATA_DIR, 'league_data.json');
const AUTH_FILE = path.join(DATA_DIR, 'auth_config.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_PLAYER_NAMES = [
  "HASAN", "HUSSEY", "MUSHIL", "NAVEY", "MORDO", "NIZAM", "FRED", "SAPPE", 
  "ABLO", "JANA", "SHIMAD", "RASHU", "IMDHAAH", "MURU", "MUNAWAR", "GAZA", 
  "AZIM", "AMEEN", "ADHU", "NADEY", "YUMIN", "SALIH", "ADAMAA", "JABE", 
  "NIYA", "MODU LAW", "XAIDEY", "RAMY", "ATTA", "GHANIMSO", "SHAFITTE", 
  "ZIGAREY", "BRIGADIER", "WADDE", "RICE", "MUJEY", "BARUTTEY"
];

function getInitialLeagueData() {
  const players = DEFAULT_PLAYER_NAMES.map((name, idx) => ({
    id: `p_${idx + 1}`,
    name: name,
    avatar: '',
    createdAt: Date.now()
  }));

  const matches = [];
  const [startYear, startMonth, startDay] = [2026, 8, 14];
  for (let i = 1; i <= 15; i++) {
    const matchDate = new Date(startYear, startMonth - 1, startDay + (i - 1) * 7);
    const y = matchDate.getFullYear();
    const m = String(matchDate.getMonth() + 1).padStart(2, '0');
    const d = String(matchDate.getDate()).padStart(2, '0');
    matches.push({
      id: i,
      title: `Match ${i}`,
      date: `${y}-${m}-${d}`,
      completed: false
    });
  }

  return {
    players,
    matches,
    matchResults: {},
    deletedPlayerIds: [],
    deletedPlayerNames: [],
    lastUpdated: 0
  };
}

function loadServerLeagueData() {
  try {
    if (fs.existsSync(LEAGUE_FILE)) {
      const data = fs.readFileSync(LEAGUE_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
        if (!parsed.lastUpdated) {
          parsed.lastUpdated = Date.now();
        }
        if (!parsed.deletedPlayerIds) parsed.deletedPlayerIds = [];
        if (!parsed.deletedPlayerNames) parsed.deletedPlayerNames = [];
        const deletedIds = new Set(parsed.deletedPlayerIds || []);
        const deletedNames = new Set((parsed.deletedPlayerNames || []).map((n: string) => n.trim().toLowerCase()));
        parsed.players = parsed.players.filter((p: any) => !deletedIds.has(p.id) && !deletedNames.has((p.name || '').trim().toLowerCase()));
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading league_data.json:', e);
  }

  // Check backup file if main file failed
  try {
    const backupFile = path.join(DATA_DIR, 'league_data.bak.json');
    if (fs.existsSync(backupFile)) {
      const data = fs.readFileSync(backupFile, 'utf-8');
      const parsed = JSON.parse(data);
      if (parsed && Array.isArray(parsed.players) && parsed.players.length > 0) {
        if (!parsed.deletedPlayerIds) parsed.deletedPlayerIds = [];
        if (!parsed.deletedPlayerNames) parsed.deletedPlayerNames = [];
        const deletedIds = new Set(parsed.deletedPlayerIds || []);
        const deletedNames = new Set((parsed.deletedPlayerNames || []).map((n: string) => n.trim().toLowerCase()));
        parsed.players = parsed.players.filter((p: any) => !deletedIds.has(p.id) && !deletedNames.has((p.name || '').trim().toLowerCase()));
        return parsed;
      }
    }
  } catch (bakErr) {
    console.error('Error reading backup league data:', bakErr);
  }

  const initial = getInitialLeagueData();
  saveServerLeagueData(initial);
  return initial;
}

function saveServerLeagueData(data: any) {
  try {
    if (!data || !Array.isArray(data.players)) {
      console.warn('Attempted to save invalid league data to server disk, ignoring');
      return;
    }
    if (!data.lastUpdated) {
      data.lastUpdated = Date.now();
    }
    if (fs.existsSync(LEAGUE_FILE)) {
      try {
        const old = fs.readFileSync(LEAGUE_FILE, 'utf-8');
        fs.writeFileSync(path.join(DATA_DIR, 'league_data.bak.json'), old, 'utf-8');
      } catch (backupErr) {
        // ignore backup error
      }
    }
    fs.writeFileSync(LEAGUE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing league_data.json:', e);
  }
}

function loadServerAuthConfig() {
  try {
    if (fs.existsSync(AUTH_FILE)) {
      const data = fs.readFileSync(AUTH_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading auth_config.json:', e);
  }
  const initial = {
    adminUsername: 'admin',
    adminPassword: 'admin2026',
    viewerUsername: 'viewer',
    viewerPassword: 'ffl2026',
  };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  return initial;
}

function saveServerAuthConfig(config: any) {
  try {
    fs.writeFileSync(AUTH_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing auth_config.json:', e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Global cache prevention headers for APIs and HTML to prevent iOS/browser bookmark staleness
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  app.get('/api/league', (req, res) => {
    const data = loadServerLeagueData();
    res.json(data);
  });

  app.post('/api/league', (req, res) => {
    const data = req.body;
    if (!data || !Array.isArray(data.players)) {
      return res.status(400).json({ error: 'Invalid league data payload' });
    }
    saveServerLeagueData(data);
    res.json({ success: true, timestamp: Date.now() });
  });

  app.get('/api/auth-config', (req, res) => {
    const config = loadServerAuthConfig();
    res.json(config);
  });

  app.post('/api/auth-config', (req, res) => {
    const config = req.body;
    if (!config || !config.adminPassword) {
      return res.status(400).json({ error: 'Invalid auth config payload' });
    }
    saveServerAuthConfig(config);
    res.json({ success: true });
  });

  app.post('/api/reset-league', (req, res) => {
    const initial = getInitialLeagueData();
    saveServerLeagueData(initial);
    res.json({ success: true, data: initial });
  });

  // Vite middleware for development vs Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Friday Football League server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
