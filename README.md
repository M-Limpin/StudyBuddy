# StudyBuddy

A mobile-friendly study planner where students track assignments, set up their class schedule, and get study suggestions, with everything saved in their own browser and no account needed.

**Live site:** [https://yourusername.github.io/your-repo-name/](https://studybuddy-petah2.vercel.app?_vercel_share=lUcmKI1vRv2nbZGdhZfbycEh8evqnUTF)
**Demo video:** (link

<img width="1919" height="943" alt="image" src="https://github.com/user-attachments/assets/8c89a381-20dc-4b13-9622-ae4241382d95" />

## What it does

- **Tasks:** add assignments with a title, subject and due date. Tap a task's badge to mark it Done or back to Pending. A task becomes **Late** on its own when its due date has passed and it isn't done.
- **Filter and search:** the Assignment List shows **Pending** tasks by default. Switch to Late, Done or All, or search by title or subject.
- **Schedule:** enter your weekly class timetable and one-time study sessions. Today's classes show up automatically.
- **Home dashboard:** today's tasks, upcoming deadlines, a progress bar, and a study suggestion.
- **Profile:** edit your name, course, student ID and photo. Statistics are counted from your real tasks.
- **Reminders:** optional browser notifications for tasks that are due soon or late.
- **Gemini AI suggestions:** optional. Add your own Gemini API key and the suggestion is based on your pending tasks. Without a key, built-in tips are used.
- **Backup:** export all your data to a `.json` file and import it again later.
- **No login:** data is saved automatically in the browser (`localStorage`).

## How to use it

1. Open **Profile > Edit Profile** and enter your details.
2. Go to **Tasks**, fill in the form, and tap **Add Task**.
3. Tap a task's colored badge to mark it Done. Use the filter buttons to see Late or Done tasks.
4. Go to **Schedule** and add your classes and study sessions.
5. Optional: turn on notifications or add a Gemini key in **Profile > Settings**.
6. Use **Export Backup** now and then. Clearing your browser data erases your tasks.

The same guide is shown inside the app on the Home page under **How to use StudyBuddy**.

## Built with

Plain HTML, CSS and JavaScript. No framework, no build step, no server, no database.

- [Poppins](https://fonts.google.com/specimen/Poppins) (Google Fonts) and [Font Awesome 6](https://fontawesome.com/) icons, loaded from a CDN
- Browser `localStorage` for saving data
- Browser Notification API for reminders
- Google Gemini API (optional, called directly from the browser with the user's own key)

The site is hosted on GitHub Pages.

## Running it yourself

There is nothing to install. Download or clone the repository, then either:

- Use the **Live Server** extension in VS Code and open `index.html`, or
- From the project folder run:

      python -m http.server 8000

  and open http://localhost:8000

Opening `index.html` by double-clicking also works, but some browsers block notifications on `file://` pages, so use a local server if you want to test reminders.

## Configuration

There are no environment variables and no secrets in this repository.

The only credential is the **optional Gemini API key**. The user types it into **Profile > Gemini AI Settings** and it is stored only in their own browser. It is never committed, never included in the exported backup, and only sent to Google's Gemini API. Because it lives in the browser, do not enter it on a shared computer.

## Deploying

The whole project is static files, so GitHub Pages is enough.

1. Push the project to a **public** repository, with `index.html` at the root.
2. Go to **Settings > Pages > Build and deployment**.
3. Set **Source** to **Deploy from a branch**, choose `main` and `/ (root)`, then save.
4. After a minute the site is live at `https://yourusername.github.io/your-repo-name/`.

## Project structure

    index.html       Home: dashboard, progress, suggestion, how-to guide
    tasks.html       Add, filter, search, complete and delete tasks
    schedule.html    Classes, study sessions, weekly timetable
    profile.html     Edit profile, statistics, settings, backup
    style.css        Design tokens, layout and components
    script.js        All behaviour: storage, rendering, reminders, Gemini
    docs/            Planning documents and weekly reports

## Architecture

StudyBuddy is a multi-page static site. Each page loads the same `style.css` and `script.js`. `script.js` reads one JSON object from `localStorage` (tasks, classes, sessions, profile, settings), renders the current page from it, and writes it back after every change. There is no backend, so data stays on the user's device and is not shared between devices. Backup and restore is done with export and import of a `.json` file. The only network call the app makes on its own is to the Gemini API, and only when the user has turned it on.

## Security notes

- All user-entered text is escaped before it is displayed, so a task title cannot inject HTML or scripts.
- Imported backups are checked for the right structure, and unexpected values are dropped before saving.
- Uploaded profile photos are resized to a small square in the browser before saving.
- No passwords, accounts or personal data leave the browser, except the text sent to Gemini when that feature is on (task titles, subjects and due dates).

## What I would do next

- Add an **Edit** option for tasks, classes and sessions (right now you delete and re-add).
- Add a real backend and sign-in so data syncs across devices instead of living in one browser.
- Add a weekly calendar view and recurring tasks.

## Author

Paulo Limpin, BS Computer Science. CS-403

## AI use

![Built with AI assistance](https://img.shields.io/badge/built%20with-AI%20assistance-0b5fff)

I used an AI assistant (Claude) while building StudyBuddy: for hints and step-by-step ideas when I was stuck, and to help rewrite the app from a demo into a working version with saved data, filters, an editable profile and backup. I tested the app and reviewed the changes myself. Full details are in [AI-USAGE.md](AI-USAGE.md).

## Licence

MIT, see [LICENSE](LICENSE). Paulo Miguel R. Limpin
