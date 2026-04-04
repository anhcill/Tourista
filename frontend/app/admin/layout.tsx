import AdminRouteGuard from '@/components/Admin/Auth/AdminRouteGuard';
import AdminSidebar from '@/components/Admin/Layout/AdminSidebar/AdminSidebar';
import AdminTopbar from '@/components/Admin/Layout/AdminTopbar/AdminTopbar';
import styles from './layout.module.css';

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminRouteGuard>
      <div className={styles.shell}>
        <AdminSidebar />

        <div className={styles.mainColumn}>
          <AdminTopbar />
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
