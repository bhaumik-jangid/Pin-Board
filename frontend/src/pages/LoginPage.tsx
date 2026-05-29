import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema as any),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const onSubmit = async (data: LoginForm) => {
    setServerError('');
    try {
      const res = await authApi.login(data);
      setAuth(res.data.data.user, res.data.data.token);
      navigate('/board');
    } catch {
      setServerError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen cork-board flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="glass-panel rounded-2xl p-8 w-full max-w-md shadow-xl"
      >
        <div className="mb-8 text-center">
          <div className="text-4xl mb-2">📌</div>
          <h1 className="text-2xl font-semibold text-cork-900">Welcome back</h1>
          <p className="text-cork-600 text-sm mt-1">Sign in to your board</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cork-800 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-2.5 rounded-xl border border-cork-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-cork-400 text-cork-900"
              placeholder="you@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-cork-800 mb-1">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-4 py-2.5 rounded-xl border border-cork-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-cork-400 text-cork-900"
              placeholder="••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-red-600 text-sm">
              {serverError}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-cork-500 hover:bg-cork-600 text-white font-medium rounded-xl transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-cork-600 mt-6">
          No account?{' '}
          <Link to="/register" className="text-cork-500 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
