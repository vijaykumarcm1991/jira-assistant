# Jira Assistant Desktop App 🚀

A native Windows desktop application modeled after the popular Jira Assistant extension, designed for developers and managers who need fast, seamless worklog tracking, timesheet analysis, active stopwatch tracking, and Jira issue management without browser extension limitations or CORS restrictions.

---

## 🌟 Key Features

1. **JQL Navigator & Custom Saved Reports** (New!):
   - **Custom Saved Reports**: Save queries with custom titles (e.g. *"Sprint 24 Incidents"*, *"My Open Bugs"*), along with custom column field selections.
   - **Configurable Fields & Columns**: Toggle visible columns on the fly (`Key`, `Summary`, `Status`, `Priority`, `Type`, `Assignee`, `Reporter`, `Created`, `Updated`, `Time Spent`, `Remaining Estimate`, etc.).
   - **Export to CSV**: 1-click export of any report into a CSV spreadsheet.
   - **Jira Cloud API v3 Compliant**: Uses modern Atlassian `POST /rest/api/3/search/jql` API and `GET /rest/api/2/search` for Jira Server/Data Center.
   - **In-App Error Diagnostic Banner**: Displays exact error details returned by Jira (e.g., unbounded query warnings, syntax issues) with a 1-click link to view logs.

2. **Diagnostics & Logging System** (New!):
   - In-app **Logs & Diagnostics** viewer (accessible via the top header **Logs** button).
   - Real-time logging of HTTP requests, endpoints, status codes, and error bodies.
   - Persistent log file written to `%APPDATA%\jira-assistant-desktop\jira-assistant.log`.
   - 1-click **Open .log File** (in Notepad) and **Open Folder** (in Windows Explorer).

3. **Active Stopwatch & Mini-Bar**:
   - Start stopwatch on any Jira ticket from your board, search, or timesheet.
   - Real-time time elapsed counter with one-click **Play**, **Pause**, **Stop & Log**, and **Discard**.
   - Minimized system tray integration showing the live active ticket and duration.

4. **Daily & Weekly Timesheets**:
   - Interactive calendar with Day View and Week View.
   - Real-time daily progress bar and completion percentage towards your target (e.g. 8h/day).
   - Grouped worklog entries with ticket key, duration, start timestamp, and work comments.
   - Delete and edit worklogs directly from the app.

5. **My Issues & Board Navigator**:
   - Quick filters: **All**, **In Progress**, **To Do**, **Done**.
   - Time tracking gauges (logged time vs remaining vs original estimate).
   - In-app workflow status transitions (**To Do** $\rightarrow$ **In Progress** $\rightarrow$ **Done**).
   - Instant "Timer" and "+ Log" buttons on every card.

6. **Dual Environment Support (Cloud & Server/Data Center)**:
   - **Jira Cloud**: Basic Auth with Email + Atlassian API Token.
   - **Jira Server / Data Center**: Bearer Token with Personal Access Token (PAT).
   - **Safe Storage**: API tokens are encrypted on Windows with DPAPI via Electron's `safeStorage`.

7. **Built-in Demo / Offline Mode**:
   - Ready right out of the box with realistic tickets, sprints, and worklogs.
   - Seamlessly toggle between Demo Mode and Live Jira in Settings at any time.

---

## 🛠️ How to Run

### Option 1: Desktop Shortcut
- Double-click the **`Jira Assistant`** shortcut on your Windows Desktop.

### Option 2: Batch Launcher
- In [`d:\OM_Projects\Jira-Assistant`](file:///d:/OM_Projects/Jira-Assistant), double-click [`Run-Jira-Assistant.bat`](file:///d:/OM_Projects/Jira-Assistant/Run-Jira-Assistant.bat).

### Option 3: Terminal
```powershell
npm start
# or for live development:
npm run dev
```

---

## 📄 Logs Location
- Log file: `%APPDATA%\jira-assistant-desktop\jira-assistant.log`
- Or click the **Logs** button in the app header to view live logs or open the log file directly.
