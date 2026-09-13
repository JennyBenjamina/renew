import { useEffect, useState } from 'react'
import { campaignRecipients, sendCampaign, listCampaigns } from '../../lib/campaigns.js'
import { isSupabaseConfigured } from '../../lib/supabaseClient.js'
import './admin.css'
import './blogadmin.css'

function fmtDate(d) {
  try {
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
    })
  } catch {
    return ''
  }
}

// A GSM-7 SMS segment is 160 chars (153 when concatenated). Rough estimate.
function segments(len) {
  if (len === 0) return 0
  return len <= 160 ? 1 : Math.ceil(len / 153)
}

export default function AdminCampaigns() {
  const [message, setMessage] = useState('')
  const [appendStop, setAppendStop] = useState(true)
  const [recipients, setRecipients] = useState([])
  const [loadingRecips, setLoadingRecips] = useState(true)
  const [reviewing, setReviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])

  const loadRecipients = async () => {
    setLoadingRecips(true)
    try {
      setRecipients(await campaignRecipients())
    } catch (err) {
      setError(err.message || 'Could not load recipients.')
    } finally {
      setLoadingRecips(false)
    }
  }

  const loadHistory = async () => {
    try {
      setHistory(await listCampaigns())
    } catch {
      /* table may not exist yet */
    }
  }

  useEffect(() => {
    if (isSupabaseConfigured) {
      loadRecipients()
      loadHistory()
    } else {
      setLoadingRecips(false)
    }
  }, [])

  const preview =
    appendStop && !/\bstop\b/i.test(message) && message.trim()
      ? `${message.trim()}\n\nReply STOP to opt out.`
      : message.trim()
  const charCount = preview.length

  const onReview = () => {
    setError('')
    setResult(null)
    if (!message.trim()) return setError('Type a message first.')
    setReviewing(true)
  }

  const onSend = async () => {
    setError('')
    setSending(true)
    try {
      const res = await sendCampaign(message.trim(), appendStop)
      setResult(res)
      setReviewing(false)
      setMessage('')
      loadHistory()
    } catch (err) {
      setError(err.message || 'Could not send the campaign.')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <div className="admin__head">
        <div>
          <h1>Text campaign</h1>
          <p>Send an SMS to all past customers via Telnyx (opt-outs excluded).</p>
        </div>
        <div className="admin__head-actions">
          <button className="btn btn--outline" onClick={loadRecipients} disabled={loadingRecips}>
            Refresh recipients
          </button>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <div className="admin-alert">
          Supabase isn’t configured. Add your keys to use campaigns.
        </div>
      )}
      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {result && (
        <div className="admin-alert admin-alert--success">
          Sent to <strong>{result.sent}</strong> of {result.attempted} recipient
          {result.attempted === 1 ? '' : 's'}
          {result.failed ? `, ${result.failed} failed` : ''}.
          {result.truncated && ` (Capped at ${result.attempted}; run again for the rest.)`}
        </div>
      )}

      <div className="campaign">
        <label className="campaign__label">
          Message
          <textarea
            className="campaign__textarea"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. New batch just dropped — GLP3-RT back in stock. Shop now: renewlabslv.com"
            maxLength={1500}
          />
        </label>

        <label className="campaign__check">
          <input
            type="checkbox"
            checked={appendStop}
            onChange={(e) => setAppendStop(e.target.checked)}
          />
          Append “Reply STOP to opt out.” (recommended for marketing)
        </label>

        <div className="campaign__meta">
          <span>{charCount} characters</span>
          <span>·</span>
          <span>{segments(charCount)} SMS segment{segments(charCount) === 1 ? '' : 's'} each</span>
          <span>·</span>
          <span>
            {loadingRecips ? 'counting…' : `${recipients.length} recipient${recipients.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {preview && (
          <div className="campaign__preview">
            <span className="campaign__preview-label">Preview</span>
            <p>{preview}</p>
          </div>
        )}

        <button
          className="btn btn--primary"
          onClick={onReview}
          disabled={!message.trim() || loadingRecips || recipients.length === 0}
        >
          Review recipients &amp; send
        </button>
      </div>

      {/* Recent sends */}
      {history.length > 0 && (
        <>
          <h2 className="campaign__h2">Recent sends</h2>
          <div className="blogadmin__list">
            {history.map((c) => (
              <article className="blogadmin__row" key={c.id}>
                <div className="blogadmin__main">
                  <div className="blogadmin__titleline">
                    <strong>{c.sent_count}/{c.recipient_count} sent</strong>
                    {c.failed_count > 0 && (
                      <span className="badge badge--outstock">{c.failed_count} failed</span>
                    )}
                  </div>
                  <span className="blogadmin__sub">{fmtDate(c.created_at)} · {c.message}</span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      {/* Confirm modal — the recipient list before sending */}
      {reviewing && (
        <div className="pform" role="dialog" aria-modal="true">
          <div className="pform__scrim" onClick={() => !sending && setReviewing(false)} />
          <div className="pform__card">
            <header className="pform__head">
              <h2>Send to {recipients.length} recipient{recipients.length === 1 ? '' : 's'}?</h2>
              <button type="button" className="pform__close" onClick={() => !sending && setReviewing(false)}>
                ✕
              </button>
            </header>

            <div className="campaign__confirm">
              <div className="campaign__preview">
                <span className="campaign__preview-label">Message</span>
                <p>{preview}</p>
              </div>
              <span className="campaign__preview-label">Recipients</span>
              <div className="campaign__reciplist">
                {recipients.map((r) => (
                  <div className="campaign__recip" key={r.phone}>
                    <span>{r.name}</span>
                    <span className="campaign__recip-phone">{r.phone}</span>
                  </div>
                ))}
              </div>
            </div>

            <footer className="pform__foot">
              <button type="button" className="btn btn--ghost" onClick={() => setReviewing(false)} disabled={sending}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary" onClick={onSend} disabled={sending}>
                {sending ? 'Sending…' : `Send to ${recipients.length}`}
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
