import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Wallet,
  FileText,
  Printer,
  QrCode,
  ShieldCheck,
  XCircle,
  Search,
  Download,
  Eye,
  Send
} from 'lucide-react';

export function FeesPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('verification'); // 'verification', 'ledger', 'invoices'
  const [feeData, setFeeData] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [verifications, setVerifications] = useState([]);
  const [taxInvoices, setTaxInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [isSubmitPaymentModalOpen, setIsSubmitPaymentModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedVerificationItem, setSelectedVerificationItem] = useState(null);
  const [selectedInvoiceUrl, setSelectedInvoiceUrl] = useState('');

  // Student Payment Submission Form
  const [studentPaymentForm, setStudentPaymentForm] = useState({
    amount: '',
    payment_method: 'UPI',
    transaction_id: ''
  });

  // Admin Verification Form
  const [verifyForm, setVerifyForm] = useState({
    fee_id: null,
    status: 'Paid / Successful',
    transaction_id: '',
    notes: ''
  });

  const role = (user?.role || 'student').toLowerCase();
  const isAdmin = ['admin', 'institute', 'institute_admin'].includes(role);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (isAdmin) {
        const [verList, stuList, invList] = await Promise.allSettled([
          api.getFeeVerifications(),
          api.getAllStudents(),
          api.getInstituteInvoices()
        ]);

        if (verList.status === 'fulfilled') setVerifications(Array.isArray(verList.value) ? verList.value : []);
        if (stuList.status === 'fulfilled') {
          const list = Array.isArray(stuList.value) ? stuList.value : [];
          setStudents(list);
          if (list.length > 0 && !selectedStudentId) {
            setSelectedStudentId(list[0].id);
          }
        }
        if (invList.status === 'fulfilled') setTaxInvoices(Array.isArray(invList.value) ? invList.value : []);
      } else if (user?.username) {
        // Student view
        const prof = await api.getStudent(user.username);
        if (prof.student?.id) {
          const sId = prof.student.id;
          setSelectedStudentId(sId);
          const [feesRes, sumRes, invRes] = await Promise.allSettled([
            api.getStudentFees(sId),
            api.getFeeSummary(sId),
            api.getStudentInvoices(sId)
          ]);

          if (feesRes.status === 'fulfilled') setFeeData(feesRes.value);
          if (sumRes.status === 'fulfilled') setFeeSummary(sumRes.value);
          if (invRes.status === 'fulfilled') setTaxInvoices(Array.isArray(invRes.value) ? invRes.value : []);
        }
      }
    } catch (err) {
      setError(err.message || 'Error loading fee & verification status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Load single student ledger for Admin dropdown change
  const loadStudentLedger = async (studentId) => {
    if (!studentId) return;
    try {
      const [feesRes, sumRes] = await Promise.allSettled([
        api.getStudentFees(studentId),
        api.getFeeSummary(studentId)
      ]);

      if (feesRes.status === 'fulfilled') setFeeData(feesRes.value);
      if (sumRes.status === 'fulfilled') setFeeSummary(sumRes.value);
    } catch (err) {
      console.warn('Failed student ledger fetch:', err);
    }
  };

  const handleStudentSelectChange = (e) => {
    const sId = parseInt(e.target.value);
    setSelectedStudentId(sId);
    loadStudentLedger(sId);
  };

  // Student Payment Submission Handler
  const handleStudentSubmitPayment = async (e) => {
    e.preventDefault();
    if (!studentPaymentForm.transaction_id.trim()) {
      setError('Transaction UTR / Gateway Reference ID is required.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const res = await api.submitFeePayment({
        amount: parseFloat(studentPaymentForm.amount),
        payment_method: studentPaymentForm.payment_method,
        transaction_id: studentPaymentForm.transaction_id.trim()
      });
      setSuccess(res.message || 'Payment submitted for verification!');
      setIsSubmitPaymentModalOpen(false);
      setStudentPaymentForm({ amount: '', payment_method: 'UPI', transaction_id: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Error submitting fee payment.');
    }
  };

  // Admin Verification Submit Handler
  const handleAdminVerifyPayment = async (e) => {
    e.preventDefault();
    if (!verifyForm.fee_id) return;
    setError('');
    setSuccess('');
    try {
      const res = await api.verifyFeePayment(verifyForm);
      setSuccess(res.message || `Payment verified as ${verifyForm.status}!`);
      setIsVerifyModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Payment verification failed.');
    }
  };

  const openVerifyModal = (item) => {
    setSelectedVerificationItem(item);
    setVerifyForm({
      fee_id: item.id,
      status: 'Paid / Successful',
      transaction_id: item.transaction_id || item.receipt_number || '',
      notes: ''
    });
    setIsVerifyModalOpen(true);
  };

  const viewInvoiceHtml = (invoiceId) => {
    const url = api.getInvoiceHtmlUrl(invoiceId);
    setSelectedInvoiceUrl(url);
    setIsInvoiceModalOpen(true);
  };

  // Filtered Verification List for Admin
  const filteredVerifications = verifications.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (v.student_name && v.student_name.toLowerCase().includes(q)) ||
      (v.registration_id && v.registration_id.toLowerCase().includes(q)) ||
      (v.transaction_id && v.transaction_id.toLowerCase().includes(q)) ||
      (v.receipt_number && v.receipt_number.toLowerCase().includes(q));

    const matchStatus = statusFilter ? v.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const totalCourseFee = feeSummary?.course_fee || feeData?.total_fee || 0;
  const paidAmount = feeSummary?.total_paid || feeData?.paid_amount || 0;
  const balanceDue = feeSummary?.pending_fee !== undefined ? feeSummary.pending_fee : Math.max(0, totalCourseFee - paidAmount);

  return (
    <div>
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
          <CheckCircle2 size={16} />
          <div>{success}</div>
        </div>
      )}

      {/* Header Banner */}
      <div className="card-container" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: '16px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#ffffff' }}>
              <CreditCard size={28} color="#60a5fa" />
              {isAdmin ? 'Institute Fee Verification & Tax Invoices' : 'My Fee Payments & Tax Invoices'}
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '4px 0 0' }}>
              {isAdmin ? 'Verify student payment transactions, view gateway responses, and manage official Tax Invoices.' : 'Submit UTR transaction references, track real-time verification status, and view downloadable Tax Invoices.'}
            </p>
          </div>

          {!isAdmin && (
            <button className="btn-primary" onClick={() => setIsSubmitPaymentModalOpen(true)} style={{ padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <QrCode size={18} /> Pay Fee / Submit UTR
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', flexWrap: 'wrap' }}>
          {isAdmin ? (
            <>
              <button
                className={`btn ${activeTab === 'verification' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('verification')}
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                <ShieldCheck size={16} style={{ marginRight: 6 }} /> Payment Verifications ({verifications.length})
              </button>
              <button
                className={`btn ${activeTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('invoices')}
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                <FileText size={16} style={{ marginRight: 6 }} /> Tax Invoices ({taxInvoices.length})
              </button>
            </>
          ) : (
            <>
              <button
                className={`btn ${activeTab === 'summary' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('summary')}
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                <Wallet size={16} style={{ marginRight: 6 }} /> Fee Statement & Ledger
              </button>
              <button
                className={`btn ${activeTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('invoices')}
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              >
                <FileText size={16} style={{ marginRight: 6 }} /> Tax Invoices ({taxInvoices.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards for Student */}
      {!isAdmin && (
        <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
          <div className="kpi-card">
            <div className="kpi-icon-wrap">
              <CreditCard size={20} />
            </div>
            <div className="kpi-info">
              <div className="kpi-label">Total Course Fee</div>
              <div className="kpi-value">₹{parseFloat(totalCourseFee).toLocaleString()}</div>
              <div className="kpi-subtext">Tuition & Institutional charges</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap success">
              <Wallet size={20} />
            </div>
            <div className="kpi-info">
              <div className="kpi-label">Verified Amount Paid</div>
              <div className="kpi-value" style={{ color: 'var(--status-success-text)' }}>
                ₹{parseFloat(paidAmount).toLocaleString()}
              </div>
              <div className="kpi-subtext">Verified gateway / UTR credits</div>
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon-wrap warning">
              <Receipt size={20} />
            </div>
            <div className="kpi-info">
              <div className="kpi-label">Outstanding Balance</div>
              <div className="kpi-value" style={{ color: balanceDue > 0 ? 'var(--status-pending-text)' : 'var(--primary-navy)' }}>
                ₹{parseFloat(balanceDue).toLocaleString()}
              </div>
              <div className="kpi-subtext">
                <StatusBadge status={balanceDue <= 0 ? 'Fully Paid' : 'Pending Verification / Due'} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: ADMIN PAYMENT VERIFICATION DASHBOARD */}
      {isAdmin && activeTab === 'verification' && (
        <div className="card-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '36px' }}
                placeholder="Search by student name, ID, UTR / Txn reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Verification Statuses</option>
              <option value="Paid / Successful">Paid / Successful</option>
              <option value="Pending">Pending Verification</option>
              <option value="Failed">Failed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading verification transactions..." />
          ) : filteredVerifications.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No transactions found"
              description="No fee payment transactions match your query criteria."
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student Name & Reg ID</th>
                    <th>Payment Date</th>
                    <th>Mode</th>
                    <th>UTR / Gateway Txn ID</th>
                    <th>Amount (₹)</th>
                    <th>Verification Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVerifications.map((v) => {
                    const isPaid = v.status === 'Paid / Successful';
                    const isPending = v.status === 'Pending';

                    return (
                      <tr key={v.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{v.student_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.registration_id}</div>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{v.payment_date || 'Recent'}</td>
                        <td>
                          <span className="badge info">{v.payment_method || 'UPI'}</span>
                        </td>
                        <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary-blue)' }}>
                          {v.transaction_id || v.receipt_number || '—'}
                        </td>
                        <td style={{ fontWeight: 700, color: '#10b981' }}>₹{v.amount?.toLocaleString()}</td>
                        <td>
                          <span className={`badge ${isPaid ? 'success' : isPending ? 'warning' : 'danger'}`}>
                            {v.status || 'Pending'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {isPending && (
                              <button
                                className="btn-primary"
                                style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#10b981', borderColor: '#10b981' }}
                                onClick={() => openVerifyModal(v)}
                              >
                                Verify Payment
                              </button>
                            )}
                            {isPaid && (
                              <button
                                className="btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                onClick={() => {
                                  const matchingInv = taxInvoices.find((i) => i.fee_id === v.id);
                                  if (matchingInv) viewInvoiceHtml(matchingInv.id);
                                  else alert('Tax Invoice generating. Please refresh in a moment.');
                                }}
                              >
                                <FileText size={12} style={{ marginRight: 4 }} /> Tax Invoice
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TAX INVOICES LIST (STUDENT & ADMIN) */}
      {activeTab === 'invoices' && (
        <div className="card-container">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--primary-blue)" /> Official Tax Invoices & GST Receipts ({taxInvoices.length})
          </h3>

          {loading ? (
            <LoadingSpinner message="Fetching tax invoices..." />
          ) : taxInvoices.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No tax invoices generated yet"
              description="Tax invoices are automatically generated once a fee payment is verified as Paid / Successful."
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Date</th>
                    {isAdmin && <th>Student Details</th>}
                    <th>Course / Training</th>
                    <th>SAC Code</th>
                    <th>Base Amount</th>
                    <th>GST (18%)</th>
                    <th>Total Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {taxInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-blue)', fontFamily: 'monospace' }}>
                        {inv.invoice_number}
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>{inv.payment_date}</td>
                      {isAdmin && (
                        <td>
                          <div style={{ fontWeight: 600 }}>{inv.student_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inv.registration_id}</div>
                        </td>
                      )}
                      <td style={{ fontWeight: 600 }}>{inv.course_name}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{inv.hsn_sac_code || '999293'}</td>
                      <td>₹{inv.subtotal_amount?.toLocaleString()}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>₹{inv.total_tax_amount?.toLocaleString()}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{inv.total_amount?.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                          onClick={() => viewInvoiceHtml(inv.id)}
                        >
                          <Printer size={13} style={{ marginRight: 4 }} /> View / Print Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STUDENT FEE STATEMENT & LEDGER */}
      {(!isAdmin || activeTab === 'summary') && (
        <div className="card-container">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Receipt size={18} color="var(--primary-blue)" /> Account Ledger & Payment Records
          </h3>

          {loading ? (
            <LoadingSpinner message="Loading account ledger..." />
          ) : !(feeData?.payments && feeData.payments.length > 0) ? (
            <EmptyState
              icon={Receipt}
              title="No fee transactions posted"
              description="Click 'Pay Fee / Submit UTR' to record your initial fee payment."
            />
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt / Reference No.</th>
                    <th>Payment Date</th>
                    <th>Payment Method</th>
                    <th>Transaction UTR / ID</th>
                    <th>Amount (₹)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {feeData.payments.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{p.receipt_number}</td>
                      <td>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'Verified'}</td>
                      <td>{p.payment_method || 'UPI / Online'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{p.transaction_id || '—'}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{parseFloat(p.amount).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${p.status === 'Paid / Successful' || p.status === 'Paid' ? 'success' : 'warning'}`}>
                          {p.status || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* STUDENT PAYMENT SUBMISSION MODAL */}
      <Modal
        isOpen={isSubmitPaymentModalOpen}
        onClose={() => setIsSubmitPaymentModalOpen(false)}
        title="Fee Payment & UTR Submission"
        maxWidth="500px"
      >
        <form onSubmit={handleStudentSubmitPayment}>
          <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>Institute Official UPI & QR Payment</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>UPI ID: <strong>institute.billing@okicici</strong></div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
              Transfer tuition fee amount using standard UPI/NetBanking apps (Google Pay, PhonePe, Paytm, BHIM) and enter the 12-digit UTR Transaction ID below.
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Amount (₹) <span className="required">*</span></label>
            <input
              type="number"
              step="1"
              className="form-control"
              placeholder="e.g. 25000"
              value={studentPaymentForm.amount}
              onChange={(e) => setStudentPaymentForm({ ...studentPaymentForm, amount: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select
              className="form-control"
              value={studentPaymentForm.payment_method}
              onChange={(e) => setStudentPaymentForm({ ...studentPaymentForm, payment_method: e.target.value })}
            >
              <option value="UPI">UPI (GPay / PhonePe / Paytm / BHIM)</option>
              <option value="NetBanking">NetBanking / NEFT / IMPS</option>
              <option value="Credit/Debit Card">Credit / Debit Card</option>
              <option value="Bank DD">Bank Demand Draft (DD)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Gateway Transaction Reference / UTR Number <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. 423985109283 (12-digit UTR)"
              value={studentPaymentForm.transaction_id}
              onChange={(e) => setStudentPaymentForm({ ...studentPaymentForm, transaction_id: e.target.value })}
              required
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Institute Admins verify this UTR before marking status as Paid / Successful.
            </span>
          </div>

          <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsSubmitPaymentModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Send size={16} style={{ marginRight: 6 }} /> Submit Payment for Verification
            </button>
          </div>
        </form>
      </Modal>

      {/* ADMIN PAYMENT VERIFICATION MODAL */}
      <Modal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        title={`Verify Payment: ${selectedVerificationItem?.student_name}`}
        maxWidth="480px"
      >
        <form onSubmit={handleAdminVerifyPayment}>
          <div style={{ fontSize: '0.9rem', marginBottom: '1rem', display: 'grid', gap: '6px', background: '#f1f5f9', padding: '12px', borderRadius: '8px' }}>
            <div><strong>Student:</strong> {selectedVerificationItem?.student_name} ({selectedVerificationItem?.registration_id})</div>
            <div><strong>Amount:</strong> ₹{selectedVerificationItem?.amount?.toLocaleString()}</div>
            <div><strong>Submitted UTR:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedVerificationItem?.transaction_id || 'N/A'}</span></div>
          </div>

          <div className="form-group">
            <label className="form-label">Set Verification Status <span className="required">*</span></label>
            <select
              className="form-control"
              value={verifyForm.status}
              onChange={(e) => setVerifyForm({ ...verifyForm, status: e.target.value })}
              required
            >
              <option value="Paid / Successful">Paid / Successful (Verified & Generates Tax Invoice)</option>
              <option value="Pending">Pending Gateway Confirmation</option>
              <option value="Failed">Failed / Rejected Payment</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Confirmed UTR / Gateway Transaction Reference</label>
            <input
              type="text"
              className="form-control"
              value={verifyForm.transaction_id}
              onChange={(e) => setVerifyForm({ ...verifyForm, transaction_id: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Verification Notes / Remarks</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Bank statement confirmed"
              value={verifyForm.notes}
              onChange={(e) => setVerifyForm({ ...verifyForm, notes: e.target.value })}
            />
          </div>

          <div className="modal-footer" style={{ margin: '1.25rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn-secondary" onClick={() => setIsVerifyModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>
              Confirm Verification
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINTABLE TAX INVOICE PREVIEW MODAL */}
      <Modal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        title="Official Tax Invoice Document"
        maxWidth="840px"
      >
        {selectedInvoiceUrl && (
          <iframe
            src={selectedInvoiceUrl}
            style={{ width: '100%', height: '520px', border: 'none', borderRadius: '8px' }}
            title="Tax Invoice Viewer"
          />
        )}
      </Modal>
    </div>
  );
}
export default FeesPage;
