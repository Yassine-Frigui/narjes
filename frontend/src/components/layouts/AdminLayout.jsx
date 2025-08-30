import React from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../AdminSidebar'
import AdminNavbar from '../AdminNavbar'

const AdminLayout = () => {
  return (
    <div className="admin-layout d-flex">
      <AdminSidebar />
      <div className="admin-content flex-grow-1">
        <AdminNavbar />
        <main 
          className="admin-main p-4"
          style={{
            marginLeft: '70px', // ALWAYS 70px - never changes
            marginTop: '60px',
            minHeight: 'calc(100vh - 60px)',
            backgroundColor: '#f8f9fa'
          }}
        >
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 991.98px) {
          .admin-main {
            margin-left: 70px !important; /* Account for thin strip */
            padding-left: 1rem;
            padding-right: 1rem;
            margin-top: 0 !important; /* No navbar on mobile */
            min-height: 100vh !important;
          }
          
          .admin-layout {
            flex-direction: column;
          }
        }

        @media (max-width: 767.98px) {
          .admin-main {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            padding-top: 1rem; /* Add some top padding for mobile */
          }
        }

        @media (min-width: 992px) {
          .admin-main {
            margin-left: 70px;
            transition: margin-left 0.3s ease;
            margin-top: 60px; /* Navbar height */
            min-height: calc(100vh - 60px);
          }
          
          /* When sidebar is hovered/expanded, content doesn't need to move 
             since we want the sidebar to overlay */
          .admin-layout:hover .admin-main {
            margin-left: 70px;
          }
        }
      `}</style>
    </div>
  )
}

export default AdminLayout
