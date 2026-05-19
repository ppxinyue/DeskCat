const { execFile } = require('node:child_process');

const EMPTY_ACTIVE_WINDOW = {
  supported: true,
  appName: '',
  windowTitle: '',
  url: '',
  error: null,
};

function windowsPowerShellUtf8Prelude() {
  return `
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = $utf8NoBom
$OutputEncoding = $utf8NoBom
$ErrorActionPreference = 'Stop'
`;
}

function windowsActiveWindowScript() {
  return `${windowsPowerShellUtf8Prelude()}
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class DeskCatForegroundWindow {
  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();

  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

  [DllImport("user32.dll")]
  public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
}
"@

$hwnd = [DeskCatForegroundWindow]::GetForegroundWindow()
if ($hwnd -eq [IntPtr]::Zero) {
  [pscustomobject]@{ appName = ""; windowTitle = ""; processId = 0; path = "" } | ConvertTo-Json -Compress
  exit 0
}

$titleBuilder = New-Object System.Text.StringBuilder 1024
[void][DeskCatForegroundWindow]::GetWindowText($hwnd, $titleBuilder, $titleBuilder.Capacity)

$processId = 0
[void][DeskCatForegroundWindow]::GetWindowThreadProcessId($hwnd, [ref]$processId)

$processName = ""
$processPath = ""
try {
  $process = Get-Process -Id $processId -ErrorAction Stop
  $processName = $process.ProcessName
  try {
    $processPath = $process.MainModule.FileName
  } catch {
    $processPath = ""
  }
} catch {
  $processName = ""
}

$url = ""
$browserNames = @("chrome", "msedge", "firefox", "brave", "opera", "vivaldi")
if ($browserNames -contains $processName.ToLowerInvariant()) {
  try {
    Add-Type -AssemblyName UIAutomationClient
    $root = [System.Windows.Automation.AutomationElement]::FromHandle($hwnd)
    if ($null -ne $root) {
      $editCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Edit
      )
      $edits = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $editCondition)
      foreach ($edit in $edits) {
        $valuePattern = $null
        if ($edit.TryGetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern, [ref]$valuePattern)) {
          $candidate = [string]$valuePattern.Current.Value
          if ($candidate -match '^(https?://|[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})(/|$)') {
            $url = $candidate
            break
          }
        }
      }
    }
  } catch {
    $url = ""
  }
}

[pscustomobject]@{
  appName = $processName
  windowTitle = $titleBuilder.ToString()
  url = $url
  processId = [int]$processId
  path = $processPath
} | ConvertTo-Json -Compress
`;
}

function normalizeWindowsAppName(value) {
  const name = String(value || '').trim();
  return name.replace(/\.exe$/i, '');
}

function normalizeWindowsTimelineText(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return text
    .replace(/\uFFFD+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normalizeCapturedBrowserUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(?:[/:?#]|$)/i.test(url)) return `https://${url}`;
  return '';
}

function parseWindowsActiveWindowJson(stdout) {
  const text = String(stdout || '').trim();
  if (!text) return { ...EMPTY_ACTIVE_WINDOW, error: 'empty active window response' };
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      ...EMPTY_ACTIVE_WINDOW,
      error: `invalid active window response: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  return {
    supported: true,
    appName: normalizeWindowsAppName(parsed.appName),
    windowTitle: normalizeWindowsTimelineText(parsed.windowTitle),
    url: normalizeCapturedBrowserUrl(parsed.url),
    processId: Number(parsed.processId) || 0,
    path: normalizeWindowsTimelineText(parsed.path),
    error: null,
  };
}

function readActiveWindowWindows({ execFileFn = execFile, timeout = 2500, log = () => {} } = {}) {
  return new Promise((resolve) => {
    execFileFn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', windowsActiveWindowScript()],
      { timeout },
      (error, stdout, stderr) => {
        if (error) {
          const detail = stderr || error.message || String(error);
          log({ stage: 'windows-active-window:error', error: detail });
          resolve({
            supported: true,
            appName: '',
            windowTitle: '',
            url: '',
            error: detail,
          });
          return;
        }
        resolve(parseWindowsActiveWindowJson(stdout));
      },
    );
  });
}

module.exports = {
  normalizeCapturedBrowserUrl,
  normalizeWindowsAppName,
  normalizeWindowsTimelineText,
  parseWindowsActiveWindowJson,
  readActiveWindowWindows,
  windowsActiveWindowScript,
};
