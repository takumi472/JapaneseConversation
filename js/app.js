let currentAudio = null;
let currentButton = null;

function playJP(num, btnEl) {
  const audio = document.getElementById('jp' + num);
  if (!audio) return;

  // If clicking the same playing button, pause/reset it
  if (currentAudio === audio && !audio.paused) {
    audio.pause();
    audio.currentTime = 0;
    if (currentButton) currentButton.classList.remove('playing');
    currentAudio = null;
    currentButton = null;
    return;
  }

  // Stop any previously playing audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (currentButton) {
    currentButton.classList.remove('playing');
  }

  currentAudio = audio;
  currentButton = btnEl || null;
  if (currentButton) {
    currentButton.classList.add('playing');
  }

  audio.onended = () => {
    if (currentButton) currentButton.classList.remove('playing');
    currentAudio = null;
    currentButton = null;
  };

  audio.playbackRate = localStorage.getItem('kaiwa1_slow') === '1' ? 0.78 : 1.0;
  audio.play();
}

const MONTH_READINGS = {
  1: 'いちがつ',
  2: 'にがつ',
  3: 'さんがつ',
  4: 'しがつ',
  5: 'ごがつ',
  6: 'ろくがつ',
  7: 'しちがつ',
  8: 'はちがつ',
  9: 'くがつ',
  10: 'じゅうがつ',
  11: 'じゅういちがつ',
  12: 'じゅうにがつ',
};

function toHalfWidthDigits(str) {
  return String(str).replace(/[０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
}

function formatMonthReading(rawMonth) {
  const normalized = toHalfWidthDigits(rawMonth).trim().replace(/(?:月|がつ)$/, '');
  if (/^\d+$/.test(normalized)) {
    const num = Number(normalized);
    if (MONTH_READINGS[num]) return MONTH_READINGS[num];
  }
  const trimmed = rawMonth.trim();
  return /(?:月|がつ)$/.test(trimmed) ? trimmed : `${trimmed}がつ`;
}

function normalizeSpeechText(text) {
  return toHalfWidthDigits(text).replace(
    /(^|[^\d])(1[0-2]|[1-9])(?:月|がつ)/g,
    (match, prefix, numStr) => {
      const reading = MONTH_READINGS[Number(numStr)];
      return reading ? `${prefix}${reading}` : match;
    }
  );
}

function speakText(text, btnEl) {
  if (!('speechSynthesis' in window)) return;

  const isSame = currentButton === btnEl && window.speechSynthesis.speaking;
  window.speechSynthesis.cancel();
  if (currentButton) {
    currentButton.classList.remove('playing');
    currentButton = null;
  }
  if (isSame) return;

  const utter = new SpeechSynthesisUtterance(normalizeSpeechText(text));
  utter.lang = 'ja-JP';
  utter.rate = localStorage.getItem('kaiwa1_slow') === '1' ? 0.72 : 0.95;

  const voices = window.speechSynthesis.getVoices();
  const jaVoice = voices.find((v) => v.lang && v.lang.startsWith('ja'));
  if (jaVoice) utter.voice = jaVoice;

  currentButton = btnEl || null;
  if (currentButton) currentButton.classList.add('playing');

  utter.onend = () => {
    if (currentButton) currentButton.classList.remove('playing');
    currentButton = null;
  };
  utter.onerror = () => {
    if (currentButton) currentButton.classList.remove('playing');
    currentButton = null;
  };

  window.speechSynthesis.speak(utter);
}

function speakSummary(btnEl) {
  const name = (document.getElementById('summary-name')?.value || '').trim();
  const country = (document.getElementById('summary-country')?.value || '').trim();
  const city = (document.getElementById('summary-city')?.value || '').trim();
  const year = (document.getElementById('summary-year')?.value || '').trim();
  const month = (document.getElementById('summary-month')?.value || '').trim();

  const parts = [];
  parts.push(`わたしは、${name || 'まるまる'}です。`);

  let origin = '';
  if (country && city) {
    origin = `${country}の${city}から、`;
  } else if (country) {
    origin = `${country}から、`;
  } else if (city) {
    origin = `${city}から、`;
  }

  const normalizedYear = toHalfWidthDigits(year).replace(/(?:年|ねん)$/, '');
  const monthReading = month ? formatMonthReading(month) : '';

  let datePart = '';
  if (normalizedYear && monthReading) {
    datePart = `${normalizedYear}ねん${monthReading}に きました。`;
  } else if (normalizedYear) {
    datePart = `${normalizedYear}ねんに きました。`;
  } else if (monthReading) {
    datePart = `${monthReading}に きました。`;
  } else {
    datePart = 'きました。';
  }

  parts.push(origin + datePart);
  parts.push('よろしくおねがいします。');

  speakText(parts.join(' '), btnEl);
}

function speakPracticeP3(btnEl) {
  const nameA = (document.getElementById('p3-name-a')?.value || '').trim() || 'まるまる';
  const nameBCall = (document.getElementById('p3-name-b-call')?.value || '').trim() || nameA;
  const nameB = (document.getElementById('p3-name-b')?.value || '').trim() || 'まるまる';

  const text = `はじめまして。${nameA}といいます。${nameBCall}さんですね。わたしは、${nameB}といいます。よろしくおねがいします。`;
  speakText(text, btnEl);
}

function speakPracticeP4(btnEl) {
  const req1 = (document.getElementById('p4-req-1')?.value || '').trim();
  const req2 = (document.getElementById('p4-req-2')?.value || '').trim();

  const parts = [];
  if (req1 || !req2) {
    parts.push(`すみません。${req1 || 'まるまる'}してください。`);
  }
  if (req2 || !req1) {
    parts.push(`${req2 || 'まるまる'}できますか？`);
  }

  speakText(parts.join(' '), btnEl);
}

function speakPracticeP7(btnEl) {
  const food1 = (document.getElementById('p7-food-1')?.value || '').trim();
  const food2 = (document.getElementById('p7-food-2')?.value || '').trim();

  const parts = [];
  if (food1 || !food2) {
    parts.push(`しゅうきょうじょう、${food1 || 'まるまる'}はたべれません。`);
  }
  if (food2 || !food1) {
    parts.push(`わたしはアレルギーがあるので、${food2 || 'まるまる'}はたべれません。`);
  }

  speakText(parts.join(' '), btnEl);
}

function speakPracticeP12(btnEl) {
  const item1 = (document.getElementById('p12-item-1')?.value || '').trim();
  const action2 = (document.getElementById('p12-action-2')?.value || '').trim();

  const parts = [];
  if (item1 || !action2) {
    parts.push(`${item1 || 'まるまる'}をつけてもいいですか？`);
  }
  if (action2 || !item1) {
    parts.push(`${action2 || 'まるまるして'}もいいですか？`);
  }

  speakText(parts.join(' '), btnEl);
}

function speakPracticeP13(btnEl) {
  const typeText = (document.getElementById('p13-type')?.value || 'きゅうきゅうしゃを おねがいします').trim();
  const address = (document.getElementById('p13-address')?.value || '').trim();
  const name = (document.getElementById('p13-name')?.value || '').trim();
  const phone = (document.getElementById('p13-phone')?.value || '').trim();

  const parts = [`${typeText}。`];
  parts.push(`ばしょは、${address || 'まるまる'}です。`);
  if (name) {
    parts.push(`わたしのなまえは、${name}です。`);
  }
  if (phone) {
    parts.push(`でんわばんごうは、${phone}です。`);
  }

  speakText(parts.join(' '), btnEl);
}

const PEOPLE_READINGS = {
  1: 'ひとり',
  2: 'ふたり',
  3: 'さんにん',
  4: 'よにん',
  5: 'ごにん',
  6: 'ろくにん',
  7: 'ななにん',
  8: 'はちにん',
  9: 'きゅうにん',
  10: 'じゅうにん',
};

function formatPeopleReading(rawCount) {
  const normalized = toHalfWidthDigits(rawCount).trim().replace(/(?:人|にん)$/, '');
  if (/^\d+$/.test(normalized)) {
    const num = Number(normalized);
    if (PEOPLE_READINGS[num]) return PEOPLE_READINGS[num];
    return `${num}にん`;
  }
  const trimmed = rawCount.trim();
  return /(?:人|にん|ひとり|ふたり)$/.test(trimmed) ? trimmed : `${trimmed}にん`;
}

function speakPracticeP15(btnEl) {
  const total = (document.getElementById('p15-total')?.value || '').trim();
  const japan = (document.getElementById('p15-japan')?.value || '').trim();
  const members = (document.getElementById('p15-members')?.value || '').trim();

  const parts = [];
  if (total || (!japan && !members)) {
    parts.push(`かぞくは、${total ? formatPeopleReading(total) : 'まるにん'}です。`);
  }
  if (japan || (!total && !members)) {
    parts.push(`にほんでいっしょにすんでいるのは、${japan ? formatPeopleReading(japan) : 'まるにん'}です。`);
  }
  if (members) {
    parts.push(`わたしのかぞくは、${members}です。`);
  }

  speakText(parts.join(' '), btnEl);
}

function speakPracticeP16(btnEl) {
  const hobby1 = (document.getElementById('p16-hobby-1')?.value || '').trim();
  const hobby2 = (document.getElementById('p16-hobby-2')?.value || '').trim();

  const parts = [];
  if (hobby1 || !hobby2) {
    parts.push(`わたしのしゅみは、${hobby1 || 'まるまる'}です。`);
  }
  if (hobby2 || !hobby1) {
    parts.push(`${hobby2 || 'まるまる'}することがすきです。`);
  }

  speakText(parts.join(' '), btnEl);
}

function speakPracticeP17(btnEl) {
  const item1 = (document.getElementById('p17-item-1')?.value || '').trim();
  const qty1 = (document.getElementById('p17-qty-1')?.value || '').trim();
  const item2 = (document.getElementById('p17-item-2')?.value || '').trim();
  const qty2 = (document.getElementById('p17-qty-2')?.value || '').trim();
  const yenRaw = (document.getElementById('p17-yen')?.value || '').trim();

  const orders = [];
  if (item1) {
    orders.push(`${item1}を${qty1 ? ` ${qty1}` : ''}`);
  }
  if (item2) {
    orders.push(`${item2}を${qty2 ? ` ${qty2}` : ''}`);
  }

  const parts = [];
  if (orders.length > 0) {
    parts.push(`${orders.join(' と、')} ください。`);
  } else {
    parts.push('これを ください。');
  }

  if (yenRaw) {
    const normalizedYen = toHalfWidthDigits(yenRaw).replace(/(?:円|えん)$/, '');
    parts.push(`では、${normalizedYen}えんで おねがいします。`);
  }

  speakText(parts.join(' '), btnEl);
}

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === 'ArrowLeft') {
    const prevLink = document.querySelector('a.nav-prev:not(.disabled)');
    if (prevLink) prevLink.click();
  } else if (e.key === 'ArrowRight') {
    const nextLink = document.querySelector('a.nav-next:not(.disabled)');
    if (nextLink) nextLink.click();
  }
});

// Realistic 3D Book Page-Turn Transition
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    const main = document.querySelector('main.container');
    if (main) {
      main.classList.remove('exit-next', 'exit-prev', 'enter-prev');
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main.container');
  if (!main) return;

  const dir = sessionStorage.getItem('pageTurnDir');
  if (dir === 'prev') {
    main.classList.add('enter-prev');
  }
  sessionStorage.removeItem('pageTurnDir');

  let isNavigating = false;

  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || link.target === '_blank' || link.classList.contains('disabled')) {
      return;
    }

    link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || isNavigating) return;
      e.preventDefault();
      isNavigating = true;

      const isPrev = link.classList.contains('nav-prev') || href.includes('index.html') || href.includes('toc.html');
      const turnDir = isPrev && !link.closest('.cover-box') ? 'prev' : 'next';
      sessionStorage.setItem('pageTurnDir', turnDir);

      main.classList.remove('enter-prev');
      main.classList.add(turnDir === 'prev' ? 'exit-prev' : 'exit-next');

      const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 340;
      setTimeout(() => {
        window.location.href = link.href;
      }, delay);
    });
  });

  // Accessibility Controls (Font Size, High Contrast, Slow Audio)
  const applyFont = (size) => {
    document.documentElement.classList.remove('font-lg', 'font-xl');
    if (size === 'lg') document.documentElement.classList.add('font-lg');
    if (size === 'xl') document.documentElement.classList.add('font-xl');
  };
  applyFont(localStorage.getItem('kaiwa1_font') || 'normal');

  if (localStorage.getItem('kaiwa1_contrast') === '1') {
    document.body.classList.add('high-contrast');
  }

  const topInner = document.querySelector('.top-bar-inner');
  if (topInner) {
    const bar = document.createElement('div');
    bar.className = 'a11y-bar';
    bar.setAttribute('aria-label', '表示と音声の設定');

    const fontBtn = document.createElement('button');
    fontBtn.type = 'button';
    fontBtn.className = 'a11y-btn';
    const fontLabels = { normal: '文字: 標準', lg: '文字: 大', xl: '文字: 特大' };
    const updateFontBtn = () => {
      const cur = localStorage.getItem('kaiwa1_font') || 'normal';
      fontBtn.textContent = fontLabels[cur] || '文字: 標準';
      fontBtn.classList.toggle('active', cur !== 'normal');
    };
    updateFontBtn();
    fontBtn.onclick = () => {
      const order = ['normal', 'lg', 'xl'];
      const cur = localStorage.getItem('kaiwa1_font') || 'normal';
      const next = order[(order.indexOf(cur) + 1) % order.length];
      localStorage.setItem('kaiwa1_font', next);
      applyFont(next);
      updateFontBtn();
    };

    const contrastBtn = document.createElement('button');
    contrastBtn.type = 'button';
    contrastBtn.className = 'a11y-btn';
    const updateContrastBtn = () => {
      const on = document.body.classList.contains('high-contrast');
      contrastBtn.textContent = '🌓 くっきり';
      contrastBtn.classList.toggle('active', on);
      contrastBtn.setAttribute('aria-pressed', String(on));
    };
    updateContrastBtn();
    contrastBtn.onclick = () => {
      const on = document.body.classList.toggle('high-contrast');
      localStorage.setItem('kaiwa1_contrast', on ? '1' : '0');
      updateContrastBtn();
    };

    const slowBtn = document.createElement('button');
    slowBtn.type = 'button';
    slowBtn.className = 'a11y-btn';
    const updateSlowBtn = () => {
      const on = localStorage.getItem('kaiwa1_slow') === '1';
      slowBtn.textContent = on ? '🐢 ゆっくり: ON' : '🐢 ゆっくり';
      slowBtn.classList.toggle('active', on);
      slowBtn.setAttribute('aria-pressed', String(on));
    };
    updateSlowBtn();
    slowBtn.onclick = () => {
      const on = localStorage.getItem('kaiwa1_slow') === '1';
      localStorage.setItem('kaiwa1_slow', on ? '0' : '1');
      updateSlowBtn();
    };

    bar.append(fontBtn, contrastBtn, slowBtn);
    const navLinks = topInner.querySelector('.top-nav-links');
    if (navLinks) {
      topInner.insertBefore(bar, navLinks);
    } else {
      topInner.appendChild(bar);
    }
  }
});
