/* ==========================================
   STUDYBUDDY - script.js
   All data is saved in the browser (localStorage).
   No account / login needed.
========================================== */
(() => {
    const KEY = "studybuddy_v1";
    const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const TIPS = [
        "Break your homework into smaller tasks.",
        "Study difficult subjects first while your mind is fresh.",
        "Take a 10-minute break after every 45 minutes of studying.",
        "Practice coding for at least 20 minutes today.",
        "Review your notes before sleeping.",
        "Focus on one subject at a time.",
        "Complete your pending tasks before starting a new one."
    ];

    /* ---------- helpers ---------- */
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => [...r.querySelectorAll(s)];
    const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const pad = n => String(n).padStart(2, "0");
    const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const today = () => dstr(new Date());
    const fmtDate = d => new Date(d + "T00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" });
    const t12 = t => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`; };
    const byDue = (a, b) => (a.due || "9999").localeCompare(b.due || "9999");

    function toast(msg) {
        const t = document.createElement("div");
        t.className = "toast";
        t.setAttribute("role", "status");
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2800);
    }

    /* ---------- storage ---------- */
    function load() {
        let s = {};
        try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { }
        return {
            tasks: s.tasks || [], classes: s.classes || [], sessions: s.sessions || [],
            profile: { name: "", course: "", studentId: "", photo: "", ...s.profile },
            settings: { notify: false, notifyDays: 1, ai: false, apiKey: "", model: "gemini-2.0-flash", ...s.settings },
            lastNotify: s.lastNotify || "", filter: s.filter || "pending"
        };
    }
    let db = load();
    function save() {
        try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
        catch { alert("Could not save. Browser storage may be full or disabled."); return false; }
    }

    /* A task is Done, Late (past due and not done) or Pending */
    const status = t => t.done ? "done" : (t.due && t.due < today() ? "late" : "pending");
    const cap = s => s[0].toUpperCase() + s.slice(1);

    /* ---------- tips / Gemini ---------- */
    function localTip() {
        const p = db.tasks.filter(t => !t.done).sort(byDue);
        if (p.length && Math.random() < 0.6) {
            const t = p[Math.floor(Math.random() * Math.min(3, p.length))];
            return `Start with "${t.title}"${t.due ? ` (due ${fmtDate(t.due)})` : ""}. Work on it in one focused 25-minute session.`;
        }
        return TIPS[Math.floor(Math.random() * TIPS.length)];
    }

    window.changeTip = async function () {
        const el = $("#tip");
        if (!el) return;
        const { ai, apiKey, model } = db.settings;
        if (!ai || !apiKey) { el.textContent = localTip(); return; }
        el.textContent = "Thinking...";
        try {
            const pending = db.tasks.filter(t => !t.done).sort(byDue).slice(0, 8)
                .map(t => `${t.title} (${t.subject || "no subject"}, due ${t.due || "n/a"})`).join("; ") || "none";
            const prompt = `You are a friendly study coach. The student's pending tasks: ${pending}. Today is ${today()}. Give ONE short, practical study suggestion (max 2 sentences).`;
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model || "gemini-2.0-flash")}:generateContent`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!res.ok) throw new Error(res.status);
            const data = await res.json();
            el.textContent = data.candidates[0].content.parts[0].text.trim();
        } catch {
            el.textContent = localTip();
            toast("Gemini unavailable. Check your API key in Profile > Gemini AI Settings.");
        }
    };

    /* ---------- reminders ---------- */
    function remind() {
        const s = db.settings;
        if (!s.notify || !("Notification" in window) || Notification.permission !== "granted" || db.lastNotify === today()) return;
        const lim = new Date(); lim.setDate(lim.getDate() + Number(s.notifyDays));
        const due = db.tasks.filter(t => !t.done && t.due && t.due <= dstr(lim));
        if (!due.length) return;
        new Notification("StudyBuddy reminder", { body: `${due.length} task(s) due soon or late: ` + due.slice(0, 3).map(t => t.title).join(", ") });
        db.lastNotify = today(); save();
    }

    /* ---------- shared row renderers ---------- */
    const taskInfo = (t, due = true) =>
        `<div><h4>${esc(t.title)}</h4><small>${esc(t.subject || "No subject")}</small>${due && t.due ? `<br><small>Due: ${fmtDate(t.due)}</small>` : ""}</div>`;
    const badge = (t, act) => {
        const s = status(t);
        return `<span class="${s}" ${act ? `role="button" tabindex="0" data-act="toggle" data-id="${t.id}" title="Tap to mark done / pending"` : ""}>${cap(s)}</span>`;
    };
    const emptyMsg = m => `<p class="empty">${m}</p>`;
    const delBtn = (act, id, label) => `<button class="icon-btn" data-act="${act}" data-id="${id}" aria-label="${label}"><i class="fa-solid fa-trash"></i></button>`;

    /* ---------- HOME ---------- */
    function homePage() {
        const name = db.profile.name.split(" ")[0];
        $("#welcome").textContent = name ? `Welcome back, ${name} 👋` : "Welcome! Set your name in Profile 👋";

        const open = db.tasks.filter(t => !t.done).sort(byDue);
        const todays = open.filter(t => t.due && t.due <= today());
        const list = todays.length ? todays : open;
        $("#todayTasks").innerHTML = list.length
            ? list.slice(0, 4).map(t => `<div class="task">${taskInfo(t)}${badge(t, false)}</div>`).join("")
            : emptyMsg(db.tasks.length ? "All caught up! 🎉" : "No tasks yet. Go to the Tasks tab to add your first one.");

        const up = open.filter(t => t.due && t.due >= today()).slice(0, 4);
        $("#deadlines").innerHTML = up.length
            ? up.map(t => `<div class="deadline"><i class="fa-solid fa-calendar"></i><div><b>${fmtDate(t.due)}</b><p>${esc(t.title)}</p></div></div>`).join("")
            : emptyMsg("No upcoming deadlines.");

        const total = db.tasks.length, done = db.tasks.filter(t => t.done).length;
        const pct = total ? Math.round(done / total * 100) : 0;
        $("#progressText").textContent = total ? `${pct}% Completed (${done} of ${total} tasks)` : "No tasks yet";
        setTimeout(() => { const b = $("#bar"); b.style.transition = "1s"; b.style.width = pct + "%"; }, 200);

        $("#tip").textContent = localTip();
        if (!localStorage.getItem(KEY + "_seen")) { $("#help").open = true; localStorage.setItem(KEY + "_seen", "1"); }
    }

    /* ---------- TASKS ---------- */
    function tasksPage() {
        let q = "";
        const labels = { pending: "Pending", late: "Late", done: "Done", all: "All" };
        const list = $("#taskList");

        const draw = () => {
            $$(".chip").forEach(c => {
                const f = c.dataset.f;
                const n = f === "all" ? db.tasks.length : db.tasks.filter(t => status(t) === f).length;
                c.textContent = `${labels[f]} (${n})`;
                c.classList.toggle("on", f === db.filter);
            });
            const rows = db.tasks
                .filter(t => (db.filter === "all" || status(t) === db.filter) && `${t.title} ${t.subject}`.toLowerCase().includes(q))
                .sort(byDue);
            list.innerHTML = rows.length
                ? rows.map(t => `<div class="task">${taskInfo(t)}<div class="task-actions">${badge(t, true)}${delBtn("del", t.id, "Delete task")}</div></div>`).join("")
                : emptyMsg(db.tasks.length ? `No ${db.filter === "all" ? "matching" : labels[db.filter].toLowerCase()} tasks.` : "No tasks yet. Add one above.");
        };

        $("#taskForm").addEventListener("submit", e => {
            e.preventDefault();
            const title = $("#tTitle").value.trim();
            if (!title) return;
            db.tasks.push({ id: uid(), title, subject: $("#tSubject").value.trim(), due: $("#tDue").value, done: false });
            if (!["pending", "all"].includes(db.filter) && status(db.tasks.at(-1)) !== db.filter) db.filter = "pending";
            save(); e.target.reset(); draw(); toast("Task added ✔");
        });
        $("#search").addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); draw(); });
        $("#chips").addEventListener("click", e => {
            const c = e.target.closest(".chip"); if (!c) return;
            db.filter = c.dataset.f; save(); draw();
        });
        const act = e => {
            const el = e.target.closest("[data-act]"); if (!el) return;
            const t = db.tasks.find(x => x.id === el.dataset.id); if (!t) return;
            if (el.dataset.act === "toggle") t.done = !t.done;
            else if (confirm(`Delete "${t.title}"?`)) db.tasks = db.tasks.filter(x => x !== t);
            save(); draw();
        };
        list.addEventListener("click", act);
        list.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(e); } });
        draw();
    }

    /* ---------- SCHEDULE ---------- */
    function schedulePage() {
        const byClass = (a, b) => WEEK.indexOf(a.day) - WEEK.indexOf(b.day) || a.start.localeCompare(b.start);
        const draw = () => {
            const day = DAY_NAMES[new Date().getDay()];
            const tc = db.classes.filter(c => c.day === day).sort(byClass);
            $("#todayClasses").innerHTML = tc.length
                ? tc.map(c => `<div class="deadline"><i class="fa-solid fa-book"></i><div><b>${t12(c.start)} - ${t12(c.end)}</b><p>${esc(c.subject)}</p></div></div>`).join("")
                : emptyMsg(`No classes today (${day}).`);

            const ss = db.sessions.filter(s => s.date >= today()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
            $("#sessionList").innerHTML = ss.length
                ? ss.map(s => `<div class="deadline"><i class="fa-solid fa-graduation-cap"></i><div><b>${fmtDate(s.date)} - ${t12(s.time)}</b><p>${esc(s.title)}</p></div>${delBtn("delSession", s.id, "Delete session")}</div>`).join("")
                : emptyMsg("No upcoming study sessions.");

            const wc = [...db.classes].sort(byClass);
            $("#weekly").innerHTML = wc.length
                ? `<div style="overflow-x:auto"><table><tr><th>Day</th><th>Time</th><th>Subject</th><th></th></tr>${wc.map(c =>
                    `<tr><td>${c.day}</td><td>${t12(c.start)} - ${t12(c.end)}</td><td>${esc(c.subject)}</td><td>${delBtn("delClass", c.id, "Delete class")}</td></tr>`).join("")}</table></div>`
                : emptyMsg("Your weekly schedule is empty. Add a class above.");
        };

        $("#classForm").addEventListener("submit", e => {
            e.preventDefault();
            const start = $("#cStart").value, end = $("#cEnd").value;
            if (end <= start) { alert("End time must be after the start time."); return; }
            db.classes.push({ id: uid(), day: $("#cDay").value, start, end, subject: $("#cSubject").value.trim() });
            save(); e.target.reset(); draw(); toast("Class added ✔");
        });
        $("#sessionForm").addEventListener("submit", e => {
            e.preventDefault();
            db.sessions.push({ id: uid(), title: $("#sTitle").value.trim(), date: $("#sDate").value, time: $("#sTime").value });
            save(); e.target.reset(); draw(); toast("Study session added ✔");
        });
        document.addEventListener("click", e => {
            const el = e.target.closest("[data-act]"); if (!el) return;
            if (!confirm("Delete this item?")) return;
            if (el.dataset.act === "delClass") db.classes = db.classes.filter(c => c.id !== el.dataset.id);
            if (el.dataset.act === "delSession") db.sessions = db.sessions.filter(s => s.id !== el.dataset.id);
            save(); draw();
        });
        draw();
    }

    /* ---------- PROFILE ---------- */
    function resizePhoto(file, cb) {
        const r = new FileReader();
        r.onload = () => {
            const img = new Image();
            img.onload = () => {
                const s = 200, c = document.createElement("canvas"), m = Math.min(img.width, img.height);
                c.width = c.height = s;
                c.getContext("2d").drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
                cb(c.toDataURL("image/jpeg", 0.8));
            };
            img.src = r.result;
        };
        r.readAsDataURL(file);
    }

    function profilePage() {
        let photo = db.profile.photo;
        const p = () => db.profile;

        const draw = () => {
            const initials = p().name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("");
            $("#pView").innerHTML =
                (p().photo ? `<img src="${esc(p().photo)}" alt="Profile photo">` : `<div class="avatar">${initials || '<i class="fa-solid fa-user"></i>'}</div>`) +
                `<h2>${esc(p().name || "Your Name")}</h2><p>${esc(p().course || "Add your course")}</p><p>${p().studentId ? "Student ID: " + esc(p().studentId) : "Add your student ID"}</p>`;
            const c = k => db.tasks.filter(t => status(t) === k).length;
            $("#stats").innerHTML = [["done", "Completed"], ["pending", "Pending"], ["late", "Late"]]
                .map(([k, l]) => `<div class="stat"><h3>${c(k)}</h3><p>${l}</p></div>`).join("");
        };
        const fill = () => {
            $("#fName").value = p().name; $("#fCourse").value = p().course; $("#fId").value = p().studentId;
            $("#nOn").checked = db.settings.notify; $("#nDays").value = db.settings.notifyDays;
            $("#aOn").checked = db.settings.ai; $("#aKey").value = db.settings.apiKey; $("#aModel").value = db.settings.model;
        };

        $$("[data-toggle]").forEach(b => b.addEventListener("click", () => {
            const target = $("#" + b.dataset.toggle);
            ["pEdit", "pNotif", "pAI"].forEach(id => { if (id !== target.id) $("#" + id).hidden = true; });
            target.hidden = !target.hidden;
            if (!target.hidden) target.scrollIntoView({ behavior: "smooth", block: "center" });
        }));

        $("#fPhoto").addEventListener("change", e => {
            const f = e.target.files[0]; if (!f) return;
            if (!f.type.startsWith("image/")) { alert("Please choose an image file."); e.target.value = ""; return; }
            resizePhoto(f, url => { photo = url; toast("Photo ready. Tap Save Profile."); });
        });
        $("#removePhoto").addEventListener("click", () => { photo = ""; $("#fPhoto").value = ""; toast("Photo removed. Tap Save Profile."); });

        $("#profileForm").addEventListener("submit", e => {
            e.preventDefault();
            db.profile = { name: $("#fName").value.trim(), course: $("#fCourse").value.trim(), studentId: $("#fId").value.trim(), photo };
            if (save()) { draw(); $("#pEdit").hidden = true; scrollTo({ top: 0, behavior: "smooth" }); toast("Profile saved ✔"); }
        });

        $("#notifForm").addEventListener("submit", e => {
            e.preventDefault();
            db.settings.notify = $("#nOn").checked; db.settings.notifyDays = Number($("#nDays").value);
            save();
            if (db.settings.notify) {
                if (!("Notification" in window)) toast("This browser doesn't support notifications.");
                else Notification.requestPermission().then(r => toast(r === "granted" ? "Notifications on ✔" : "Notifications are blocked in your browser settings."));
            } else toast("Notifications off");
        });

        $("#aiForm").addEventListener("submit", e => {
            e.preventDefault();
            Object.assign(db.settings, { ai: $("#aOn").checked, apiKey: $("#aKey").value.trim(), model: $("#aModel").value.trim() || "gemini-2.0-flash" });
            save(); toast("Gemini settings saved ✔");
        });

        $("#export").addEventListener("click", () => {
            const a = document.createElement("a");
            const copy = { ...db, settings: { ...db.settings, apiKey: "" } };   // never export the API key
            a.href = URL.createObjectURL(new Blob([JSON.stringify(copy, null, 2)], { type: "application/json" }));
            a.download = `studybuddy-backup-${today()}.json`;
            a.click(); URL.revokeObjectURL(a.href);
        });
        $("#import").addEventListener("click", () => $("#importFile").click());
        $("#importFile").addEventListener("change", e => {
            const f = e.target.files[0]; if (!f) return;
            const r = new FileReader();
            r.onload = () => {
                try {
                    const d = JSON.parse(r.result);
                    if (!d || !Array.isArray(d.tasks) || !Array.isArray(d.classes) || !Array.isArray(d.sessions)) throw new Error("bad");
                    if (!confirm(`Import ${d.tasks.length} task(s), ${d.classes.length} class(es) and ${d.sessions.length} session(s)?\n\nThis REPLACES your current data.`)) return;
                    const str = v => (typeof v === "string" ? v : "");
                    const keep = db.settings.apiKey;   // backups never contain the API key
                    localStorage.setItem(KEY, JSON.stringify({
                        tasks: d.tasks.filter(t => t && str(t.title)).map(t => ({ id: uid(), title: str(t.title), subject: str(t.subject), due: str(t.due), done: !!t.done })),
                        classes: d.classes.filter(c => c && WEEK.includes(c.day) && str(c.start) && str(c.end)).map(c => ({ id: uid(), day: c.day, start: c.start, end: c.end, subject: str(c.subject) })),
                        sessions: d.sessions.filter(s => s && str(s.date) && str(s.time)).map(s => ({ id: uid(), title: str(s.title), date: s.date, time: s.time })),
                        profile: { name: str(d.profile?.name), course: str(d.profile?.course), studentId: str(d.profile?.studentId), photo: str(d.profile?.photo).startsWith("data:image/") ? d.profile.photo : "" },
                        settings: { ...db.settings, notify: !!d.settings?.notify, notifyDays: Number(d.settings?.notifyDays) || 1, ai: !!d.settings?.ai, model: str(d.settings?.model) || "gemini-2.0-flash", apiKey: keep },
                        filter: "pending"
                    }));
                    location.reload();
                } catch { alert("That file isn't a valid StudyBuddy backup."); }
            };
            r.readAsText(f);
            e.target.value = "";
        });
        $("#reset").addEventListener("click", () => {
            if (confirm("Delete ALL your tasks, schedule and profile? This cannot be undone.")) {
                localStorage.removeItem(KEY); location.reload();
            }
        });

        draw(); fill();
    }

    /* ---------- init ---------- */
    const pages = { index: homePage, tasks: tasksPage, schedule: schedulePage, profile: profilePage };
    const run = pages[document.body.dataset.page];
    if (run) run();
    remind();
})();
