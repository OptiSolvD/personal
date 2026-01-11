import React, { useState, useEffect } from 'react';
import './EditMemoryModal.css';

export default function EditMemoryModal({ memory, onClose, onSave }) {
  const [title, setTitle] = useState(memory.title || '');
  const [description, setDescription] = useState(memory.description || '');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(memory.imageUrl);
  const [imagePaste, setImagePaste] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(memory.title || '');
    setDescription(memory.description || '');
    setImagePreview(memory.imageUrl);
    setImageFile(null);
    setImagePaste('');
  }, [memory]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePaste('');
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
      setImageFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let newImage = null;
      
      if (imageFile) {
        newImage = imageFile;
      } else if (imagePaste && (imagePaste.startsWith('data:image') || imagePaste.startsWith('http'))) {
        if (imagePaste.startsWith('data:image')) {
          const response = await fetch(imagePaste);
          const blob = await response.blob();
          newImage = blob;
        } else {
          const response = await fetch(imagePaste);
          const blob = await response.blob();
          newImage = blob;
        }
      }

      await onSave({
        _id: memory._id,
        title,
        description,
        newImage: newImage || undefined,
      });
      
      setLoading(false);
    } catch (err) {
      alert('Failed to save changes');
      setLoading(false);
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
      <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="edit-modal-header">
          <h2>Edit Memory</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your memory a title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write about this moment..."
              rows="4"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-image">Image (optional - leave empty to keep current)</label>
            <input
              id="edit-image"
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
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

