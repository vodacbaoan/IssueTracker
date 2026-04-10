import type { Metadata } from 'next';
import '../styles.css';

export const metadata: Metadata = {
  title: 'Issue Tracker Starter',
  description: 'Simple project dashboard powered by Next.js and an Express API.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
