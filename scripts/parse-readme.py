#!/usr/bin/env python3
"""Parse chinese-independent-developer README.md files into structured JSON."""
import re, json
from pathlib import Path

STATUS_MAP = {k: ("active" if k == "white_check_mark" else ("closed" if k == "x" else "developing"))
              for k in ["white_check_mark","x","clock1","clock2","clock3","clock4","clock5","clock6","clock7","clock8","clock9","clock10","clock11","clock12"]}

def parse_author(line):
    text = line.lstrip("#").strip()
    gh = blog = city = None
    # Extract markdown links FIRST
    gh_m = re.search(r'\[(?:Github|GitHub|GITHUB)\]\((https?://github\.com/[^)]+)\)', text, re.I)
    if gh_m:
        gh = gh_m.group(1)
        text = text[:gh_m.start()] + text[gh_m.end():]
    bl_m = re.search(r'\[博客\]\((https?://[^)]+)\)', text)
    if bl_m:
        blog = bl_m.group(1)
        text = text[:bl_m.start()] + text[bl_m.end():]
    # Now extract (City) - only matches if NOT a URL inside parens
    # City is typically Chinese chars or short text, not a URL
    city_m = re.search(r'\(([^http][^)]{1,10})\)', text)
    if city_m:
        city = city_m.group(1).strip()
        text = text[:city_m.start()] + text[city_m.end():]
    # Clean name
    name = re.sub(r'\[[^\]]*\]\([^)]*\)', '', text).strip().strip("-").strip().rstrip(",").strip()
    return name or "?", gh, city, blog

def parse_readme(fp, src="main"):
    text = Path(fp).read_text(encoding="utf-8")
    projs = []
    cdate = cauthor = cgh = ccity = cblog = None
    for line in text.split("\n"):
        s = line.strip()
        dm = re.match(r"^###\s+(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*号", s)
        if dm:
            cdate = f"{dm.group(1)}-{int(dm.group(2)):02d}-{int(dm.group(3)):02d}"
            continue
        if s.startswith("#### "):
            cauthor, cgh, ccity, cblog = parse_author(s)
            continue
        if not s.startswith("*") or not cdate or not cauthor:
            continue
        em = re.match(r"^\*\s+:([a-z_0-9]+):\s+", s)
        if not em:
            continue
        rest = s[em.end():]
        pm = re.match(r'\[([^\]]+)\]\((https?://[^)]+)\)\s*[：:]\s*(.+?)(?:\s*-\s*\[(?:更多介绍|查看仓库)\]\(([^)]+)\))?\s*$', rest)
        if not pm or len(pm.group(3).strip()) < 3:
            continue
        projs.append({"name":pm.group(1).strip(),"url":pm.group(2).strip(),"description":pm.group(3).strip(),
                       "author":cauthor,"authorGithub":cgh,"authorCity":ccity,"authorBlog":cblog,
                       "moreUrl":pm.group(4),"status":STATUS_MAP.get(em.group(1),"active"),
                       "dateAdded":cdate,"source":src})
    return projs

def cat(d):
    d=d.lower()
    for c,ks in {"AI":["ai","gpt","claude","llm","deepseek","gemini","机器学习","人工智能","模型","大模型","智能"],
                 "开发者工具":["开发","api","cli","工具","tool","sdk","plugin","插件","chrome","扩展","extension","代码","code","部署"],
                 "内容创作":["视频","音频","音乐","图片","设计","design","video","audio","music","image","3d","动画","绘画"],
                 "效率工具":["笔记","待办","管理","日历","效率","todo","计时"],
                 "教育":["学习","教育","练习","单词","learn","课程"],
                 "SaaS":["saas","订阅","付费"],"数据分析":["数据","分析","统计","dashboard","analytics","可视化"],
                 "社交媒体":["社交","social","社区","论坛"],"写作":["写作","markdown","编辑器","blog","文档"],
                 "游戏":["游戏","game"]}.items():
        for k in ks:
            if k in d: return c
    return "其他"

base = Path("/home/z/my-project/chinese-independent-developer")
all_p = []
for fn,src in [("README.md","main"),("pages/README-Programmer-Edition.md","programmer"),("pages/README-Game.md","game"),("pages/README-2018-2020.md","archive")]:
    f = base/fn
    if f.exists():
        ps = parse_readme(str(f), src); all_p.extend(ps); print(f"{fn}: {len(ps)}")
seen=set(); u=[]
for p in all_p:
    k=(p["name"],p["url"])
    if k not in seen: seen.add(k); p["category"]=cat(p["description"]); u.append(p)
print(f"\nTotal: {len(u)}")
if u: print(f"Sample: author={u[0]['author']}, city={u[0]['authorCity']}, gh={u[0]['authorGithub']}")
Path("/home/z/my-project/scripts/parsed-projects.json").write_text(json.dumps(u,ensure_ascii=False,indent=2),encoding="utf-8")
print("Saved.")