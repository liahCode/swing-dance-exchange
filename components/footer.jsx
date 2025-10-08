import Link from 'next/link';

export function Footer() {
    return (
        <footer className="footer-section">
            <p className="footer-text">
                <Link
                    href="https://docs.netlify.com/frameworks/next-js/overview/"
                    className="footer-link"
                >
                    Next.js on Netlify
                </Link>
            </p>
        </footer>
    );
}
