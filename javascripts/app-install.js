/* 앱 설치 버튼과 "책 전체 저장" (2026-11-17, 2026-11-18 머리 버튼 추가)
   - 모든 페이지 머리 부분에 "앱 설치" 버튼을 둔다(앱으로 연 상태에서는 숨김)
   - 크롬·엣지·삼성 인터넷: 머리 버튼, 홈 버튼([data-install]), 안내 페이지 버튼이 설치 창을 바로 띄운다
   - 설치 창을 띄울 수 없는 브라우저(사파리, 파이어폭스 등): 안내 페이지(app/)로 보낸다
   - 안내 페이지: 지금 쓰는 브라우저의 방법을 맨 위로 올리고 표시한다 */
(function () {
  var deferred = null;
  var root = document.documentElement;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  function browser() {
    var ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) return 'ios';
    if (/SamsungBrowser/.test(ua)) return 'samsung';
    if (/Android/.test(ua) && /Firefox/.test(ua)) return 'firefox';
    if (/Android/.test(ua)) return 'android-chrome';
    if (/Firefox/.test(ua)) return 'firefox';
    if (/Macintosh/.test(ua) && /Safari/.test(ua) && !/Chrome|Chromium|Edg/.test(ua)) return 'mac-safari';
    if (/Chrome|Chromium|Edg/.test(ua)) return 'desktop-chrome';
    return 'other';
  }
  function appUrl() {
    var logo = document.querySelector('a.md-header__button.md-logo');
    return (logo ? logo.href : './').replace(/\/?$/, '/') + 'app/';
  }

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; root.classList.add('wh-can-install'); render(); });
  window.addEventListener('appinstalled', function () { deferred = null; standalone = true; root.classList.remove('wh-can-install'); root.classList.add('wh-installed'); render(); });

  function askInstall(ev) {
    if (!deferred) return false;
    if (ev) ev.preventDefault();
    deferred.prompt();
    deferred.userChoice.finally(function () { deferred = null; root.classList.remove('wh-can-install'); render(); });
    return true;
  }

  function el(id) { return document.getElementById(id); }
  function render() {
    var btn = el('app-install-btn'), msg = el('app-install-msg');
    if (!btn || !msg) return;
    if (standalone) { btn.hidden = true; msg.textContent = '지금 앱으로 보고 있어요. 설치가 끝났어요.'; return; }
    if (deferred) { btn.hidden = false; msg.textContent = '버튼을 누르면 홈 화면에 세계사 정주행 앱이 생겨요.'; return; }
    btn.hidden = true;
    msg.textContent = '이 브라우저는 설치 창을 바로 띄울 수 없어요. 아래에서 표시된 방법을 따라 해 주세요.';
  }

  function setup() {
    if (standalone) root.classList.add('wh-installed');

    // 1) 머리 부분 "앱 설치" 버튼
    var inner = document.querySelector('.md-header__inner');
    if (inner && !standalone && !inner.querySelector('.wh-install-btn')) {
      var b = document.createElement('a');
      b.className = 'wh-install-btn';
      b.href = appUrl();
      b.setAttribute('aria-label', '앱으로 설치');
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>앱 설치</span>';
      b.addEventListener('click', askInstall);
      inner.insertBefore(b, inner.querySelector('.md-search') || null);
    }

    // 2) 본문의 설치 버튼들([data-install], 안내 페이지 버튼)
    document.querySelectorAll('[data-install], #app-install-btn').forEach(function (a) {
      if (a.dataset.whBound) return;
      a.dataset.whBound = '1';
      a.addEventListener('click', askInstall);
    });
    render();

    // 3) 안내 페이지: 지금 쓰는 브라우저 방법을 맨 위로
    var guides = document.querySelector('.wh-guides');
    if (guides && !guides.dataset.whDone) {
      guides.dataset.whDone = '1';
      var mine = guides.querySelector('[data-guide~="' + browser() + '"]');
      if (mine) { mine.classList.add('is-mine'); guides.insertBefore(mine, guides.firstChild); }
    }

    // 4) 책 전체 저장
    var save = el('app-save-btn'), out = el('app-save-msg');
    if (save && !save.dataset.whBound) {
      save.dataset.whBound = '1';
      if (!('serviceWorker' in navigator)) { save.disabled = true; out.textContent = '이 브라우저는 저장 기능을 지원하지 않아요.'; return; }
      save.addEventListener('click', function () {
        save.disabled = true; out.textContent = '준비하는 중…';
        navigator.serviceWorker.ready.then(function (reg) {
          var ch = new MessageChannel();
          ch.port1.onmessage = function (ev) {
            var d = ev.data;
            if (d.type === 'progress') out.textContent = '저장하는 중… ' + d.done + ' / ' + d.total;
            if (d.type === 'done') { out.textContent = d.fail ? ('저장 완료. ' + (d.total - d.fail) + '쪽을 저장했고 ' + d.fail + '쪽은 실패했어요. 다시 누르면 이어서 받아요.') : ('저장 완료. ' + d.total + '쪽을 저장했어요. 이제 인터넷이 없어도 읽을 수 있어요.'); save.disabled = false; }
            if (d.type === 'error') { out.textContent = '저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.'; save.disabled = false; }
          };
          (reg.active || navigator.serviceWorker.controller).postMessage('save-all', [ch.port2]);
        });
      });
    }
  }
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(setup);
  else if (document.readyState !== 'loading') setup();
  else document.addEventListener('DOMContentLoaded', setup);
})();
