'use client';

import '../styles/globals.css';
import Navigation from '../components/Navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
        <head>
            <title>Queer Swing Dance Exchange Zürich</title>
            {/*<link rel="icon" href="/favicon.svg" sizes="any" />*/}
        </head>
        <body>
        <Navigation />
        <main>{children}</main>
        {/*<Footer />*/}
        </body>
        </html>
    );
}
