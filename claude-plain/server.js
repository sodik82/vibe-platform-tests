const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const SESSIONS_DIR = path.join(__dirname, 'data', 'sessions');
const PUBLIC_DIR = path.join(__dirname, 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');

// Ensure data/sessions directory exists
fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// Determine available variants from images directory
function getAvailableVariants() {
  try {
    const files = fs.readdirSync(IMAGES_DIR);
    const variants = [];
    for (const name of ['a', 'b', 'c', 'd']) {
      const found = files.find(f => f.match(new RegExp(`^variant-${name}\\.(jpg|jpeg|png|webp)$`, 'i')));
      if (found) variants.push({ name, file: found });
    }
    return variants.length > 0 ? variants : [{ name: 'a', file: null }];
  } catch {
    return [{ name: 'a', file: null }];
  }
}

function getSessionCount() {
  try {
    return fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json')).length;
  } catch {
    return 0;
  }
}

function readSession(sessionId) {
  const file = path.join(SESSIONS_DIR, `${sessionId}.json`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeSession(data) {
  const file = path.join(SESSIONS_DIR, `${data.sessionId}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// Start a new session
app.post('/api/session/start', (req, res) => {
  const variants = getAvailableVariants();
  const count = getSessionCount();
  const variant = variants[count % variants.length];

  const sessionId = crypto.randomUUID();
  const session = {
    sessionId,
    variant: variant.name,
    variantFile: variant.file,
    startedAt: new Date().toISOString(),
    steps: {}
  };

  writeSession(session);
  res.json({ sessionId, variant: variant.name, hasImage: variant.file !== null });
});

// Record a completed step
app.post('/api/step/:stepName', (req, res) => {
  const { stepName } = req.params;
  const { sessionId, ...stepData } = req.body;

  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

  const allowed = ['intro', 'image', 'freeText', 'multipleChoice'];
  if (!allowed.includes(stepName)) return res.status(400).json({ error: 'Unknown step' });

  try {
    const session = readSession(sessionId);
    session.steps[stepName] = {
      completedAt: new Date().toISOString(),
      ...stepData
    };
    writeSession(session);
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Download all results as JSON
app.get('/api/results/download', (req, res) => {
  try {
    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
    const results = files.map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, f), 'utf8'));
      } catch {
        return null;
      }
    }).filter(Boolean);

    results.sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="ab-results-${Date.now()}.json"`);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read results' });
  }
});

app.listen(PORT, () => {
  console.log(`A/B Test server running at http://localhost:${PORT}`);
  console.log(`Download results: http://localhost:${PORT}/api/results/download`);
});
