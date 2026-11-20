' Atraso de 40s para permitir que a Area de Trabalho e Barra de Tarefas carreguem instantaneamente
WScript.Sleep 40000
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""C:\Users\luciano\.gemini\antigravity\scratch\copiloto-rota\iniciar_servico_24_7.ps1""", 0, False
