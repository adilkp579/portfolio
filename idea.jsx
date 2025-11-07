/*
IdeaShare - Single-file React component (Tailwind CSS + Framer Motion)
Features included:
- Responsive layout (mobile-first)
- Light/Dark theme toggle (persists in localStorage)
- Submit idea form (title, description, tags)
- Idea cards with upvote, save, comments count
- Inline comments modal with add/delete (stored locally)
- Search, filter by tag, sort (most recent / most upvoted)
- User avatars (initials), timestamp formatting
- LocalStorage persistence for ideas, theme, and saved ideas
- Accessibility-friendly (aria labels, keyboard focus)
- Uses Tailwind utility classes (assumes Tailwind is available in project)
- Uses Framer Motion for subtle animations

How to use:
1. Paste this file as `IdeaShare.jsx` in a React app created with Vite / Create React App.
2. Make sure Tailwind CSS is configured in your project.
3. Install framer-motion: `npm install framer-motion`
4. Import and render <IdeaShare /> in your app.

Notes: This is a single-file demo meant for prototyping. Replace localStorage persistence with an API/backend when ready.
*/

import React, { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const uid = () => Math.random().toString(36).slice(2, 9);
const now = () => new Date().toISOString();

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 30) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

const defaultIdeas = [
  {
    id: uid(),
    title: "Make library events monthly",
    description: "Organize monthly meetup sessions focusing on web security and practical labs.",
    tags: ["community", "security"],
    votes: 12,
    comments: [],
    createdAt: now(),
    author: "Adil KP",
  },
  {
    id: uid(),
    title: "Campus mentorship program",
    description: "Pair seniors with juniors for guided learning and project reviews.",
    tags: ["education", "mentorship"],
    votes: 8,
    comments: [],
    createdAt: now(),
    author: "Guest",
  },
];

export default function IdeaShare() {
  const [ideas, setIdeas] = useState(() => {
    try {
      const raw = localStorage.getItem("ideas_v1");
      return raw ? JSON.parse(raw) : defaultIdeas;
    } catch (e) {
      return defaultIdeas;
    }
  });

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [query, setQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [form, setForm] = useState({ title: "", description: "", tags: "" });
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [saved, setSaved] = useState(() => JSON.parse(localStorage.getItem("saved_v1") || "[]"));

  useEffect(() => {
    localStorage.setItem("ideas_v1", JSON.stringify(ideas));
  }, [ideas]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("saved_v1", JSON.stringify(saved));
  }, [saved]);

  const allTags = useMemo(() => {
    const s = new Set();
    ideas.forEach((i) => i.tags.forEach((t) => s.add(t)));
    return [...s];
  }, [ideas]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    const newIdea = {
      id: uid(),
      title: form.title.trim(),
      description: form.description.trim(),
      tags: form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
      votes: 0,
      comments: [],
      createdAt: now(),
      author: "Anonymous",
    };
    setIdeas((s) => [newIdea, ...s]);
    setForm({ title: "", description: "", tags: "" });
  }

  function vote(id, delta = 1) {
    setIdeas((prev) => prev.map((it) => (it.id === id ? { ...it, votes: Math.max(0, it.votes + delta) } : it)));
  }

  function addComment(ideaId, text) {
    if (!text.trim()) return;
    setIdeas((prev) => prev.map((it) => (it.id === ideaId ? { ...it, comments: [...it.comments, { id: uid(), text: text.trim(), createdAt: now(), author: "You" }] } : it)));
  }

  function removeComment(ideaId, commentId) {
    setIdeas((prev) => prev.map((it) => (it.id === ideaId ? { ...it, comments: it.comments.filter((c) => c.id !== commentId) } : it)));
  }

  function toggleSave(id) {
    setSaved((s) => (s.includes(id) ? s.filter((x) => x !== id) : [id, ...s]));
  }

  const filtered = ideas
    .filter((it) => (tagFilter ? it.tags.includes(tagFilter) : true))
    .filter((it) => (query ? (it.title + " " + it.description).toLowerCase().includes(query.toLowerCase()) : true))
    .sort((a, b) => {
      if (sortBy === "recent") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "votes") return b.votes - a.votes;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">IdeaShare</h1>
            <p className="text-sm opacity-70">Share ideas, vote, comment, and build community.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="toggle theme"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              className="p-2 rounded-lg ring-1 ring-gray-200 dark:ring-gray-800"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
            <div className="hidden md:block text-sm opacity-80">Welcome, Adil</div>
          </div>
        </header>

        <main className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <section className="md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-xs uppercase opacity-60">Share an idea</label>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" className="w-full rounded-md p-2 ring-1 ring-gray-200 dark:ring-gray-700 bg-transparent" />
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" rows={4} className="w-full rounded-md p-2 ring-1 ring-gray-200 dark:ring-gray-700 bg-transparent" />
              <input value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma separated)" className="w-full rounded-md p-2 ring-1 ring-gray-200 dark:ring-gray-700 bg-transparent" />
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow hover:scale-[1.01]">Post</button>
                <button type="button" onClick={() => setForm({ title: "", description: "", tags: "" })} className="px-4 py-2 rounded-xl ring-1 ring-gray-200 dark:ring-gray-700">Reset</button>
              </div>

              <div className="pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ideas..." className="w-full rounded-md p-2 ring-1 ring-gray-200 dark:ring-gray-700 bg-transparent" />
                <div className="flex items-center gap-2 mt-3">
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded-md p-2 ring-1 ring-gray-200 dark:ring-gray-700 bg-transparent text-sm">
                    <option value="recent">Most Recent</option>
                    <option value="votes">Top Voted</option>
                  </select>

                  <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="rounded-md p-2 ring-1 ring-gray-200 dark:ring-gray-700 bg-transparent text-sm">
                    <option value="">All tags</option>
                    {allTags.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-3 text-xs opacity-80">Hot tags:</div>
                <div className="flex gap-2 flex-wrap mt-2">
                  {allTags.slice(0, 6).map((t) => (
                    <button key={t} onClick={() => setTagFilter(t)} className="text-xs px-2 py-1 rounded-full ring-1 ring-gray-200 dark:ring-gray-700">#{t}</button>
                  ))}
                </div>
              </div>
            </form>

            <div className="mt-4 text-xs opacity-70">Saved ideas: {saved.length}</div>
          </section>

          <section className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Ideas</h2>
              <div className="text-sm opacity-70">{filtered.length} results</div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <AnimatePresence>
                {filtered.map((idea) => (
                  <motion.article key={idea.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} layout className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">{(idea.author || "A").split(" ").map(x=>x[0]).slice(0,2).join("")}</div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{idea.title}</h3>
                            <div className="text-xs opacity-70">by {idea.author} • {timeAgo(idea.createdAt)}</div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button onClick={() => vote(idea.id, 1)} aria-label="upvote" className="px-3 py-1 rounded-full ring-1 ring-gray-200 dark:ring-gray-700">▲</button>
                            <div className="text-sm w-8 text-center">{idea.votes}</div>
                            <button onClick={() => vote(idea.id, -1)} aria-label="downvote" className="px-3 py-1 rounded-full ring-1 ring-gray-200 dark:ring-gray-700">▼</button>
                          </div>
                        </div>

                        <p className="mt-3 text-sm opacity-85">{idea.description}</p>

                        <div className="flex items-center gap-2 mt-3">
                          {idea.tags.map((t) => (
                            <span key={t} className="text-xs px-2 py-1 ring-1 ring-gray-200 dark:ring-gray-700 rounded-full">#{t}</span>
                          ))}
                        </div>

                        <div className="flex items-center gap-3 mt-3">
                          <button onClick={() => setSelectedIdea(idea)} className="text-sm ring-1 ring-gray-200 dark:ring-gray-700 px-3 py-1 rounded-md">Comments ({idea.comments.length})</button>
                          <button onClick={() => toggleSave(idea.id)} className={`text-sm px-3 py-1 rounded-md ring-1 ${saved.includes(idea.id) ? "bg-indigo-600 text-white" : "ring-gray-200 dark:ring-gray-700"}`}>{saved.includes(idea.id) ? "Saved" : "Save"}</button>
                          <button onClick={() => { navigator.clipboard?.writeText(window.location.href + `#idea-${idea.id}`); }} className="text-sm px-3 py-1 rounded-md ring-1 ring-gray-200 dark:ring-gray-700">Share</button>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className="p-6 rounded-xl bg-white dark:bg-gray-800 ring-1 ring-gray-100 dark:ring-gray-800 text-center opacity-80">No ideas found — try posting one!</div>
              )}
            </div>
          </section>
        </main>

        <AnimatePresence>
          {selectedIdea && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} exit={{ scale: 0.98 }} className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-xl">{selectedIdea.title}</h3>
                    <div className="text-xs opacity-70">by {selectedIdea.author} • {timeAgo(selectedIdea.createdAt)}</div>
                  </div>
                  <button aria-label="close comments" onClick={() => setSelectedIdea(null)} className="px-3 py-1 rounded-md ring-1 ring-gray-200 dark:ring-gray-700">Close</button>
                </div>

                <p className="mt-4 text-sm opacity-90">{selectedIdea.description}</p>

                <div className="mt-4">
                  <CommentSection idea={selectedIdea} onAdd={(text) => addComment(selectedIdea.id, text)} onRemove={(cId) => removeComment(selectedIdea.id, cId)} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

function CommentSection({ idea, onAdd, onRemove }) {
  const [text, setText] = useState("");
  return (
    <div>
      <div className="space-y-3">
        {idea.comments.map((c) => (
          <div key={c.id} className="flex items-start gap-3 p-2 rounded-md ring-1 ring-gray-100 dark:ring-gray-700">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 font-bold">{(c.author||"U")[0]}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{c.author}</div>
                <div className="text-xs opacity-70">{timeAgo(c.createdAt)}</div>
              </div>
              <div className="text-sm opacity-90">{c.text}</div>
            </div>
            <button onClick={() => onRemove(c.id)} className="text-xs px-2 py-1 rounded-md ring-1 ring-gray-200 dark:ring-gray-700">Delete</button>
          </div>
        ))}

        <form onSubmit={(e) => { e.preventDefault(); onAdd(text); setText(""); }} className="mt-2 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment..." className="flex-1 rounded-md p-2 ring-1 ring-gray-200 dark:ring-gray-700 bg-transparent" />
          <button type="submit" className="px-3 py-2 rounded-md bg-indigo-600 text-white">Reply</button>
        </form>
      </div>
    </div>
  );
}
