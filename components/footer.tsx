'use client';

import Link from 'next/link';

export function Footer() {
    return (
        <footer>
            <p>
                <Link
                    href="https://docs.netlify.com/frameworks/next-js/overview/"
                >
                    Next.js on Netlify
                </Link>
            </p>
        </footer>
    );
}

