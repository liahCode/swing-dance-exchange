import { useTranslations } from 'next-intl';
import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import styles from './landing.module.css';

export default function LandingPage() {
  const t = useTranslations();

  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>{t('hero.title')}</h1>
          <p className={styles.dates}>{t('hero.dates')}</p>
          <p className={styles.tagline}>{t('hero.tagline')}</p>
          <div className={styles.newsletterWrapper}>
            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className={styles.sectionsContainer}>
        {/* What is QSXZ Section */}
        <section className={`${styles.section} ${styles.sectionLeft}`}>
          <div className={styles.sectionText}>
            <h2 className={styles.sectionTitle}>{t('landing.whatIsQSXZ.title')}</h2>
            <div className={styles.sectionTitleUnderline} />
            <p className={styles.sectionContent}>{t('landing.whatIsQSXZ.content')}</p>
            <Link href="/what-is/vision" className={styles.button}>
              {t('landing.whatIsQSXZ.learnMore')}
            </Link>
          </div>
          <div className={styles.imagePlaceholder}>
            Swing dancing image
          </div>
        </section>

        {/* Pride Section */}
        <section className={`${styles.section} ${styles.sectionRight}`}>
          <div className={styles.sectionText}>
            <h2 className={styles.sectionTitle}>{t('landing.pride.title')}</h2>
            <div className={styles.sectionTitleUnderline} />
            <p className={styles.sectionContent}>{t('landing.pride.content')}</p>
            <a
              href="https://www.zurichpridefestival.ch"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.button}
            >
              {t('landing.pride.learnMore')}
            </a>
          </div>
          <div className={styles.imagePlaceholder}>
            Pride parade image
          </div>
        </section>

        {/* What to Expect Section */}
        <section className={`${styles.section} ${styles.sectionLeft}`}>
          <div className={styles.sectionText}>
            <h2 className={styles.sectionTitle}>{t('landing.whatToExpect.title')}</h2>
            <div className={styles.sectionTitleUnderline} />
            <p className={styles.sectionContent}>{t('landing.whatToExpect.content')}</p>
            <span className={styles.buttonDisabled}>
              {t('landing.whatToExpect.learnMore')}
            </span>
          </div>
          <div className={styles.imagePlaceholder}>
            Workshop / activities image
          </div>
        </section>

        {/* Artists Section */}
        <section className={`${styles.section} ${styles.sectionRight}`}>
          <div className={styles.sectionText}>
            <h2 className={styles.sectionTitle}>{t('landing.artists.title')}</h2>
            <div className={styles.sectionTitleUnderline} />
            <p className={styles.sectionContent}>{t('landing.artists.content')}</p>
            <span className={styles.buttonDisabled}>
              {t('landing.artists.learnMore')}
            </span>
          </div>
          <div className={styles.imagePlaceholder}>
            Band / DJ / Drag image
          </div>
        </section>

        {/* Venue Section */}
        <section className={`${styles.section} ${styles.sectionLeft}`}>
          <div className={styles.sectionText}>
            <h2 className={styles.sectionTitle}>{t('landing.venue.title')}</h2>
            <div className={styles.sectionTitleUnderline} />
            <p className={styles.sectionContent}>{t('landing.venue.content')}</p>
            <Link href="/practical/venue" className={styles.button}>
              {t('landing.venue.detailsButton')}
            </Link>
          </div>
          <div className={styles.imagePlaceholder}>
            Flow60 venue image
          </div>
        </section>

        {/* City Section */}
        <section className={`${styles.section} ${styles.sectionRight}`}>
          <div className={styles.sectionText}>
            <h2 className={styles.sectionTitle}>{t('landing.city.title')}</h2>
            <div className={styles.sectionTitleUnderline} />
            <p className={styles.sectionContent}>{t('landing.city.content')}</p>
            <Link href="/practical/transport" className={styles.button}>
              {t('landing.city.learnMore')}
            </Link>
          </div>
          <div className={styles.imagePlaceholder}>
            Zürich cityscape image
          </div>
        </section>
      </div>
    </div>
  );
}
