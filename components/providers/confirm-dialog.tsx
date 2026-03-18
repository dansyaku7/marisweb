"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

// --- TIPE DATA ---
interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'info';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

// --- COMPONENT PROVIDER ---
export const ConfirmProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      setIsOpen(true);
      resolveRef.current = resolve;
    });
  }, []);

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(value);
      resolveRef.current = null;
    }
  };

  const isDanger = options.variant === 'danger';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* ---- MODAL CONFIRM ---- */}
      {isOpen && (
        <>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');

            .cd-overlay {
              position: fixed;
              inset: 0;
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background: rgba(0,0,0,0.80);
              backdrop-filter: blur(8px);
              -webkit-backdrop-filter: blur(8px);
              animation: cd-bg-in 0.18s ease both;
            }
            @keyframes cd-bg-in {
              from { opacity: 0; }
              to   { opacity: 1; }
            }

            .cd-modal {
              font-family: 'Syne', sans-serif;
              background: #111;
              border: 1px solid #1E1E1E;
              border-radius: 18px;
              width: 100%;
              max-width: 400px;
              overflow: hidden;
              box-shadow: 0 32px 64px rgba(0,0,0,0.7);
              animation: cd-modal-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            }
            @keyframes cd-modal-in {
              from { opacity: 0; transform: scale(0.92) translateY(12px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }

            /* Top accent line */
            .cd-accent-line {
              height: 2px;
              width: 100%;
            }
            .cd-accent-line.danger { background: linear-gradient(90deg, #F87171, transparent); }
            .cd-accent-line.info   { background: linear-gradient(90deg, #C8F135, transparent); }

            /* Body */
            .cd-body {
              padding: 24px 24px 20px;
              display: flex;
              gap: 16px;
              align-items: flex-start;
            }

            .cd-icon-wrap {
              width: 44px; height: 44px;
              border-radius: 11px;
              display: flex; align-items: center; justify-content: center;
              flex-shrink: 0;
            }
            .cd-icon-wrap.danger {
              background: rgba(248,113,113,0.1);
              border: 1px solid rgba(248,113,113,0.2);
              color: #F87171;
            }
            .cd-icon-wrap.info {
              background: rgba(200,241,53,0.08);
              border: 1px solid rgba(200,241,53,0.15);
              color: #C8F135;
            }

            .cd-text { flex: 1; min-width: 0; }
            .cd-eyebrow {
              font-family: 'DM Mono', monospace;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.14em;
              margin-bottom: 6px;
            }
            .cd-eyebrow.danger { color: #7A3535; }
            .cd-eyebrow.info   { color: #4A7A1A; }

            .cd-title {
              font-size: 16px;
              font-weight: 800;
              color: #F0F0F0;
              margin: 0 0 8px 0;
              line-height: 1.2;
            }
            .cd-desc {
              font-size: 13px;
              color: #4A4A4A;
              margin: 0;
              line-height: 1.65;
            }

            /* Footer */
            .cd-footer {
              padding: 16px 24px 20px;
              display: flex;
              gap: 10px;
              border-top: 1px solid #161616;
            }

            .cd-btn-cancel {
              flex: 1;
              padding: 11px;
              background: #141414;
              border: 1px solid #222;
              border-radius: 10px;
              font-family: 'Syne', sans-serif;
              font-size: 13px;
              font-weight: 700;
              color: #555;
              cursor: pointer;
              transition: background 0.15s, color 0.15s;
            }
            .cd-btn-cancel:hover {
              background: #1C1C1C;
              color: #999;
            }

            .cd-btn-confirm {
              flex: 1;
              padding: 11px;
              border: 1px solid transparent;
              border-radius: 10px;
              font-family: 'Syne', sans-serif;
              font-size: 13px;
              font-weight: 800;
              cursor: pointer;
              transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .cd-btn-confirm:active { transform: scale(0.97); }

            .cd-btn-confirm.danger {
              background: rgba(248,113,113,0.12);
              border-color: rgba(248,113,113,0.25);
              color: #F87171;
            }
            .cd-btn-confirm.danger:hover {
              background: rgba(248,113,113,0.2);
              border-color: rgba(248,113,113,0.4);
              box-shadow: 0 0 20px rgba(248,113,113,0.1);
            }

            .cd-btn-confirm.info {
              background: #C8F135;
              border-color: #C8F135;
              color: #0A0A0A;
            }
            .cd-btn-confirm.info:hover {
              background: #D4F542;
              box-shadow: 0 0 20px rgba(200,241,53,0.15);
            }
          `}</style>

          <div className="cd-overlay" onClick={() => handleClose(false)}>
            <div className="cd-modal" onClick={(e) => e.stopPropagation()}>

              {/* Top accent */}
              <div className={`cd-accent-line ${isDanger ? 'danger' : 'info'}`} />

              {/* Body */}
              <div className="cd-body">
                <div className={`cd-icon-wrap ${isDanger ? 'danger' : 'info'}`}>
                  {isDanger ? <AlertTriangle size={20} /> : <Info size={20} />}
                </div>
                <div className="cd-text">
                  <p className={`cd-eyebrow ${isDanger ? 'danger' : 'info'}`}>
                    {isDanger ? '// Konfirmasi Bahaya' : '// Konfirmasi Tindakan'}
                  </p>
                  <h3 className="cd-title">
                    {options.title || 'Konfirmasi Tindakan'}
                  </h3>
                  <p className="cd-desc">
                    {options.description || 'Apakah Anda yakin ingin melanjutkan tindakan ini?'}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="cd-footer">
                <button className="cd-btn-cancel" onClick={() => handleClose(false)}>
                  {options.cancelLabel || 'Batal'}
                </button>
                <button
                  className={`cd-btn-confirm ${isDanger ? 'danger' : 'info'}`}
                  onClick={() => handleClose(true)}
                >
                  {options.confirmLabel || 'Ya, Lanjutkan'}
                </button>
              </div>

            </div>
          </div>
        </>
      )}
    </ConfirmContext.Provider>
  );
};

// --- HOOK BIAR GAMPANG DIPANGGIL ---
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};