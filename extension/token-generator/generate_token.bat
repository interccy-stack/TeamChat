@echo off
chcp 65001 >nul
title AI PRO Token Generator

echo.
echo ╔══════════════════════════════════════════╗
echo ║     🤖 AI PRO Token 生成器 v1.0         ║
echo ╚══════════════════════════════════════════╝
echo.

cd /d "%~dp0"
python generate_token.py --copy
pause