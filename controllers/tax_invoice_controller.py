from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from database.database import get_db
from security.auth import get_current_user
from models.student import Student
from models.institute import Institute
from services.tax_invoice_service import (
    get_invoice_by_id,
    get_student_tax_invoices,
    get_institute_tax_invoices
)

router = APIRouter(
    prefix="/invoices",
    tags=["Tax Invoices"]
)


@router.get("/student/{student_id}")
def get_student_invoices_api(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user.get("role", "").lower()
    if role == "student":
        student = db.query(Student).filter(Student.registration_id == current_user["username"]).first()
        if not student or student.id != student_id:
            raise HTTPException(status_code=403, detail="You can only view your own tax invoices.")

    invoices = get_student_tax_invoices(db, student_id)
    return invoices


@router.get("/institute")
def get_institute_invoices_api(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    role = current_user.get("role", "").lower()
    if role not in ["admin", "institute", "institute_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required.")

    inst_code = current_user.get("institute_code")
    if not inst_code:
        return []

    return get_institute_tax_invoices(db, inst_code)


@router.get("/{invoice_id}")
def get_invoice_details_api(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    invoice = get_invoice_by_id(db, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Tax Invoice not found.")

    inst = db.query(Institute).filter(Institute.institute_code == invoice.institute_code).first()

    return {
        "invoice": invoice,
        "institute": {
            "name": inst.name if inst else "AI Smart Institute",
            "code": inst.institute_code if inst else "DEFAULT",
            "address": inst.address if inst else "Main Academic Campus",
            "contact_number": inst.contact_number if inst else "Helpline",
            "email": inst.email if inst else "support@institute.edu"
        }
    }


@router.get("/{invoice_id}/html", response_class=HTMLResponse)
def get_invoice_html_view(
    invoice_id: int,
    db: Session = Depends(get_db)
):
    invoice = get_invoice_by_id(db, invoice_id)
    if not invoice:
        return HTMLResponse(content="<h1>404 - Tax Invoice Not Found</h1>", status_code=404)

    inst = db.query(Institute).filter(Institute.institute_code == invoice.institute_code).first()
    inst_name = inst.name if inst else "AI SMART INSTITUTE OF TECHNOLOGY"
    inst_addr = inst.address if inst else "Central Academic Campus, Tech Corridor"
    inst_email = inst.email if inst else "billing@institute.edu"
    inst_phone = inst.contact_number if inst else "+91 9876543210"

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Tax Invoice - {invoice.invoice_number}</title>
      <style>
        body {{
          font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          margin: 0;
          padding: 30px;
          background-color: #f8fafc;
          color: #1e293b;
        }}
        .invoice-card {{
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }}
        .header {{
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }}
        .brand {{
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }}
        .brand-sub {{
          font-size: 13px;
          color: #64748b;
          margin-top: 4px;
        }}
        .inv-title {{
          text-align: right;
        }}
        .inv-badge {{
          background: #2563eb;
          color: #ffffff;
          padding: 4px 12px;
          font-weight: 700;
          font-size: 13px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 6px;
        }}
        .inv-num {{
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
        }}
        .meta-grid {{
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
          background: #f1f5f9;
          padding: 20px;
          border-radius: 8px;
        }}
        .meta-box h4 {{
          margin: 0 0 8px 0;
          font-size: 12px;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
        }}
        .meta-box p {{
          margin: 2px 0;
          font-size: 14px;
          font-weight: 600;
        }}
        table {{
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }}
        th, td {{
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }}
        th {{
          background-color: #0f172a;
          color: #ffffff;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 12px;
        }}
        .text-right {{
          text-align: right;
        }}
        .totals-table {{
          width: 320px;
          margin-left: auto;
          border-collapse: collapse;
        }}
        .totals-table td {{
          padding: 8px 12px;
        }}
        .totals-table .grand-total {{
          background: #eff6ff;
          font-size: 16px;
          font-weight: 800;
          color: #1e40af;
          border-top: 2px solid #2563eb;
        }}
        .status-stamp {{
          display: inline-block;
          border: 2px solid #10b981;
          color: #059669;
          padding: 4px 14px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 14px;
          text-transform: uppercase;
          margin-top: 15px;
        }}
        .footer {{
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
        }}
        @media print {{
          body {{ background: #ffffff; padding: 0; }}
          .invoice-card {{ box-shadow: none; border: none; padding: 0; }}
          .no-print {{ display: none; }}
        }}
      </style>
    </head>
    <body>
      <div className="no-print" style="max-width: 800px; margin: 0 auto 20px; text-align: right;">
        <button onclick="window.print()" style="background: #2563eb; color: #fff; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer;">
          🖨️ Print / Download PDF
        </button>
      </div>

      <div class="invoice-card">
        <div class="header">
          <div>
            <div class="brand">{inst_name}</div>
            <div class="brand-sub">{inst_addr}</div>
            <div class="brand-sub">Email: {inst_email} | Contact: {inst_phone}</div>
          </div>
          <div class="inv-title">
            <div class="inv-badge">OFFICIAL TAX INVOICE</div>
            <div class="inv-num">{invoice.invoice_number}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Date: {invoice.payment_date}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-box">
            <h4>Billed To (Student Details)</h4>
            <p>{invoice.student_name}</p>
            <p style="color: #2563eb;">Enrollment ID: {invoice.registration_id}</p>
            <p>Email: {invoice.student_email or '—'}</p>
            <p>Mobile: {invoice.student_mobile or '—'}</p>
          </div>
          <div class="meta-box">
            <h4>Payment & Tax Reference</h4>
            <p>Payment Method: {invoice.payment_method}</p>
            <p>UTR / Txn ID: {invoice.transaction_id or 'N/A'}</p>
            <p>SAC Code: {invoice.hsn_sac_code} (Educational Services)</p>
            <div class="status-stamp">✓ {invoice.status}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description / Course Services</th>
              <th>SAC Code</th>
              <th class="text-right">Base Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>
                <strong>{invoice.course_name}</strong>
                <div style="font-size: 12px; color: #64748b;">Academic Tuition & Syllabus Training Fee</div>
              </td>
              <td>{invoice.hsn_sac_code}</td>
              <td class="text-right">₹{invoice.subtotal_amount:,.2f}</td>
            </tr>
          </tbody>
        </table>

        <table class="totals-table">
          <tr>
            <td>Base Amount (Subtotal):</td>
            <td class="text-right">₹{invoice.subtotal_amount:,.2f}</td>
          </tr>
          <tr>
            <td>CGST ({invoice.cgst_rate}%):</td>
            <td class="text-right">₹{invoice.cgst_amount:,.2f}</td>
          </tr>
          <tr>
            <td>SGST ({invoice.sgst_rate}%):</td>
            <td class="text-right">₹{invoice.sgst_amount:,.2f}</td>
          </tr>
          <tr class="grand-total">
            <td>Total Tax Paid:</td>
            <td class="text-right">₹{invoice.total_amount:,.2f}</td>
          </tr>
        </table>

        <div class="footer">
          This is a computer-generated official Tax Invoice. Authorized by {inst_name}.
        </div>
      </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
