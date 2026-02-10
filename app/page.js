'use client';

import { useMemo, useState } from 'react';
import styles from './page.module.css';
import { useLocalStorage } from './hooks/useLocalStorage';

const STORAGE_KEY = 'pocket-notes:v1';

function normalizeTags(source) {
  if (!source) return [];
  const items = Array.isArray(source) ? source : source.split(',');
  return Array.from(
    new Set(
      items
        .map((tag) => (tag || '').toString().trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function formatTimestamp(value) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  return formatter.format(new Date(value));
}

function createNote({ title, body, tags }) {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    title: title.trim(),
    body: body.trim(),
    tags: normalizeTags(tags),
    createdAt: new Date().toISOString()
  };
}

function SearchControls({
  searchTerm,
  onSearch,
  allTags,
  activeTags,
  onToggleTag,
  onClearFilters
}) {
  const hasActiveFilters = activeTags.length > 0 || searchTerm.trim().length > 0;
  return (
    <div className={styles.notesCard}>
      <div className={styles.searchBar}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="20" y1="20" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={styles.searchInput}
          placeholder="Search notes…"
          value={searchTerm}
          onChange={(event) => onSearch(event.target.value)}
        />
        {hasActiveFilters ? (
          <button type="button" className={styles.clearButton} onClick={onClearFilters}>
            Clear
          </button>
        ) : null}
      </div>
      <div>
        <span className={styles.label}>Filter by tags</span>
        <div className={styles.tagsSection}>
          {allTags.length === 0 ? (
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Add tags to your notes to filter them here.</span>
          ) : (
            allTags.map((tag) => {
              const isActive = activeTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.tagChip} ${isActive ? styles.tagChipActive : ''}`}
                  onClick={() => onToggleTag(tag)}
                >
                  #{tag}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function NoteEditor({ onCreate, suggestedTags }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tagInput, setTagInput] = useState('');

  const tagSuggestions = useMemo(() => suggestedTags.slice(0, 10), [suggestedTags]);

  const canSubmit = title.trim().length > 0 || body.trim().length > 0;

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    const tags = normalizeTags(tagInput);
    onCreate(
      createNote({
        title,
        body,
        tags
      })
    );
    setTitle('');
    setBody('');
    setTagInput('');
  }

  function toggleSuggestedTag(tag) {
    const tagSet = new Set(normalizeTags(tagInput));
    if (tagSet.has(tag)) {
      tagSet.delete(tag);
    } else {
      tagSet.add(tag);
    }
    setTagInput(Array.from(tagSet).join(', '));
  }

  return (
    <form className={styles.editorCard} onSubmit={handleSubmit}>
      <div className={styles.header} style={{ marginBottom: 0 }}>
        <h2 className={styles.title} style={{ fontSize: '1.4rem' }}>
          New note
        </h2>
        <p className={styles.subtitle} style={{ fontSize: '0.95rem' }}>
          Capture ideas quickly. Add tags to group related thoughts instantly.
        </p>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="note-title">
          Title
        </label>
        <input
          id="note-title"
          className={styles.input}
          placeholder="Give your note a title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="note-body">
          Note
        </label>
        <textarea
          id="note-body"
          className={styles.textarea}
          placeholder="Write your note…"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.label} htmlFor="note-tags">
          Tags
        </label>
        <input
          id="note-tags"
          className={styles.input}
          placeholder="Comma separated e.g. work, ideas, errands"
          value={tagInput}
          onChange={(event) => setTagInput(event.target.value)}
        />
        {tagSuggestions.length > 0 ? (
          <div className={styles.tagsSection}>
            {tagSuggestions.map((tag) => {
              const normalizedTags = normalizeTags(tagInput);
              const isActive = normalizedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`${styles.tagChip} ${isActive ? styles.tagChipActive : ''}`}
                  onClick={() => toggleSuggestedTag(tag)}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      <div className={styles.buttonRow}>
        <button className={styles.primaryButton} type="submit" disabled={!canSubmit}>
          Save note
        </button>
      </div>
    </form>
  );
}

function NotesList({ notes, onDelete, onActivateTag }) {
  if (notes.length === 0) {
    return (
      <div className={`${styles.notesCard} ${styles.emptyState}`}>
        <div className={styles.emptyIllustration}>📝</div>
        <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem' }}>No notes yet</h3>
        <p style={{ margin: 0, fontSize: '0.95rem' }}>
          Create your first note to start building your personal knowledge bank.
        </p>
      </div>
    );
  }

  return (
    <div className={`${styles.notesCard} ${styles.notesList}`}>
      {notes.map((note) => (
        <article key={note.id} className={styles.noteCard}>
          <div className={styles.noteHeader}>
            {note.title ? <h3 className={styles.noteTitle}>{note.title}</h3> : null}
            <span className={`${styles.noteMeta} ${styles.timestamp}`}>
              {formatTimestamp(note.createdAt)}
            </span>
          </div>
          {note.body ? <p className={styles.noteBody}>{note.body}</p> : null}
          {note.tags.length > 0 ? (
            <div className={styles.noteTags}>
              {note.tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={styles.noteTag}
                  onClick={() => onActivateTag(tag)}
                  style={{ border: 'none', background: 'rgba(99, 102, 241, 0.16)', cursor: 'pointer' }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          ) : null}
          <div className={styles.noteFooter}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Tap a tag to filter matching notes.</span>
            <button className={styles.deleteButton} type="button" onClick={() => onDelete(note.id)}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

export default function Page() {
  const [notes, setNotes] = useLocalStorage(STORAGE_KEY, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTags, setActiveTags] = useState([]);

  const allTags = useMemo(() => {
    const tagSet = new Set();
    notes.forEach((note) => note.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return notes
      .filter((note) => {
        if (term.length > 0) {
          const matchesTerm = [note.title, note.body, note.tags.join(' ')].some((field) =>
            (field || '').toLowerCase().includes(term)
          );
          if (!matchesTerm) {
            return false;
          }
        }
        if (activeTags.length === 0) {
          return true;
        }
        return activeTags.every((tag) => note.tags.includes(tag));
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [notes, searchTerm, activeTags]);

  function handleCreate(note) {
    setNotes((prev) => [note, ...prev]);
  }

  function handleDelete(id) {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  function toggleTag(tag) {
    setActiveTags((prev) => (prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]));
  }

  function activateTag(tag) {
    setActiveTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  }

  function clearFilters() {
    setSearchTerm('');
    setActiveTags([]);
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pocket Notes</h1>
        <p className={styles.subtitle}>
          A lightweight mobile-first notebook with instant search and tag filters to keep your ideas organized wherever inspiration strikes.
        </p>
      </header>
      <div className={styles.layout}>
        <NoteEditor onCreate={handleCreate} suggestedTags={allTags} />
        <div style={{ flex: 1.6, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SearchControls
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            allTags={allTags}
            activeTags={activeTags}
            onToggleTag={toggleTag}
            onClearFilters={clearFilters}
          />
          <NotesList notes={filteredNotes} onDelete={handleDelete} onActivateTag={activateTag} />
        </div>
      </div>
    </main>
  );
}
