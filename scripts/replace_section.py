import json

content = open('/home/z/my-project/src/components/bitcoin/bitcoin-core.tsx', 'r').read()
lines = content.split('\n')

start_idx = None
for i, line in enumerate(lines):
    if '// WITHDRAW TO CUSTODY' in line:
        start_idx = i - 1
        break

end_idx = None
for i, line in enumerate(lines):
    if '// KEY AUDIT' in line:
        end_idx = i - 1
        break

print(f"Removing lines {start_idx+1} to {end_idx+1} ({end_idx - start_idx} lines)")

saques_content = open('/home/z/my-project/scripts/saques_tab.tsx', 'r').read()

new_lines = lines[:start_idx] + [saques_content] + lines[end_idx:]
open('/home/z/my-project/src/components/bitcoin/bitcoin-core.tsx', 'w').write('\n'.join(new_lines))
print(f'OK: inserted SaquesTab ({len(new_lines)} total lines)')