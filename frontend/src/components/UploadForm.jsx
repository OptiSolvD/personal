import React, { useState } from 'react';

function getSavedAuth() {
  return localStorage.getItem('authHeader') || null;
}

async function doUpload(fd, extraHeaders = {}) {
  const headers = Object.assign({}, extraHeaders);
  return fetch('/api/memories/upload', {
    method: 'POST',
    body: fd,
    headers,
  });
}

export default function UploadForm({ onUpload }) {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    fd.append('title', title || 'Untitled');

    // try with saved auth header first (if any)
    let auth = getSavedAuth();
    let res = await doUpload(fd, auth ? { Authorization: auth } : {});

    // If unauthenticated, prompt for credentials and retry once
    if (res.status === 401) {
      const username = window.prompt('Username:');
      const password = window.prompt('Password:');
      if (!username || !password) {
        alert('Upload cancelled — credentials required');
        return;
      }
      auth = 'Basic ' + btoa(`${username}:${password}`);
      // save for subsequent requests
      localStorage.setItem('authHeader', auth);
      res = await doUpload(fd, { Authorization: auth });
    }

    if (!res.ok) {
      let errorMessage = res.statusText;
      try {
        const errorData = await res.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If response is not JSON, try as text
        try {
          const text = await res.text();
          if (text) {
            // Try to parse as JSON if it looks like JSON
            if (text.trim().startsWith('{')) {
              const parsed = JSON.parse(text);
              errorMessage = parsed.error || errorMessage;
            } else {
              errorMessage = text;
            }
          }
        } catch (e2) {
          // Use default error message
        }
      }
      alert('Upload failed: ' + errorMessage);
      return;
    }

    // parse JSON safely
    let data = null;
    try {
      data = await res.json();
    } catch (err) {
      // if server returned empty body but ok, inform user
      alert('Upload succeeded but server returned no JSON');
    }

    if (onUpload && data) onUpload(data);
  };

  return (
    <form onSubmit={submit}>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
      <button type="submit">Upload</button>
    </form>
  );
}
