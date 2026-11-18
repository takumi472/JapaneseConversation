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

function speakText(text, btnEl) {
  if (!('speechSynthesis' in window)) return;

  const isSame = currentButton === btnEl && window.speechSynthesis.speaking;
  window.speechSynthesis.cancel();
  if (currentButton) {
    currentButton.classList.remove('playing');
    currentButton = null;
  }
  if (isSame) return;

  const utter = new SpeechSynthesisUtterance(text);
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

  let datePart = '';
  if (year && month) {
    datePart = `${year}ねん${month}がつに きました。`;
  } else if (year) {
    datePart = `${year}ねんに きました。`;
  } else if (month) {
    datePart = `${month}がつに きました。`;
  } else {
    datePart = 'きました。';
  }

  parts.push(origin + datePart);
  parts.push('よろしくおねがいします。');

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

// 3D Book Page-Turn Transition
document.addEventListener('DOMContentLoaded', () => {
  const main = document.querySelector('main.container');
  if (!main) return;

  const dir = sessionStorage.getItem('pageTurnDir');
  if (dir === 'prev') {
    main.classList.add('enter-prev');
  }
  sessionStorage.removeItem('pageTurnDir');

  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('http') || link.target === '_blank' || link.classList.contains('disabled')) {
      return;
    }

    link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();

      const isPrev = link.classList.contains('nav-prev') || href.includes('index.html') || href.includes('toc.html');
      const turnDir = isPrev && !link.closest('.cover-box') ? 'prev' : 'next';
      sessionStorage.setItem('pageTurnDir', turnDir);

      main.classList.remove('enter-prev');
      main.classList.add(turnDir === 'prev' ? 'exit-prev' : 'exit-next');

      setTimeout(() => {
        window.location.href = link.href;
      }, 220);
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
