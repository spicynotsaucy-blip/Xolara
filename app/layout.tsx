import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Xolara - AI Sales Agent for Real Estate',
  description: 'Your AI Inside Sales Agent. Always On. Responds to every lead in under 60 seconds, 24/7.',
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
