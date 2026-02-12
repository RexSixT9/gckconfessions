export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <meta name="description" content="Health check endpoint" />
      </head>
      <body>{children}</body>
    </html>
  );
}
