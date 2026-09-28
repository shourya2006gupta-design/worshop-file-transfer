import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Format bytes into human readable format
function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Format remaining time in a human-friendly format
function formatExpiryTime(expiresAt) {
  if (!expiresAt) return '';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

// Safe share URL generator
function getShareUrl(id) {
  const origin = window.location.origin;
  return `${origin}/share/${id}`;
}

// Configurable API base for production / cross-origin deployments
const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

// Sleek minimalist SVG Icons
const Icons = {
  UploadCloud: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  ),
  File: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Download: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Copy: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  Close: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  QrCode: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="5" height="5" x="3" y="3" rx="1" />
      <rect width="5" height="5" x="16" y="3" rx="1" />
      <rect width="5" height="5" x="3" y="16" rx="1" />
      <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
      <path d="M21 21v.01" />
      <path d="M12 7v3a2 2 0 0 1-2 2H7" />
      <path d="M3 12h.01" />
      <path d="M12 3h.01" />
      <path d="M12 16v.01" />
      <path d="M16 12h1" />
      <path d="M21 12v.01" />
      <path d="M12 21v-1" />
    </svg>
  ),
  Alert: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  External: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState({ view: 'home', shareId: null });

  // Read URL on mount and handle forward/back buttons
  useEffect(() => {
    function parseRoute() {
      const path = window.location.pathname;
      const search = window.location.search;
      const params = new URLSearchParams(search);

      // Support /share/:id or ?share=:id or ?id=:id
      const shareParam = params.get('share') || params.get('id');
      if (shareParam) {
        setCurrentRoute({ view: 'download', shareId: shareParam });
        return;
      }

      if (path.startsWith('/share/')) {
        const id = path.replace('/share/', '').trim();
        if (id) {
          setCurrentRoute({ view: 'download', shareId: id });
          return;
        }
      }

      setCurrentRoute({ view: 'home', shareId: null });
    }

    parseRoute();
    window.addEventListener('popstate', parseRoute);
    return () => window.removeEventListener('popstate', parseRoute);
  }, []);

  const navigateTo = (view, shareId = null) => {
    if (view === 'download' && shareId) {
      window.history.pushState({}, '', `/share/${shareId}`);
      setCurrentRoute({ view: 'download', shareId });
    } else {
      window.history.pushState({}, '', '/');
      setCurrentRoute({ view: 'home', shareId: null });
    }
  };

  return (
    <>
      {/* Floating Animated Mesh Orbs */}
      <div className="bg-ambient">
        <div className="ambient-orb orb-1"></div>
        <div className="ambient-orb orb-2"></div>
      </div>

      <div className="app-container">
        {/* Minimal Header */}
        <header className="nav-header">
          <div className="brand-link" onClick={() => navigateTo('home')}>
            <div className="brand-symbol">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
                <path d="M12 12v9" />
                <path d="m16 16-4-4-4 4" />
              </svg>
            </div>
            <span className="brand-text">
              QuickShare
              <span className="brand-dot"></span>
            </span>
          </div>

          <div className="nav-status">
            <span className="status-indicator"></span>
            <span>24h Ephemeral Transfers</span>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="main-wrapper">
          {currentRoute.view === 'download' && currentRoute.shareId ? (
            <DownloadView 
              shareId={currentRoute.shareId} 
              onGoHome={() => navigateTo('home')} 
            />
          ) : (
            <HomeView onNavigateToDownload={(id) => navigateTo('download', id)} />
          )}
        </main>

        {/* Minimal Footer */}
        <footer className="minimal-footer">
          <span>&copy; {new Date().getFullYear()} QuickShare &bull; Minimalist Temporary File Sharing</span>
          <span>Max 25 MB &bull; Direct P2P-style delivery</span>
        </footer>
      </div>
    </>
  );
}

// ================= MINIMALIST HOME & UPLOAD VIEW ================= //
function HomeView({ onNavigateToDownload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | success | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(true);

  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

  const handleFileSelect = (file) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`"${file.name}" is ${formatBytes(file.size)}. Maximum allowed size is 25 MB.`);
      setSelectedFile(null);
      setUploadStatus('error');
      return;
    }

    setErrorMessage('');
    setUploadStatus('idle');
    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setUploadProgress(0);
    setErrorMessage('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/upload`, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percent);
      }
    };

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.success) {
          setUploadProgress(100);
          setUploadResult(res);
          setUploadStatus('success');
        } else {
          setUploadStatus('error');
          setErrorMessage(res.error || 'Failed to upload file.');
        }
      } catch (err) {
        setUploadStatus('error');
        setErrorMessage('Unexpected server response.');
      }
    };

    xhr.onerror = () => {
      setUploadStatus('error');
      setErrorMessage('Could not connect to backend server. Make sure port 5001 is running.');
    };

    xhr.send(formData);
  };

  const handleCopyLink = () => {
    if (!uploadResult) return;
    const link = getShareUrl(uploadResult.id);
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
    setUploadResult(null);
    setCopied(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* Sleek Minimalist Hero */}
      <div className="hero-minimal">
        <div className="hero-pill">
          <span>Self-Destructs in 24 Hours</span>
        </div>
        <h1 className="hero-heading">
          Drop a file. <br />
          <span>Share with anyone.</span>
        </h1>
        <p className="hero-desc">
          Instant, anonymous temporary transfers. Up to 25 MB with direct link and QR code access.
        </p>
      </div>

      <div className="card-minimal">
        {uploadStatus === 'success' && uploadResult ? (
          /* ================= SUCCESS & QR CODE VIEW ================= */
          <div className="success-wrapper">
            <div className="success-badge-pop">
              <Icons.Check />
            </div>
            <h2 className="success-headline">Transfer Ready!</h2>
            <p className="success-sub">
              <strong>{uploadResult.originalName}</strong> ({formatBytes(uploadResult.size)})
            </p>

            {/* Share Link Row with Copy Button */}
            <div className="link-copy-container">
              <input 
                type="text" 
                readOnly 
                value={getShareUrl(uploadResult.id)} 
                className="link-input-field"
                id="share-link-input"
              />
              <button 
                className={`btn-copy-action ${copied ? 'copied' : ''}`}
                onClick={handleCopyLink}
                id="copy-link-button"
              >
                {copied ? (
                  <>
                    <Icons.Check />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Icons.Copy />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* QR Code Section with Toggle & Scanning Laser */}
            <div style={{ margin: '8px 0' }}>
              <button 
                type="button"
                className="qr-toggle-btn"
                onClick={() => setShowQrCode(!showQrCode)}
                id="toggle-qr-btn"
              >
                <Icons.QrCode />
                <span>{showQrCode ? 'Hide QR Code' : 'Show QR Code'}</span>
              </button>
            </div>

            {showQrCode && (
              <div className="qr-card-section" id="qr-code-card">
                <div className="qr-code-frame">
                  {/* Animated futuristic scan laser */}
                  <div className="qr-scanner-laser"></div>
                  <QRCodeSVG 
                    value={getShareUrl(uploadResult.id)}
                    size={164}
                    bgColor="#ffffff"
                    fgColor="#0a0d14"
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="qr-caption">
                  <Icons.QrCode />
                  <span>Scan with mobile camera to download</span>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                className="btn-action btn-action-secondary" 
                onClick={() => onNavigateToDownload(uploadResult.id)}
                id="open-download-page-btn"
              >
                <Icons.External />
                <span>Open Page</span>
              </button>
              <button 
                className="btn-action btn-action-primary" 
                onClick={handleReset}
                id="new-upload-btn"
              >
                <Icons.UploadCloud />
                <span>Send Another</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================= DRAG & DROP UPLOAD FORM ================= */
          <>
            <div 
              className={`dropzone-animated ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              id="file-dropzone"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files[0])}
                id="file-input"
              />
              <div className="dropzone-icon">
                <Icons.UploadCloud />
              </div>
              <h3 className="drop-title">
                {isDragging ? 'Release to upload' : 'Drag & drop your file here'}
              </h3>
              <p className="drop-subtitle">or choose from your device</p>
              
              <button 
                type="button" 
                className="btn-browse"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current && fileInputRef.current.click();
                }}
                id="browse-btn"
              >
                <Icons.File />
                <span>Select File</span>
              </button>
            </div>

            {/* Selected File Summary */}
            {selectedFile && (
              <div className="selected-file-strip" id="selected-file-strip">
                <div className="file-lead">
                  <div className="file-type-icon">
                    <Icons.File />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span className="file-title" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                    <span className="file-meta-sub">
                      {formatBytes(selectedFile.size)} &bull; {selectedFile.type || 'Binary file'}
                    </span>
                  </div>
                </div>
                {uploadStatus !== 'uploading' && (
                  <button 
                    type="button" 
                    className="btn-remove-file"
                    onClick={handleReset}
                    title="Remove file"
                    id="remove-file-button"
                  >
                    <Icons.Close />
                  </button>
                )}
              </div>
            )}

            {/* Shimmering Animated Progress Bar */}
            {uploadStatus === 'uploading' && (
              <div className="progress-wrap">
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="progress-labels">
                  <span>Uploading securely...</span>
                  <span>{uploadProgress}%</span>
                </div>
              </div>
            )}

            {/* Error Strip */}
            {errorMessage && (
              <div className="alert-strip" id="upload-error-alert">
                <Icons.Alert />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Upload Button */}
            <button 
              className="btn-action btn-action-primary"
              style={{ marginTop: '16px' }}
              disabled={!selectedFile || uploadStatus === 'uploading'}
              onClick={handleUpload}
              id="upload-submit-btn"
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <div className="spinner-anim"></div>
                  <span>Uploading {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <Icons.UploadCloud />
                  <span>Generate Share Link & QR</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </>
  );
}

// ================= MINIMALIST DOWNLOAD VIEW ================= //
function DownloadView({ shareId, onGoHome }) {
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');

    fetch(`${API_BASE}/api/files/${shareId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!isMounted) return;

        if (res.status === 200 && data.success) {
          setFileData(data.file);
        } else {
          setError(data.error || 'This file is no longer available or the link is invalid.');
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Unable to connect to QuickShare server.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shareId]);

  const handleDownload = () => {
    setIsDownloading(true);
    const downloadEndpoint = `${API_BASE}/api/files/${shareId}/download`;
    
    const a = document.createElement('a');
    a.href = downloadEndpoint;
    a.setAttribute('download', fileData?.originalName || 'file');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setTimeout(() => {
      setIsDownloading(false);
    }, 2000);
  };

  return (
    <div className="card-minimal" style={{ maxWidth: '480px', textAlign: 'center' }}>
      {loading ? (
        <div style={{ padding: '40px 0' }}>
          <div className="spinner-anim" style={{ width: '32px', height: '32px', margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Locating file...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '16px 0' }}>
          <div className="success-badge-pop" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'var(--danger-bg)' }}>
            <Icons.Alert />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>File Unavailable</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px', lineHeight: 1.6 }}>
            {error}
          </p>
          <button className="btn-action btn-action-primary" onClick={onGoHome} id="back-home-btn">
            <span>Upload a New File</span>
          </button>
        </div>
      ) : fileData ? (
        <div>
          <div className="download-avatar">
            <Icons.File />
          </div>

          <h2 className="download-title" id="download-file-name" title={fileData.originalName}>
            {fileData.originalName}
          </h2>

          <div className="download-badges">
            <span className="badge-tag">
              <strong>{formatBytes(fileData.size)}</strong>
            </span>
            <span className="badge-tag">
              <Icons.Clock />
              <span>{formatExpiryTime(fileData.expiresAt)}</span>
            </span>
            {fileData.downloadsCount !== undefined && (
              <span className="badge-tag">
                <Icons.Download />
                <span>{fileData.downloadsCount} download{fileData.downloadsCount === 1 ? '' : 's'}</span>
              </span>
            )}
          </div>

          <button 
            className="btn-action btn-action-primary"
            onClick={handleDownload}
            disabled={isDownloading}
            id="download-btn"
            style={{ marginBottom: '12px' }}
          >
            {isDownloading ? (
              <>
                <div className="spinner-anim"></div>
                <span>Preparing Download...</span>
              </>
            ) : (
              <>
                <Icons.Download />
                <span>Download File</span>
              </>
            )}
          </button>

          <button 
            className="btn-action btn-action-secondary"
            onClick={onGoHome}
            id="upload-own-file-btn"
          >
            <span>Send a File</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
