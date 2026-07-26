#!/usr/bin/env python3
c = open("/home/z/my-project/src/app/page.tsx").read()
lines = c.split("\n")
for i, line in enumerate(lines):
    if "Navegador" in line:
        s = max(0, i-5)
        e = min(len(lines), i+6)
        for j in range(s, e):
            marker = ">>>" if j == i else "   "
            print(f"{marker} L{j+1}: {lines[j]}")
        print("===")