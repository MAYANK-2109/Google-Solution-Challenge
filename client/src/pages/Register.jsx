import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Eye, EyeOff, AlertCircle, Loader2, User, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'user' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Account created! Welcome, ${user.name}`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-xl shadow-blue-500/30 mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tight">
            <span className="text-brand-text">SAHE</span><span className="text-gradient">LI</span>
          </h1>
          <p className="text-brand-muted mt-1 text-sm">Create your safety account</p>
        </div>

        <div className="card shadow-2xl">
          <h2 className="text-xl font-bold mb-6">Create Account</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
              <AlertCircle size={16} className="shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Full Name</label>
              <input id="reg-name" name="name" type="text" required value={form.name} onChange={handleChange}
                className="input-field" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Email</label>
              <input id="reg-email" name="email" type="email" required value={form.email} onChange={handleChange}
                className="input-field" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Phone (Optional)</label>
              <input id="reg-phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
                className="input-field" placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input id="reg-password" name="password" type={showPass ? 'text' : 'password'} required
                  value={form.password} onChange={handleChange} className="input-field pr-12" placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPass((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-subtle transition-colors">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-brand-muted uppercase tracking-wider mb-2">Account Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'user', label: 'Traveler', icon: User, desc: 'Guest / Staff' },
                  { value: 'admin', label: 'Security', icon: ShieldCheck, desc: 'Admin / Guard' },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <button key={value} type="button" onClick={() => setForm((p) => ({ ...p, role: value }))}
                    id={`role-${value}`}
                    className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 ${form.role === value
                        ? 'border-brand-accent bg-brand-accent/10 text-brand-text'
                        : 'border-brand-border text-brand-muted hover:border-brand-accent/50'
                      }`}>
                    <Icon size={22} />
                    <span className="font-semibold text-sm">{label}</span>
                    <span className="text-xs opacity-70">{desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" id="reg-submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-brand-muted text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-accent hover:underline font-semibold">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
