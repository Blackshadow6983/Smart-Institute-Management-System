import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { CreditCard, Plus, CheckCircle2, AlertCircle, Receipt, IndianRupee, Wallet } from 'lucide-react';

export function FeesPage() {
  const { user } = useAuth();
  const [feeData, setFeeData] = useState(null);
  const [feeSummary, setFeeSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Fee Payment Modal
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    student_id: '',
    amount: '',
    payment_method: 'Online Transfer',
    receipt_number: `REC-${Date.now().toString().slice(-6)}`
  });

  const loadFeeDetails = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const [feesRes, sumRes] = await Promise.allSettled([
        api.getStudentFees(studentId),
        api.getFeeSummary(studentId)
      ]);

      if (feesRes.status === 'fulfilled') {
        setFeeData(feesRes.value);
      } else {
        setFeeData(null);
      }

      if (sumRes.status === 'fulfilled') {
        setFeeSummary(sumRes.value);
      } else {
        setFeeSummary(null);
      }
    } catch (err) {
      setError(err.message || 'Error loading fee statement.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError('');
      try {
        const role = (user?.role || '').toLowerCase();
        if (role === 'student' && user?.username) {
          const prof = await api.getStudent(user.username);
          if (prof.student?.id) {
            setSelectedStudentId(prof.student.id);
            await loadFeeDetails(prof.student.id);
          }
        } else if (role === 'admin' || role === 'faculty') {
          const stuList = await api.getAllStudents().catch(() => []);
          const list = Array.isArray(stuList) ? stuList : [];
          setStudents(list);
          if (list.length > 0) {
            setSelectedStudentId(list[0].id);
            await loadFeeDetails(list[0].id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        setError(err.message || 'Failed to initialize fee accounting.');
        setLoading(false);
      }
    }

    init();
  }, [user]);

  const handleStudentChange = (e) => {
    const sId = parseInt(e.target.value);
    setSelectedStudentId(sId);
    loadFeeDetails(sId);
  };

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.createFeePayment({
        student_id: parseInt(paymentForm.student_id),
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.payment_method,
        receipt_number: paymentForm.receipt_number
      });
      setSuccess(`Payment of ₹${paymentForm.amount} recorded under receipt #${paymentForm.receipt_number}!`);
      setIsAddPaymentModalOpen(false);
      setPaymentForm({
        student_id: selectedStudentId || '',
        amount: '',
        payment_method: 'Online Transfer',
        receipt_number: `REC-${Date.now().toString().slice(-6)}`
      });
      if (selectedStudentId === parseInt(paymentForm.student_id)) {
        loadFeeDetails(selectedStudentId);
      }
    } catch (err) {
      setError(err.message || 'Failed to record fee payment.');
    }
  };

  const payments = feeData?.payments || [];
  const totalCourseFee = feeSummary?.total_fee !== undefined ? feeSummary.total_fee : feeData?.total_fee || 0;
  const paidAmount = feeSummary?.total_paid !== undefined ? feeSummary.total_paid : feeData?.paid_amount || 0;
  const balanceDue = feeSummary?.balance_due !== undefined ? feeSummary.balance_due : (totalCourseFee - paidAmount);
  const status = feeSummary?.status || feeData?.status || (balanceDue <= 0 ? 'Fully Paid' : paidAmount > 0 ? 'Partial Due' : 'Unpaid');

  const isAdmin = user?.role === 'admin';

  return (
    <div>
      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={16} />
          <div>{success}</div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
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
            <div className="kpi-label">Total Amount Paid</div>
            <div className="kpi-value" style={{ color: 'var(--status-success-text)' }}>
              ₹{parseFloat(paidAmount).toLocaleString()}
            </div>
            <div className="kpi-subtext">Verified bank / receipt credits</div>
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
              <StatusBadge status={status} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h2 className="card-title">
              <Receipt size={18} />
              Verified Fee Payment History & Ledger
            </h2>
            {(user?.role === 'admin' || user?.role === 'faculty') && students.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Student:</span>
                <select
                  className="form-control"
                  style={{ width: 'auto', padding: '3px 8px', fontSize: '12px' }}
                  value={selectedStudentId || ''}
                  onChange={handleStudentChange}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.registration_id} - {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => {
              setPaymentForm({
                ...paymentForm,
                student_id: selectedStudentId || '',
                receipt_number: `REC-${Date.now().toString().slice(-6)}`
              });
              setIsAddPaymentModalOpen(true);
            }}>
              <Plus size={14} />
              Record Fee Payment
            </button>
          )}
        </div>

        <div className="card-body">
          {loading ? (
            <LoadingSpinner message="Loading financial ledger..." />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No payment records found"
              description="No fee transactions have been posted for this student record."
            />
          ) : (
            <div className="table-container">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Receipt No.</th>
                    <th>Payment Date</th>
                    <th>Payment Method</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p, idx) => (
                    <tr key={p.id || idx}>
                      <td style={{ fontWeight: 700, color: 'var(--primary-navy)' }}>{p.receipt_number}</td>
                      <td>{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : 'Verified'}</td>
                      <td>{p.payment_method || 'Cash / Bank'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--status-success-text)' }}>
                        ₹{parseFloat(p.amount).toLocaleString()}
                      </td>
                      <td>
                        <StatusBadge status="Paid" type="success" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        title="Record Fee Payment Receipt"
        maxWidth="480px"
      >
        <form onSubmit={handleCreatePayment}>
          <div className="form-group">
            <label className="form-label">Student <span className="required">*</span></label>
            <select
              className="form-control"
              value={paymentForm.student_id}
              onChange={(e) => setPaymentForm({ ...paymentForm, student_id: e.target.value })}
              required
            >
              <option value="">Select Student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.registration_id} - {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Receipt Number <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              value={paymentForm.receipt_number}
              onChange={(e) => setPaymentForm({ ...paymentForm, receipt_number: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Amount (₹) <span className="required">*</span></label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 5000"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <select
              className="form-control"
              value={paymentForm.payment_method}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })}
            >
              <option value="Online Transfer">Online Transfer / UPI</option>
              <option value="Bank Demand Draft">Bank Demand Draft (DD)</option>
              <option value="Cash Receipt">Cash Receipt</option>
              <option value="Credit/Debit Card">Credit/Debit Card</option>
            </select>
          </div>

          <div className="modal-footer" style={{ margin: '1rem -1.25rem -1.25rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddPaymentModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Post Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
