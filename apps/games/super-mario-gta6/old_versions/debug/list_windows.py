"""List windows via xwininfo"""
import subprocess
result = subprocess.run(['xwininfo', '-root', '-tree'], capture_output=True, text=True, timeout=10)
lines = result.stdout.split('\n')
for line in lines[:50]:
    print(line)
print("---STDERR---")
print(result.stderr[:500])
print("---RC:", result.returncode)
