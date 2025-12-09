import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import './styles/main.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import NotesDashboard from './pages/NotesDashboard.jsx'
import BlockchainDashboard from './pages/BlockchainDashboard.jsx'
import Profile from './pages/Profile.jsx'
import { Buffer } from 'buffer'
window.Buffer = Buffer

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'notes', element: <NotesDashboard /> },
      { path: 'blockchain', element: <BlockchainDashboard /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
