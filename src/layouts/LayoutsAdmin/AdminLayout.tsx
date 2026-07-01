import { Outlet } from 'react-router-dom';
import AdminSidebar from '@/components/Admin/AdminSidebar';
import AdminHeader from '@/components/Layout/AdminHeader';

const AdminLayout = () => {
  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Sidebar fixed */}
      <AdminSidebar />
      
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader />
        
        <main className="flex-1 overflow-y-auto p-4 tablet:p-6 small_desktop:p-8 desktop:p-8 animate-in fade-in duration-500 bg-slate-50/50">
          <div className="max-w-[1600px] mx-auto min-h-full flex flex-col">
            <div className="flex-1">
              <Outlet />
            </div>
            
            <footer className="py-8 mt-12 border-t border-slate-200 text-slate-400 text-sm text-center">
              &copy; 2025 CodeSphere Admin. Built with precision.
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
