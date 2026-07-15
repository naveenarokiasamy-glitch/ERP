const FIELDS = [
  { key: 'companyName', label: 'Company Name', required: true },
  { key: 'contactPerson', label: 'Contact Person' },
  { key: 'gst', label: 'GST Number' },
  { key: 'address1', label: 'Address Line 1' },
  { key: 'address2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'pincode', label: 'Pincode' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
];

export default function VendorDetails({ mode = 'form', vendor, onChange, heading = 'Vendor Details' }) {
  if (mode === 'print') {
    const addressLine = [vendor.city, vendor.state, vendor.pincode].filter(Boolean).join(' - ');
    return (
      <div className="doc-block">
        <p>To,</p>
        <p className="doc-label">M/s. {vendor.companyName || '__________'}</p>
        {vendor.address1 && <p>{vendor.address1},</p>}
        {vendor.address2 && <p>{vendor.address2},</p>}
        {addressLine && <p>{addressLine}.</p>}
        {vendor.gst && <p>GST: {vendor.gst}</p>}
        {vendor.contactPerson && <p>Attn: {vendor.contactPerson}</p>}
        {vendor.phone && <p>Phone: {vendor.phone}</p>}
        {vendor.email && <p>Email: {vendor.email}</p>}
      </div>
    );
  }

  const handle = (key) => (e) => onChange({ ...vendor, [key]: e.target.value });

  return (
    <section className="form-card">
      <h3 className="form-card__title">{heading}</h3>
      <div className="vendor-grid">
        {FIELDS.map((f) => (
          <label key={f.key} className={`field ${f.key === 'address1' || f.key === 'address2' ? 'field--wide' : ''}`}>
            <span className="field__label">
              {f.label}
              {f.required && <span className="field__required">*</span>}
            </span>
            <input
              className="field__input"
              type={f.key === 'email' ? 'email' : 'text'}
              value={vendor[f.key] || ''}
              onChange={handle(f.key)}
              placeholder={f.label}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
