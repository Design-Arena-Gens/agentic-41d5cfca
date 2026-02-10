import './globals.css';

export const metadata = {
  title: 'Pocket Notes',
  description: 'Mobile-friendly notes app with tags and search'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
