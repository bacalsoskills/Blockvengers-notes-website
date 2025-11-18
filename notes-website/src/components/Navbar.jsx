import { Link, NavLink, useNavigate } from 'react-router-dom'

function getSession() {
  try {
    const raw = localStorage.getItem('session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function Navbar() {
  const navigate = useNavigate()
  const session = getSession()

  const handleLogout = () => {
    localStorage.removeItem('session')
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="nav-inner container">
        <Link to="/" className="brand">Notes</Link>
        <div className="links">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/notes">Notes</NavLink>
          {session && <NavLink to="/profile">Profile</NavLink>}
          {session ? (
            <button className="link-btn" onClick={handleLogout}>Logout</button>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}


