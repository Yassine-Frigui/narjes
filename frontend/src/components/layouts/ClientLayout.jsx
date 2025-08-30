import React from 'react'
import { Outlet } from 'react-router-dom'
import ClientNavbar from '../ClientNavbar'
import ClientFooter from '../ClientFooter'

const ClientLayout = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <ClientNavbar />
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <ClientFooter />
    </div>
  )
}

export default ClientLayout
