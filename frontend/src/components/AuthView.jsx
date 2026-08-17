import React, { useState, useMemo } from 'react';
import { registerAPI, loginAPI } from '../services/api'; // verifyOtpAPI removed
import { Mail, Lock, User as UserIcon, Hash, MapPin, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';

export default function AuthView({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'registered'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ---- Password validation (mirroring your backend rules) ----
  const passwordChecks = useMemo(() => {
    const p = password || '';
    return {
      length: p.length >= 8,
      letter: /[A-Za-z]/.test(p),
      number: /\d/.test(p),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(p),
    };
  }, [password]);

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // ---- Age clamp ----
  const handleAgeChange = (e) => {
    const val = e.target.value;
    if (val === '') {
      setAge('');
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setAge(val);
    }
  };

  const handleAgeBlur = () => {
    if (age !== '') {
      const num = parseInt(age, 10);
      if (isNaN(num) || num < 0) setAge('0');
    }
  };

  // ---- Submit ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginAPI(email, password);
        localStorage.setItem('access_token', res.access_token);
        onLoginSuccess();
      } else if (mode === 'register') {
        if (!isPasswordValid) {
          throw new Error('Please meet all password requirements.');
        }
        await registerAPI({ email, password, name, age: parseInt(age, 10) || 0, country });
        // Show success and switch to 'registered' screen
        setSuccess(`Registration successful! Verification link has been sent to ${email}`);
        setMode('registered');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ---- Back to login, clear everything ----
  const goToLogin = () => {
    setMode('login');
    setSuccess('');
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setAge('');
    setCountry('');
  };

  const title = mode === 'login' ? 'Welcome Back' : 'Create Account';
  const subtitle = mode === 'login' ? 'Sign in to continue to OpsAssistant' : 'Join the operations team';
  const buttonText = loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Sign Up';

  // Shared input style – moderate 36px height
  const inputStyle = {
    width: '100%',
    padding: '5px 10px 5px 32px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s',
    height: '36px',
    boxSizing: 'border-box',
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 20% 20%, #1a2333 0%, #0a0f1e 70%)',
      padding: '0',
      margin: '0',
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        boxSizing: 'border-box',
        background: 'var(--bg-secondary, #111827)',
        border: '1px solid var(--panel-border, rgba(255,255,255,0.1))',
        borderRadius: '20px',
        padding: '24px 28px 20px 28px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,242,254,0.05)',
        position: 'relative',
      }}>
        {/* ===== APP TITLE with space ===== */}
        <div style={{
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '700',
          color: '#00f2fe',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          Ops Assistant   {/* <-- space added */}
        </div>

        {/* ===== GRADIENT LINE – moved inside, not absolute ===== */}
        <div style={{
          height: '2px',
          background: 'linear-gradient(90deg, #00f2fe, #c043ff, #f59e0b)',
          borderRadius: '2px',
          margin: '0 0 14px 0',
        }} />

        {/************************************************************
          *  REGISTERED SUCCESS SCREEN (no form, just confirmation)  *
          ************************************************************/}
        {mode === 'registered' ? (
          <div style={{ textAlign: 'center', padding: '16px 0 8px 0' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0,242,254,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '2px solid rgba(0,242,254,0.3)',
            }}>
              <CheckCircle size={32} color="#00f2fe" />
            </div>
            <h2 style={{
              color: '#e2e8f0',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 8px 0',
            }}>
              Check Your Inbox
            </h2>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              lineHeight: '1.6',
              margin: '0 0 20px 0',
            }}>
              Registration successful!<br />
              Verification link has been sent to <strong style={{ color: '#e2e8f0' }}>{email}</strong>
            </p>
            <button
              onClick={goToLogin}
              style={{
                width: '100%',
                padding: '8px',
                background: 'linear-gradient(135deg, #00f2fe, #c043ff)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,242,254,0.3)',
                height: '40px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,242,254,0.5)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,242,254,0.3)'}
            >
              Back to Login
            </button>
          </div>
        ) : (
          /************************************************************
           *  LOGIN / REGISTER FORMS                                  *
           ************************************************************/
          <>
            {/* Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #00f2fe, #c043ff)',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShieldCheck size={24} color="#fff" />
              </div>
            </div>

            {/* Title & subtitle */}
            <h1 style={{
              textAlign: 'center',
              fontSize: '22px',
              fontWeight: '700',
              margin: '0 0 4px',
              background: 'linear-gradient(90deg, #ffffff, #00f2fe)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              {title}
            </h1>
            <p style={{
              textAlign: 'center',
              color: 'var(--text-muted, #94a3b8)',
              margin: '0 0 14px',
              fontSize: '13px',
            }}>
              {subtitle}
            </p>

            {/* Error / Success messages (only for login/register, not for registered) */}
            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(248,113,113,0.1)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: '#f87171',
                padding: '6px 12px',
                borderRadius: '6px',
                marginBottom: '10px',
                fontSize: '12px',
              }}>
                <XCircle size={14} />
                {error}
              </div>
            )}
            {success && mode !== 'registered' && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(0,242,254,0.1)',
                border: '1px solid rgba(0,242,254,0.3)',
                color: '#00f2fe',
                padding: '6px 12px',
                borderRadius: '6px',
                marginBottom: '10px',
                fontSize: '12px',
              }}>
                <CheckCircle size={14} />
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

              {/* Name (register only) */}
              {mode === 'register' && (
                <div style={{ position: 'relative' }}>
                  <UserIcon size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
                </div>
              )}

              {/* Age – clamped to 0 minimum */}
              {mode === 'register' && (
                <div style={{ position: 'relative' }}>
                  <Hash size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Age"
                    value={age}
                    onChange={handleAgeChange}
                    onBlur={handleAgeBlur}
                    style={inputStyle}
                  />
                </div>
              )}

              {/* Country (register only) */}
              {mode === 'register' && (
                <div style={{ position: 'relative' }}>
                  <MapPin size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} style={inputStyle} />
                </div>
              )}

              {/* Email (login & register) */}
              <div style={{ position: 'relative' }}>
                <Mail size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
              </div>

              {/* Password (login & register) */}
              <>
                <div style={{ position: 'relative' }}>
                  <Lock size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      ...inputStyle,
                      borderColor: mode === 'register' && password && !isPasswordValid
                        ? 'rgba(248,113,113,0.6)'
                        : mode === 'register' && password && isPasswordValid
                        ? 'rgba(0,242,254,0.6)'
                        : 'rgba(255,255,255,0.1)',
                    }}
                  />
                </div>

                {/* ===== ONE‑SENTENCE PASSWORD HELPER ===== */}
                {mode === 'register' && (
                  <div style={{
                    marginTop: '2px',
                    fontSize: '11px',
                    color: password ? (isPasswordValid ? '#00f2fe' : '#f87171') : '#64748b',
                    transition: 'color 0.2s',
                    paddingLeft: '4px',
                  }}>
                    {password
                      ? (isPasswordValid ? '✓ Strong password' : 'Must be 8+ chars, a letter, a number, and a special char.')
                      : 'Must be 8+ chars, a letter, a number, and a special char.'
                    }
                  </div>
                )}
              </>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '6px',
                  marginTop: '4px',
                  background: loading ? 'rgba(0,242,254,0.3)' : 'linear-gradient(135deg, #00f2fe, #c043ff)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(0,242,254,0.3)',
                  height: '40px',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {buttonText}
              </button>
            </form>

            {/* Mode switch (Login ↔ Register) */}
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
              {mode === 'login' && (
                <span>
                  Don't have an account?{' '}
                  <span onClick={() => { setMode('register'); setError(''); setSuccess(''); }} style={{ color: '#00f2fe', cursor: 'pointer', fontWeight: '500' }}>
                    Sign Up
                  </span>
                </span>
              )}
              {mode === 'register' && (
                <span>
                  Already have an account?{' '}
                  <span onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ color: '#00f2fe', cursor: 'pointer', fontWeight: '500' }}>
                    Log In
                  </span>
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}