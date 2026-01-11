import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UploadPage.css';

export default function UploadPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imagePaste, setImagePaste] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePaste(''); // Clear paste if file selected
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasteChange = (e) => {
    const value = e.target.value;
    setImagePaste(value);
    if (value.startsWith('data:image') || value.startsWith('http')) {
      setImagePreview(value);
      setImageFile(null); // Clear file if paste used
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const formData = new FormData();
      
      // Handle file upload
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imagePaste && (imagePaste.startsWith('data:image') || imagePaste.startsWith('http'))) {
        // If it's a data URL, convert to blob
        if (imagePaste.startsWith('data:image')) {
          const response = await fetch(imagePaste);
          const blob = await response.blob();
          formData.append('image', blob, 'pasted-image.png');
        } else {
          // If it's a URL, fetch and convert
          const response = await fetch(imagePaste);
          const blob = await response.blob();
          formData.append('image', blob, 'url-image.png');
        }
      } else {
        setError('Please select an image file or paste an image URL/data URL');
        setLoading(false);
        return;
      }

      formData.append('title', title || 'Untitled');
      formData.append('description', description || '');

      const res = await fetch('/api/memories/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        setError(data.error || 'Upload failed');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTitle('');
      setDescription('');
      setImageFile(null);
      setImagePreview(null);
      setImagePaste('');
      
      setTimeout(() => {
        navigate('/gallery');
      }, 1500);
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-content">
        <div className="upload-header">
          <h1 className="upload-title">Raj loves Saloni</h1>
          <p className="upload-subtitle">Share a beautiful moment</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Memory saved successfully! Redirecting...</div>}

          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your memory a title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write about this moment..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image">Image</label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="file-input"
            />
            <p className="form-hint">OR paste image URL or data URL below</p>
            <input
              type="text"
              value={imagePaste}
              onChange={handlePasteChange}
              placeholder="Paste image URL or data URL here"
              className="paste-input"
            />
          </div>

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/gallery')}
              className="btn-secondary"
            >
              View Memories
            </button>
            <button type="submit" className="btn-primary" disabled={loading || !imagePreview}>
              {loading ? 'Uploading...' : 'Save Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

