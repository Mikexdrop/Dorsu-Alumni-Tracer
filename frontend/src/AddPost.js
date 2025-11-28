import React, { useState } from 'react';

function AddPost({ initialPost = null, onCreated = null, onUpdated = null, onClose = null }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    handleNewImages(files);
  };

  const handleNewImages = (files) => {
    const newImages = [...images];
    const newPreviews = [...imagePreviews];

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        newImages.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({
            url: reader.result,
            name: file.name
          });
          setImagePreviews([...newPreviews]);
        };
        reader.readAsDataURL(file);
      }
    });

    setImages(newImages);
  };

  const handleRemoveImage = (index) => {
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    handleNewImages(files);
  };

  // State to control confirmation overlay
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Minimal toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const showToast = (message, type = 'info', duration = 3500) => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'info' }), duration);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Open confirmation overlay instead of immediately submitting
    setShowConfirm(true);
  };

  // When initialPost is provided (edit mode), prefill the form
  React.useEffect(() => {
    if (initialPost) {
      setTitle(initialPost.title || '');
      setContent(initialPost.content || initialPost.body || '');
      // images from server cannot be directly appended to FormData; leave images empty for now
      setImagePreviews((initialPost.images || []).map(im => ({ url: im.image, name: '' })));
    }
  }, [initialPost]);

  const confirmSubmit = async () => {
    // Create FormData object to handle file upload
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);

    // Append all images to formData
    images.forEach((image, index) => {
      formData.append(`images[${index}]`, image);
    });

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Token ${token}` } : {};
      let response;
      if (initialPost && initialPost.id) {
        // Update existing post using PATCH
        response = await fetch(`/api/posts/${initialPost.id}/`, {
          method: 'PATCH',
          headers,
          body: formData
        });
      } else {
        response = await fetch(`/api/posts/`, {
          method: 'POST',
          headers,
          body: formData,
        });
      }

      if (response.ok) {
        const data = await response.json().catch(() => null);
        // Clear form after successful submission (for new posts)
        if (!initialPost) {
          setTitle('');
          setContent('');
          setImages([]);
          setImagePreviews([]);
        }
        setShowConfirm(false);
        showToast(initialPost ? 'Post updated successfully!' : 'Post published successfully!', 'success');
        // Notify parent
        try {
          if (initialPost && onUpdated) onUpdated(data);
          if (!initialPost && onCreated) onCreated(data);
        } catch (_) {}
        if (onClose) onClose();
      } else {
        setShowConfirm(false);
        showToast('Failed to publish post', 'error');
      }
    } catch (error) {
      console.error('Error publishing post:', error);
      setShowConfirm(false);
      showToast('Error publishing post', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-post-container" style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    }}>
      <style>
        {`
          .add-post-container input[type="text"],
          .add-post-container textarea {
            transition: border-color 0.3s, box-shadow 0.3s;
          }
          
          .add-post-container input[type="text"]:focus,
          .add-post-container textarea:focus {
            border-color: #4CAF50;
            box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
            outline: none;
          }

          .image-upload-container {
            border: 2px dashed #ccc;
            padding: 20px;
            text-align: center;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .image-upload-container:hover,
          .image-upload-container.dragging {
            border-color: #4CAF50;
            background-color: rgba(76, 175, 80, 0.05);
          }
          
          .image-upload-container.dragging {
            border-style: solid;
            background-color: rgba(76, 175, 80, 0.1);
          }

          .submit-button {
            transition: transform 0.2s, box-shadow 0.2s;
          }

          .submit-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(76, 175, 80, 0.2);
          }

          .card-container {
            animation: fadeIn 0.5s ease-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <h2 style={{
        fontSize: '2rem',
        color: '#1a237e',
        marginBottom: '8px'
      }}>Create New Post</h2>
      <p style={{
        color: '#666',
        marginBottom: '24px'
      }}>Share announcements, news, or events with the alumni community</p>

      <div className="card-container" style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontWeight: '500'
            }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#f8f9fa'
              }}
              placeholder="Enter an engaging title"
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontWeight: '500'
            }}>Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                backgroundColor: '#f8f9fa',
                minHeight: '200px',
                resize: 'vertical'
              }}
              placeholder="Write your post content here..."
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontWeight: '500'
            }}>Images</label>
            <div 
              className={`image-upload-container ${isDragging ? 'dragging' : ''}`}
              onClick={() => document.getElementById('image-upload').click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isDragging ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
              }}
            >
              <div>
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#666"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ margin: '0 auto 16px' }}
                >
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                  <path d="M16 5V3" />
                  <path d="M8 9l4 4 4-4" />
                  <path d="M12 13V3" />
                </svg>
                <div>Click or drag images here to upload</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>
                  Support for JPG, PNG, GIF
                </div>
              </div>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageChange}
                multiple
                style={{ display: 'none' }}
              />
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div style={{
                marginTop: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '16px',
              }}>
                {imagePreviews.map((preview, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      aspectRatio: '1',
                    }}
                  >
                    <img
                      src={preview.url}
                      alt={`Preview ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(255, 255, 255, 0.9)',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(index);
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ff4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="submit-button"
            style={{
              padding: '14px 28px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%'
            }}
          >
            Publish Post
          </button>
        </form>
      </div>

      {/* Confirmation Overlay */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ marginTop: 0, color: '#1a237e' }}>Confirm Publish</h3>
            <p style={{ color: '#444' }}>Are you sure you want to publish this post?</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #ccc',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                disabled={submitting}
                aria-busy={submitting}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: submitting ? '#81C784' : '#4CAF50',
                  color: '#fff',
                  cursor: submitting ? 'not-allowed' : 'pointer'
                }}
              >
                {submitting ? 'Publishing...' : 'Confirm & Publish'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast.visible && (
        <div style={{
          position: 'fixed',
          right: '20px',
          top: '20px',
          zIndex: 10000,
          minWidth: '220px',
          padding: '12px 16px',
          borderRadius: '8px',
          color: '#fff',
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
          background: toast.type === 'success' ? '#2e7d32' : (toast.type === 'error' ? '#c62828' : '#1565c0')
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default AddPost;