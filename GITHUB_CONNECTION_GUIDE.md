# GitHub Connection Guide for ToolLink Project

Follow these steps to connect your local ToolLink project to a GitHub repository:

## Step 1: Create a new GitHub repository

1. Log in to your GitHub account at https://github.com
2. Click on the "+" button in the top-right corner and select "New repository"
3. Fill in the repository details:
   - Repository name: `toollink` (or any name you prefer)
   - Description: `Construction Material Management System`
   - Visibility: Choose either Public or Private based on your preference
   - Do NOT initialize with README, .gitignore, or license (as we already have these files)
4. Click "Create repository"

## Step 2: Connect your local repository to GitHub

After creating the repository, you'll see instructions. Follow the "push an existing repository" instructions. Open PowerShell in your project directory (`E:\Project 2`) and run:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/toollink.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Handle the ToolLink subdirectory issue

You'll notice that the ToolLink directory was added as a submodule because it contains its own .git directory. To fix this:

1. Remove the submodule reference:
```powershell
git rm --cached ToolLink
```

2. Delete the internal .git directory:
```powershell
Remove-Item -Path "E:\Project 2\ToolLink\.git" -Recurse -Force
```

3. Add the ToolLink directory contents again:
```powershell
git add ToolLink
git commit -m "Add ToolLink directory as regular files, not a submodule"
git push origin main
```

## Step 4: Setting up GitHub authentication

If you haven't already set up authentication with GitHub, you'll need to:

1. Use GitHub CLI:
```powershell
# Install GitHub CLI (if not already installed)
winget install GitHub.cli

# Login to GitHub
gh auth login
```

2. Or set up a Personal Access Token:
   - Go to GitHub Settings → Developer Settings → Personal Access Tokens
   - Generate a new token with repo permissions
   - Use this token when prompted for your password

## Step 5: Verify the connection

After pushing your code, refresh your GitHub repository page to confirm that all files were uploaded correctly.

## Using GitHub with your project

Now that your project is connected to GitHub, you can:

1. Create and manage branches:
```powershell
git checkout -b feature/new-feature
# Make changes...
git add .
git commit -m "Add new feature"
git push -u origin feature/new-feature
```

2. Pull the latest changes:
```powershell
git pull origin main
```

3. Create Pull Requests through the GitHub web interface

4. Use GitHub Actions for CI/CD (if needed)

## Troubleshooting

If you encounter authentication issues, try:

```powershell
git config --global credential.helper wincred
```

For large files that exceed GitHub's file size limits, consider using Git LFS:

```powershell
# Install Git LFS
git lfs install
git lfs track "*.psd"  # Track large files by extension
git add .gitattributes
```
