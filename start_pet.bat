@echo off
chcp 65001 >nul
echo 🐱 启动AI分身桌面宠物...
cd /d "%~dp0"
python aifenshen_pet.py
pause
