import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GalleryPage.css';
import EditMemoryModal from './EditMemoryModal';

export default function GalleryPage() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingMemory, setEditingMemory] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await fetch('/api/memories', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!res.ok) {
        setError('Failed to load memories');
        setLoading(false);
        return;
      }

      const data = await res.json();
      setMemories(data);
      setLoading(false);
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this memory?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/memories/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to delete memory');
        return;
      }

      // Remove from state
      setMemories(memories.filter(m => m._id !== id));
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const handleEdit = (memory) => {
    setEditingMemory(memory);
  };

  const handleEditSave = async (updatedMemory) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      // If new image is provided
      if (updatedMemory.newImage) {
        formData.append('image', updatedMemory.newImage);
      }
      
      formData.append('title', updatedMemory.title);
      formData.append('description', updatedMemory.description);

      const res = await fetch(`/api/memories/${updatedMemory._id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (res.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update memory');
        return;
      }

      const data = await res.json();
      // Update in state
      setMemories(memories.map(m => m._id === updatedMemory._id ? data : m));
      setEditingMemory(null);
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  const handleImageClick = (imageUrl) => {
    setZoomedImage(imageUrl);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const username = localStorage.getItem('username');

  if (loading) {
    return (
      <div className="gallery-container">
        <div className="loading">Loading memories...</div>
      </div>
    );
  }

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <div>
          <h1 className="gallery-title">Our Moments</h1>
          <p className="gallery-subtitle">Welcome back, {username}!</p>
        </div>
        <div className="header-actions">
          <button onClick={() => navigate('/upload')} className="btn-add">
            + Add Memory
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {memories.length === 0 ? (
        <div className="empty-state">
          <p>No memories yet. Start creating beautiful moments!</p>
          <button onClick={() => navigate('/upload')} className="btn-primary">
            Create First Memory
          </button>
        </div>
      ) : (
        <div className="memories-grid">
          {memories.map((memory) => (
            <div key={memory._id} className="memory-card">
              <div 
                className="memory-image" 
                onClick={() => handleImageClick(memory.imageUrl)}
              >
                <img src={memory.imageUrl} alt={memory.title} />
                <div className="image-overlay">
                  <span className="zoom-hint">Click to zoom</span>
                </div>
              </div>
              <div className="memory-content">
                <h3 className="memory-title">{memory.title}</h3>
                {memory.description && (
                  <p className="memory-description">{memory.description}</p>
                )}
                <div className="memory-date">
                  <span className="date-icon">📅</span>
                  {formatDate(memory.createdAt)}
                </div>
                <div className="memory-actions">
                  <button 
                    onClick={() => handleEdit(memory)} 
                    className="btn-edit"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(memory._id)} 
                    className="btn-delete"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingMemory && (
        <EditMemoryModal
          memory={editingMemory}
          onClose={() => setEditingMemory(null)}
          onSave={handleEditSave}
        />
      )}

      {zoomedImage && (
        <div className="image-zoom-overlay" onClick={() => setZoomedImage(null)}>
          <div className="image-zoom-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="zoom-close" 
              onClick={() => setZoomedImage(null)}
            >
              ✕
            </button>
            <img src={zoomedImage} alt="Zoomed" />
          </div>
        </div>
      )}
    </div>
  );
}
