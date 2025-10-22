import styles from '../../styles/Governance.module.css';
import PageHeader from '../../components/PageHeader';

export default function DepositCrowdfunding() {
  return (
    <div className={styles.container}>
      <PageHeader
        title="Deposit Crowdfunding"
        subtitle="Smart Contracts to submit onchain governance actions via deposit crowdfunding"
      />
      
      <div className={styles.content}>
        {/* Content will be added later */}
      </div>
    </div>
  );
}
