/* Legacy navbar — used on auth pages only. Board has its own toolbar. */
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/services/api';

export function FloatingNavbar() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try { await authApi.logout(); } finally {
      clearAuth(); navigate('/login');
    }
  };

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type:'spring', stiffness:260, damping:22, delay:0.2 }}
      style={{
        position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:50,
      }}
    >
      <div style={{
        display:'flex', alignItems:'center', gap:'8px',
        background:'rgba(255,255,255,0.82)', backdropFilter:'blur(16px)',
        borderRadius:'20px', padding:'10px 20px',
        boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
        border:'1px solid rgba(255,255,255,0.6)',
      }}>
        <div style={{
          width:28, height:28, borderRadius:'50%',
          backgroundColor: user?.avatarColor || '#c49a45',
          display:'flex', alignItems:'center', justifyContent:'center',
          color:'white', fontSize:'12px', fontWeight:700,
        }}>
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <span style={{ fontSize:'13px', fontWeight:500, color:'#5a3e1b' }}>
          {user?.username}
        </span>
        <button
          onClick={handleLogout}
          style={{
            background:'transparent', border:'none', cursor:'pointer',
            color:'#9a7a50', display:'flex', alignItems:'center', padding:'4px',
          }}
        >
          <LogOut size={16}/>
        </span>
      </div>
    </motion.nav>
  );
}
