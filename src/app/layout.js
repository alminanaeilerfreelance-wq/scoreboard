import './globals.css';

export const metadata = {
  title: 'CourtCast — Live Basketball Scoreboard',
  description: 'Full-stack basketball scoreboard with admin dashboard, live game console, and audience display.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
