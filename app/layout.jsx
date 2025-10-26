import '../styles/globals.css';
import Navigation from '../components/Navigation';

export const metadata = {
    title: {
        template: '%s | Netlify',
        default: 'Queer Swing Dance Exchange Zürich'
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <head>
            <link rel="icon" href="/favicon.svg" sizes="any" />
        </head>
        <body>
        <Navigation />
        <main>{children}</main>
        {/*<Footer />*/}
        </body>
        </html>
    );
}
