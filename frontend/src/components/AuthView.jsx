import React, { useState } from 'react';
import { registerAPI, verifyOtpAPI, loginAPI } from '../services/api';

export default function AuthView({ onLoginSuccess }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
        await registerAPI({ email, password, name, age: parseInt(age) || 0, country });
        setSuccess('Registration successful! Check your email for OTP.');
        setMode('verify');
      } else if (mode === 'verify') {
        const res = await verifyOtpAPI(email, otp);
        localStorage.setItem('access_token', res.access_token);
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '40px', width: '400px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          {mode === 'login' ? 'Log In' : mode === 'register' ? 'Sign Up' : 'Verify OTP'}
        </h2>
        {error && <div style={{ color: 'red', marginBottom: '12px' }}>{error}</div>}
        {success && <div style={{ color: 'cyan', marginBottom: '12px' }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
              <input placeholder="Age" type="number" value={age} onChange={e => setAge(e.target.value)} />
              <input placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} />
            </>
          )}
          {mode !== 'verify' ? (
            <>
              <input placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              <input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </>
          ) : (
            <input placeholder="OTP Code" value={otp} onChange={e => setOtp(e.target.value)} required />
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
            {loading ? 'Processing...' : mode === 'login' ? 'Log In' : mode === 'register' ? 'Sign Up' : 'Verify'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          {mode === 'login' && <span onClick={() => setMode('register')}>Don't have an account? Sign Up</span>}
          {mode === 'register' && <span onClick={() => setMode('login')}>Already have an account? Log In</span>}
          {mode === 'verify' && <span onClick={() => setMode('login')}>Back to Login</span>}
        </div>
      </div>
    </div>
  );
}