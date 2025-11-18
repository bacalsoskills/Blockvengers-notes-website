import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useNotifications, NotificationContainer } from '../hooks/useNotifications.jsx'
import { useTheme } from '../hooks/useTheme'

function getSession() {
  try { return JSON.parse(localStorage.getItem('session')) } catch { return null }
}

function getProfile() {
  try { 
    const profile = localStorage.getItem('userProfile')
    return profile ? JSON.parse(profile) : null
  } catch { 
    return null 
  }
}

function getNotes() {
  try {
    const notes = localStorage.getItem('notes')
    return notes ? JSON.parse(notes) : []
  } catch {
    return []
  }
}

function getTrash() {
  try {
    const trash = localStorage.getItem('trash')
    return trash ? JSON.parse(trash) : []
  } catch {
    return []
  }
}

export default function Profile() {
  const navigate = useNavigate()
  const session = getSession()
  const email = session?.email
  const fileInputRef = useRef(null)
  const { notifications, addNotification, removeNotification } = useNotifications()
  const { isDark, toggleTheme } = useTheme()

  const [profile, setProfile] = useState(getProfile())
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    theme: 'dark',
    notifications: true,
    autoSave: true
  })
  const [imageUploading, setImageUploading] = useState(false)

  // Initialize profile if it doesn't exist
  useEffect(() => {
    if (email && !profile) {
      const defaultProfile = {
        email: email,
        displayName: email.split('@')[0],
        bio: '',
        location: '',
        website: '',
        avatar: generateAvatar(email),
        joinedAt: Date.now(),
        theme: isDark ? 'dark' : 'light',
        notifications: true,
        autoSave: true,
        lastActive: Date.now()
      }
      setProfile(defaultProfile)
      localStorage.setItem('userProfile', JSON.stringify(defaultProfile))
    }
  }, [email, profile, isDark])

  // Update last active timestamp
  useEffect(() => {
    if (profile) {
      const updated = { ...profile, lastActive: Date.now() }
      setProfile(updated)
      localStorage.setItem('userProfile', JSON.stringify(updated))
    }
  }, [])

  // Initialize edit form when editing starts
  useEffect(() => {
    if (isEditing && profile) {
      setEditForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        theme: profile.theme || 'dark',
        notifications: profile.notifications !== false,
        autoSave: profile.autoSave !== false
      })
    }
  }, [isEditing, profile])

  // Calculate statistics
  const stats = useMemo(() => {
    const notes = getNotes()
    const trash = getTrash()
    
    const totalNotes = notes.length
    const favoritesCount = notes.filter(n => n.favorite).length
    const pinnedCount = notes.filter(n => n.pinned).length
    const deletedCount = trash.length
    
    const categories = new Set()
    const allTags = []
    notes.forEach(note => {
      if (note.category) categories.add(note.category)
      if (note.tags) allTags.push(...note.tags)
    })
    
    const tagCounts = {}
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
    
    const mostUsedTag = Object.keys(tagCounts).reduce((a, b) => 
      tagCounts[a] > tagCounts[b] ? a : b, null
    )
    
    const recentActivity = notes
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
      .slice(0, 5)
    
    return {
      totalNotes,
      favoritesCount,
      pinnedCount,
      deletedCount,
      categoriesCount: categories.size,
      tagsCount: Object.keys(tagCounts).length,
      mostUsedTag,
      recentActivity
    }
  }, [])

  const handleSaveProfile = () => {
    if (!profile) return
    
    const updatedProfile = {
      ...profile,
      ...editForm,
      updatedAt: Date.now()
    }
    
    setProfile(updatedProfile)
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
    setIsEditing(false)
    addNotification('Profile updated successfully!', 'success')
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addNotification('Please select a valid image file', 'error')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification('Image size must be less than 5MB', 'error')
      return
    }

    setImageUploading(true)

    try {
      // Convert to base64 for localStorage storage
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageData = e.target.result
        const updatedProfile = {
          ...profile,
          avatar: {
            ...profile.avatar,
            image: imageData,
            type: 'image'
          },
          updatedAt: Date.now()
        }
        
        setProfile(updatedProfile)
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
        setImageUploading(false)
        addNotification('Profile picture updated!', 'success')
      }
      
      reader.onerror = () => {
        setImageUploading(false)
        addNotification('Failed to upload image', 'error')
      }
      
      reader.readAsDataURL(file)
    } catch (error) {
      setImageUploading(false)
      addNotification('Failed to upload image', 'error')
    }
  }

  const handleRemoveImage = () => {
    const updatedProfile = {
      ...profile,
      avatar: {
        ...generateAvatar(email),
        type: 'initials'
      },
      updatedAt: Date.now()
    }
    
    setProfile(updatedProfile)
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
    addNotification('Profile picture removed', 'info')
  }

  const toggleNotifications = () => {
    const newValue = !profile.notifications
    const updatedProfile = {
      ...profile,
      notifications: newValue,
      updatedAt: Date.now()
    }
    
    setProfile(updatedProfile)
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
    
    addNotification(
      `Notifications ${newValue ? 'enabled' : 'disabled'}`, 
      'success'
    )
  }

  const toggleAutoSave = () => {
    const newValue = !profile.autoSave
    const updatedProfile = {
      ...profile,
      autoSave: newValue,
      updatedAt: Date.now()
    }
    
    setProfile(updatedProfile)
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
    
    // Update global auto-save setting
    localStorage.setItem('autoSaveEnabled', JSON.stringify(newValue))
    
    addNotification(
      `Auto-save ${newValue ? 'enabled' : 'disabled'}`, 
      'success'
    )
  }

  const handleThemeToggle = () => {
    console.log('Theme toggle clicked. Current isDark:', isDark)
    
    // Calculate new theme before calling toggleTheme
    const newTheme = isDark ? 'light' : 'dark'
    console.log('New theme will be:', newTheme)
    
    // Toggle the global theme
    toggleTheme()
    
    // Update profile with new theme
    const updatedProfile = {
      ...profile,
      theme: newTheme,
      updatedAt: Date.now()
    }
    
    setProfile(updatedProfile)
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile))
    
    addNotification(
      `Theme changed to ${newTheme} mode`, 
      'success'
    )
    
    console.log('Theme toggle complete')
  }

  const handleLogout = () => {
    localStorage.removeItem('session')
    localStorage.removeItem('userProfile')
    navigate('/login')
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This will remove all your data permanently.')) {
      localStorage.removeItem('session')
      localStorage.removeItem('userProfile')
      localStorage.removeItem('notes')
      localStorage.removeItem('trash')
      navigate('/login')
    }
  }

  const generateAvatar = (email) => {
    // Generate a simple avatar based on email
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF7F50', '#87CEEB']
    const index = email.charCodeAt(0) % colors.length
    return {
      backgroundColor: colors[index],
      initials: email.slice(0, 2).toUpperCase()
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTimeAgo = (timestamp) => {
    const diff = Date.now() - timestamp
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  if (!email) {
    return (
      <motion.section 
        className="page profile"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div className="profile-login-prompt">
          <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <h2>Profile Access Required</h2>
          <p>Please log in to view and manage your profile.</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/login')}
          >
            Go to Login
          </button>
        </motion.div>
      </motion.section>
    )
  }

  return (
    <motion.section 
      className="page profile"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <NotificationContainer 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      <div className="profile-container">
        {/* Profile Header */}
        <motion.div 
          className="profile-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="profile-avatar">
            <div 
              className="avatar-circle"
              style={{ 
                backgroundColor: profile?.avatar?.image ? 'transparent' : profile?.avatar?.backgroundColor 
              }}
            >
              {profile?.avatar?.image ? (
                <img 
                  src={profile.avatar.image} 
                  alt="Profile" 
                  className="avatar-image"
                />
              ) : (
                profile?.avatar?.initials || email.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="profile-status online">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <circle cx="6" cy="6" r="6"/>
              </svg>
            </div>
            
            {/* Image Upload Controls */}
            <div className="avatar-controls">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button
                className="avatar-upload-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                title="Upload profile picture"
              >
                {imageUploading ? (
                  <svg className="spinner-small" width="16" height="16" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
                    <circle cx="12" cy="13" r="3"></circle>
                  </svg>
                )}
              </button>
              
              {profile?.avatar?.image && (
                <button
                  className="avatar-remove-btn"
                  onClick={handleRemoveImage}
                  title="Remove profile picture"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className="profile-info">
            <h1>{profile?.displayName || email.split('@')[0]}</h1>
            <p className="profile-email">{email}</p>
            {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
            
            <div className="profile-meta">
              {profile?.location && (
                <span className="profile-meta-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  {profile.location}
                </span>
              )}
              
              {profile?.website && (
                <span className="profile-meta-item">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    {profile.website}
                  </a>
                </span>
              )}
              
              <span className="profile-meta-item">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 2v4l3 3"></path>
                  <circle cx="12" cy="12" r="10"></circle>
                </svg>
                Joined {formatDate(profile?.joinedAt || Date.now())}
              </span>
            </div>
          </div>

          <div className="profile-actions">
            <button 
              className="btn-secondary"
              onClick={() => setIsEditing(!isEditing)}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </motion.div>

        {/* Edit Profile Form */}
        <AnimatePresence>
          {isEditing && (
            <motion.div
              className="profile-edit-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3>Edit Profile</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      displayName: e.target.value
                    }))}
                    placeholder="Your display name"
                  />
                </div>
                
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      location: e.target.value
                    }))}
                    placeholder="Your location"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      bio: e.target.value
                    }))}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
                
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      website: e.target.value
                    }))}
                    placeholder="https://your-website.com"
                  />
                </div>
                
                <div className="form-group">
                  <label>Theme</label>
                  <select
                    value={editForm.theme}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      theme: e.target.value
                    }))}
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
                
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editForm.notifications}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        notifications: e.target.checked
                      }))}
                    />
                    <span className="checkmark"></span>
                    Email Notifications
                  </label>
                </div>
                
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={editForm.autoSave}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        autoSave: e.target.checked
                      }))}
                    />
                    <span className="checkmark"></span>
                    Auto-save notes
                  </label>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleSaveProfile}
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Tabs */}
        {!isEditing && (
          <>
            <div className="profile-tabs">
              <button 
                className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                Activity
              </button>
              <button 
                className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </button>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  className="tab-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-icon notes">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </div>
                      <div className="stat-info">
                        <h3>{stats.totalNotes}</h3>
                        <p>Total Notes</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon favorites">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      </div>
                      <div className="stat-info">
                        <h3>{stats.favoritesCount}</h3>
                        <p>Favorites</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon pinned">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 17v5M5 17h14l-1-7H6l-1 7zM9 10V4a3 3 0 0 1 6 0v6"></path>
                        </svg>
                      </div>
                      <div className="stat-info">
                        <h3>{stats.pinnedCount}</h3>
                        <p>Pinned</p>
                      </div>
                    </div>

                    <div className="stat-card">
                      <div className="stat-icon categories">
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                      </div>
                      <div className="stat-info">
                        <h3>{stats.categoriesCount}</h3>
                        <p>Categories</p>
                      </div>
                    </div>
                  </div>

                  {stats.mostUsedTag && (
                    <div className="insight-card">
                      <h4>Most Used Tag</h4>
                      <span className="tag-highlight">#{stats.mostUsedTag}</span>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div
                  key="activity"
                  className="tab-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="activity-section">
                    <h4>Recent Activity</h4>
                    {stats.recentActivity.length > 0 ? (
                      <div className="activity-list">
                        {stats.recentActivity.map((note, index) => (
                          <div key={note.id || index} className="activity-item">
                            <div className="activity-icon">
                              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                              </svg>
                            </div>
                            <div className="activity-content">
                              <p>
                                <strong>{note.title || 'Untitled'}</strong>
                              </p>
                              <small>{formatTimeAgo(note.updatedAt || note.createdAt)}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-state-text">No recent activity</p>
                    )}

                    <div className="activity-stats">
                      <div className="activity-stat">
                        <span className="stat-label">Last Active:</span>
                        <span className="stat-value">
                          {formatTimeAgo(profile?.lastActive || Date.now())}
                        </span>
                      </div>
                      <div className="activity-stat">
                        <span className="stat-label">Account Created:</span>
                        <span className="stat-value">
                          {formatDate(profile?.joinedAt || Date.now())}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  className="tab-content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <div className="settings-section">
                    <h4>Account Settings</h4>
                    
                    <div className="setting-item">
                      <div className="setting-info">
                        <h5>Theme</h5>
                        <p>Choose your preferred theme</p>
                      </div>
                      <div className="setting-control">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={isDark}
                            onChange={handleThemeToggle}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className="setting-status">
                          {isDark ? 'DARK' : 'LIGHT'}
                        </span>
                      </div>
                    </div>

                    <div className="setting-item">
                      <div className="setting-info">
                        <h5>Notifications</h5>
                        <p>Receive email notifications for important updates</p>
                      </div>
                      <div className="setting-control">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={profile?.notifications !== false}
                            onChange={toggleNotifications}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className="setting-status">
                          {profile?.notifications ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>

                    <div className="setting-item">
                      <div className="setting-info">
                        <h5>Auto-save</h5>
                        <p>Automatically save notes as you type</p>
                      </div>
                      <div className="setting-control">
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={profile?.autoSave !== false}
                            onChange={toggleAutoSave}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className="setting-status">
                          {profile?.autoSave ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="danger-zone">
                    <h4>Danger Zone</h4>
                    
                    <div className="danger-actions">
                      <button 
                        className="btn-danger"
                        onClick={handleLogout}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        Sign Out
                      </button>

                      <button 
                        className="btn-danger"
                        onClick={handleDeleteAccount}
                      >
                        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        Delete Account
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.section>
  )
}


