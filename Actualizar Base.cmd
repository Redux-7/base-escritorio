@echo off
title Actualizar Base
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $w=New-Object Net.WebClient; $w.Encoding=[Text.Encoding]::UTF8; iex ($w.DownloadString('https://raw.githubusercontent.com/Redux-7/base-escritorio/main/actualizar.ps1?t='+[DateTime]::Now.Ticks))"
if errorlevel 1 pause
