require('dotenv').config();
const express   = require('express');
const http      = require('http');
const cors      = require('cors');
const mongoose  = require('mongoose');
const { Server } = require('socket.io');

const zonesRoute      = require('./routes/zones');
const volunteersRoute = require('./routes/volunteers');
const matchRoute      = require('./routes/match');
const geminiRoute     = require('./routes/gemini');
const { router: authRoute } = require('./routes/auth');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE'] }
});

// ── Middleware ──
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://disaster-relief-2026.web.app',
    'https://disaster-relief-2026.firebaseapp.com'
  ],
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());

// Attach io to every request so routes can emit events
app.use((req, _res, next) => { req.io = io; next(); });

// ── Routes ──
app.use('/api/zones',      zonesRoute);
app.use('/api/volunteers', volunteersRoute);
app.use('/api/match',      matchRoute);
app.use('/api/gemini',     geminiRoute);
app.use('/api/auth',       authRoute);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Socket.IO ──
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Client can request a match run directly via socket (offline mode fallback)
  socket.on('request:match', async () => {
    try {
      const { runEngine }   = require('./utils/engineBridge');
      const Zone            = require('./models/Zone');
      const Volunteer       = require('./models/Volunteer');
      const zones           = await Zone.find({ needsHelp: true });
      const volunteers      = await Volunteer.find({ available: true });
      const engineInput     = {
        zones: zones.map(z => ({
          id: z._id.toString(), name: z.name, lat: z.lat, lng: z.lng,
          severity: z.severity, peopleAffected: z.peopleAffected,
          requiredSkill: z.requiredSkill, needsHelp: z.needsHelp
        })),
        volunteers: volunteers.map(v => ({
          id: v._id.toString(), name: v.name, lat: v.lat, lng: v.lng,
          skill: v.skill, available: v.available
        })),
      };
      const result = await runEngine(engineInput);
      socket.emit('match:complete', result);
    } catch (err) {
      socket.emit('match:error', { error: err.message });
    }
  });
});

// ── Simulation loop (auto-rerun matching every 30s) ──
const SIMULATION_INTERVAL = 30000;
let simTimer = null;

function startSimulation() {
  simTimer = setInterval(async () => {
    try {
      const { runEngine } = require('./utils/engineBridge');
      const Zone          = require('./models/Zone');
      const Volunteer     = require('./models/Volunteer');
      const zones         = await Zone.find({ needsHelp: true });
      const volunteers    = await Volunteer.find({ available: true });
      if (zones.length === 0 || volunteers.length === 0) return;

      // Randomly bump severity to simulate evolving disaster
      for (const z of zones) {
        const delta = Math.floor(Math.random() * 3) - 1; // -1, 0, or +1
        z.severity  = Math.min(10, Math.max(1, z.severity + delta));
        z.peopleAffected = Math.max(0, z.peopleAffected + Math.floor(Math.random() * 200) - 50);
        await z.save();
      }

      const result = await runEngine({
        zones: zones.map(z => ({
          id: z._id.toString(), name: z.name, lat: z.lat, lng: z.lng,
          severity: z.severity, peopleAffected: z.peopleAffected,
          requiredSkill: z.requiredSkill, needsHelp: z.needsHelp
        })),
        volunteers: volunteers.map(v => ({
          id: v._id.toString(), name: v.name, lat: v.lat, lng: v.lng,
          skill: v.skill, available: v.available
        })),
      });

      io.emit('simulation:tick', {
        prioritizedZones: result.prioritizedZones,
        stats:            result.stats,
        timestamp:        new Date(),
      });
    } catch (err) {
      console.error('Simulation tick error:', err.message);
    }
  }, SIMULATION_INTERVAL);
}

// ── DB Connection ──
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/disaster-relief';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      startSimulation();
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
