"""List ALL X windows including override-redirect"""
import subprocess
# xwininfo -root -tree only shows managed windows
# Use xdotool or xprop to find all
result = subprocess.run(['xprop', '-root', '_NET_CLIENT_LIST'], capture_output=True, text=True, timeout=5)
print("_NET_CLIENT_LIST:", result.stdout.strip())

result2 = subprocess.run(['xprop', '-root', '_WIN_CLIENT_LIST'], capture_output=True, text=True, timeout=5)
print("_WIN_CLIENT_LIST:", result2.stdout.strip())

# Try listing all windows
result3 = subprocess.run(['xlsclients'], capture_output=True, text=True, timeout=5)
print("\nxlsclients:")
print(result3.stdout[:1000])
print("stderr:", result3.stderr[:200])
