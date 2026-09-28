import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Format bytes into clean human readable format
function formatBytes(bytes, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Get extension from filename
function getFileExtension(filename) {
  if (!filename) return 'FILE';
  const parts = filename.split('.');
  if (parts.length <= 1) return 'FILE';
  return parts.pop().toUpperCase().slice(0, 4);
}

// Format remaining time
function formatExpiryTime(expiresAt) {
  if (!expiresAt) return '';
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}

// Safe share URL generator
function getShareUrl(id) {
  const origin = window.location.origin;
  return `${origin}/share/${id}`;
}

// Configurable API base for production / cross-origin deployments
const API_BASE = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

// Futuristic SVG Icons
const Icons = {
  Bolt: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  UploadCloud: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  ),
  File: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Download: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Check: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  Link: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
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
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  External: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState({ view: 'home', shareId: null });
  const [mousePos, setMousePos] = useState({ x: -500, y: -500 });

  // Interactive mouse glow movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Parse browser route on load / history pop
  useEffect(() => {
    function parseRoute() {
      const path = window.location.pathname;
      const search = window.location.search;
      const params = new URLSearchParams(search);

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
      {/* Sci-Fi Ambient Overlays */}
      <div className="bg-grid-overlay"></div>
      <div className="neon-nebula-1"></div>
      <div className="neon-nebula-2"></div>

      {/* Dynamic Cursor Spotlight Glow */}
      <div 
        className="mouse-spotlight"
        style={{
          left: `${mousePos.x}px`,
          top: `${mousePos.y}px`
        }}
      ></div>

      <div className="genz-app-container">
        {/* Floating Dynamic Island Navbar */}
        <div className="nav-island-wrapper">
          <header className="nav-island">
            <div className="brand-capsule" onClick={() => navigateTo('home')}>
              <div className="brand-orb-icon">
                <Icons.Bolt />
              </div>
              <span className="brand-name">
                QuickShare
                <span className="brand-dot-pulse"></span>
              </span>
            </div>

            <div className="nav-chip-badge">
              <span className="status-ring"></span>
              <span>EPHEMERAL &bull; 24H</span>
            </div>
          </header>
        </div>

        {/* Main Content Hub */}
        <main className="main-hub">
          {currentRoute.view === 'download' && currentRoute.shareId ? (
            <DownloadView 
              shareId={currentRoute.shareId} 
              onGoHome={() => navigateTo('home')} 
            />
          ) : (
            <HomeView onNavigateToDownload={(id) => navigateTo('download', id)} />
          )}
        </main>

        {/* Minimalist Sci-Fi Footer */}
        <footer className="hud-footer">
          <span>// QUICKSHARE &bull; PRIVATE P2P-STYLE TRANSFER</span>
          <span>AUTODELETE: 24.00.00 &bull; 25MB MAXIMUM</span>
        </footer>
      </div>
    </>
  );
}

// ================= GEN-Z MINIMALIST UPLOAD HUB ================= //
function HomeView({ onNavigateToDownload }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | success | error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('qr'); // 'qr' | 'link'

  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

  const handleFileSelect = (file) => {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage(`File exceeds 25 MB limit (${formatBytes(file.size)}).`);
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
          setErrorMessage(res.error || 'Failed to upload.');
        }
      } catch (err) {
        setUploadStatus('error');
        setErrorMessage('Unexpected server response.');
      }
    };

    xhr.onerror = () => {
      setUploadStatus('error');
      setErrorMessage('Network error: Could not reach backend server.');
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
      {/* High-Impact Gen-Z Typography Hero */}
      <div className="hero-hub">
        <div className="hero-neon-pill">
          <Icons.Bolt />
          <span>AUTONOMOUS TEMPORARY TRANSFER</span>
        </div>
        <h1 className="hero-big-title">
          BEAM FILES. <br />
          <span className="text-gradient-neon">INTO OBLIVION.</span>
        </h1>
        <div className="hero-meta-chips">
          <span className="tag-spec">// 25MB CAP</span>
          <span className="tag-spec">// 24H LIFESPAN</span>
          <span className="tag-spec">// NO AUTH</span>
          <span className="tag-spec">// QR READY</span>
        </div>
      </div>

      <div className="cyber-card">
        {uploadStatus === 'success' && uploadResult ? (
          /* ================= SUCCESS & QR HUB ================= */
          <div className="success-hub">
            <div className="success-pop-halo">
              <Icons.Check />
            </div>
            <h2 className="success-title-cyber">BEAM READY</h2>
            <p className="success-caption">
              <strong>{uploadResult.originalName}</strong> &bull; {formatBytes(uploadResult.size)}
            </p>

            {/* Segmented Switcher for QR vs Link */}
            <div className="segmented-tabs-row">
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'qr' ? 'active' : ''}`}
                onClick={() => setActiveTab('qr')}
              >
                <Icons.QrCode />
                <span>QR Code</span>
              </button>
              <button 
                type="button" 
                className={`tab-btn ${activeTab === 'link' ? 'active' : ''}`}
                onClick={() => setActiveTab('link')}
              >
                <Icons.Link />
                <span>Share Link</span>
              </button>
            </div>

            {/* QR Code Tab with Laser Beam */}
            {activeTab === 'qr' && (
              <div className="qr-cyber-box" id="qr-code-box">
                <div className="qr-plate">
                  <div className="qr-scanner-beam"></div>
                  <QRCodeSVG 
                    value={getShareUrl(uploadResult.id)}
                    size={168}
                    bgColor="#ffffff"
                    fgColor="#050609"
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="qr-hint-text">
                  <Icons.QrCode />
                  <span>POINT PHONE CAMERA TO DOWNLOAD DIRECTLY</span>
                </div>
              </div>
            )}

            {/* Link Tab */}
            {activeTab === 'link' && (
              <div className="cyber-link-bar">
                <input 
                  type="text" 
                  readOnly 
                  value={getShareUrl(uploadResult.id)} 
                  className="cyber-link-input"
                  id="share-link-input"
                />
                <button 
                  className={`btn-cyber-copy ${copied ? 'copied' : ''}`}
                  onClick={handleCopyLink}
                  id="copy-link-btn"
                >
                  {copied ? (
                    <>
                      <Icons.Check />
                      <span>COPIED</span>
                    </>
                  ) : (
                    <>
                      <Icons.Copy />
                      <span>COPY</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Dual Action Row */}
            <div className="success-action-row">
              <button 
                className="btn-cyber-secondary"
                onClick={() => onNavigateToDownload(uploadResult.id)}
                id="open-page-btn"
              >
                <Icons.External />
                <span>Open Page</span>
              </button>
              <button 
                className="btn-neon-cta"
                style={{ flex: 1.2, padding: '12px 18px' }}
                onClick={handleReset}
                id="beam-another-btn"
              >
                <Icons.Bolt />
                <span>Beam Another</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================= INTERACTIVE DROPZONE ================= */
          <>
            <div 
              className={`dropzone-cyber ${isDragging ? 'drag-active' : ''}`}
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
              <div className="orbit-icon-container">
                <Icons.UploadCloud />
              </div>
              <h3 className="drop-prompt">
                {isDragging ? 'RELEASE TO BEAM' : 'DROP FILE ANYWHERE'}
              </h3>
              <p className="drop-subtext">Drag & drop or tap to browse storage</p>
              
              <button 
                type="button" 
                className="btn-select-pill"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current && fileInputRef.current.click();
                }}
                id="choose-file-btn"
              >
                <Icons.File />
                <span>Browse Files</span>
              </button>
            </div>

            {/* Selected File Capsule */}
            {selectedFile && (
              <div className="file-capsule-strip" id="selected-file-capsule">
                <div className="file-capsule-left">
                  <span className="ext-badge">
                    {getFileExtension(selectedFile.name)}
                  </span>
                  <div className="file-capsule-details">
                    <span className="file-name-text" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                    <span className="file-size-spec">
                      {formatBytes(selectedFile.size)} &bull; {selectedFile.type || 'RAW BINARY'}
                    </span>
                  </div>
                </div>
                {uploadStatus !== 'uploading' && (
                  <button 
                    type="button" 
                    className="btn-file-delete"
                    onClick={handleReset}
                    title="Remove file"
                    id="remove-file-btn"
                  >
                    <Icons.Close />
                  </button>
                )}
              </div>
            )}

            {/* Fluid Laser Upload Progress */}
            {uploadStatus === 'uploading' && (
              <div className="progress-laser-box">
                <div className="progress-track-cyber">
                  <div 
                    className="progress-fill-cyber" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <div className="progress-stats-cyber">
                  <span>TRANSMITTING TO CLOUD...</span>
                  <span>{uploadProgress}%</span>
                </div>
              </div>
            )}

            {/* Error Alert */}
            {errorMessage && (
              <div className="alert-cyber-strip" id="error-alert">
                <Icons.Alert />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <button 
              className="btn-neon-cta"
              style={{ marginTop: '16px' }}
              disabled={!selectedFile || uploadStatus === 'uploading'}
              onClick={handleUpload}
              id="upload-button"
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <div className="spinner-cyber"></div>
                  <span>BEAMING {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <Icons.Bolt />
                  <span>GENERATE BEAM LINK & QR</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </>
  );
}

// ================= GEN-Z MINIMALIST DOWNLOAD HUD ================= //
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
          setError(data.error || 'Transfer link has expired or is invalid.');
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('Unable to reach QuickShare cluster. Check connection.');
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
    <div className="cyber-card" style={{ maxWidth: '480px', textAlign: 'center' }}>
      {loading ? (
        <div style={{ padding: '36px 0' }}>
          <div className="spinner-cyber" style={{ width: '32px', height: '32px', borderTopColor: '#00f0ff', margin: '0 auto 16px' }}></div>
          <p style={{ color: 'var(--text-dim)', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>
            SCANNING CLOUD REPOSITORY...
          </p>
        </div>
      ) : error ? (
        <div style={{ padding: '16px 0' }}>
          <div className="success-pop-halo" style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'var(--danger-bg)' }}>
            <Icons.Alert />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, marginBottom: '6px' }}>
            TRANSFER EXPIRED
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.86rem', marginBottom: '22px', lineHeight: 1.6 }}>
            {error}
          </p>
          <button className="btn-neon-cta" onClick={onGoHome} id="back-home-btn">
            <span>BEAM A NEW FILE</span>
          </button>
        </div>
      ) : fileData ? (
        <div>
          <div className="download-hero-icon">
            <Icons.File />
          </div>

          <h2 className="download-file-title" id="download-file-name" title={fileData.originalName}>
            {fileData.originalName}
          </h2>

          <div className="badges-hud-row">
            <span className="hud-chip">
              <strong>{formatBytes(fileData.size)}</strong>
            </span>
            <span className="hud-chip">
              <Icons.Clock />
              <span>{formatExpiryTime(fileData.expiresAt)}</span>
            </span>
            {fileData.downloadsCount !== undefined && (
              <span className="hud-chip">
                <Icons.Download />
                <span>{fileData.downloadsCount} DL</span>
              </span>
            )}
          </div>

          <button 
            className="btn-neon-cta"
            onClick={handleDownload}
            disabled={isDownloading}
            id="download-btn"
            style={{ marginBottom: '12px' }}
          >
            {isDownloading ? (
              <>
                <div className="spinner-cyber"></div>
                <span>FETCHING PAYLOAD...</span>
              </>
            ) : (
              <>
                <Icons.Download />
                <span>INITIATE DOWNLOAD</span>
              </>
            )}
          </button>

          <button 
            className="btn-cyber-secondary"
            style={{ width: '100%' }}
            onClick={onGoHome}
            id="beam-new-file-btn"
          >
            <span>BEAM ANOTHER FILE</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
