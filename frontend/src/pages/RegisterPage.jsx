import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  Building2,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  GraduationCap,
  BookOpen,
  Sparkles
} from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'institute'

  const [publicCourses, setPublicCourses] = useState([]);

  // Student Form Fields
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    mobile: '',
    institute_code: 'ITE-001',
    course: '',
    password: '',
    confirmPassword: '',
    gender: 'Male',
    date_of_birth: '',
    address: ''
  });

  // Institute Form Fields
  const [instForm, setInstForm] = useState({
    name: '',
    email: '',
    contact_number: '',
    preferred_code: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredInfo, setRegisteredInfo] = useState(null);

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await api.getPublicCourses(studentForm.institute_code);
        if (Array.isArray(data)) {
          setPublicCourses(data);
          if (data.length > 0) {
            setStudentForm(prev => ({ ...prev, course: data[0].name }));
          } else {
            setStudentForm(prev => ({ ...prev, course: '' }));
          }
        }
      } catch (err) {
        console.warn('Could not load public courses:', err);
      }
    }
    loadCourses();
  }, [studentForm.institute_code]);


  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!studentForm.institute_code.trim()) return setError('Please enter your University Code (e.g. ITE-001).');
    if (!studentForm.name.trim()) return setError('Please enter your full name.');
    if (!studentForm.email.trim()) return setError('Please enter your email.');
    if (!studentForm.password) return setError('Please create a password.');
    if (studentForm.password !== studentForm.confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const response = await api.selfRegisterStudent({
        name: studentForm.name.trim(),
        email: studentForm.email.trim(),
        mobile: studentForm.mobile.trim(),
        password: studentForm.password,
        institute_code: studentForm.institute_code.trim(),
        gender: studentForm.gender,
        date_of_birth: studentForm.date_of_birth || undefined,
        address: studentForm.address || undefined,
        course: studentForm.course || undefined
      });

      setRegisteredInfo({
        type: 'student',
        name: studentForm.name,
        email: studentForm.email,
        institute_code: studentForm.institute_code.trim(),
        registration_id: response.registration_id || response.student?.registration_id,
        course: studentForm.course
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstituteSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!instForm.name.trim()) return setError('Please enter University Name.');
    if (!instForm.email.trim()) return setError('Please enter official email.');
    if (!instForm.password) return setError('Please create a password.');
    if (instForm.password !== instForm.confirmPassword) return setError('Passwords do not match.');

    setLoading(true);
    try {
      const response = await api.registerInstitute({
        name: instForm.name.trim(),
        email: instForm.email.trim(),
        password: instForm.password,
        contact_number: instForm.contact_number.trim(),
        address: instForm.address.trim() || undefined,
        preferred_code: instForm.preferred_code.trim() || undefined
      });

      setRegisteredInfo({
        type: 'institute',
        institute: response.institute,
        admin_credentials: response.admin_credentials
      });
    } catch (err) {
      setError(err.message || 'University registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ padding: '2.5rem 1rem' }}>
      <div className="auth-card" style={{ maxWidth: '640px' }}>
        <div className="auth-header">
          <div style={{
            width: '46px',
            height: '46px',
            background: 'linear-gradient(135deg, var(--primary-navy, #0f172a), var(--primary-blue, #2563eb))',
            borderRadius: '8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            marginBottom: '10px',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)'
          }}>
            {activeTab === 'student' ? <GraduationCap size={24} /> : <Building2 size={24} />}
          </div>
          <h1 style={{ fontSize: '22px', letterSpacing: '-0.5px' }}>
            {activeTab === 'student' ? 'Direct Student Registration' : 'Register New University'}
          </h1>
          <p>AI Smart University Academic Portal</p>

          {/* Tab Selection */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            borderRadius: '8px',
            padding: '4px',
            marginTop: '1rem',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => { setActiveTab('student'); setError(''); setRegisteredInfo(null); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                background: activeTab === 'student' ? '#ffffff' : 'transparent',
                color: activeTab === 'student' ? 'var(--primary-blue)' : 'var(--text-muted)',
                boxShadow: activeTab === 'student' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <GraduationCap size={16} /> Student Sign Up
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('institute'); setError(''); setRegisteredInfo(null); }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                background: activeTab === 'institute' ? '#ffffff' : 'transparent',
                color: activeTab === 'institute' ? 'var(--primary-blue)' : 'var(--text-muted)',
                boxShadow: activeTab === 'institute' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Building2 size={16} /> University Register
            </button>
          </div>
        </div>

        <div className="auth-body">
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {registeredInfo ? (
            <div style={{
              background: 'rgba(16,185,129,0.06)',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '1.75rem',
              textAlign: 'center',
              marginBottom: '1rem'
            }}>
              {registeredInfo.type === 'student' ? (
                <>
                  <CheckCircle2 size={48} style={{ color: '#10b981', margin: '0 auto 12px' }} />
                  <h3 style={{ margin: '0 0 6px', color: '#065f46', fontWeight: 800 }}>
                    Student Registration Complete & Activated!
                  </h3>
                  <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Your account under University Code <strong>[{registeredInfo.institute_code}]</strong> is active. You can log in immediately using your assigned Enrollment Number.
                  </p>

                  <div style={{
                    background: '#ffffff',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    textAlign: 'left',
                    display: 'grid',
                    gap: '10px',
                    fontSize: '13px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Full Name</span>
                      <strong>{registeredInfo.name}</strong> ({registeredInfo.email})
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>University Code</span>
                      <strong style={{ color: 'var(--primary-blue)' }}>{registeredInfo.institute_code}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Selected Course</span>
                      <strong>{registeredInfo.course || 'General Admission'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Official Enrollment Number / Student ID</span>
                      <span style={{
                        display: 'inline-block',
                        background: 'var(--primary-navy, #0f172a)',
                        color: '#60a5fa',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '15px'
                      }}>
                        {registeredInfo.registration_id}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => navigate('/login')}
                  >
                    Proceed to Portal Log In <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                <>
                  <CheckCircle2 size={48} style={{ color: '#10b981', margin: '0 auto 12px' }} />
                  <h3 style={{ margin: '0 0 6px', color: '#065f46' }}>University Registration Complete!</h3>
                  <p style={{ margin: '0 0 14px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                    Your university environment is provisioned and ready.
                  </p>

                  <div style={{
                    background: '#ffffff',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.25rem',
                    textAlign: 'left',
                    display: 'grid',
                    gap: '8px',
                    fontSize: '13px'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>University Name</span>
                      <strong>{registeredInfo.institute?.name}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Assigned Code</span>
                      <strong>{registeredInfo.institute?.institute_code}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    onClick={() => navigate('/login')}
                  >
                    Proceed to Log In <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
          ) : activeTab === 'student' ? (
            /* STUDENT REGISTRATION FORM */
            <form onSubmit={handleStudentSubmit}>
              <div style={{
                background: 'rgba(37,99,235,0.06)',
                borderLeft: '4px solid #2563eb',
                padding: '10px 12px',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Sparkles size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                <span>
                  Enter your <strong>University Code</strong> and select your desired <strong>Course</strong>. Registration is instant and your official Enrollment Number will be generated immediately upon sign up!
                </span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">University Code <span className="required">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ITE-001"
                    value={studentForm.institute_code}
                    onChange={(e) => setStudentForm({ ...studentForm, institute_code: e.target.value.toUpperCase() })}
                    required
                  />
                  <small style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Enter your university's assigned code</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Desired Course <span className="required">*</span></label>
                  <select
                    className="form-control"
                    value={studentForm.course}
                    onChange={(e) => setStudentForm({ ...studentForm, course: e.target.value })}
                    required
                  >
                    {publicCourses.length > 0 ? (
                      publicCourses.map(c => (
                        <option key={c.id} value={c.name}>
                          {c.course_code} - {c.name} {c.fees ? `(₹${parseFloat(c.fees).toLocaleString()})` : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Full Stack Web Development">Full Stack Web Development</option>
                        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Rahul Verma"
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Address (Gmail) <span className="required">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="student@gmail.com"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number <span className="required">*</span></label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="10-digit mobile number"
                    value={studentForm.mobile}
                    onChange={(e) => setStudentForm({ ...studentForm, mobile: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select
                    className="form-control"
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="form-control"
                    value={studentForm.date_of_birth}
                    onChange={(e) => setStudentForm({ ...studentForm, date_of_birth: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Residential Address</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Residential Address"
                  value={studentForm.address}
                  onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password <span className="required">*</span></label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="At least 6 characters"
                    value={studentForm.password}
                    onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password <span className="required">*</span></label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Re-enter password"
                    value={studentForm.confirmPassword}
                    onChange={(e) => setStudentForm({ ...studentForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                style={{ marginTop: '0.75rem' }}
                disabled={loading}
              >
                {loading ? 'Submitting Registration Request...' : 'Submit Student Registration Request'}
              </button>
            </form>
          ) : (
            /* UNIVERSITY REGISTRATION FORM */
            <form onSubmit={handleInstituteSubmit}>
              <div className="form-group">
                <label className="form-label">University Name <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. AI Smart University"
                  value={instForm.name}
                  onChange={(e) => setInstForm({ ...instForm, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">University Code / Acronym</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ITE-001"
                    value={instForm.preferred_code}
                    onChange={(e) => setInstForm({ ...instForm, preferred_code: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Official Email <span className="required">*</span></label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="admin@university.com"
                    value={instForm.email}
                    onChange={(e) => setInstForm({ ...instForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Helpline Phone <span className="required">*</span></label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="+91 98765 43210"
                    value={instForm.contact_number}
                    onChange={(e) => setInstForm({ ...instForm, contact_number: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Campus Address</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="City, State"
                    value={instForm.address}
                    onChange={(e) => setInstForm({ ...instForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password <span className="required">*</span></label>
                  <input
                    type="password"
                    className="form-control"
                    value={instForm.password}
                    onChange={(e) => setInstForm({ ...instForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password <span className="required">*</span></label>
                  <input
                    type="password"
                    className="form-control"
                    value={instForm.confirmPassword}
                    onChange={(e) => setInstForm({ ...instForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                style={{ marginTop: '0.75rem' }}
                disabled={loading}
              >
                {loading ? 'Registering University...' : 'Register University Account'}
              </button>
            </form>
          )}

          <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary-blue, #2563eb)' }}>
              Sign In to Portal &rarr;
            </Link>
          </div>
        </div>

        <div className="auth-footer">
          <div>AI Smart University Academic Portal • Self Registration & Management</div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
