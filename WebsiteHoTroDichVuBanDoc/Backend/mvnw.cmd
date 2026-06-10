@echo off
setlocal enabledelayedexpansion

set "MVN_VERSION=3.9.9"
set "MVN_CACHE_DIR=%LOCALAPPDATA%\maven-wrapper"
set "MVN_DIST_DIR=%MVN_CACHE_DIR%\apache-maven-%MVN_VERSION%"
set "MVN_ZIP=%MVN_CACHE_DIR%\apache-maven-%MVN_VERSION%-bin.zip"
set "MVN_URL=https://archive.apache.org/dist/maven/maven-3/%MVN_VERSION%/binaries/apache-maven-%MVN_VERSION%-bin.zip"

where mvn >nul 2>nul
if %errorlevel% equ 0 (
  mvn %*
  exit /b %errorlevel%
)

if not exist "%JAVA_HOME%\bin\javac.exe" (
  for /f "delims=" %%i in ('powershell -NoProfile -Command "$jdk = Get-ChildItem \"$env:ProgramFiles\\Microsoft\" -Directory -Filter ''jdk-*'' ^| Sort-Object Name -Descending ^| Select-Object -First 1; if ($jdk) { $jdk.FullName }"') do set "JAVA_HOME=%%i"
)

if not exist "%JAVA_HOME%\bin\javac.exe" (
  if exist "%ProgramFiles%\Microsoft\jdk-17.0.19.10-hotspot\bin\javac.exe" set "JAVA_HOME=%ProgramFiles%\Microsoft\jdk-17.0.19.10-hotspot"
)

if defined JAVA_HOME (
  set "PATH=%JAVA_HOME%\bin;%PATH%"
)

if exist "%MVN_DIST_DIR%\bin\mvn.cmd" (
  call "%MVN_DIST_DIR%\bin\mvn.cmd" %*
  exit /b %errorlevel%
)

if not exist "%MVN_CACHE_DIR%" mkdir "%MVN_CACHE_DIR%" >nul 2>nul

echo Maven not found. Downloading Apache Maven %MVN_VERSION%...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ProgressPreference = 'SilentlyContinue';" ^
  "$zip = '%MVN_ZIP%';" ^
  "$url = '%MVN_URL%';" ^
  "Invoke-WebRequest -Uri $url -OutFile $zip;" ^
  "if (Test-Path '%MVN_DIST_DIR%') { Remove-Item -Recurse -Force '%MVN_DIST_DIR%' };" ^
  "Expand-Archive -Path $zip -DestinationPath '%MVN_CACHE_DIR%' -Force;"

if not exist "%MVN_DIST_DIR%\bin\mvn.cmd" (
  echo Failed to prepare Maven distribution.
  exit /b 1
)

call "%MVN_DIST_DIR%\bin\mvn.cmd" %*
exit /b %errorlevel%