#!/bin/bash
# MiMo Browser - Start Web Server
cd /mnt/c/Users/HP/Desktop/deepseek/super_intelligence_do_browsing
setsid python3 server.py </dev/null > /dev/null 2>&1 &
echo $!
