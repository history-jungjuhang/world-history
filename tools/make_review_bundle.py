#!/usr/bin/env python3
"""검수용 원고 묶음: book.yml 순서대로 부마다 페이지 원문을 이어 붙여 docs/review/*.txt로 만든다.
사이트에 그대로 올라가서 GPT 같은 외부 검수자가 주소 하나로 한 부를 통째로 읽을 수 있다.
배포 워크플로가 빌드 전에 실행한다(생성물은 git에 넣지 않는다)."""
import pathlib, yaml
root = pathlib.Path(__file__).resolve().parent.parent
out = root / 'docs/review'; out.mkdir(exist_ok=True)
book = yaml.safe_load((root / 'book.yml').read_text(encoding='utf-8'))
index = ['세계사 정주행 검수용 원고 묶음 (부마다 파일 하나, 페이지는 "<<<<< FILE: 경로 >>>>>" 줄로 나뉨)', '']
for part in book['parts']:
    pd = 'appendix' if part['id'] == 'A' else f"part{part['id']}"
    files = [f"{pd}/{p['slug']}.md" for p in part.get('flat', [])]
    for ch in part.get('chapters', []):
        for se in ch['sections']:
            files += [f"{pd}/ch{ch['num']:02d}/{p['slug']}.md" for p in se['pages'] if p['done']]
    txt = f"# 검수 묶음: {part['title']} ({len(files)}페이지)\n"
    for f in files:
        p = root / 'docs' / f
        if p.exists(): txt += f"\n\n<<<<< FILE: docs/{f} >>>>>\n\n" + p.read_text(encoding='utf-8')
    name = f"{pd}.txt"
    (out / name).write_text(txt, encoding='utf-8')
    index.append(f"{name}  {part['title']}  ({len(files)}페이지)")
(out / 'index.txt').write_text('\n'.join(index) + '\n', encoding='utf-8')
print('ok', len(book['parts']))
