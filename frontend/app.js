// === State =================================================================
const state = {
  currentDate: todayDateStr(),
  currentCategory: '',
  currentCity: '',
  offset: 0,
  limit: 20,
  total: 0,
  loading: false,
  availableDates: new Set(),
};

// === Helpers ===============================================================
function todayDateStr() {
  return new Date().toLocaleDateString('sv', { timeZone: 'Europe/Paris' });
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'Europe/Paris',
  });
}

function formatDateTime(isoStr) {
  const d = new Date(isoStr);
  const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });
  const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  return `${dateStr} · ${timeStr}`;
}

function formatTime(isoStr) {
  const d = new Date(isoStr);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
}

function shiftDate(dateStr, days) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('sv', { timeZone: 'Europe/Paris' });
}

function isToday(dateStr) {
  return dateStr === todayDateStr();
}

function dayLabel(dateStr) {
  if (isToday(dateStr)) return `Aujourd'hui · ${formatDate(dateStr)}`;
  const yesterday = shiftDate(todayDateStr(), -1);
  if (dateStr === yesterday) return `Hier · ${formatDate(dateStr)}`;
  const tomorrow = shiftDate(todayDateStr(), 1);
  if (dateStr === tomorrow) return `Demain · ${formatDate(dateStr)}`;
  return formatDate(dateStr);
}

function categoryIcon(cat) {
  const icons = {
    'bars-soirees': '🍻',
    'concerts-musique': '🎵',
    'expositions-arts': '🎨',
    'spectacles-theatre': '🎭',
    'festivals': '🎪',
    'ginguettes-guinguettes': '🎡',
    'sexpo': '🌶️',
    'autres': '📌',
  };
  return icons[cat] ?? '📌';
}

function categoryLabel(cat) {
  const labels = {
    'bars-soirees': 'Bars / soirées',
    'concerts-musique': 'Concerts / musique',
    'expositions-arts': 'Expositions / arts',
    'spectacles-theatre': 'Spectacles / théâtre',
    'festivals': 'Festivals',
    'ginguettes-guinguettes': 'Ginguettes / guinguettes',
    'sexpo': 'Sexpo',
    'autres': 'Autres',
  };
  return labels[cat] ?? cat;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// === API ===================================================================
async function fetchEvents({ date, category, city, limit, offset }) {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (category) params.set('category', category);
  if (city) params.set('city', city);
  if (limit != null) params.set('limit', String(limit));
  if (offset != null) params.set('offset', String(offset));
  const res = await fetch(`/api/events?${params}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function fetchEventById(id) {
  const res = await fetch(`/api/events/${id}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

async function fetchCities() {
  const res = await fetch('/api/cities');
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

async function fetchEventDates() {
  const res = await fetch('/api/dates');
  if (!res.ok) return [];
  const data = await res.json();
  return data.data ?? [];
}

// === Rendering =============================================================
function renderCard(event) {
  const article = document.createElement('article');
  article.className = 'event-card';
  article.setAttribute('role', 'listitem');
  article.setAttribute('tabindex', '0');
  article.dataset.id = event.id;

  const imageHtml = event.imageUrl
    ? `<div class="card-image"><img src="${escapeHtml(event.imageUrl)}" alt="" loading="lazy" /></div>`
    : `<div class="card-image-placeholder">${categoryIcon(event.category)}</div>`;

  const categoryBadgeHtml = event.category !== 'autres'
    ? `<span class="badge badge-category">${escapeHtml(categoryLabel(event.category))}</span>`
    : '';

  const freeHtml = event.isFree
    ? `<span class="badge badge-free">Gratuit</span>`
    : '';

  const time = formatTime(event.startAt);

  const shareHtml = navigator.share
    ? `<button class="card-share-btn btn btn-outline btn-sm" aria-label="Partager">&#8679;</button>`
    : '';

  article.innerHTML = `
    ${imageHtml}
    <div class="card-body">
      <div class="card-badges">
        ${categoryBadgeHtml}
        ${freeHtml}
      </div>
      <div class="card-title">${escapeHtml(event.title)}</div>
      <div class="card-meta">
        <span class="card-time">&#128337; ${escapeHtml(time)}</span>
        ${event.venueName ? `<span>&#128205; ${escapeHtml(event.venueName)}${event.city ? ` · ${escapeHtml(event.city)}` : ''}</span>` : ''}
      </div>
    </div>
    ${shareHtml}
  `;

  article.addEventListener('click', () => openDetail(event.id));
  article.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') openDetail(event.id); });

  article.querySelector('.card-share-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    shareEvent(event);
  });

  return article;
}

function clearCards(list) {
  const loadingEl = document.getElementById('loading-state');
  [...list.children].forEach(c => { if (c !== loadingEl) c.remove(); });
}

function renderList(events, append = false) {
  const list = document.getElementById('events-list');

  document.getElementById('loading-state').hidden = true;

  if (!append) {
    clearCards(list);
  }

  if (events.length === 0 && !append) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Aucun événement trouvé pour ces critères.';
    list.appendChild(empty);
    return;
  }

  for (const event of events) {
    list.appendChild(renderCard(event));
  }
}

function updateLoadMore() {
  const wrap = document.getElementById('load-more-wrap');
  wrap.hidden = state.offset + state.limit >= state.total;
}

function syncDatePicker() {
  const picker = document.getElementById('date-picker');
  picker.value = state.currentDate;
  document.getElementById('today-btn').classList.toggle('is-today', isToday(state.currentDate));
}

function updateDayLabel() {
  document.getElementById('day-label').textContent = dayLabel(state.currentDate);
  syncDatePicker();
}

// === Load events ===========================================================
async function loadEvents(append = false) {
  if (state.loading) return;
  state.loading = true;

  if (!append) {
    const list = document.getElementById('events-list');
    document.getElementById('loading-state').hidden = false;
    clearCards(list);
  }

  try {
    const result = await fetchEvents({
      date: state.currentDate,
      category: state.currentCategory || undefined,
      city: state.currentCity || undefined,
      limit: state.limit,
      offset: state.offset,
    });

    state.total = result.total;
    renderList(result.data, append);
    updateLoadMore();
  } catch (_err) {
    const list = document.getElementById('events-list');
    document.getElementById('loading-state').hidden = true;
    clearCards(list);
    const errEl = document.createElement('div');
    errEl.className = 'error-state';
    errEl.textContent = 'Impossible de charger les événements. Réessaie dans un moment.';
    list.appendChild(errEl);
    document.getElementById('load-more-wrap').hidden = true;
  } finally {
    state.loading = false;
  }
}

// === Detail panel ==========================================================
function openDetail(id) {
  fetchEventById(id).then((event) => {
    // Reset iframe section
    const iframeSection = document.getElementById('iframe-section');
    iframeSection.hidden = true;
    clearIframe();

    // Image
    const imageWrap = document.getElementById('detail-image-wrap');
    const detailImg = document.getElementById('detail-image');
    if (event.imageUrl) {
      detailImg.src = event.imageUrl;
      detailImg.alt = event.title;
      imageWrap.hidden = false;
    } else {
      imageWrap.hidden = true;
    }

    // Badges
    const categoryBadge = event.category !== 'autres'
      ? `<span class="badge badge-category">${escapeHtml(categoryLabel(event.category))}</span>`
      : '';
    const freeHtml = event.isFree ? `<span class="badge badge-free">Gratuit</span>` : '';
    document.getElementById('detail-badges').innerHTML = `${categoryBadge}${freeHtml}`;

    // Title
    document.getElementById('detail-title').textContent = event.title;

    // Meta
    const endHtml = event.endAt
      ? ` → ${formatTime(event.endAt)}`
      : '';
    document.getElementById('detail-meta').innerHTML = `
      <span>&#128337; ${escapeHtml(formatDateTime(event.startAt))}${endHtml}</span>
      ${event.venueName ? `<span>&#128205; ${escapeHtml(event.venueName)}${event.address ? ` — ${escapeHtml(event.address)}` : ''}</span>` : ''}
      ${event.city ? `<span>&#127960; ${escapeHtml(event.city)}</span>` : ''}
    `;

    // Description
    const descEl = document.getElementById('detail-description');
    descEl.textContent = event.description ?? '';
    descEl.hidden = !event.description;

    // Price
    const priceEl = document.getElementById('detail-price');
    if (event.priceInfo) {
      priceEl.innerHTML = `&#127915; ${escapeHtml(event.priceInfo)}`;
      priceEl.hidden = false;
    } else {
      priceEl.hidden = true;
    }

    // Actions
    const actionsEl = document.getElementById('detail-actions');
    let actionsHtml = '';
    if (event.detailUrl) {
      actionsHtml += `<a href="${escapeHtml(event.detailUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-ghost btn-sm">Voir la source &#8599;</a>`;
      actionsHtml += `<button class="btn btn-outline btn-sm" id="open-iframe-btn" data-url="${escapeHtml(event.detailUrl)}">Aperçu</button>`;
    }
    if (navigator.share) {
      actionsHtml += `<button class="btn btn-outline btn-sm" id="share-btn">Partager</button>`;
    }
    actionsEl.innerHTML = actionsHtml;

    if (event.detailUrl) {
      document.getElementById('open-iframe-btn')?.addEventListener('click', () => {
        loadIframe(event.detailUrl);
      });
    }

    document.getElementById('share-btn')?.addEventListener('click', () => {
      shareEvent(event);
    });

    // Show overlay
    const overlay = document.getElementById('detail-overlay');
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('detail-close').focus();
  }).catch(() => {
    // Silently fail — the card click shouldn't crash the UI
  });
}

async function shareEvent(event) {
  const venue = event.venueName ? ` @ ${event.venueName}` : '';
  const date = formatDateTime(event.startAt);
  try {
    await navigator.share({
      title: event.title,
      text: `${event.title}\n${date}${venue}`,
      url: event.detailUrl || window.location.href,
    });
  } catch (err) {
    if (err.name !== 'AbortError') console.error('Share failed:', err);
  }
}

function closeDetail() {
  const overlay = document.getElementById('detail-overlay');
  overlay.hidden = true;
  document.body.style.overflow = '';
  clearIframe();
}

// === iFrame ================================================================
function loadIframe(url) {
  const iframeSection = document.getElementById('iframe-section');
  const iframeEl = document.getElementById('detail-iframe');
  const overlay = document.getElementById('iframe-overlay');
  const fallback = document.getElementById('iframe-fallback');
  const fallbackLink = document.getElementById('iframe-fallback-link');

  iframeSection.hidden = false;
  overlay.classList.remove('hidden');
  fallback.hidden = true;
  fallbackLink.href = url;

  let loaded = false;
  const timeout = setTimeout(() => {
    if (!loaded) {
      overlay.classList.add('hidden');
      fallback.hidden = false;
    }
  }, 4000);

  iframeEl.onload = () => {
    loaded = true;
    clearTimeout(timeout);
    try {
      const body = iframeEl.contentDocument?.body;
      if (!body || body.innerHTML.trim() === '') {
        overlay.classList.add('hidden');
        fallback.hidden = false;
        return;
      }
    } catch (_) {
      // Cross-origin SecurityError → real page loaded successfully
    }
    overlay.classList.add('hidden');
    fallback.hidden = true;
  };

  iframeEl.src = url;
}

function clearIframe() {
  const iframeEl = document.getElementById('detail-iframe');
  iframeEl.src = '';
  iframeEl.onload = null;
}

// === Date picker ===========================================================
async function initDatePicker() {
  try {
    const dates = await fetchEventDates();
    if (dates.length === 0) return;
    state.availableDates = new Set(dates);
    const picker = document.getElementById('date-picker');
    picker.min = dates[0];
    picker.max = dates[dates.length - 1];
  } catch (_) {}
}

function nearestAvailableDate(dateStr) {
  if (state.availableDates.size === 0) return dateStr;
  const sorted = [...state.availableDates].sort();
  const next = sorted.find(d => d >= dateStr);
  return next ?? sorted[sorted.length - 1];
}

// === City select ===========================================================
async function initCitySelect() {
  const select = document.getElementById('city-select');
  try {
    const cities = await fetchCities();
    for (const city of cities) {
      const opt = document.createElement('option');
      opt.value = city;
      opt.textContent = city;
      select.appendChild(opt);
    }
  } catch (_) {}
}

// === Event listeners =======================================================
function init() {
  updateDayLabel();
  initDatePicker();
  initCitySelect();

  // Day navigation
  document.getElementById('prev-day').addEventListener('click', () => {
    state.currentDate = shiftDate(state.currentDate, -1);
    state.offset = 0;
    updateDayLabel();
    loadEvents();
  });

  document.getElementById('next-day').addEventListener('click', () => {
    state.currentDate = shiftDate(state.currentDate, 1);
    state.offset = 0;
    updateDayLabel();
    loadEvents();
  });

  document.getElementById('today-btn').addEventListener('click', () => {
    state.currentDate = todayDateStr();
    state.offset = 0;
    updateDayLabel();
    loadEvents();
  });

  document.getElementById('date-picker').addEventListener('change', (e) => {
    if (!e.target.value) return;
    const picked = e.target.value;
    state.currentDate = (state.availableDates.size > 0 && !state.availableDates.has(picked))
      ? nearestAvailableDate(picked)
      : picked;
    state.offset = 0;
    updateDayLabel();
    loadEvents();
  });

  // Search form
  document.getElementById('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    state.currentCategory = document.getElementById('category-select').value;
    state.currentCity = document.getElementById('city-select').value;
    state.offset = 0;
    loadEvents();
  });

  document.getElementById('reset-btn').addEventListener('click', () => {
    state.currentCategory = '';
    state.currentCity = '';
    state.offset = 0;
    document.getElementById('category-select').value = '';
    document.getElementById('city-select').value = '';
    loadEvents();
  });

  // Load more
  document.getElementById('load-more-btn').addEventListener('click', () => {
    state.offset += state.limit;
    loadEvents(true);
  });

  // Detail close
  document.getElementById('detail-close').addEventListener('click', closeDetail);
  document.getElementById('close-iframe-btn').addEventListener('click', () => {
    document.getElementById('iframe-section').hidden = true;
    clearIframe();
  });
  document.getElementById('detail-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDetail();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !document.getElementById('detail-overlay').hidden) closeDetail();
  });

  // Initial load
  loadEvents();
}

document.addEventListener('DOMContentLoaded', init);
