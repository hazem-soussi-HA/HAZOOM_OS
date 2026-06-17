const https = require('https');
const fs = require('fs');
const WebSocket = require('ws');
const crypto = require('crypto');

const PORT = 9443;
const WSS_PORT = 9444;

const SSL_KEY = process.env.SSL_KEY || '/home/hazem/map-command-center/ssl/server.key';
const SSL_CERT = process.env.SSL_CERT || '/home/hazem/map-command-center/ssl/server.crt';

const SYSTEMS = [
  {id: "neo-tokyo", name: "Neo-Tokyo", lat: 35.6762, lon: 139.6503, type: "mega-city", power: 95, population: 42000000, defense: "A", comms: "Q-7", status: "online", behavior: "stable", resourceRate: 120, specialty: "tech"},
  {id: "new-berlin", name: "New Berlin", lat: 52.5200, lon: 13.4050, type: "arcology", power: 88, population: 18000000, defense: "B", comms: "Q-5", status: "online", behavior: "stable", resourceRate: 85, specialty: "energy"},
  {id: "cyber-paris", name: "Cyber-Paris", lat: 48.8566, lon: 2.3522, type: "technopolis", power: 82, population: 25000000, defense: "B", comms: "Q-4", status: "online", behavior: "stable", resourceRate: 95, specialty: "culture"},
  {id: "silicon-valley", name: "Silicon Valley", lat: 37.4419, lon: -122.1430, type: "data-hub", power: 91, population: 12000000, defense: "A", comms: "Q-8", status: "online", behavior: "stable", resourceRate: 150, specialty: "ai"},
  {id: "mega-london", name: "Mega-London", lat: 51.5074, lon: -0.1278, type: "corpo-city", power: 85, population: 35000000, defense: "A", comms: "Q-6", status: "online", behavior: "stable", resourceRate: 110, specialty: "finance"},
  {id: "neo-moscow", name: "Neo-Moscow", lat: 55.7558, lon: 37.6173, type: "federal-district", power: 78, population: 22000000, defense: "C", comms: "Q-3", status: "warning", behavior: "volatile", resourceRate: 70, specialty: "military"},
  {id: "solaris-9", name: "Solaris-9", lat: 15.7942, lon: -47.8822, type: "orbital-station", power: 72, population: 5000000, defense: "B", comms: "Q-9", status: "online", behavior: "stable", resourceRate: 60, specialty: "space"},
  {id: "quantum-haven", name: "Quantum-Haven", lat: -33.9249, lon: 18.4241, type: "research-facility", power: 65, population: 2000000, defense: "D", comms: "Q-10", status: "online", behavior: "stable", resourceRate: 50, specialty: "quantum"},
  {id: "void-station", name: "Void-Station", lat: 0.0, lon: 0.0, type: "deep-space", power: 55, population: 500000, defense: "E", comms: "Q-12", status: "warning", behavior: "unstable", resourceRate: 30, specialty: "exploration"},
  {id: "eclipse-city", name: "Eclipse-City", lat: -12.0464, lon: -77.0428, type: "shadow-zone", power: 48, population: 8000000, defense: "C", comms: "Q-2", status: "critical", behavior: "chaotic", resourceRate: 40, specialty: "stealth"},
  {id: "nova-prime", name: "Nova-Prime", lat: 34.0522, lon: -118.2437, type: "alpha-colony", power: 89, population: 15000000, defense: "A", comms: "Q-7", status: "online", behavior: "stable", resourceRate: 100, specialty: "colony"},
  {id: "zenith-7", name: "Zenith-7", lat: 41.9028, lon: 12.4964, type: "zenith-tower", power: 76, population: 10000000, defense: "B", comms: "Q-5", status: "online", behavior: "stable", resourceRate: 75, specialty: "diplomacy"},
  {id: "neo-shanghai", name: "Neo-Shanghai", lat: 31.2304, lon: 121.4737, type: "mega-port", power: 93, population: 38000000, defense: "A", comms: "Q-6", status: "online", behavior: "stable", resourceRate: 140, specialty: "trade"},
  {id: "cyber-dubai", name: "Cyber-Dubai", lat: 25.2048, lon: 55.2708, type: "lux-hub", power: 87, population: 8000000, defense: "B", comms: "Q-8", status: "online", behavior: "stable", resourceRate: 130, specialty: "luxury"},
  {id: "arctic-base", name: "Arctic Base", lat: 71.2906, lon: -156.7886, type: "ice-fortress", power: 60, population: 1000000, defense: "A", comms: "Q-11", status: "online", behavior: "stable", resourceRate: 45, specialty: "defense"},
  {id: "sahara-nexus", name: "Sahara Nexus", lat: 23.4162, lon: 25.6628, type: "desert-city", power: 70, population: 6000000, defense: "C", comms: "Q-4", status: "online", behavior: "stable", resourceRate: 55, specialty: "solar"},
  {id: "amazon-arc", name: "Amazon Arc", lat: -3.4653, lon: -62.2159, type: "bio-dome", power: 68, population: 3000000, defense: "D", comms: "Q-9", status: "online", behavior: "stable", resourceRate: 65, specialty: "bio"},
  {id: "himalayan-peak", name: "Himalayan Peak", lat: 27.9881, lon: 86.9250, type: "sky-fortress", power: 74, population: 2000000, defense: "A", comms: "Q-10", status: "online", behavior: "stable", resourceRate: 40, specialty: "monitoring"},
  {id: "antarctica-zero", name: "Antarctica Zero", lat: -82.8628, lon: 135.0000, type: "ice-lab", power: 50, population: 500000, defense: "B", comms: "Q-12", status: "warning", behavior: "unstable", resourceRate: 35, specialty: "research"},
  {id: "pacific-ridge", name: "Pacific Ridge", lat: -20.0, lon: -160.0, type: "underwater", power: 62, population: 4000000, defense: "C", comms: "Q-8", status: "online", behavior: "stable", resourceRate: 50, specialty: "marine"},
  {id: "neo-mumbai", name: "Neo-Mumbai", lat: 19.0760, lon: 72.8777, type: "mega-city", power: 84, population: 32000000, defense: "B", comms: "Q-5", status: "online", behavior: "volatile", resourceRate: 115, specialty: "tech"},
  {id: "atlantis-deep", name: "Atlantis Deep", lat: 36.0, lon: -24.0, type: "submerged", power: 58, population: 1500000, defense: "D", comms: "Q-11", status: "warning", behavior: "unstable", resourceRate: 45, specialty: "deep-sea"},
  {id: "lunar-gateway", name: "Lunar Gateway", lat: -40.0, lon: -100.0, type: "lunar-base", power: 80, population: 200000, defense: "A", comms: "Q-15", status: "online", behavior: "stable", resourceRate: 200, specialty: "lunar"},
  {id: "mars-outpost", name: "Mars Outpost", lat: -15.0, lon: 175.0, type: "mars-colony", power: 65, population: 50000, defense: "B", comms: "Q-20", status: "online", behavior: "stable", resourceRate: 180, specialty: "mars"},
  {id: "orbital-alpha", name: "Orbital Alpha", lat: 45.0, lon: -90.0, type: "space-station", power: 90, population: 10000, defense: "A", comms: "Q-18", status: "online", behavior: "stable", resourceRate: 250, specialty: "orbital"},
  {id: "neo-seoul", name: "Neo-Seoul", lat: 37.5665, lon: 126.9780, type: "mega-city", power: 92, population: 28000000, defense: "A", comms: "Q-7", status: "online", behavior: "stable", resourceRate: 125, specialty: "gaming"},
  {id: "cairo-fortress", name: "Cairo Fortress", lat: 30.0444, lon: 31.2357, type: "ancient-modern", power: 73, population: 20000000, defense: "C", comms: "Q-4", status: "online", behavior: "stable", resourceRate: 60, specialty: "history"},
  {id: "sydney-hub", name: "Sydney Hub", lat: -33.8688, lon: 151.2093, type: "coastal-city", power: 81, population: 12000000, defense: "B", comms: "Q-6", status: "online", behavior: "stable", resourceRate: 90, specialty: "marine"},
  {id: "reykjavik-nexus", name: "Reykjavik Nexus", lat: 64.1466, lon: -21.9426, type: "geo-plant", power: 95, population: 3000000, defense: "B", comms: "Q-9", status: "online", behavior: "stable", resourceRate: 100, specialty: "geothermal"},
  {id: "singapore-core", name: "Singapore Core", lat: 1.3521, lon: 103.8198, type: "city-state", power: 94, population: 9000000, defense: "A", comms: "Q-8", status: "online", behavior: "stable", resourceRate: 135, specialty: "finance"},
  {id: "buenos-aires", name: "Buenos Aires", lat: -34.6037, lon: -58.3816, type: "cultural-hub", power: 77, population: 15000000, defense: "C", comms: "Q-5", status: "online", behavior: "stable", resourceRate: 70, specialty: "culture"},
  {id: "nairobi-tech", name: "Nairobi Tech", lat: -1.2921, lon: 36.8219, type: "tech-hub", power: 71, population: 8000000, defense: "C", comms: "Q-6", status: "online", behavior: "volatile", resourceRate: 80, specialty: "mobile"}
];

const gameState = {
  credits: 10000,
  power: 500,
  intel: 100,
  influence: 50,
  level: 1,
  xp: 0,
  xpToNext: 1000,
  activeEvents: [],
  upgrades: {},
  alliances: [],
  turn: 1
};

const clients = new Map();
const operators = {
  'admin': { pass: 'quantum123', role: 'commander', level: 5 },
  'operator': { pass: 'secure456', role: 'operator', level: 3 },
  'viewer': { pass: 'view789', role: 'viewer', level: 1 }
};

function simulateSystemBehavior(system) {
  const volatility = { stable: 2, volatile: 5, unstable: 8, chaotic: 12 };
  const range = volatility[system.behavior] || 2;
  system.power = Math.max(10, Math.min(100, system.power + (Math.random() * range * 2 - range)));
  
  if (system.power < 30) system.status = 'critical';
  else if (system.power < 60) system.status = 'warning';
  else system.status = 'online';
  
  system.population = Math.floor(system.population * (1 + (Math.random() * 0.002 - 0.001)));
}

function generateEvent() {
  const events = [
    { type: 'power-surge', desc: 'Power surge detected', effect: (sys) => { sys.power = Math.max(10, sys.power - 15); } },
    { type: 'trade-boom', desc: 'Trade boom!', effect: (sys) => { gameState.credits += 500; } },
    { type: 'cyber-attack', desc: 'Cyber attack detected', effect: (sys) => { sys.power = Math.max(10, sys.power - 20); } },
    { type: 'discovery', desc: 'New resource discovered', effect: (sys) => { gameState.credits += 300; gameState.intel += 50; } },
    { type: 'alliance-offer', desc: 'Alliance proposal received', effect: (sys) => { gameState.influence += 20; } },
    { type: 'solar-flare', desc: 'Solar flare disrupting comms', effect: (sys) => { sys.power = Math.max(10, sys.power - 10); } },
    { type: 'tech-breakthrough', desc: 'Technology breakthrough', effect: (sys) => { gameState.intel += 100; } },
    { type: 'population-boom', desc: 'Population surge', effect: (sys) => { sys.population = Math.floor(sys.population * 1.05); } }
  ];
  const event = events[Math.floor(Math.random() * events.length)];
  const system = SYSTEMS[Math.floor(Math.random() * SYSTEMS.length)];
  event.effect(system);
  return { ...event, system: system.name, systemId: system.id, timestamp: Date.now(), id: crypto.randomUUID() };
}

let sslOptions;
try {
  sslOptions = {
    key: fs.readFileSync(SSL_KEY),
    cert: fs.readFileSync(SSL_CERT)
  };
} catch (e) {
  console.log('⚠️  No SSL certs found, using HTTP only');
  sslOptions = null;
}

const server = https.createServer(sslOptions || {}, (req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(fs.readFileSync(__dirname + '/public/index.html'));
  } else if (req.url.endsWith('.js')) {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(fs.readFileSync(__dirname + '/public' + req.url));
  } else if (req.url.endsWith('.css')) {
    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(fs.readFileSync(__dirname + '/public' + req.url));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const clientId = crypto.randomUUID();
  clients.set(clientId, { ws, authenticated: false, session: null });
  console.log(`🔗 Client connected: ${clientId}`);
  
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to Quantum Command Center',
    clientId
  }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      const client = clients.get(clientId);
      
      switch (msg.type) {
        case 'auth': {
          const op = operators[msg.userId];
          if (op && op.pass === msg.password) {
            client.authenticated = true;
            client.session = {
              userId: msg.userId,
              role: op.role,
              level: op.level,
              token: crypto.randomUUID(),
              expires: Date.now() + 3600000
            };
            ws.send(JSON.stringify({
              type: 'auth-success',
              session: client.session,
              gameState
            }));
          } else {
            ws.send(JSON.stringify({ type: 'auth-fail', message: 'Invalid credentials' }));
          }
          break;
        }
        
        case 'get-systems': {
          if (!client.authenticated) return;
          ws.send(JSON.stringify({ type: 'systems-data', systems: SYSTEMS }));
          break;
        }
        
        case 'ping-system': {
          if (!client.authenticated) return;
          const sys = SYSTEMS.find(s => s.id === msg.systemId);
          if (sys) {
            const latency = Math.floor(Math.random() * 200 + 20);
            ws.send(JSON.stringify({
              type: 'ping-response',
              systemId: msg.systemId,
              latency,
              status: sys.status
            }));
          }
          break;
        }
        
        case 'boost-system': {
          if (!client.authenticated) return;
          const sys = SYSTEMS.find(s => s.id === msg.systemId);
          if (sys) {
            sys.power = Math.min(100, sys.power + 10);
            gameState.credits -= 100;
            ws.send(JSON.stringify({
              type: 'boost-response',
              systemId: msg.systemId,
              power: sys.power,
              credits: gameState.credits
            }));
          }
          break;
        }
        
        case 'send-message': {
          if (!client.authenticated) return;
          const sys = SYSTEMS.find(s => s.id === msg.systemId);
          if (sys) {
            setTimeout(() => {
              const responses = {
                'tech': ['Processing data request', 'AI analysis complete', 'Neural network stable'],
                'energy': ['Grid output optimal', 'Reactor stable', 'Power distribution nominal'],
                'military': ['Defense systems nominal', 'Perimeter secure', 'Standing by'],
                'trade': ['Markets stable', 'Trade routes open', 'Cargo processing'],
                'research': ['Experiment ongoing', 'Data collected', 'Breakthrough imminent'],
                'default': ['Acknowledged', 'Standing by', 'Systems nominal']
              };
              const respList = responses[sys.specialty] || responses.default;
              ws.send(JSON.stringify({
                type: 'system-response',
                systemId: msg.systemId,
                message: respList[Math.floor(Math.random() * respList.length)],
                timestamp: Date.now()
              }));
            }, 1000 + Math.random() * 3000);
          }
          break;
        }
        
        case 'upgrade-system': {
          if (!client.authenticated) return;
          const sys = SYSTEMS.find(s => s.id === msg.systemId);
          if (sys && gameState.credits >= msg.cost) {
            gameState.credits -= msg.cost;
            gameState.xp += 50;
            if (msg.upgrade === 'defense') sys.defense = String.fromCharCode(sys.defense.charCodeAt(0) - 1);
            if (msg.upgrade === 'power') sys.power = Math.min(100, sys.power + 20);
            ws.send(JSON.stringify({
              type: 'upgrade-response',
              systemId: msg.systemId,
              upgrade: msg.upgrade,
              credits: gameState.credits,
              xp: gameState.xp
            }));
          }
          break;
        }
        
        case 'next-turn': {
          if (!client.authenticated) return;
          gameState.turn++;
          SYSTEMS.forEach(simulateSystemBehavior);
          if (Math.random() > 0.6) {
            const event = generateEvent();
            gameState.activeEvents.push(event);
            broadcast({ type: 'event', event });
          }
          gameState.credits += Math.floor(SYSTEMS.reduce((sum, s) => sum + s.resourceRate, 0) * 0.1);
          ws.send(JSON.stringify({ type: 'turn-update', gameState, systems: SYSTEMS }));
          break;
        }
        
        case 'chat': {
          if (!client.authenticated) return;
          broadcast({
            type: 'chat-message',
            userId: client.session.userId,
            message: msg.message,
            timestamp: Date.now()
          });
          break;
        }
      }
    } catch (e) {
      console.error('Message error:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(clientId);
    console.log(`❌ Client disconnected: ${clientId}`);
  });
});

function broadcast(data) {
  const msg = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  });
}

setInterval(() => {
  SYSTEMS.forEach(simulateSystemBehavior);
  broadcast({ type: 'system-update', systems: SYSTEMS });
}, 5000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Quantum Command Center running on https://0.0.0.0:${PORT}`);
  console.log(`🔌 WebSocket on wss://0.0.0.0:${PORT}`);
  console.log(`📊 ${SYSTEMS.length} systems loaded`);
});
