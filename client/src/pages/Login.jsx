import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Eye, EyeOff, AlertCircle, Loader2, Key, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const { login, requestPasswordReset, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotForm, setForgotForm] = useState({ email: '', code: '', newPassword: '' });
  const [captchaDisplay, setCaptchaDisplay] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleForgotChange = (e) => setForgotForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const data = await requestPasswordReset(forgotForm.email);
      setCaptchaDisplay(data.code);
      setForgotStep(2);
      toast.success('Captcha generated!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to request reset');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await resetPassword(forgotForm.email, forgotForm.code, forgotForm.newPassword);
      toast.success('Password reset successfully! You can now log in.');
      setShowForgotModal(false);
      setForgotStep(1);
      setForgotForm({ email: '', code: '', newPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset failed');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl shadow-blue-500/30 mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-brand-accent dark:text-white">
            SAHELI
          </h1>
          <p className="text-brand-muted mt-1 text-sm">IoT Safety Platform · Sign in to continue</p>
        </div>

        {/* Card */}
        <div className="card shadow-2xl">
          <h2 className="text-xl font-bold mb-6 text-brand-text">Sign In</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-brand-accent hover:text-brand-accent-hover font-semibold transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-subtle transition-colors"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" id="login-submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-brand-muted text-sm mt-5">
            No account?{' '}
            <Link to="/register" className="text-brand-accent hover:underline font-semibold">
              Register here
            </Link>
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-4 card bg-brand-surface/50 text-center">
          <p className="text-brand-muted text-xs">
            <span className="text-brand-subtle font-semibold">Demo:</span> Register with role <code className="bg-brand-border px-1.5 py-0.5 rounded text-brand-accent">admin</code> or <code className="bg-brand-border px-1.5 py-0.5 rounded text-brand-accent">user</code>
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/80 backdrop-blur-sm animate-fade-in">
          <div className="card shadow-2xl w-full max-w-sm relative">
            <button
              onClick={() => {
                setShowForgotModal(false);
                setForgotStep(1);
              }}
              className="absolute top-4 right-4 text-brand-muted hover:text-brand-text transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-surface border border-brand-border rounded-lg">
                <Key size={20} className="text-brand-accent" />
              </div>
              <h2 className="text-xl font-bold text-brand-text">Reset Password</h2>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <p className="text-sm text-brand-muted">Enter your email to receive a secure captcha code to reset your password.</p>
                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={forgotForm.email}
                    onChange={handleForgotChange}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                </div>
                <button type="submit" disabled={forgotLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {forgotLoading ? <Loader2 size={18} className="animate-spin" /> : 'Get Captcha Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="p-4 bg-brand-surface border border-brand-border rounded-xl text-center">
                  <p className="text-xs text-brand-muted mb-2 uppercase tracking-wider font-semibold">Your Captcha Code</p>
                  <div className="text-3xl font-mono font-bold text-brand-text tracking-[0.2em] bg-brand-bg py-2 rounded-lg border border-brand-border select-none pointer-events-none">
                    {captchaDisplay}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Enter Captcha Code</label>
                  <input
                    name="code"
                    type="text"
                    required
                    value={forgotForm.code}
                    onChange={handleForgotChange}
                    className="input-field font-mono"
                    placeholder="Enter the 6 letters above"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">New Password</label>
                  <input
                    name="newPassword"
                    type="password"
                    required
                    minLength={6}
                    value={forgotForm.newPassword}
                    onChange={handleForgotChange}
                    className="input-field"
                    placeholder="Min 6 characters"
                  />
                </div>

                <button type="submit" disabled={forgotLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                  {forgotLoading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Reset'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
