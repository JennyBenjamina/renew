import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import BenchCard, { PendingNotice } from './BenchCard.jsx'
import './account.css'

/** Where pending and rejected accounts land. Never shows the catalog. */
export default function Pending() {
  const { user, profile, loading, isApproved, approvalStatus, signOut } = useAuth()

  if (loading) return <div className="admin-loading">Checking access…</div>
  if (!user) return <Navigate to="/login" replace />
  if (isApproved) return <Navigate to="/products" replace />

  const rejected = approvalStatus === 'rejected'

  return (
    <BenchCard pill={rejected ? 'Not approved' : 'Under review'}>
      {rejected ? (
        <div className="bench__notice" role="status">
          <h1 className="bench__title">Registration not approved.</h1>
          <p className="bench__lede">
            After review, we weren’t able to approve this account for access to
            the research product catalog.
          </p>
          {profile?.review_note && (
            <p className="bench__help"><strong>Reviewer note:</strong> {profile.review_note}</p>
          )}
          <p className="bench__help">
            If you believe this is a mistake, reply to the decision email we sent
            to <strong>{user.email}</strong>.
          </p>
        </div>
      ) : (
        <PendingNotice email={user.email} />
      )}

      <button type="button" className="bench__submit bench__submit--ghost" onClick={signOut}>
        Sign out
      </button>
      <p className="bench__foot">
        <Link to="/terms-of-service">Terms of Service</Link> ·{' '}
        <Link to="/research-use-terms">Research Use Terms</Link>
      </p>
    </BenchCard>
  )
}
