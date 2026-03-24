'use strict';

const CHOICE_OPTIONS = [
  'Software development',
  'Fashion & apparel',
  'Healthcare & medicine',
  'Food & restaurants',
  'Education & e-learning'
];

const IMAGE_DURATION_MS = 10000;

const session = {
  sessionId: null,
  variant: null,
  hasImage: false
};

function $(selector) {
  return document.querySelector(selector);
}

function setApp(html) {
  $('#app').innerHTML = html;
}

// Fisher-Yates shuffle (returns a new array)
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function saveStep(stepName, data) {
  try {
    await fetch(`/api/step/${stepName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.sessionId, ...data })
    });
  } catch (err) {
    console.error('Failed to save step', stepName, err);
  }
}

// ── Step 1: Intro ──────────────────────────────────────────────────────────

function renderIntro() {
  setApp(`
    <div class="card">
      <h1>Design Study</h1>
      <p>
        Thank you for taking part in this short study. We're testing different
        versions of a website design and would love your honest impression.
      </p>
      <p>Here's what will happen:</p>
      <ul class="steps-list">
        <li>
          <span class="step-num">1</span>
          <span>You'll see a webpage design for <strong>10 seconds</strong> — just take it in naturally.</span>
        </li>
        <li>
          <span class="step-num">2</span>
          <span>You'll answer a quick question in your own words.</span>
        </li>
        <li>
          <span class="step-num">3</span>
          <span>You'll pick from a short list of options.</span>
        </li>
      </ul>
      <p>The whole thing takes about a minute. There are no right or wrong answers.</p>
      <button class="btn" id="start-btn">I'm ready — let's start</button>
    </div>
  `);

  const btn = $('#start-btn');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = 'Starting…';

    try {
      const res = await fetch('/api/session/start', { method: 'POST' });
      const data = await res.json();
      session.sessionId = data.sessionId;
      session.variant = data.variant;
      session.hasImage = data.hasImage;
    } catch (err) {
      console.error('Failed to start session', err);
      btn.disabled = false;
      btn.textContent = 'I\'m ready — let\'s start';
      return;
    }

    await saveStep('intro', {});
    renderImage();
  });
}

// ── Step 2: Full-screen image ──────────────────────────────────────────────

function renderImage() {
  document.body.classList.add('image-step');

  if (session.hasImage) {
    setApp(`
      <div id="image-countdown">${IMAGE_DURATION_MS / 1000}s</div>
      <img
        id="variant-image"
        src="/images/variant-${session.variant}.jpg"
        alt="Design variant"
        onerror="this.onerror=null; showImagePlaceholder()"
      >
    `);
  } else {
    setApp(`
      <div id="image-countdown">${IMAGE_DURATION_MS / 1000}s</div>
      <div class="image-placeholder">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <span>Place your landing page image at<br><code>public/images/variant-${session.variant}.jpg</code></span>
      </div>
    `);
  }

  // Countdown timer
  let remaining = IMAGE_DURATION_MS / 1000;
  const countdownEl = () => $('#image-countdown');

  const tick = setInterval(() => {
    remaining -= 1;
    const el = countdownEl();
    if (el) el.textContent = `${remaining}s`;
  }, 1000);

  setTimeout(async () => {
    clearInterval(tick);
    document.body.classList.remove('image-step');
    await saveStep('image', { viewDurationMs: IMAGE_DURATION_MS, variant: session.variant });
    renderFreeText();
  }, IMAGE_DURATION_MS);
}

// Exposed globally for the onerror handler in img tag
window.showImagePlaceholder = function() {
  const img = $('#variant-image');
  if (!img) return;
  img.replaceWith(Object.assign(document.createElement('div'), {
    className: 'image-placeholder',
    innerHTML: `
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <span>Image not found: <code>public/images/variant-${session.variant}.jpg</code></span>
    `
  }));
};

// ── Step 3: Free-text question ─────────────────────────────────────────────

function renderFreeText() {
  setApp(`
    <div class="card">
      <h1>Your impression</h1>
      <p>
        Based on what you just saw — in what area of business does this company operate?
      </p>
      <p class="hint">Write a few words or sentences in your own words.</p>
      <textarea id="free-answer" placeholder="e.g. They seem to sell software for businesses…" rows="5"></textarea>
      <div class="field-error" id="free-error"></div>
      <button class="btn" id="free-next">Next</button>
    </div>
  `);

  $('#free-next').addEventListener('click', async () => {
    const answer = $('#free-answer').value.trim();
    if (!answer) {
      $('#free-error').textContent = 'Please write something before continuing.';
      return;
    }
    $('#free-next').disabled = true;
    await saveStep('freeText', { answer });
    renderMultipleChoice();
  });
}

// ── Step 4: Multiple-choice question ──────────────────────────────────────

function renderMultipleChoice() {
  const shuffled = shuffle(CHOICE_OPTIONS);

  const optionsHtml = shuffled.map((opt, i) => `
    <li class="option-item">
      <label class="option-label">
        <input type="radio" name="choice" value="${opt}">
        <span>${opt}</span>
      </label>
    </li>
  `).join('');

  setApp(`
    <div class="card">
      <h1>One more question</h1>
      <p>
        Looking at the same options below — which area of business best describes
        what that company does?
      </p>
      <p class="hint">Pick the one that fits best.</p>
      <ul class="options-list">
        ${optionsHtml}
      </ul>
      <div class="field-error" id="choice-error"></div>
      <button class="btn" id="choice-next">Submit</button>
    </div>
  `);

  $('#choice-next').addEventListener('click', async () => {
    const selected = $('input[name="choice"]:checked');
    if (!selected) {
      $('#choice-error').textContent = 'Please select an option before continuing.';
      return;
    }
    $('#choice-next').disabled = true;
    await saveStep('multipleChoice', {
      answer: selected.value,
      optionOrder: shuffled
    });
    renderDone();
  });
}

// ── Step 5: Done ───────────────────────────────────────────────────────────

function renderDone() {
  setApp(`
    <div class="card" style="text-align:center">
      <div class="done-icon">✓</div>
      <h1>Thank you!</h1>
      <p>
        Your responses have been recorded. You've completed the study and
        your input helps us improve the design.
      </p>
      <p>You can now close this tab.</p>
    </div>
  `);
}

// ── Bootstrap ──────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', renderIntro);
