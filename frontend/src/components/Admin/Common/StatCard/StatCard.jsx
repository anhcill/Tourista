import styles from './StatCard.module.css';

export default function StatCard({
  icon,
  title,
  value,
  note,
  tone = 'cyan',
}) {
  return (
    <article className={`${styles.card} ${styles[`tone_${tone}`]}`}>
      <div className={styles.iconWrap}>{icon}</div>
      <div className={styles.body}>
        <p>{title}</p>
        <strong>{value}</strong>
        <span>{note}</span>
      </div>
    </article>
  );
}
