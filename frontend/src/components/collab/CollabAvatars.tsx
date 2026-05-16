import { motion, AnimatePresence } from 'framer-motion';
import { useCollabStore } from '@/stores/collab.store';
import { useAuthStore } from '@/stores/auth.store';

export function CollabAvatars() {
  const users  = useCollabStore((s) => s.users);
  const myId   = useAuthStore((s) => s.user?._id);

  /* Show up to 3 avatars then a +N chip — exactly like reference image */
  const others  = users.filter((u) => u.userId !== myId);
  const visible = others.slice(0, 3);
  const overflow = others.length - 3;

  if (others.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <AnimatePresence>
        {visible.map((u, i) => (
          <motion.div
            key={u.userId}
            initial={{ opacity: 0, scale: 0.5, x: 20 }}
            animate={{ opacity: 1, scale: 1,   x: 0  }}
            exit={{   opacity: 0, scale: 0.5         }}
            transition={{ type: 'spring', stiffness: 300, damping: 22, delay: i * 0.05 }}
            title={u.username}
            style={{
              width: 36, height: 36,
              borderRadius: '50%',
              backgroundColor: u.avatarColor,
              border: '2.5px solid rgba(255,255,255,0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '13px', fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
              marginLeft: i > 0 ? '-8px' : 0,
              zIndex: 10 - i,
              cursor: 'default',
            }}
          >
            {u.username[0].toUpperCase()}
          </motion.div>
        ))}
      </AnimatePresence>
      {overflow > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1   }}
          style={{
            width: 36, height: 36,
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.45)',
            border: '2.5px solid rgba(255,255,255,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '11px', fontWeight: 700,
            marginLeft: '-8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.22)',
          }}
        >
          +{overflow}
        </motion.div>
      )}
    </div>
  );
}
