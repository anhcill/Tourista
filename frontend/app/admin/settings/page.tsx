import styles from '../section.module.css';

export default function AdminSettingsPage() {
  return (
    <section className={styles.page}>
      <h2>Cai dat he thong</h2>
      <p>Trang placeholder cho cau hinh he thong va tra cuu audit logs o phase tiep theo.</p>
      <div className={styles.hint}>Goi y: them tab Audit Logs va feature toggles cho admin.</div>
    </section>
  );
}
