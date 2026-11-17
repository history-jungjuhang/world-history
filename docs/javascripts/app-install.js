/* 앱 설치 버튼과 "책 전체 저장" (2026-11-17)
   - 크롬·엣지·삼성 인터넷: 브라우저가 주는 설치 창을 버튼으로 띄운다
   - 아이폰·아이패드(사파리): 설치 창이 없어서 "공유 → 홈 화면에 추가" 안내를 보여 준다
   - 이미 앱으로 열었으면 "설치됨"을 보여 준다 */
(function () {
  var deferred = null;
  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var ua = navigator.userAgent;
  var ios = /iPhone|iPad|iPod/.test(ua) || (ua.indexOf('Macintosh') > -1 && 'ontouchend' in document);

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; render(); });
  window.addEventListener('appinstalled', function () { deferred = null; standalone = true; render(); });

  function el(id) { return document.getElementById(id); }
  function render() {
    var btn = el('app-install-btn'), msg = el('app-install-msg');
    if (!btn || !msg) return;
    if (standalone) { btn.hidden = true; msg.textContent = '지금 앱으로 보고 있어요. 설치가 끝났어요.'; return; }
    if (deferred) { btn.hidden = false; msg.textContent = '버튼을 누르면 홈 화면에 세계사 정주행 앱이 생겨요.'; return; }
    btn.hidden = true;
    msg.textContent = ios
      ? '아이폰·아이패드는 사파리 아래쪽의 공유 버튼(네모에 화살표)을 누르고 "홈 화면에 추가"를 고르세요.'
      : '설치 버튼이 안 보이면 브라우저 메뉴(⋮)에서 "앱 설치" 또는 "홈 화면에 추가"를 고르세요. 이미 설치했다면 홈 화면의 아이콘으로 여세요.';
  }

  function setup() {
    render();
    var btn = el('app-install-btn');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        if (!deferred) return;
        deferred.prompt();
        deferred.userChoice.finally(function () { deferred = null; render(); });
      });
    }
    var save = el('app-save-btn'), out = el('app-save-msg');
    if (save && !save.dataset.bound) {
      save.dataset.bound = '1';
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
          reg.active.postMessage('save-all', [ch.port2]);
        });
      });
    }
  }
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(setup);
  else if (document.readyState !== 'loading') setup();
  else document.addEventListener('DOMContentLoaded', setup);
})();
