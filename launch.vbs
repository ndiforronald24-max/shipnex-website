Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d c:\Users\Falone Mo\Desktop\shipnex-website && npx vite --host 0.0.0.0 --port 5173", 1, False
