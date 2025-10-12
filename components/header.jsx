import Image from 'next/image';
import Link from 'next/link';
import netlifyLogo from 'public/netlify-logo.svg';

const navItems = [
    { linkText: 'Travelinformation', href: '/travelinformation' },
    { linkText: 'Schedule', href: '/schedule' },
    { linkText: 'Code of Conduct', href: '/code-of-conduct' },
    { linkText: 'Registration', href: '/registration' },
    { linkText: 'Team', href: '/team' },
    { linkText: 'Artists', href: '/artists' }
];

export function Header() {
    return (
        <header>
            <nav>
                <Link href="/">
                    <Image src={netlifyLogo} alt="Home" />
                </Link>
                {!!navItems?.length && (
                    <ul>
                        {navItems.map((item, index) => (
                            <li key={index}>
                                <Link href={item.href}>
                                    {item.linkText}
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </nav>
        </header>
    );
}
