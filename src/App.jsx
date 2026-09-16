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

function normalizeName(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase()
}

function parseAmountValue(rawValue) {
  if (rawValue === null || rawValue === undefined) return null

  const text = String(rawValue).trim()
  if (!text) return null

  const cleaned = text
    .replace(/₹/gi, '')
    .replace(/rs\.?/gi, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')

  if (!/^[-+]?\d+(?:\.\d+)?$/.test(cleaned)) return null

  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed) || parsed < 0) return null

  return Number(parsed.toFixed(2))
}

function parseDelimitedRow(row) {
  if (!row) return []

  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < row.length; index += 1) {
    const character = row[index]

    if (character === '"') {
      if (inQuotes && row[index + 1] === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if ((character === ',' || character === ';' || character === '\t' || character === '|') && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += character
  }

  values.push(current.trim())
  return values.filter((value) => value !== '')
}

function parseImportText(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

  const importedRecords = []
  const duplicates = []
  const rejected = []
  const seenExactRows = new Set()
  const mergedGroups = new Map()

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const cells = parseDelimitedRow(line)

    if (cells.length === 0) continue
    if (cells.length === 1) {
      rejected.push({ row: index + 1, value: line, reason: 'Malformed row. Expected name and amount columns.' })
      continue
    }

    let nameValue = ''
    let amountValue = ''

    if (cells.length > 2) {
      const [firstCell, ...remainingCells] = cells
      nameValue = firstCell
      amountValue = remainingCells.join(',')
    } else {
      nameValue = cells[0]
      amountValue = cells[1]
    }

    const trimmedName = nameValue.trim().replace(/\s+/g, ' ')
    const trimmedAmount = amountValue.trim()

    if (!trimmedName) {
      rejected.push({ row: index + 1, value: line, reason: 'Missing name.' })
      continue
    }

    if (!trimmedAmount) {
      rejected.push({ row: index + 1, value: line, reason: 'Missing amount.' })
      continue
    }

    if (/^(name|person|member)$/i.test(trimmedName) && /^(amount|paid|contribution)$/i.test(trimmedAmount)) {
      continue
    }

    const parsedAmount = parseAmountValue(trimmedAmount)
    if (parsedAmount === null) {
      rejected.push({ row: index + 1, value: line, reason: 'Invalid or non-numeric amount.' })
      continue
    }

    if (parsedAmount < 0) {
      rejected.push({ row: index + 1, value: line, reason: 'Negative amount is not allowed.' })
      continue
    }

    const canonicalName = normalizeName(trimmedName)
    const normalizedRow = `${canonicalName}|${parsedAmount.toFixed(2)}`

    if (seenExactRows.has(normalizedRow)) {
      duplicates.push({ row: index + 1, value: line, reason: 'Exact duplicate row detected after normalizing name and amount.' })
      continue
    }

    seenExactRows.add(normalizedRow)
    importedRecords.push({
      id: crypto.randomUUID(),
      row: index + 1,
      originalName: trimmedName,
      normalizedName: canonicalName,
      amount: parsedAmount,
      value: line,
    })

    const existing = mergedGroups.get(canonicalName) || new Set()
    existing.add(trimmedName)
    mergedGroups.set(canonicalName, existing)
  }

  const mergedNameGroups = Array.from(mergedGroups.entries())
    .map(([canonicalName, variants]) => ({ key: canonicalName, variants: Array.from(variants).sort((left, right) => left.localeCompare(right)) }))
    .filter((group) => group.variants.length > 1)

  return {
    totalRows: lines.length,
    importedRows: importedRecords.length,
    duplicateRows: duplicates.length,
    mergedNames: mergedNameGroups.length,
    rejectedRows: rejected.length,
    importedRecords,
    duplicates,
    mergedNameGroups,
    rejected,
  }
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
  const [importText, setImportText] = useState('')
  const [importPreview, setImportPreview] = useState(null)
  const [importMappings, setImportMappings] = useState({})

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(pool)) }, [pool])

  const budget = toPaise(pool.budget)
  const totalCollected = pool.members.reduce((total, member) => total + toPaise(member.paid), 0)
  const remaining = Math.max(budget - totalCollected, 0)
  const fairShare = pool.members.length ? Math.round(budget / pool.members.length) : 0
  const settlement = useMemo(() => getSettlement(pool.members, fairShare), [pool.members, fairShare])

  const importGroups = useMemo(() => {
    if (!importPreview) return []

    const groups = new Map()
    importPreview.importedRecords.forEach((record) => {
      const key = record.normalizedName
      if (!groups.has(key)) {
        groups.set(key, {
          canonicalName: key,
          originalNames: new Set(),
          records: [],
        })
      }

      const group = groups.get(key)
      group.originalNames.add(record.originalName)
      group.records.push(record)
    })

    return Array.from(groups.values()).map((group) => ({
      ...group,
      originalNames: Array.from(group.originalNames).sort((left, right) => left.localeCompare(right)),
    }))
  }, [importPreview])

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
    if (pool.members.some((member) => normalizeName(member.name) === normalizeName(normalized))) return setMessage('That member is already in the pool.')
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

  function handleImportFile(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setImportText(String(reader.result || ''))
      setMessage('Imported file loaded. Review the cleaned rows before applying them.')
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  function reviewImport() {
    if (!importText.trim()) {
      setMessage('Paste or upload a contribution list before reviewing the import.')
      return
    }

    const preview = parseImportText(importText)
    setImportPreview(preview)
    setImportMappings({})

    if (!preview.importedRows && !preview.duplicateRows && !preview.rejectedRows) {
      setMessage('Nothing was found to import.')
      return
    }

    setMessage('Import review ready. Confirm to apply the cleaned contributions.')
  }

  function updateImportMapping(canonicalName, selectedValue) {
    setImportMappings((current) => ({ ...current, [canonicalName]: selectedValue }))
  }

  function confirmImport() {
    if (!importPreview || importPreview.importedRows === 0) {
      setMessage('No valid rows are ready to apply.')
      return
    }

    const existingMembers = new Map(pool.members.map((member) => [normalizeName(member.name), member]))
    const newMembers = [...pool.members]
    const assignMap = new Map()
    const totalsByMemberId = new Map()

    importGroups.forEach((group) => {
      const canonicalName = group.canonicalName
      const selectedMapping = importMappings[canonicalName] ?? (existingMembers.has(canonicalName) ? existingMembers.get(canonicalName).id : 'new_member')

      let targetMember = null
      if (selectedMapping === 'new_member') {
        const existingRecord = newMembers.find((member) => normalizeName(member.name) === canonicalName)
        if (existingRecord) {
          targetMember = existingRecord
        } else {
          const displayName = group.originalNames[0] || canonicalName
          const newMember = { id: crypto.randomUUID(), name: displayName, paid: '0' }
          newMembers.push(newMember)
          targetMember = newMember
        }
      } else {
        targetMember = newMembers.find((member) => member.id === selectedMapping) || existingMembers.get(canonicalName)
      }

      if (!targetMember) {
        return
      }

      assignMap.set(canonicalName, targetMember.id)
    })

    importPreview.importedRecords.forEach((record) => {
      const targetMemberId = assignMap.get(record.normalizedName)
      if (!targetMemberId) return
      totalsByMemberId.set(targetMemberId, (totalsByMemberId.get(targetMemberId) || 0) + Math.round(record.amount * 100))
    })

    setPool((current) => {
      const updatedMembers = current.members.map((member) => {
        const additionalPaise = totalsByMemberId.get(member.id) || 0
        if (!additionalPaise) return member

        const nextPaise = toPaise(member.paid) + additionalPaise
        return { ...member, paid: (nextPaise / 100).toFixed(2) }
      })

      const syncedMembers = [...updatedMembers]
      newMembers.forEach((member) => {
        if (!syncedMembers.some((currentMember) => currentMember.id === member.id)) {
          syncedMembers.push(member)
        }
      })

      return { ...current, members: syncedMembers }
    })

    setImportText('')
    setImportPreview(null)
    setImportMappings({})
    setMessage('Imported contributions were reviewed and applied to the pool.')
  }

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

        <section className="import-section panel">
          <div className="panel-heading import-header"><div><p className="eyebrow">01A / IMPORT</p><h2>Import past contributions</h2></div></div>
          <div className="import-grid">
            <div className="import-panel">
              <label className="import-label" htmlFor="import-text">Paste contribution rows</label>
              <textarea id="import-text" value={importText} onChange={(event) => setImportText(event.target.value)} rows={8} placeholder={'Chetan, ₹1000\nchetan, 1000\nRahul, Rs. 500\nNeha, 0\nInvalid row'} />
              <div className="import-actions">
                <label className="file-upload button button-secondary" htmlFor="import-file">Upload CSV</label>
                <input id="import-file" type="file" accept=".csv,.txt" onChange={handleImportFile} />
                <button className="button button-primary" type="button" onClick={reviewImport}>Review import</button>
              </div>
            </div>

            {importPreview && (
              <div className="import-preview">
                <div className="preview-stats">
                  <StatChip label="Total rows" value={importPreview.totalRows} />
                  <StatChip label="Imported" value={importPreview.importedRows} />
                  <StatChip label="Duplicates" value={importPreview.duplicateRows} />
                  <StatChip label="Merged" value={importPreview.mergedNames} />
                  <StatChip label="Rejected" value={importPreview.rejectedRows} />
                </div>

                <div className="preview-block">
                  <h3>Imported records</h3>
                  {importPreview.importedRecords.length === 0 ? <p className="empty-state">No valid imported contributions to apply.</p> : (
                    <ul>{importPreview.importedRecords.map((record) => <li key={record.id}><strong>{record.originalName}</strong> — {formatCurrency(Math.round(record.amount * 100))}</li>)}</ul>
                  )}
                </div>

                <div className="preview-block">
                  <h3>Duplicate records</h3>
                  {importPreview.duplicates.length === 0 ? <p className="empty-state">No exact duplicate rows were found.</p> : (
                    <ul>{importPreview.duplicates.map((record, index) => <li key={`${record.row}-${index}`}><strong>Row {record.row}</strong> — {record.reason}</li>)}</ul>
                  )}
                </div>

                <div className="preview-block">
                  <h3>Merged name variants</h3>
                  {importPreview.mergedNameGroups.length === 0 ? <p className="empty-state">No capitalization or spacing variants needed merging.</p> : (
                    <ul>{importPreview.mergedNameGroups.map((group) => <li key={group.key}><strong>{group.variants.join(', ')}</strong></li>)}</ul>
                  )}
                </div>

                <div className="preview-block">
                  <h3>Rejected rows</h3>
                  {importPreview.rejected.length === 0 ? <p className="empty-state">No rows were rejected.</p> : (
                    <ul>{importPreview.rejected.map((record, index) => <li key={`${record.row}-${index}`}><strong>Row {record.row}</strong> — {record.reason}: {record.value}</li>)}</ul>
                  )}
                </div>

                <div className="preview-block mapping-block">
                  <h3>Map unknown names</h3>
                  {importGroups.length === 0 ? <p className="empty-state">No names require mapping.</p> : importGroups.map((group) => {
                    const memberMatch = pool.members.find((member) => normalizeName(member.name) === group.canonicalName)
                    if (memberMatch) return null

                    const currentValue = importMappings[group.canonicalName] ?? 'new_member'
                    const options = [
                      <option key="new_member" value="new_member">Add as a new member</option>,
                      ...pool.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>),
                    ]

                    return (
                      <div className="mapping-row" key={group.canonicalName}>
                        <label>{group.originalNames.join(', ')}</label>
                        <select value={currentValue} onChange={(event) => updateImportMapping(group.canonicalName, event.target.value)}>
                          {options}
                        </select>
                      </div>
                    )
                  })}
                </div>

                <div className="import-actions review-actions">
                  <button className="button button-secondary" type="button" onClick={() => setImportPreview(null)}>Close preview</button>
                  <button className="button button-primary" type="button" onClick={confirmImport}>Confirm and apply</button>
                </div>
              </div>
            )}
          </div>
        </section>

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

function StatChip({ label, value }) { return <div className="stat-chip"><span>{label}</span><strong>{value}</strong></div> }

export default App
