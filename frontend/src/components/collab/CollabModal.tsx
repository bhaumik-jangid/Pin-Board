import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Copy, Check, Users, Link } from 'lucide-react';
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
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1,    y: 0  }}
        exit={{   opacity: 0, scale: 0.9,   y: 20 }}
        transition={{ type: 'spring', stiffness: 340, damping: 26 }}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 201,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          width: 420,
          boxShadow: '0 24px 80px rgba(0,0,0,0.28), 0 4px 16px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255,255,255,0.8)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '10px',
            background: 'rgba(196,154,69,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={18} color="#c49a45" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>
              Collaborate
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Invite others to your board
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', color: '#999', padding: '4px',
              borderRadius: '8px', display: 'flex',
            }}
          >
            <X size={18}/>
          </button>
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* How it works */}
          <div style={{
            background: 'rgba(196,154,69,0.08)',
            border: '1px solid rgba(196,154,69,0.2)',
            borderRadius: '12px', padding: '12px 14px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#5a3e1b', marginBottom: '6px' }}>
              How collaboration works
            </div>
            <div style={{ fontSize: '12px', color: '#7a5a30', lineHeight: 1.6 }}>
              Share the link or Board ID below with your team. They sign up or log in,
              then open the board — everyone sees notes update in real-time via WebSocket.
            </div>
          </div>

          {/* Board ID */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#888',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Board ID
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#f8f8f8', border: '1px solid #e8e8e8',
              borderRadius: '10px', padding: '10px 14px',
            }}>
              <code style={{ fontSize: '13px', color: '#333', flex: 1,
                fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {boardId}
              </code>
            </div>
          </div>

          {/* Share link */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#888',
              textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
              Share link
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#f8f8f8', border: '1px solid #e8e8e8',
              borderRadius: '10px', padding: '10px 14px',
            }}>
              <Link size={14} color="#999" style={{ flexShrink: 0 }}/>
              <span style={{ fontSize: '12px', color: '#555', flex: 1,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {shareUrl}
              </span>
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '6px 12px', borderRadius: '8px', border: 'none',
                  background: copied ? '#22c55e' : '#5a3e1b',
                  color: 'white', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s',
                }}
              >
                {copied ? <Check size={13}/> : <Copy size={13}/>}
                {copied ? 'Copied!' : 'Copy'}
              </motion.button>
            </div>
          </div>

          {/* Currently online */}
          {users.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#888',
                textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Currently on this board ({users.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {users.map((u) => (
                  <div key={u.userId} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '8px 12px',
                    background: 'rgba(0,0,0,0.03)',
                    borderRadius: '10px',
                  }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%',
                      backgroundColor: u.avatarColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '12px', fontWeight: 700, flexShrink: 0,
                    }}>
                      {u.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>
                        {u.username}
                      </div>
                      <div style={{ fontSize: '11px', color: '#22c55e', display: 'flex',
                        alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%',
                          background: '#22c55e' }}/>
                        Online
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {users.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '16px',
              color: '#aaa', fontSize: '13px',
            }}>
              No one else is on this board yet. Share the link above!
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
