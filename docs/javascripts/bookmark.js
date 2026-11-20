/* 자동 책갈피 (2026-11-20 사용자 요청)
   - 주제 페이지를 읽는 동안 어디까지 내려갔는지 이 기기에 저장한다(localStorage, 기기마다 따로)
   - 홈: "이어 읽기" 카드(마지막으로 읽던 페이지, 2026-11-25 퍼센트·진행 막대는 헷갈려서 뺌)와 읽은 페이지 수
   - 읽다 만 페이지를 다시 열면 "이어서 읽기" 안내
   - 끝까지(90%) 읽은 페이지는 차례 목록과 왼쪽 메뉴에 ✓ */
(function () {
  var K_LAST = 'wh-last', K_POS = 'wh-pos', K_READ = 'wh-read';
  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function norm(p) { return decodeURI(p).replace(/index\.html$/, '').replace(/\/?$/, '/'); }
  function ratioNow() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 1;
  }
  function scrollToRatio(r) {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({top: Math.round(max * r), behavior: 'auto'});
  }
  function ago(t) {
    var m = Math.round((Date.now() - t) / 60000);
    if (m < 2) return '방금 전'; if (m < 60) return m + '분 전';
    var h = Math.round(m / 60); if (h < 24) return h + '시간 전';
    return Math.round(h / 24) + '일 전';
  }

  var current = null, timer = null, moved = false;

  function flush() {
    if (!current || !moved) return;
    var r = ratioNow(), pos = load(K_POS, {}), read = load(K_READ, {});
    pos[current.path] = r; save(K_POS, pos);
    if (r >= 0.9 && !read[current.path]) { read[current.path] = Date.now(); save(K_READ, read); }
    save(K_LAST, {path: current.path, title: current.title, meta: current.meta, r: r, t: Date.now()});
  }
  function onScroll() {
    if (!current) return;
    moved = true;
    if (timer) return;
    timer = setTimeout(function () { timer = null; flush(); }, 600);
  }

  function toast(r) {
    var old = document.querySelector('.wh-resume'); if (old) old.remove();
    var d = document.createElement('div');
    d.className = 'wh-resume';
    d.innerHTML = '<span>지난번에 읽다 멈춘 페이지예요</span><button type="button" class="wh-resume-go">읽던 곳으로</button><button type="button" class="wh-resume-x" aria-label="닫기">×</button>';
    document.body.appendChild(d);
    d.querySelector('.wh-resume-go').onclick = function () { scrollToRatio(r); d.remove(); };
    d.querySelector('.wh-resume-x').onclick = function () { d.remove(); };
    setTimeout(function () { if (d.isConnected) d.classList.add('is-fading'); }, 9000);
    setTimeout(function () { if (d.isConnected) d.remove(); }, 9600);
  }

  function markLists() {
    var read = load(K_READ, {}), pos = load(K_POS, {});
    document.querySelectorAll('.md-typeset .ep-list a, .md-nav__link[href]').forEach(function (a) {
      var p = norm(new URL(a.href, location.href).pathname);
      a.classList.toggle('wh-is-read', !!read[p]);
      a.classList.toggle('wh-is-reading', !read[p] && pos[p] > 0.05);
    });
  }

  function homeCard() {
    var hero = document.querySelector('.md-typeset .hero');
    if (!hero || document.querySelector('.wh-continue')) return;
    var last = load(K_LAST, null), read = load(K_READ, {});
    var n = Object.keys(read).length;
    if (!last) return;
    var c = document.createElement('div');
    c.className = 'wh-continue';
    var done = last.r >= 0.9;
    c.innerHTML = '<p class="wh-continue-kicker">' + (done ? '지난번에 다 읽은 페이지' : '지난번에 읽던 곳') + ' · ' + ago(last.t) + (n ? ' · 다 읽은 페이지 ' + n + '쪽' : '') + '</p>' +
      '<p class="wh-continue-title"></p>' +
      '<a class="md-button md-button--primary wh-continue-go"></a>';
    c.querySelector('.wh-continue-title').textContent = (last.meta ? last.meta + ' · ' : '') + last.title;
    var go = c.querySelector('.wh-continue-go');
    go.textContent = done ? '이 페이지 다시 보기' : '이어 읽기';
    go.href = last.path + (done ? '' : '#wh-resume');
    hero.parentNode.insertBefore(c, hero);
  }

  function setup() {
    current = null; moved = false;
    var content = document.querySelector('.md-content .md-typeset');
    var isTopic = content && content.querySelector('.ep-meta') && !content.querySelector('.hero');
    if (isTopic) {
      var h1 = content.querySelector('h1'), meta = content.querySelector('.ep-meta span');
      current = {path: norm(location.pathname), title: h1 ? h1.textContent.replace('¶', '').trim() : document.title, meta: meta ? meta.textContent.trim() : ''};
      var saved = load(K_POS, {})[current.path];
      if (location.hash === '#wh-resume') {
        history.replaceState(null, '', location.pathname);
        if (saved) setTimeout(function () { scrollToRatio(saved); }, 150);
      } else if (!location.hash && saved > 0.05 && saved < 0.9) {
        setTimeout(function () { if (window.scrollY < 50) toast(saved); }, 400);
      }
    }
    homeCard();
    markLists();
  }
  window.addEventListener('scroll', onScroll, {passive: true});
  function flushNow() { if (timer) { clearTimeout(timer); timer = null; } flush(); }
  window.addEventListener('pagehide', flushNow);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flushNow(); });
  if (window.document$ && window.document$.subscribe) window.document$.subscribe(setup);
  else if (document.readyState !== 'loading') setup();
  else document.addEventListener('DOMContentLoaded', setup);
})();
