import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Copy, Check, Users, Link, Info } from 'lucide-react';
import { useCollabStore } from '@/stores/collab.store';

interface Props {
  boardId: string;
  onClose: () => void;
}

export function CollabModal({ boardId, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const users = useCollabStore((s) => s.users);

  const shareUrl = `${window.location.origin}/board?id=${boardId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return createPortal(
    <>
      {/* ── Backdrop — full screen, escapes overflow:hidden ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          background: 'rgba(0,0,0,0.52)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* ── Modal panel ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 20 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.92,  y: 14 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        style={{
          /* Fixed + explicit centering — immune to parent overflow */
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9001,

          /* Responsive width */
          width: 'min(460px, calc(100vw - 32px))',

          /* Never taller than viewport with padding */
          maxHeight: 'min(640px, calc(100vh - 48px))',

          background: 'rgba(255,255,255,0.99)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '22px',
          boxShadow: `
            0 0 0 1px rgba(0,0,0,0.06),
            0 8px 24px rgba(0,0,0,0.12),
            0 32px 80px rgba(0,0,0,0.22)
          `,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Header (fixed height, never scrolls) ── */}
        <div style={{
          padding: '20px 22px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0,
          background: 'rgba(255,255,255,0.99)',
        }}>
          <div style={{
            width: 40, height: 40,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(196,154,69,0.2), rgba(196,154,69,0.08))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Users size={18} color="#c49a45" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a' }}>
              Collaborate
            </div>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '1px' }}>
              Invite others to join your board live
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              borderRadius: '10px',
              background: 'rgba(0,0,0,0.06)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#888',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.06)')}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          padding: '18px 22px 24px',
          /* Custom scrollbar */
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,0,0,0.15) transparent',
        }}>

          {/* Info banner */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            background: 'rgba(196,154,69,0.08)',
            border: '1px solid rgba(196,154,69,0.22)',
            borderRadius: '12px',
            padding: '12px 14px',
            marginBottom: '20px',
          }}>
            <Info size={14} color="#c49a45" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{
              margin: 0, fontSize: '12.5px',
              color: '#7a5a30', lineHeight: 1.65,
            }}>
              Share the link below. Anyone who logs in and opens it
              joins your board and sees all changes live via WebSocket.
            </p>
          </div>

          {/* Board ID */}
          <Field label="Board ID">
            <div style={{
              background: '#f7f7f7',
              border: '1px solid #ebebeb',
              borderRadius: '10px',
              padding: '10px 14px',
            }}>
              <code style={{
                fontSize: '12.5px',
                color: '#444',
                wordBreak: 'break-all',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                letterSpacing: '0.02em',
              }}>
                {boardId}
              </code>
            </div>
          </Field>

          {/* Share link */}
          <Field label="Share link">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f7f7f7',
              border: '1px solid #ebebeb',
              borderRadius: '10px',
              padding: '10px 14px',
            }}>
              <Link size={13} color="#bbb" style={{ flexShrink: 0 }} />
              <span style={{
                fontSize: '12.5px',
                color: '#555',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}>
                {shareUrl}
              </span>
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={handleCopy}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: copied
                    ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                    : 'linear-gradient(135deg, #5a3e1b, #7a5a2b)',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background 0.25s',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied
                  ? <><Check size={12} /> Copied!</>
                  : <><Copy size={12} /> Copy link</>
                }
              </motion.button>
            </div>
          </Field>

          {/* Steps */}
          <Field label="Steps for collaborators">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                'Copy the link above',
                'Open it in any browser tab',
                'Sign up or log in to PinBoard',
                'You\'re live — all changes sync instantly',
              ].map((text, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '9px 12px',
                  background: 'rgba(0,0,0,0.02)',
                  borderRadius: '10px',
                  border: '1px solid rgba(0,0,0,0.04)',
                }}>
                  <div style={{
                    width: 24, height: 24,
                    borderRadius: '50%',
                    background: 'rgba(196,154,69,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700,
                    color: '#c49a45',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: '13px', color: '#555' }}>{text}</span>
                </div>
              ))}
            </div>
          </Field>

          {/* Online now */}
          <Field label={
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: 7, height: 7,
                borderRadius: '50%',
                background: '#22c55e',
                display: 'inline-block',
                boxShadow: '0 0 0 2px rgba(34,197,94,0.25)',
              }}/>
              Online now ({users.length})
            </span>
          }>
            {users.length === 0 ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#ccc',
                fontSize: '13px',
                background: 'rgba(0,0,0,0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(0,0,0,0.08)',
              }}>
                No one else is here yet — share the link!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {users.map((u) => (
                  <div key={u.userId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                  }}>
                    <div style={{
                      width: 34, height: 34,
                      borderRadius: '50%',
                      backgroundColor: u.avatarColor || '#c49a45',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: 700,
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}>
                      {u.username[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>
                        {u.username}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      color: '#22c55e',
                      fontWeight: 600,
                    }}>
                      <div style={{
                        width: 6, height: 6,
                        borderRadius: '50%',
                        background: '#22c55e',
                        boxShadow: '0 0 0 2px rgba(34,197,94,0.2)',
                      }} />
                      Live
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Field>
        </div>
      </motion.div>
    </>,
    document.body   /* ← portal target — escapes all overflow:hidden ancestors */
  );
}

/* ── Small helper ── */
function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{
        fontSize: '10.5px',
        fontWeight: 700,
        color: '#aaa',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '8px',
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}
