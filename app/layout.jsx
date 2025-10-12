import '../styles/globals.css';
import { Header } from '../components/header';

export const metadata = {
    title: {
        template: '%s | Netlify',
        default: 'Queer Swing Dance Exchange Zurich'
    }
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <head>
            <link rel="icon" href="/favicon.svg" sizes="any" />
        </head>
        <body>
        <Header />
        <main>{children}</main>
        {/*<Footer />*/}
        </body>
        </html>
    );
}
