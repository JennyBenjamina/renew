import { useState } from 'react'

/** Footer newsletter signup → Omnisend (via the subscribe function). */
export default function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('idle') // idle | busy | done | error
  const [msg, setMsg] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setState('busy')
    setMsg('')
    try {
      const res = await fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Could not subscribe.')
      setState('done')
    } catch (err) {
      setState('error')
      setMsg(err.message || 'Something went wrong.')
    }
  }

  if (state === 'done') {
    return <p className="newsletter__done">Thanks — you’re on the list.</p>
  }

  return (
    <form className="newsletter" onSubmit={onSubmit}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email address"
      />
      <button type="submit" className="btn btn--primary" disabled={state === 'busy'}>
        {state === 'busy' ? '…' : 'Join'}
      </button>
      {state === 'error' && <span className="newsletter__error">{msg}</span>}
    </form>
  )
}
