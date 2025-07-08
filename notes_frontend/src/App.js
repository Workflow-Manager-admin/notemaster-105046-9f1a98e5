import React, { useState, useEffect } from "react";
import "./App.css";

/**
 * Colors and theme for Notes
 * Primary: #1976d2
 * Secondary: #424242
 * Accent: #ff4081
 */

/** NOTES API base URL. Adapt as needed for environment config. */
// Backend expected at http://localhost:5000/ or update to deployed URL
const API_BASE = process.env.REACT_APP_NOTES_API || "http://localhost:5000/api/notes";

// Helper fetch with error handling
async function apiFetch(endpoint, options = {}) {
  const result = await fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!result.ok) {
    throw new Error(await result.text());
  }
  return result.json();
}

/* Note List Item Component */
function NoteCard({ note, onEdit, onDelete }) {
  return (
    <div className="note-card">
      <div className="note-meta">
        <span className="note-date">{new Date(note.updatedAt || note.createdAt).toLocaleString()}</span>
        <button className="icon-btn" title="Edit" onClick={() => onEdit(note)}><span role="img" aria-label="edit">✏️</span></button>
        <button className="icon-btn danger" title="Delete" onClick={() => onDelete(note)}><span role="img" aria-label="delete">🗑️</span></button>
      </div>
      <div className="note-title">{note.title}</div>
      <div className="note-body">{note.content}</div>
    </div>
  );
}

/* Modal for Create/Edit Note */
function NoteModal({ open, initialNote, onSave, onCancel }) {
  const [title, setTitle] = useState(initialNote?.title || "");
  const [content, setContent] = useState(initialNote?.content || "");

  useEffect(() => {
    setTitle(initialNote?.title || "");
    setContent(initialNote?.content || "");
  }, [initialNote, open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>{initialNote && initialNote.id ? "Edit Note" : "Create Note"}</h2>
        <label>
          Title
          <input
            className="input"
            type="text"
            maxLength={120}
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
            required
          />
        </label>
        <label>
          Content
          <textarea
            className="input"
            value={content}
            onChange={e => setContent(e.target.value)}
            required
            rows={8}
          />
        </label>
        <div className="modal-actions">
          <button className="btn secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn accent"
            onClick={() => onSave({ ...initialNote, title: title.trim(), content: content.trim() })}
            disabled={!title.trim()}
          >
            {initialNote && initialNote.id ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Header Component */
function AppHeader({ onNew, searchValue, setSearchValue }) {
  return (
    <header className="header">
      <div className="header-left">
        <span className="app-title">📝 NoteMaster</span>
      </div>
      <div className="header-middle">
        <input
          className="search-bar"
          type="search"
          placeholder="Search notes..."
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
        />
      </div>
      <div className="header-right">
        <button className="btn accent" onClick={onNew}>
          + New Note
        </button>
      </div>
    </header>
  );
}

// PUBLIC_INTERFACE
/**
 * Root App for NoteMaster
 */
function App() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  // Fetch notes from backend
  const fetchNotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("");
      setNotes(res || []);
    } catch (e) {
      setError("Failed to fetch notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Filter notes based on search
  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(search.toLowerCase()) ||
    note.content.toLowerCase().includes(search.toLowerCase())
  );

  // Create or edit note
  const handleSaveNote = async (note) => {
    try {
      setError(null);
      if (note.id) {
        // Edit note
        await apiFetch(`/${note.id}`, {
          method: "PUT",
          body: JSON.stringify({ title: note.title, content: note.content })
        });
      } else {
        // Create note
        await apiFetch("", {
          method: "POST",
          body: JSON.stringify({ title: note.title, content: note.content })
        });
      }
      setModalOpen(false);
      setEditingNote(null);
      await fetchNotes();
    } catch (e) {
      setError(String(e));
    }
  };

  // Delete note
  const handleDeleteNote = async (note) => {
    if (!window.confirm(`Delete note "${note.title}"?`)) return;
    try {
      setError(null);
      await apiFetch(`/${note.id}`, { method: "DELETE" });
      await fetchNotes();
    } catch (e) {
      setError("Delete failed");
    }
  };

  // Modal handlers
  const openNewModal = () => {
    setEditingNote(null);
    setModalOpen(true);
  };
  const openEditModal = (note) => {
    setEditingNote(note);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingNote(null);
  };

  return (
    <div className="notes-app">
      <AppHeader
        onNew={openNewModal}
        searchValue={search}
        setSearchValue={setSearch}
      />
      <main className="notes-main">
        {loading ? (
          <div className="status-msg">Loading notes...</div>
        ) : error ? (
          <div className="status-msg error">{error}</div>
        ) : (
          <>
            {filteredNotes.length === 0 ? (
              <div className="empty-msg">
                <span role="img" aria-label="empty">📭</span> No notes found.
              </div>
            ) : (
              <div className="notes-list">
                {filteredNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={openEditModal}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <NoteModal
        open={modalOpen}
        initialNote={editingNote}
        onSave={handleSaveNote}
        onCancel={closeModal}
      />
    </div>
  );
}

export default App;
