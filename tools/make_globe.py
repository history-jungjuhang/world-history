#!/usr/bin/env python3
"""세계사 정주행 마스코트 '지구본' SVG를 만든다(원작 캐릭터, 2026-11-11).
표정: 눈 open|wide|happy + 입 smile|o|grin. 결과는 docs/assets/globe*.svg."""
import pathlib
OUT = pathlib.Path(__file__).resolve().parent.parent / 'docs/assets'
INK = '#242424'
def svg(eyes='open', mouth='smile'):
    E = {
     'open': f'<ellipse cx="118" cy="168" rx="17" ry="22" fill="{INK}"/><ellipse cx="202" cy="168" rx="17" ry="22" fill="{INK}"/><circle cx="124" cy="160" r="7" fill="#fff"/><circle cx="208" cy="160" r="7" fill="#fff"/>',
     'wide': f'<ellipse cx="118" cy="164" rx="23" ry="28" fill="{INK}"/><ellipse cx="202" cy="164" rx="23" ry="28" fill="{INK}"/><circle cx="126" cy="154" r="9" fill="#fff"/><circle cx="210" cy="154" r="9" fill="#fff"/><circle cx="112" cy="176" r="4" fill="#fff"/><circle cx="196" cy="176" r="4" fill="#fff"/>',
     'happy': f'<g fill="none" stroke="{INK}" stroke-width="11"><path d="M98 176 Q118 146 138 176"/><path d="M182 176 Q202 146 222 176"/></g>'}[eyes]
    M = {
     'smile': f'<path d="M140 204 Q160 224 180 204" fill="none" stroke="{INK}" stroke-width="9"/>',
     'o': f'<ellipse cx="160" cy="214" rx="12" ry="15" fill="#7a2a1c" stroke="{INK}" stroke-width="7"/>',
     'grin': f'<path d="M128 198 Q160 252 192 198Z" fill="#7a2a1c" stroke="{INK}" stroke-width="8"/><path d="M144 228 Q160 214 176 228 Q160 242 144 228Z" fill="#ff9c8a"/>'}[mouth]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 380" stroke-linecap="round" stroke-linejoin="round">
  <ellipse cx="160" cy="364" rx="90" ry="10" fill="#000" opacity=".12"/>
  <!-- 받침대 -->
  <path d="M160 300 L160 336" stroke="{INK}" stroke-width="14"/>
  <path d="M104 352 Q160 322 216 352 Z" fill="#1f3a5f" stroke="{INK}" stroke-width="10"/>
  <path d="M42 112 A132 132 0 0 0 214 296" fill="none" stroke="#c9a36b" stroke-width="16"/>
  <!-- 공 -->
  <circle cx="160" cy="176" r="118" fill="#5b8cc9" stroke="{INK}" stroke-width="11"/>
  <clipPath id="ball"><circle cx="160" cy="176" r="112"/></clipPath>
  <g clip-path="url(#ball)">
    <path d="M60 70 C90 52 128 66 120 98 C112 124 74 120 70 146 C66 170 38 168 36 140 C34 110 40 84 60 70Z" fill="#d9744d"/>
    <path d="M212 70 C246 64 284 90 282 122 C280 150 252 140 240 160 C228 182 196 168 198 140 C200 112 186 76 212 70Z" fill="#d9744d"/>
    <path d="M196 262 C220 248 256 256 262 280 C268 302 226 306 210 300 C192 294 180 274 196 262Z" fill="#d9744d"/>
    <path d="M58 250 C76 240 98 252 92 270 C86 286 62 284 54 272 C48 262 50 254 58 250Z" fill="#d9744d"/>
    <ellipse cx="160" cy="176" rx="56" ry="112" fill="none" stroke="#fff" stroke-width="3" opacity=".35"/>
    <path d="M48 176 H272" stroke="#fff" stroke-width="3" opacity=".35"/>
  </g>
  <path d="M86 92 C104 72 128 64 150 62" fill="none" stroke="#fff" stroke-width="10" opacity=".55"/>
  <!-- 볼 -->
  <ellipse cx="88" cy="204" rx="20" ry="13" fill="#ff9c8a" opacity=".9"/>
  <ellipse cx="232" cy="204" rx="20" ry="13" fill="#ff9c8a" opacity=".9"/>
  <!-- 얼굴 -->
  {E}
  {M}
</svg>
'''
OUT.mkdir(parents=True, exist_ok=True)
for name, e, m in [('globe', 'open', 'grin'), ('globe-logo', 'happy', 'smile'), ('globe-grin', 'happy', 'grin'), ('globe-smile', 'open', 'smile'), ('globe-wow', 'wide', 'o')]:
    (OUT / f'{name}.svg').write_text(svg(e, m), encoding='utf-8')
print('ok')
