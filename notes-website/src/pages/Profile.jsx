function getSession() {
  try { return JSON.parse(localStorage.getItem('session')) } catch { return null }
}

export default function Profile() {
  const session = getSession()
  const email = session?.email

  return (
    <section className="page profile">
      <h2>Profile</h2>
      {email ? (
        <div className="panel">
          <p><strong>Email:</strong> {email}</p>
          <p className="muted">Your notes are stored locally in this browser.</p>
        </div>
      ) : (
        <p>Please log in to view your profile.</p>
      )}
    </section>
  )
}


