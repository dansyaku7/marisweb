"use client";

import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { AlertTriangle, Info } from 'lucide-react';

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

      {isOpen && (
        <>
          <style>{`
            .cd-overlay {
              position: fixed;
              inset: 0;
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background: rgba(0, 0, 0, 0.35);
              backdrop-filter: blur(6px);
              -webkit-backdrop-filter: blur(6px);
              animation: cd-bg-in 0.18s ease both;
            }
            @keyframes cd-bg-in {
              from { opacity: 0; }
              to   { opacity: 1; }
            }

            .cd-modal {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              background: #FFFFFF;
              border: 1.5px solid #EAE7DF;
              border-radius: 16px;
              width: 100%;
              max-width: 400px;
              overflow: hidden;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.12);
              animation: cd-modal-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) both;
            }
            @keyframes cd-modal-in {
              from { opacity: 0; transform: scale(0.94) translateY(10px); }
              to   { opacity: 1; transform: scale(1) translateY(0); }
            }

            .cd-accent-line {
              height: 2px;
              width: 100%;
            }
            .cd-accent-line.danger { background: linear-gradient(90deg, #DC3C3C, transparent); }
            .cd-accent-line.info   { background: linear-gradient(90deg, #F0A500, transparent); }

            .cd-body {
              padding: 22px 22px 18px;
              display: flex;
              gap: 14px;
              align-items: flex-start;
            }

            .cd-icon-wrap {
              width: 40px;
              height: 40px;
              border-radius: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }
            .cd-icon-wrap.danger {
              background: rgba(220, 60, 60, 0.07);
              border: 1.5px solid rgba(220, 60, 60, 0.18);
              color: #DC3C3C;
            }
            .cd-icon-wrap.info {
              background: rgba(240, 165, 0, 0.08);
              border: 1.5px solid rgba(240, 165, 0, 0.2);
              color: #C87A00;
            }

            .cd-text { flex: 1; min-width: 0; }

            .cd-eyebrow {
              font-size: 9px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.14em;
              margin-bottom: 5px;
              font-family: monospace;
            }
            .cd-eyebrow.danger { color: #DC3C3C; }
            .cd-eyebrow.info   { color: #C87A00; }

            .cd-title {
              font-size: 15px;
              font-weight: 600;
              color: #1A1A1A;
              margin: 0 0 7px;
              line-height: 1.25;
            }

            .cd-desc {
              font-size: 13px;
              font-weight: 400;
              color: #888880;
              margin: 0;
              line-height: 1.6;
            }

            .cd-footer {
              padding: 14px 22px 20px;
              display: flex;
              gap: 10px;
              border-top: 1px solid #F0EDE4;
              background: #FAFAF7;
            }

            .cd-btn-cancel {
              flex: 1;
              padding: 10px;
              background: #FFFFFF;
              border: 1.5px solid #E5E2D8;
              border-radius: 10px;
              font-family: inherit;
              font-size: 13px;
              font-weight: 500;
              color: #888880;
              cursor: pointer;
              transition: background 0.15s, color 0.15s, border-color 0.15s;
            }
            .cd-btn-cancel:hover {
              background: #F5F3EE;
              color: #555550;
              border-color: #C8C0B0;
            }

            .cd-btn-confirm {
              flex: 1;
              padding: 10px;
              border-radius: 10px;
              font-family: inherit;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.15s, transform 0.12s, box-shadow 0.15s;
              display: flex;
              align-items: center;
              justify-content: center;
              border: none;
            }
            .cd-btn-confirm:active { transform: scale(0.97); }

            .cd-btn-confirm.danger {
              background: #DC3C3C;
              color: #FFFFFF;
              box-shadow: 0 4px 14px rgba(220, 60, 60, 0.25);
            }
            .cd-btn-confirm.danger:hover {
              background: #C43030;
              box-shadow: 0 4px 18px rgba(220, 60, 60, 0.35);
            }

            .cd-btn-confirm.info {
              background: #F0A500;
              color: #1A1A1A;
              box-shadow: 0 4px 14px rgba(240, 165, 0, 0.25);
            }
            .cd-btn-confirm.info:hover {
              background: #E09800;
              box-shadow: 0 4px 18px rgba(240, 165, 0, 0.35);
            }
          `}</style>

          <div className="cd-overlay" onClick={() => handleClose(false)}>
            <div className="cd-modal" onClick={(e) => e.stopPropagation()}>

              {/* Top accent line */}
              <div className={`cd-accent-line ${isDanger ? 'danger' : 'info'}`} />

              {/* Body */}
              <div className="cd-body">
                <div className={`cd-icon-wrap ${isDanger ? 'danger' : 'info'}`}>
                  {isDanger ? <AlertTriangle size={18} /> : <Info size={18} />}
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

// --- HOOK ---
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider');
  return context;
};