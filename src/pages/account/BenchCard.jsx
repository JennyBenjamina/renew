import Logo from '../../components/Logo.jsx'

/** Shared shell for the researcher login / signup / pending screens:
 *  logo + status pill, a rule, then the form. */
export default function BenchCard({ pill, children, as: Tag = 'div', ...rest }) {
  return (
    <div className="auth auth--bench">
      <Tag className="bench" {...rest}>
        <div className="bench__top">
          <span className="bench__logo"><Logo /></span>
          {pill && <span className="bench__pill">{pill}</span>}
        </div>
        {children}
      </Tag>
    </div>
  )
}

/** The notice shown straight after registering and to pending accounts. */
export function PendingNotice({ email }) {
  return (
    <div className="bench__notice" role="status">
      <h1 className="bench__title">Registration received.</h1>
      <p className="bench__lede">
        Your account registration has been successfully submitted for review.
        Access to our research product catalog will remain restricted until your
        account has been reviewed and approved by our administration team. You
        will be notified once a decision has been made.
      </p>
      {email && (
        <p className="bench__help">
          We’ll email the decision to <strong>{email}</strong>. If a confirmation
          link arrives first, click it to verify your address.
        </p>
      )}
    </div>
  )
}
