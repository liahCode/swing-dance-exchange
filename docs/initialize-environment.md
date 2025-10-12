# What is nvm?

```markdown
nvm (Node Version Manager) is a tool for managing multiple Node.js versions on a single system.  
[Wikipedia](https://en.wikipedia.org/wiki/Node_Version_Manager)
[GitHub](https://github.com/nvm-sh/nvm)
```

# Install nvm

## Linux or MacOS terminal command:

bash

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

## On windows

1. Find Node.js installation

```powershell
Get-Package -Name "Node.js"
```

2. Uninstall Node.js

```powershell
Get-Package -Name "Node.js" | Uninstall-Package
```

3. Verify Node.js is uninstalled

```powershell
node --version
```

4. Check if npm exists

```powershell
npm --version
```

5. Optional cleanup
   Remove global npm cache

```powershell
Remove-Item -Path "$env:LOCALAPPDATA\npm-cache" -Recurse -Force -ErrorAction SilentlyContinue
```

6. Remove user-level npm config

```powershell
Remove-Item -Path "$env:USERPROFILE\.npmrc" -Force -ErrorAction SilentlyContinue
```

7. Install nvm for Windows

```powershell
Invoke-WebRequest -Uri "https://github.com/coreybutler/nvm-windows/releases/latest/download/nvm-setup.exe" -OutFile "$env:TEMP\nvm-setup.exe"; Start-Process "$env:TEMP\nvm-setup.exe"
```

8. Check nvm version

```powershell
nvm version
```

9. Check node version

```powershell
node --version
```

10. Install newest node version

```powershell
nvm install lts
```

```powershell
nvm install latest
```

11. Use the newest node version

```powershell
nvm use latest
```

12. Verify node and npm version

```powershell
node --version
npm --version
```

13. Update npm to the latest version

```powershell
 npm install -g npm@<version>
```

Yes, you can update npm independently even if you installed Node.js using nvm (Node Version Manager).

When you install Node.js via nvm, each Node.js version comes bundled with a specific npm version.
If a newer patch of npm is available, you can update npm for the currently active Node.js version.
The npm update only applies to the currently active Node.js version.
If you switch to another Node.js version with nvm use <other-version>, you'll get the npm version that was bundled with
that Node.js version (unless you update npm for that version as well).

