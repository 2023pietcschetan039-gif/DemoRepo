import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'farewell-pool-state'
const emptyPool = { name: '', budget: '', organizer: '', members: [] }
const demoPool = {
  name: "Chetan's Farewell Gift",
  budget: '6000',
  organizer: 'Chetan',
  members: [
    { id: 'chetan', name: 'Chetan', paid: '1000' },
    { id: 'rahul', name: 'Rahul', paid: '500' },
    { id: 'amit', name: 'Amit', paid: '1500' },
    { id: 'priya', name: 'Priya', paid: '1000' },
    { id: 'neha', name: 'Neha', paid: '0' },
    { id: 'rohit', name: 'Rohit', paid: '1000' },
  ],
}

function toPaise(value) {
  const amount = Number.parseFloat(value)
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0
}

function formatCurrency(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function getSettlement(members, fairShare) {
  const debtors = members.map((member) => ({ ...member, balance: toPaise(member.paid) - fairShare })).filter((member) => member.balance < 0).map((member) => ({ ...member, amount: Math.abs(member.balance) }))
  const creditors = members.map((member) => ({ ...member, balance: toPaise(member.paid) - fairShare })).filter((member) => member.balance > 0).map((member) => ({ ...member, amount: member.balance }))
  const transactions = []
  let debtorIndex = 0
  let creditorIndex = 0

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex]
    const creditor = creditors[creditorIndex]
    const amount = Math.min(debtor.amount, creditor.amount)
    if (amount > 0) transactions.push({ from: debtor.name, to: creditor.name, amount })
    debtor.amount -= amount
    creditor.amount -= amount
    if (debtor.amount === 0) debtorIndex += 1
    if (creditor.amount === 0) creditorIndex += 1
  }
  return transactions
}

function App() {
  const [pool, setPool] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || emptyPool } catch { return emptyPool }
  })
  const [setup, setSetup] = useState({ name: '', budget: '', organizer: '' })
  const [memberName, setMemberName] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(pool)) }, [pool])

  const budget = toPaise(pool.budget)
  const totalCollected = pool.members.reduce((total, member) => total + toPaise(member.paid), 0)
  const remaining = Math.max(budget - totalCollected, 0)
  const fairShare = pool.members.length ? Math.round(budget / pool.members.length) : 0
  const settlement = useMemo(() => getSettlement(pool.members, fairShare), [pool.members, fairShare])

  function createPool(event) {
    event.preventDefault()
    if (!setup.name.trim() || toPaise(setup.budget) <= 0 || !setup.organizer.trim()) {
      setMessage('Add a pool name, organizer, and a budget greater than ₹0.')
      return
    }
    setPool({ ...emptyPool, name: setup.name.trim(), budget: setup.budget, organizer: setup.organizer.trim() })
    setSetup({ name: '', budget: '', organizer: '' })
    setMessage('Pool created. Add your members below.')
  }

  function addMember(event) {
    event.preventDefault()
    const normalized = memberName.trim()
    if (!normalized) return setMessage('Enter a member name first.')
    if (pool.members.some((member) => member.name.toLowerCase() === normalized.toLowerCase())) return setMessage('That member is already in the pool.')
    setPool((current) => ({ ...current, members: [...current.members, { id: crypto.randomUUID(), name: normalized, paid: '0' }] }))
    setMemberName('')
    setMessage('Member added.')
  }

  function updatePayment(id, value) {
    if (value !== '' && Number(value) < 0) return
    setPool((current) => ({ ...current, members: current.members.map((member) => member.id === id ? { ...member, paid: value } : member) }))
  }

  function loadDemo() {
    setPool(demoPool)
    setSetup({ name: '', budget: '', organizer: '' })
    setMessage('Demo data loaded. Try changing a payment to see the settlement update.')
  }

  function removeMember(id) { setPool((current) => ({ ...current, members: current.members.filter((member) => member.id !== id) })) }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top"><span className="brand-mark">₹</span><span>Splitwise</span></a>
        <nav><a href="#dashboard">Dashboard</a><a href="#members">Members</a><a href="#settlement">Settlement</a></nav>
        <button className="button button-ghost" type="button" onClick={loadDemo}>Load demo data</button>
      </header>

      <main id="top">
        <section className="intro">
          <div><p className="eyebrow">CONTRIBUTION POOL</p><h1>{pool.name || 'Make the group gift easy.'}</h1><p className="intro-copy">Track contributions, see who is settled, and finish the math before the farewell begins.</p></div>
          <div className="intro-note"><span className="note-dot"></span><div><strong>{pool.organizer ? `Organized by ${pool.organizer}` : 'Ready when you are'}</strong><span>{pool.members.length ? `${pool.members.length} people in this pool` : 'Set up your first pool below'}</span></div></div>
        </section>

        <section className="setup-grid" aria-label="Pool setup">
          <div className="section-heading"><p className="eyebrow">01 / SETUP</p><h2>Create your pool</h2><p>Start with the basics. You can always update payments later.</p></div>
          <form className="setup-form" onSubmit={createPool}>
            <label>Pool name<input value={setup.name} onChange={(event) => setSetup({ ...setup, name: event.target.value })} placeholder="e.g. Priya's farewell" /></label>
            <label>Total budget<div className="input-prefix"><span>₹</span><input type="number" min="0" step="0.01" value={setup.budget} onChange={(event) => setSetup({ ...setup, budget: event.target.value })} placeholder="6000" /></div></label>
            <label>Organizer name<input value={setup.organizer} onChange={(event) => setSetup({ ...setup, organizer: event.target.value })} placeholder="Your name" /></label>
            <button className="button button-primary" type="submit">Create pool <span>→</span></button>
          </form>
        </section>

        {message && <div className="message" role="status">{message}<button type="button" onClick={() => setMessage('')} aria-label="Dismiss message">×</button></div>}

        <section className="dashboard-section" id="dashboard">
          <div className="section-heading inline-heading"><div><p className="eyebrow">02 / OVERVIEW</p><h2>Pool dashboard</h2></div><span className={remaining === 0 && budget > 0 ? 'collection-status complete' : 'collection-status'}>{remaining === 0 && budget > 0 ? '✓ Fully collected' : `${formatCurrency(remaining)} left to collect`}</span></div>
          <div className="summary-grid"><SummaryCard label="Total budget" value={formatCurrency(budget)} accent="orange" /><SummaryCard label="Total collected" value={formatCurrency(totalCollected)} accent="green" /><SummaryCard label="Members" value={pool.members.length} accent="blue" /><SummaryCard label="Equal share" value={formatCurrency(fairShare)} accent="yellow" /></div>
        </section>

        <section className="content-grid" id="members">
          <div className="members-panel panel">
            <div className="panel-heading"><div><p className="eyebrow">03 / PEOPLE</p><h2>Members</h2></div><span className="count-badge">{pool.members.length}</span></div>
            <form className="add-member" onSubmit={addMember}><input value={memberName} onChange={(event) => setMemberName(event.target.value)} placeholder="Add a member" aria-label="Member name" /><button className="button button-secondary" type="submit">+ Add member</button></form>
            <div className="member-list">{pool.members.length === 0 ? <p className="empty-state">No members yet. Add people to see the equal share.</p> : pool.members.map((member) => <div className="member-row" key={member.id}><span className="avatar">{member.name.charAt(0).toUpperCase()}</span><span className="member-name">{member.name}</span><button className="remove-button" onClick={() => removeMember(member.id)} type="button" aria-label={`Remove ${member.name}`}>×</button></div>)}</div>
          </div>

          <div className="contribution-panel panel" aria-label="Contribution table"><div className="panel-heading"><div><p className="eyebrow">04 / CONTRIBUTIONS</p><h2>Who has paid?</h2></div><span className="table-help">Enter amounts in ₹</span></div><div className="table-wrap"><table><thead><tr><th>Name</th><th>Fair share</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>{pool.members.length === 0 ? <tr><td colSpan="5" className="empty-cell">Add members to start tracking contributions.</td></tr> : pool.members.map((member) => { const balance = toPaise(member.paid) - fairShare; const status = balance < 0 ? 'Owes' : balance > 0 ? 'Receives' : 'Settled'; return <tr key={member.id}><td><strong>{member.name}</strong></td><td>{formatCurrency(fairShare)}</td><td><div className="payment-input"><span>₹</span><input type="number" min="0" step="0.01" value={member.paid} onChange={(event) => updatePayment(member.id, event.target.value)} aria-label={`Paid amount for ${member.name}`} /></div></td><td className={balance < 0 ? 'negative' : balance > 0 ? 'positive' : ''}>{balance < 0 ? '-' : balance > 0 ? '+' : ''}{formatCurrency(Math.abs(balance))}</td><td><span className={`status status-${status.toLowerCase()}`}>{status}</span></td></tr> })}</tbody></table></div></div>
        </section>

        <section className="settlement-section panel" id="settlement"><div className="settlement-copy"><p className="eyebrow">05 / WRAP UP</p><h2>Settle up, simply.</h2><p>Here is the shortest path to square everyone up. Payments are matched between people who owe and people who paid extra.</p></div><div className="transaction-list">{settlement.length === 0 ? <div className="settled-message"><span>✓</span><div><strong>Everyone is settled</strong><p>No transfers are needed right now.</p></div></div> : settlement.map((transaction, index) => <div className="transaction" key={`${transaction.from}-${transaction.to}-${index}`}><span className="transaction-number">{String(index + 1).padStart(2, '0')}</span><div><strong>{transaction.from} <span>pays</span> {transaction.to}</strong><small>{formatCurrency(transaction.amount)}</small></div></div>)}</div></section>
      </main>
      <footer><span>Built for a smoother group gift.</span><span>Changes save automatically in this browser.</span></footer>
    </div>
  )
}

function SummaryCard({ label, value, accent }) { return <div className={`summary-card accent-${accent}`}><span className="card-accent"></span><p>{label}</p><strong>{value}</strong></div> }

export default App
