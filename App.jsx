import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

// Single-file starter React app (Tailwind CSS assumed in project)
// Purpose: legal file-sharing for user-uploaded content (indie games, demos, patches, open-source assets).
// IMPORTANT: This project is for legal content only. Do NOT use to distribute copyrighted/pirated material.

export default function App() {
  const [user, setUser] = useState(null); // mock auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (user) fetchFiles();
  }, [user]);

  async function fetchFiles() {
    try {
      const res = await fetch("/api/files", { headers: { Authorization: user?.token || '' } });
      if (!res.ok) throw new Error("Failed to fetch files");
      const data = await res.json();
      setFiles(data.files);
    } catch (err) {
      console.error(err);
      setMessage("Could not load files.");
    }
  }

  // Mock login — replace with real auth flow (JWT/OAuth)
  function handleLogin(e) {
    e.preventDefault();
    // VERY simple mock: in prod call /api/auth/login
    setUser({ email, token: "mock-token-123" });
    setEmail("");
    setPassword("");
  }

  function handleLogout() {
    setUser(null);
    setFiles([]);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFile) return setMessage("Choose a file first.");
    setUploading(true);
    setProgress(0);
    setMessage("");

    // Use fetch + FormData. For real large files prefer direct-to-cloud (S3 multipart) to avoid server memory limits.
    const fd = new FormData();
    fd.append("file", selectedFile);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload", true);
      xhr.setRequestHeader("Authorization", user.token);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) {
          const pct = Math.round((ev.loaded / ev.total) * 100);
          setProgress(pct);
        }
      };
      xhr.onload = async () => {
        setUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          setMessage("Upload complete!");
          setSelectedFile(null);
          fetchFiles();
        } else {
          setMessage("Upload failed: " + xhr.statusText);
        }
      };
      xhr.onerror = () => {
        setUploading(false);
        setMessage("Network error during upload.");
      };
      xhr.send(fd);
    } catch (err) {
      setUploading(false);
      setMessage("Upload error: " + err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-slate-100 p-6">
      <header className="max-w-4xl mx-auto flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Legal GameShare</h1>
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm opacity-80">{user.email}</span>
              <button onClick={handleLogout} className="bg-slate-700 px-3 py-1 rounded-lg text-sm hover:bg-slate-600">Logout</button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="flex gap-2 items-center">
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="px-3 py-1 rounded bg-slate-700 text-sm" required />
              <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="px-3 py-1 rounded bg-slate-700 text-sm" required />
              <button type="submit" className="bg-indigo-600 px-3 py-1 rounded text-sm hover:bg-indigo-500">Login</button>
            </form>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-slate-700 p-6 rounded-xl shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Upload a file (legal content only)</h2>
          <p className="text-sm opacity-80 mb-4">Share demos, patches, indie builds, or open-source game assets. Do not upload copyrighted or pirated material.</p>

          {user ? (
            <form onSubmit={handleUpload} className="flex flex-col gap-3">
              <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="text-sm" />

              {uploading ? (
                <div>
                  <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden">
                    <div style={{ width: `${progress}%` }} className="h-2 rounded-full bg-gradient-to-r from-indigo-400 to-emerald-400" />
                  </div>
                  <div className="text-xs mt-2">Uploading — {progress}%</div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button className="bg-emerald-500 px-4 py-2 rounded hover:brightness-110">Upload</button>
                  <button type="button" onClick={() => setSelectedFile(null)} className="bg-slate-600 px-4 py-2 rounded">Clear</button>
                </div>
              )}

              {message && <div className="text-sm mt-1 text-amber-200">{message}</div>}
            </form>
          ) : (
            <div className="text-sm opacity-80">Please log in to upload files.</div>
          )}
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid gap-4">
          <h3 className="text-lg font-semibold">Available files</h3>

          {files.length === 0 ? (
            <div className="p-6 bg-slate-700 rounded">No files uploaded yet.</div>
          ) : (
            files.map((f) => (
              <motion.div key={f.id} whileHover={{ scale: 1.01 }} className="p-4 bg-slate-700 rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{f.name}</div>
                  <div className="text-xs opacity-80">{(f.size / (1024*1024)).toFixed(2)} MB • uploaded by {f.uploaderEmail || 'anonymous'}</div>
                </div>
                <div className="flex gap-2 items-center">
                  <a href={`/api/download/${f.id}`} className="text-sm bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-500">Download</a>
                  <button onClick={() => alert('Preview not implemented in starter') } className="text-sm bg-slate-600 px-3 py-1 rounded">Preview</button>
                </div>
              </motion.div>
            ))
          )}
        </motion.section>

        <footer className="mt-8 text-sm opacity-80">This starter app is intended for legal sharing only. Maintain appropriate licensing and permissions for any content you upload.</footer>
      </main>
    </div>
  );
}
