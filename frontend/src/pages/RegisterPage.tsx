import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

const registerSchema = z.object({
  username: z.string().min(3, 'Min 3 characters').max(30),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Min 6 characters'),
});

type RegisterForm = {
  username: string;
  email: string;
  password: string;
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm, undefined, RegisterForm>({
    resolver: zodResolver(registerSchema as never),
  });

  const onSubmit: SubmitHandler<RegisterForm> = async (data) => {
    setServerError('');
    try {
      const res = await authApi.register(data);
      setAuth(res.data.data.user, res.data.data.token);
      navigate('/board');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed';
      setServerError(msg);
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
          <h1 className="text-2xl font-semibold text-cork-900">Create your board</h1>
          <p className="text-cork-600 text-sm mt-1">Join PinBoard and start pinning</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cork-800 mb-1">Username</label>
            <input
              {...register('username')}
              className="w-full px-4 py-2.5 rounded-xl border border-cork-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-cork-400 text-cork-900"
              placeholder="your_name"
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
            )}
          </div>

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
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-cork-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-cork-500 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
