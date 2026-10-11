# 🧭 Beginner's Setup Guide (Windows)

This guide takes you from **nothing installed** to **the website running on your laptop**, and then (optionally) **live on the internet**.
You don't need any prior experience. Follow the steps in order and don't skip any.

⏱️ **Time needed:** about 45 minutes the first time. After that, starting the project takes 10 seconds.

| Part | What you'll do |
|---|---|
| Step 1 | Install Node.js |
| Step 2 | Install VS Code |
| Step 3 | Put the project folder on your PC |
| Step 4 | Create a free MongoDB Atlas database |
| Step 5 | Create the `.env` settings file |
| Step 6 | Install the project's packages |
| Step 7 | Load demo data |
| Step 8 | Run the website 🎉 |
| Step 9 | Try every feature (demo script) |
| Step 10 | (Optional) Put it online with Render |
| — | Troubleshooting |

---

## Step 1: Install Node.js

Node.js lets your computer run JavaScript outside the browser. Our backend needs it, and it also installs **npm**, the tool that downloads code libraries.

1. Go to **https://nodejs.org**.
2. Click the big button that says **LTS** ("Long Term Support"). Do **not** pick "Current".
3. Run the downloaded `.msi` file. Click **Next → Next → Next → Install**, keeping all the default options.
   - If you see a checkbox *"Automatically install the necessary tools"*, you can leave it **unchecked**.
4. When it finishes, **restart your computer**. This makes sure Windows knows where Node is.
5. Check that it worked:
   - Press the **Windows key**, type `cmd`, and press **Enter**. A black window (Command Prompt) opens.
   - Type `node -v` and press Enter. You should see something like `v22.x.x` or `v24.x.x`.
   - Type `npm -v` and press Enter. You should see a number like `10.x.x`.

✅ If both show numbers, you're done with Step 1.
❌ If it says *"'node' is not recognized"*, restart the PC and try again. If it still fails, reinstall Node.

> The project needs Node **20.19 or newer**. Any current LTS version is fine.

---

## Step 2: Install VS Code (the code editor)

1. Go to **https://code.visualstudio.com** and click **Download for Windows**.
2. Run the installer. On the **"Select Additional Tasks"** screen, tick:
   - ✅ *Add "Open with Code" action to Windows Explorer file context menu*
   - ✅ *Add "Open with Code" action to Windows Explorer directory context menu*
   - ✅ *Add to PATH* (usually already ticked)
3. Finish the install and open VS Code.

---

## Step 3: Put the project on your PC

1. Download the file **`smart-ranking-system.zip`**.
2. Create a folder **`C:\Projects`**: open File Explorer → `This PC` → `Local Disk (C:)` → right-click → New → Folder → name it `Projects`.
   > ⚠️ Avoid the **Desktop**, **Documents** or any **OneDrive** folder. OneDrive tries to sync thousands of library files and slows everything down, sometimes breaking the install.
3. Right-click the zip → **Extract All…** → choose `C:\Projects` → **Extract**.
4. You should now have **`C:\Projects\smart-ranking-system`**, and inside it the folders `client` and `server` plus files like `package.json` and `README.md`.
   > If you instead see `C:\Projects\smart-ranking-system\smart-ranking-system\...` (a folder inside a folder with the same name), move the inner one up a level.
5. Open the folder in VS Code: right-click the `smart-ranking-system` folder → **Show more options** → **Open with Code**.
   - Or, in VS Code: **File → Open Folder…** → choose `C:\Projects\smart-ranking-system`.
   - If VS Code asks *"Do you trust the authors?"*, click **Yes, I trust the authors**.

### Open the terminal inside VS Code
You'll type all commands here.
- Menu **Terminal → New Terminal** (or press <kbd>Ctrl</kbd> + <kbd>`</kbd>, the key under Esc).
- A panel opens at the bottom, showing something like `PS C:\Projects\smart-ranking-system>`.

> ⚠️ **One-time fix for a common Windows error.** If an `npm` command later says *"running scripts is disabled on this system"*, either:
> - **Option A (easiest):** click the **˅** arrow next to the **+** in the terminal panel → choose **Command Prompt**, and use that terminal instead; or
> - **Option B:** run this once in the PowerShell terminal, type `Y` if asked, then try again:
>   ```
>   Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
>   ```

---

## Step 4: Create your free MongoDB Atlas database

MongoDB Atlas is a free cloud database. All users, achievements and even the certificate files will be stored here.

### 4.1 Make an account and a free cluster
1. Go to **https://www.mongodb.com/cloud/atlas/register** and sign up. Signing in with Google is fine.
2. Answer the short welcome questions however you like.
3. When asked to deploy/create a cluster, choose the **FREE** option (called **M0** or **Free**).
   - Provider: any (AWS is fine). Region: pick one close to you, e.g. **Mumbai (ap-south-1)**.
   - Name: leave it as `Cluster0`.
   - Click **Create Deployment** / **Create**.

### 4.2 Create a database user (the username and password your app will use)
Atlas may show this screen automatically right after creating the cluster. If it doesn't, open **Security → Database Access** (sometimes labelled *Database & Network Access*) in the left menu → **Add New Database User**.
1. Authentication method: **Password**.
2. Username: `ssars_user`
3. Password: make one with **only letters and numbers**, e.g. `Ssars2026Pass`.
   > ⚠️ Avoid special characters like `@ # % / : ?` in this password. They break the connection link, and this is the #1 beginner problem.
4. **Write the username and password down.** You need them in Step 5.
5. Role/privileges: **Read and write to any database** (the default "Atlas admin" also works).
6. Click **Add User** / **Create Database User**.

### 4.3 Allow your computer to connect
Open **Security → Network Access** → **Add IP Address**.
- Click **ALLOW ACCESS FROM ANYWHERE** (it fills in `0.0.0.0/0`) → **Confirm**.
- This is the easiest option while learning, and it is **required** for Render (Step 10).
- Wait until the status shows **Active** (about 1 minute).

### 4.4 Copy your connection string
1. Go to **Database / Clusters** in the left menu → on `Cluster0` click **Connect**.
2. Choose **Drivers** (it may say *"Connect your application"*). Driver: **Node.js**. Ignore the `npm install mongodb` instruction; the project already has what it needs.
3. Copy the connection string. It looks like:
   ```
   mongodb+srv://ssars_user:<db_password>@cluster0.ab12cd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```
4. Paste it into Notepad and make **two changes**:
   - Replace `<db_password>` (including the `< >`) with your real password.
   - Add **`ssars`** right after `.mongodb.net/` and before the `?`. This is the database name.

   **Before:** `...@cluster0.ab12cd.mongodb.net/?retryWrites=true...`
   **After:** `...@cluster0.ab12cd.mongodb.net/ssars?retryWrites=true...`

   The final result should look like:
   ```
   mongodb+srv://ssars_user:Ssars2026Pass@cluster0.ab12cd.mongodb.net/ssars?retryWrites=true&w=majority&appName=Cluster0
   ```
   (Your `ab12cd` part will be different. Keep yours.)

---

## Step 5: Create the `.env` settings file

The `.env` file holds your secrets (database link, signing key). It is **never** shared or uploaded.

1. In VS Code's left panel (Explorer), open the **`server`** folder.
2. Right-click **`.env.example`** → **Copy**, then right-click the **`server`** folder → **Paste**. This creates `.env copy.example`.
3. Right-click the new file → **Rename** → type exactly **`.env`** → Enter.
   > Or simply type this in the terminal: `copy server\.env.example server\.env`
4. Open **`server/.env`** and fill it in:
   ```
   MONGO_URI=mongodb+srv://ssars_user:Ssars2026Pass@cluster0.ab12cd.mongodb.net/ssars?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=my-final-year-project-super-secret-key-2026-xyz
   ADMIN_CODE=ADMIN2026
   PORT=5000
   ```
   - `MONGO_URI`: paste **your** string from Step 4.4. Don't use quotes or spaces.
   - `JWT_SECRET`: any long random sentence. It is used to sign login tokens.
   - `ADMIN_CODE`: the secret code someone must enter to register as an Admin.
5. Save with <kbd>Ctrl</kbd> + <kbd>S</kbd>.

---

## Step 6: Install the project's packages

In the VS Code terminal (make sure it shows `C:\Projects\smart-ranking-system>`), type:

```
npm run setup
```

This downloads all the libraries (Express, React, etc.) for the root, the server and the client. It takes **2–5 minutes** and prints a lot of text. That's normal.

✅ It's done when you get the prompt back, with no red `ERR!` lines at the end.
(Yellow `WARN` lines are harmless. Ignore them.)

You'll notice new `node_modules` folders. That's where the libraries live. **Never edit or upload them.**

---

## Step 7: Load the demo data

```
npm run seed
```

This connects to your Atlas database and fills it with:
- **69 demo users**: 60 students, 6 faculty, 1 admin and 2 recruiters.
- **225 achievements**, plus their **certificate PDFs**.
- Calculated scores, ranks and badges.

✅ You should see: `✅ Demo data ready! Log in with admin@example.com / Demo@123`

❌ If you see `Could not connect to MongoDB`, go to **Troubleshooting** at the bottom.

> 💡 You can run `npm run seed` again any time to **reset** the demo data to a clean state. It only removes demo data (`@example.com` accounts and their records), never real accounts you create.

**Want to see the data?** In Atlas, go to **Database → Browse Collections** (or **Data Explorer**) → `ssars`. You'll find `users`, `achievements`, `configs`, `certificates.files` and more.

---

## Step 8: Run the website 🎉

```
npm run dev
```

This starts **two** programs at once:
- `[SERVER]` (blue): the backend API on port 5000. Wait for `✅ MongoDB connected` and `🚀 API server running`.
- `[CLIENT]` (green): the React website. Wait for `Local: http://localhost:5173/`.

Now open your browser and go to 👉 **http://localhost:5173**

- **To stop the website:** click in the terminal and press <kbd>Ctrl</kbd> + <kbd>C</kbd> (type `Y` if asked).
- **Next time:** open the folder in VS Code → open a terminal → `npm run dev`. That's it. Steps 1–7 were one-time only.
- **While it's running**, if you edit and save a file, the website/server reloads automatically.

---

## Step 9: Try every feature (demo script for your presentation)

All demo passwords are **`Demo@123`**. On the Login page there's also a box listing the demo accounts.

**Tip:** to see the *live* updates, open a second browser window in **Incognito/InPrivate** (<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>N</kbd>) so you can be logged in as two people at once.

### 🎓 Student: `imran.1by25mc004@example.com`
1. **Dashboard:** score breakdown, department rank, and badges (Silver, Perfect Attendance, Technical Guru).
2. **Upload Achievement:** pick a category, level and position, and watch the **SmartScore preview** change. Attach any PDF or image under 5 MB → Submit.
3. Try uploading **the same file again**. It is blocked as a duplicate ✅
4. **Rankings:** filter by department or semester; **Download PDF Report**.
5. **Profile & Portfolio:** add skills; tick *"Let approved recruiters find my profile"* and *"Make my verified portfolio public"* → **Save changes**, then open your portfolio link.

### 👩‍🏫 Faculty: `ramesh.kulkarni.faculty@example.com` (MCA)
1. **Verification Queue** shows only **MCA** students' pending items.
2. In the other (incognito) window, log in as the student who submitted something. Click **Approve** here and watch the student get a 🎉 **pop-up instantly**, with their score and rank updating live.
3. Try **Reject** without typing a remark. It is blocked, because a reason is required.

### 🛠️ Admin: `admin@example.com`
1. **Control Centre:** platform stats and charts.
2. **Algorithm config:** change the weights, e.g. 50 / 10 / 40. They must total 100. **Save**, and every student's score and rank is recalculated live.
3. Switch **Scoring mode** between *Normalised* and *Classic* to compare with the original report's formula.
4. The yellow banner on the Control Centre says **1 recruiter account waiting for approval** → click **Review now** → **Approve** `recruiter2@example.com`. **User Management** is also where you edit, disable or enable accounts.

### 💼 Recruiter: `recruiter@example.com`
1. **Find Talent:** search skills like `Python, SQL`, set a minimum CGPA, and filter by domain.
2. A ✓ next to a skill means it is **proven by a faculty-approved achievement**.
3. Click ⭐ to **shortlist**, then **My Shortlist → Export CSV** (it opens in Excel).
4. **View verified profile.** The student can see this view on their own Profile page.
5. Try logging in as `recruiter2@example.com` *before* the admin approves it. It is blocked ✅

### Special demo students (for showing edge cases)
| USN | What it shows |
|---|---|
| `1BY25MC004` | 100% attendance → Perfect Attendance badge |
| `1BY25MC017`, `1BY24IS011` | Attendance below 75% |
| `1BY24IS014` | Disabled account (can't log in, not ranked) |
| `1BY25MC010` | Has a duplicate certificate attempt |
| `1BY26MC001`–`006` | New students with no CGPA yet → shown as "incomplete profile", not ranked |

Student emails follow the pattern `firstname.usn@example.com` in lowercase. The full list is in the **User Management** page, or in `server/seed/data/users.json`.

### Registering real accounts
On **Register** you can create real Student / Faculty / Admin / Recruiter accounts.
- Admins need the `ADMIN_CODE` from your `.env`.
- Recruiters must be approved by an admin before they can log in.

---

## Step 10 (Optional): Put it online with Render

Render can run the whole thing (backend + website) as **one free web service**.

### 10.1 Upload the code to GitHub
1. Create a free account at **https://github.com**.
2. Install **GitHub Desktop**: **https://desktop.github.com**. Sign in with your GitHub account.
3. In GitHub Desktop: **File → Add local repository…** → choose `C:\Projects\smart-ranking-system`.
   - It will say it's not a repository yet → click **create a repository** → **Create Repository**.
4. Check the file list on the left: there must be **no `node_modules`** and **no `.env`**. The included `.gitignore` file hides them automatically. 🔒
5. Click **Publish repository**. You can tick *Keep this code private*.

### 10.2 Create the Render service
1. Go to **https://render.com** → sign up **with GitHub**.
2. Click **New → Web Service** → select your `smart-ranking-system` repository.
3. Fill in:
   | Setting | Value |
   |---|---|
   | Language / Runtime | **Node** |
   | Branch | `main` |
   | Build Command | `npm run build` |
   | Start Command | `npm start` |
   | Instance type | **Free** |
4. Under **Environment Variables**, add each of these (**Add Environment Variable**):
   | Key | Value |
   |---|---|
   | `MONGO_URI` | your Atlas string (same as in `.env`) |
   | `JWT_SECRET` | your secret sentence |
   | `ADMIN_CODE` | `ADMIN2026` (or your own) |
   | `NODE_VERSION` | `22` |

   (Don't add `PORT`. Render sets it automatically.)
5. Click **Create Web Service**. The first build takes about 3–5 minutes. When the log says `🚀 API server running`, open the URL at the top, e.g. `https://smart-ranking-system.onrender.com`.

> 💡 The free plan "sleeps" after about 15 minutes of no visitors. The first visit after that takes about 30–60 seconds to wake up. **Open the site a minute before your demo.**
> Certificates are stored inside MongoDB, so they **don't disappear** when Render restarts, unlike in the original version.
> Updating the site: make changes → in GitHub Desktop write a summary → **Commit** → **Push origin**. Render redeploys automatically.

---

## 🆘 Troubleshooting

| Problem / message | Fix |
|---|---|
| `'node' is not recognized` / `'npm' is not recognized` | Restart the PC after installing Node. Still failing? Reinstall Node LTS. |
| `running scripts is disabled on this system` | See the box at the end of Step 3 (switch to Command Prompt, or run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`). |
| `Missing MONGO_URI, JWT_SECRET in server/.env` | The file must be named exactly `.env` (not `.env.txt` or `.env copy.example`) and must sit **inside the `server` folder**. |
| `Could not connect to MongoDB` + `bad auth` / `authentication failed` | Wrong username or password in `MONGO_URI`. In Atlas → Database Access → **Edit** the user → set a new letters-and-numbers password, and update `.env`. Make sure you removed the `< >`. |
| `Could not connect…` + `timed out` / `ECONNREFUSED` / `querySrv` | Atlas → Network Access must contain `0.0.0.0/0` with status **Active**. College or office Wi-Fi sometimes blocks MongoDB, so try a **mobile hotspot**. |
| Data goes into a database called `test` | You forgot `/ssars` before the `?` in `MONGO_URI` (Step 4.4). |
| `EADDRINUSE: address already in use :::5000` | The project is already running in another terminal. Close it (Ctrl+C), or restart VS Code. |
| Website opens but says *"Network error"* or nothing loads after login | The `[SERVER]` part crashed. Scroll up in the terminal for the red error message; it's usually the database connection. |
| `npm run setup` fails with red `ERR!` lines | Check your internet connection, make sure the folder is **not** in OneDrive, then delete all `node_modules` folders and run `npm run setup` again. |
| Login says *"Invalid email or password"* for demo users | Run `npm run seed` again. The password is `Demo@123` (capital D). |
| Recruiter login says *"awaiting admin approval"* | That's correct behaviour. Log in as admin → User Management → Approve. |
| Render build fails | Check that all 4 environment variables are set and that Atlas Network Access has `0.0.0.0/0`. Read the red lines in Render's **Logs** tab. |

### Useful commands (run from `C:\Projects\smart-ranking-system`)
| Command | What it does |
|---|---|
| `npm run setup` | Installs all libraries (one time, or after deleting `node_modules`) |
| `npm run seed` | Resets the demo data |
| `npm run dev` | Runs the website for development (http://localhost:5173) |
| `npm run build` then `npm start` | Runs the "production" version, exactly as Render does (http://localhost:5000) |
| `npm run seed:remove --prefix server` | Deletes all demo data but keeps real accounts |

---

## 📚 How the code fits together (for your viva)

1. **Browser (React, `client/src`)**: pages call `api.js`, which sends requests to `/api/...` with your login token attached.
2. **Express server (`server/src/app.js`, `routes/index.js`)** receives the request.
3. **Middleware (`middleware/`)**:
   - `protect` checks the JWT token, so you must be logged in.
   - `allowRoles` checks your role, e.g. only faculty can verify.
   - `upload` (Multer) checks the file type and the 5 MB limit.
4. **Controllers (`controllers/`)** do the work, such as saving an achievement.
5. **Services (`services/`)** calculate SmartScores, the achievement index, badges and ranks.
6. **Models (`models/`)**: Mongoose checks the data shape and saves it to **MongoDB Atlas**. Certificate files go to **GridFS**.
7. **Socket.IO (`utils/socket.js`)** pushes live events (approved, new rank, badge unlocked) to the right users instantly.

Good luck with your project! 🚀
