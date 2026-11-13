import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Activity, ArrowLeft, ArrowRight, BadgeCheck, Bell, ChevronDown, ChevronLeft, ChevronRight,
  Cloud, CreditCard, Database, Eye, FileText, Grid2X2, KeyRound, ListFilter, LoaderCircle, Menu, MoreVertical, Network,
  Printer, Search, Settings, Shield, Smartphone, Users, Wifi, X,
} from 'lucide-react';

type Page = 'credentials' | 'printers' | 'dashboard' | 'details';
type PrinterInfo = {
  id: string; name: string; printer_type: string; device_id: string; status: string;
  cards_printed: number; model: string; serial_number: string; ip_address: string;
  quiet_mode: boolean | null; supplies: { name: string; percent: number }[];
  cleaning_percent: number; cards_until_cleaning: number; activity: string[];
  hoppers: string[]; firmware: string; last_checked: string;
};
type Pair = [string, string];
type Details = { product_data: Pair[]; network: Pair[]; serial_numbers: Pair[]; versions: Pair[]; options: string[] };

const navItems: { key: Page | 'designs' | 'enrollment' | 'flash' | 'profiles' | 'queue'; label: string; icon: typeof CreditCard }[] = [
  { key: 'credentials', label: 'Credentials', icon: CreditCard },
  { key: 'designs', label: 'Credential Designs', icon: Grid2X2 },
  { key: 'enrollment', label: 'Enrollment Designs', icon: FileText },
  { key: 'flash', label: 'Mobile Flash Pass Designs', icon: Smartphone },
  { key: 'profiles', label: 'Smart Card Profiles', icon: Database },
  { key: 'printers', label: 'Printers', icon: Printer },
  { key: 'queue', label: 'Print Queue', icon: ListFilter },
];

const callApi = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json() as Promise<T>;
};

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [authScreen, setAuthScreen] = useState<'user' | 'otp' | 'chooser' | 'push'>('user');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [page, setPage] = useState<Page>('credentials');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [credentials, setCredentials] = useState<{ id: string; name: string; kind: string }[]>([]);
  const [printer, setPrinter] = useState<PrinterInfo | null>(null);
  const [details, setDetails] = useState<Details | null>(null);
  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(0);
  const [busy, setBusy] = useState(true);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    Promise.all([callApi<{ printers: PrinterInfo[] }>('/api/printers'), callApi<{ credentials: typeof credentials }>('/api/credentials')])
      .then(([p, c]) => { setPrinters(p.printers); setCredentials(c.credentials); setApiError(''); })
      .catch(() => setApiError('Backend is unavailable. Start the FastAPI server to load demo data.'))
      .finally(() => setBusy(false));
  }, []);

  useEffect(() => {
    if (!printer || (page !== 'dashboard' && page !== 'details')) return;
    callApi<PrinterInfo>(`/api/printers/${printer.id}`).then(setPrinter).catch(() => {});
    if (page === 'details') callApi<Details>(`/api/printers/${printer.id}/details`).then(setDetails).catch(() => {});
  }, [page, printer?.id]);

  const filteredPrinters = useMemo(() => printers.filter((p) => `${p.name} ${p.printer_type} ${p.device_id} ${p.status}`.toLowerCase().includes(search.toLowerCase())), [printers, search]);
  const pageSize = 10;
  const visiblePrinters = filteredPrinters.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
  const openPrinter = (item: PrinterInfo) => { setPrinter(item); setPage('dashboard'); };

  if (!authenticated) {
    return <AuthFlow screen={authScreen} setScreen={setAuthScreen} userId={userId} setUserId={setUserId} otp={otp} setOtp={setOtp} onAuthenticated={() => { setAuthenticated(true); setPage('credentials'); }} />;
  }

  const crumbs = page === 'credentials' ? ['Home', 'Credentials'] : page === 'printers' ? ['Home', 'Printer List', 'Printers'] : page === 'details' ? ['Home', 'Printer Dashboard'] : ['Home', 'Printer List'];

  return (
    <div className={`app-shell ${drawerOpen ? '' : 'drawer-closed'}`}>
      {drawerOpen && <aside className="sidebar">
        <button className="drawer-close" aria-label="Collapse navigation" onClick={() => setDrawerOpen(false)}><ChevronLeft size={17} /></button>
        <nav>{navItems.map(({ key, label, icon: Icon }) => <button key={key} aria-label={label} title={label} className={`nav-item ${page === key ? 'selected' : ''}`} onClick={() => { if (key === 'credentials' || key === 'printers') { setPage(key); setSearch(''); setPageIndex(0); } }}><Icon size={16} /><span>{label}</span></button>)}
          <button className="nav-item" aria-label="Administration" title="Administration"><Users size={16} /><span>Administration</span><ChevronDown size={14} className="nav-tail" /></button>
        </nav>
      </aside>}
      <div className="workspace">
        <header className="topbar">
          {!drawerOpen && <button className="icon-button" aria-label="Open navigation" onClick={() => setDrawerOpen(true)}><Menu size={19} /></button>}
          <div className="topbar-spacer" />
          <button className="user-menu">{userId || 'Demo User'} <MoreVertical size={16} /></button>
        </header>
        {page === 'credentials' && <main className="content">
          <Breadcrumb items={crumbs} />
          <SectionBar title="Credentials" icon={<CreditCard size={16} />} />
          {apiError && <p className="api-error">{apiError}</p>}
          <div className="credential-grid">{credentials.map((card, i) => <button key={card.id} className="credential-card" onClick={() => setPage('credentials')}>
            <span className="credential-name">{card.name}</span>
            <div className={`badge-preview badge-${i % 4}`}><div className="badge-photo">{['JD', 'AM', 'RK', 'TS'][i % 4]}</div><div className="badge-info"><b>{card.kind}</b><span>DEMO ACCESS</span><i /></div><div className="badge-qr">▦</div></div>
            <div className="card-actions"><span><BadgeCheck size={17} /></span><span><Search size={17} /></span></div>
          </button>)}</div>
        </main>}
        {page === 'printers' && <main className="content">
          <Breadcrumb items={crumbs} />
          <SectionBar title="Printers" icon={<Printer size={16} />} />
          {apiError && <p className="api-error">{apiError}</p>}
          <div className="table-tools"><label className="search-box"><Search size={15} /><input value={search} onChange={(e) => { setSearch(e.target.value); setPageIndex(0); }} placeholder="Search printers" aria-label="Search printers" />{search && <button onClick={() => setSearch('')} aria-label="Clear search"><X size={14} /></button>}</label></div>
          <div className="table-wrap"><table className="printer-table"><thead><tr><th>Name <ArrowRight size={13} className="sort-arrow" /></th><th>Printer Type</th><th>Device Id</th><th>Status</th><th>Cards Printed</th><th>Actions</th></tr></thead><tbody>
            {visiblePrinters.map((item) => <tr key={item.id}><td><button className="text-link" onClick={() => openPrinter(item)}>{item.name}</button></td><td>{item.printer_type}</td><td className="mono">{item.device_id}</td><td><span className={`status-pill status-${item.status.toLowerCase()}`}><i />{item.status}</span></td><td>{item.cards_printed.toLocaleString()}</td><td><div className="row-actions"><button title="View printer" onClick={() => openPrinter(item)}><Eye size={16} /></button><button title="Edit (demo only)" onClick={() => window.alert('Editing is not enabled in this demo.')}><Settings size={15} /></button><button title="More actions" onClick={() => openPrinter(item)}><MoreVertical size={15} /></button></div></td></tr>)}
            {!busy && visiblePrinters.length === 0 && <tr><td colSpan={6} className="empty-table">No printers match your search.</td></tr>}
          </tbody></table></div>
          <div className="table-footer"><span>Rows per page: <select value={pageSize} aria-label="Rows per page" onChange={() => setPageIndex(0)}><option>10</option></select></span><span>{filteredPrinters.length ? `${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, filteredPrinters.length)} of ${filteredPrinters.length}` : '0 results'}</span><div><button disabled={pageIndex === 0} onClick={() => setPageIndex(0)} aria-label="First page"><ChevronLeft size={16} /><ChevronLeft size={16} /></button><button disabled={pageIndex === 0} onClick={() => setPageIndex((v) => Math.max(0, v - 1))} aria-label="Previous page"><ChevronLeft size={16} /></button><button disabled={(pageIndex + 1) * pageSize >= filteredPrinters.length} onClick={() => setPageIndex((v) => v + 1)} aria-label="Next page"><ChevronRight size={16} /></button></div></div>
        </main>}
        {page === 'dashboard' && printer && <main className="content dashboard-content">
          <Breadcrumb items={crumbs} />
          <div className="dashboard-title"><div><h1>Printer Dashboard</h1><p className="pink-crumb">Home <span>›</span> Printer List</p></div><BrandLockup /></div>
          <div className="dashboard-grid">
            <SummaryCard printer={printer} onDetails={() => setPage('details')} />
            <Panel title="Supplies" className="supplies-panel">{printer.supplies.length ? <div className="supply-content">{printer.supplies.map((s) => <div className="supply-item" key={s.name}><div className="level-meter"><i style={{ height: `${s.percent}%` }} /></div><span>{s.name}</span></div>)}<div className="supply-buttons"><button className="secondary-button">ORDER SUPPLIES</button><button className="secondary-button">SUPPLY DETAILS</button></div></div> : <p className="panel-empty">No supplies were detected.</p>}</Panel>
            <Panel title="Cleaning Card" className="cleaning-panel"><div className="cleaning-content"><div><div className="level-meter tall"><i style={{ height: `${printer.cleaning_percent}%` }} /></div><span className="subtle">Clean %</span></div><div className="cleaning-count">Cards to<br />Print Until<br />Cleaning<strong>{printer.cards_until_cleaning}</strong></div></div><button className="secondary-button full-button">CLEANING CARD</button></Panel>
            <Panel title="Device Activity" className="activity-panel">{printer.activity.length ? printer.activity.map((a) => <p className="activity-row" key={a}><Activity size={14} />{a}</p>) : <p className="panel-empty">There has been no recent device activity.</p>}</Panel>
            <Panel title="Hoppers" className="hopper-panel">{printer.hoppers.length ? printer.hoppers.map((h) => <div className="hopper-item" key={h}><Database size={26} /><div>{h}<span className="status-pill status-idle"><i />Cards available</span></div></div>) : <p className="panel-empty">No hoppers were detected.</p>}</Panel>
            <Panel title="Firmware" className="firmware-panel"><Cloud size={35} className="firmware-cloud"/><div><small>Current Firmware Version:</small><b>{printer.firmware}</b><span className="status-pill status-idle"><i />The firmware is up to date</span><small>Last checked {printer.last_checked}</small></div><button className="secondary-button">CHECK FOR UPDATE</button></Panel>
          </div>
          <Footer />
        </main>}
        {page === 'details' && printer && <main className="content details-content">
          <Breadcrumb items={crumbs} />
          <div className="dashboard-title"><div><h1>Device Details</h1><p className="pink-crumb">Home <span>›</span><button onClick={() => setPage('dashboard')}>Printer Dashboard</button></p></div><BrandLockup /></div>
          {!details ? <div className="loading"><LoaderCircle className="spin" /> Loading device details…</div> : <>
            <div className="details-grid"><DetailPanel title="Product Data" rows={details.product_data} /><DetailPanel title="Network - Ethernet" rows={details.network} /><DetailPanel title="Serial Numbers" rows={details.serial_numbers} /><DetailPanel title="Versions" rows={details.versions} scroll /><DetailPanel title="Options" rows={details.options.map((o) => [o, ''])} scroll /></div>
            <Footer />
          </>}
        </main>}
      </div>
    </div>
  );
}

function AuthFlow({ screen, setScreen, userId, setUserId, otp, setOtp, onAuthenticated }: { screen: 'user' | 'otp' | 'chooser' | 'push'; setScreen: (v: 'user' | 'otp' | 'chooser' | 'push') => void; userId: string; setUserId: (v: string) => void; otp: string; setOtp: (v: string) => void; onAuthenticated: () => void }) {
  const [showCode, setShowCode] = useState(false);
  return <div className="auth-page"><div className="auth-topbar" />
    <section className={`auth-card ${screen === 'chooser' ? 'chooser-card' : ''}`}>
      <BrandLockup large />
      {screen === 'user' && <div className="auth-body"><h2>Login to access Printer Console Demo.</h2><label className="field-label">Enter User ID<input autoFocus value={userId} onChange={(e) => setUserId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && userId.trim() && setScreen('otp')} /></label><button className="primary-button" disabled={!userId.trim()} onClick={() => setScreen('otp')}>NEXT <ArrowRight size={15} /></button></div>}
      {screen === 'otp' && <div className="auth-body"><h2>Welcome</h2><span className="user-chip"><Users size={14} />{userId || 'demo-user'}</span><p className="auth-instruction">Enter the one-time password that was just sent to you.</p><label className="field-label">Enter OTP<div className="password-field"><input autoFocus type={showCode ? 'text' : 'password'} value={otp} onChange={(e) => setOtp(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAuthenticated()} /><button aria-label="Show code" onClick={() => setShowCode((v) => !v)}><Eye size={17} /></button></div></label><button className="resend-link">Resend OTP using Email</button><div className="auth-actions"><button className="text-action" onClick={() => setScreen('chooser')}>Alternative Authentication</button><button className="outline-button" onClick={() => setScreen('user')}>CANCEL</button><button className="primary-button" onClick={onAuthenticated}>LOGIN</button></div><p className="demo-hint">Demo only — any code is accepted.</p></div>}
      {screen === 'chooser' && <div className="auth-body chooser-body"><div className="chooser-heading">Alternative Authentication</div><button className="auth-option" onClick={() => setScreen('push')}><Smartphone size={19} />Soft Token Push<ChevronRight size={16} /></button><button className="auth-option" onClick={() => setScreen('otp')}><KeyRound size={18} />Software / Hardware Token<ChevronRight size={16} /></button><button className="outline-button back-button" onClick={() => setScreen('otp')}><ArrowLeft size={14} /> BACK</button></div>}
      {screen === 'push' && <div className="auth-body push-body"><h2>Approve sign-in</h2><span className="user-chip"><Shield size={14} />{userId || 'demo-user'}</span><div className="push-illustration"><Smartphone size={34} /><Bell size={20} /></div><p>Confirm the authentication request displayed in your mobile application.</p><button className="primary-button" onClick={onAuthenticated}>Simulate approval</button><button className="text-action" onClick={() => setScreen('chooser')}>Choose another method</button><p className="demo-hint">Demo only — no notification is sent.</p></div>}
    </section>
    <div className="auth-footer"><span>© 2026 Printer Console Demo</span><span>Help&nbsp;&nbsp; Privacy</span></div>
  </div>;
}

function BrandLockup({ large = false }: { large?: boolean }) {
  return <div className={`brand-lockup ${large ? 'brand-large' : ''}`}><span className="brand-symbol"><span /></span><b>PRINTER CONSOLE</b><i /> <span>Issuance<br />Management</span></div>;
}
function Breadcrumb({ items }: { items: string[] }) { return <div className="breadcrumb">{items.map((item, i) => <span key={`${item}-${i}`} className={i === items.length - 1 ? 'current' : ''}>{i > 0 && <ChevronRight size={12} />}{item}</span>)}</div>; }
function SectionBar({ title, icon }: { title: string; icon: ReactNode }) { return <div className="section-bar"><span>{icon}</span><b>{title}</b></div>; }
function Panel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) { return <section className={`panel ${className}`}><header>{title}</header><div className="panel-body">{children}</div></section>; }
function Footer() { return <footer className="site-footer"><span>© 2026 Printer Console Demo. All rights reserved.</span><span>Terms of Service&nbsp;&nbsp; Privacy Statement&nbsp;&nbsp; Support</span></footer>; }

function SummaryCard({ printer, onDetails }: { printer: PrinterInfo; onDetails: () => void }) {
  const idle = printer.status === 'Idle';
  return <Panel title="Summary" className="summary-panel"><div className="printer-identity"><Printer size={38} /><div><span className={`state-square ${idle ? 'green' : printer.status === 'Busy' ? 'amber' : 'red'}`} /><strong>{printer.serial_number}</strong><small>{printer.status}</small></div>{printer.quiet_mode !== null && <label className="quiet-switch"><input type="checkbox" checked={printer.quiet_mode} onChange={() => {}} /><span />Quiet Mode</label>}</div>
    <div className="summary-table"><div className="summary-cell wide"><b>Printer Name</b><span>{printer.name}</span></div><div className="summary-cell"><b>Model</b><span>{printer.model}</span></div><div className="summary-cell"><b>Network</b><span className="network-icons"><Network size={16} /><Wifi size={16} /><Cloud size={17} /></span></div><div className="summary-cell"><b>Serial Number</b><span>{printer.serial_number}</span></div><div className="summary-cell"><b>Cards Printed</b><span>{printer.cards_printed.toLocaleString()}</span></div></div>
    <div className="summary-actions"><button className="secondary-button" onClick={onDetails}>DEVICE DETAILS</button></div>
  </Panel>;
}
function DetailPanel({ title, rows, scroll = false }: { title: string; rows: Pair[]; scroll?: boolean }) { return <Panel title={title} className={`detail-panel ${scroll ? 'scroll-panel' : ''}`}><div className="detail-rows">{rows.map(([label, value], i) => <div className="detail-row" key={`${label}-${i}`}><span>{label}</span><b>{value}</b></div>)}</div></Panel>; }
