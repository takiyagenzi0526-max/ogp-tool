export default function Home() {
  return (
    <main
      style={{
        maxWidth: 640,
        margin: '0 auto',
        padding: '60px 24px',
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>OGP Redirect Tool</h1>
      <p style={{ marginBottom: 24, color: '#555' }}>
        カスタムサムネイル付きの短縮URLを発行するツールです。
      </p>
      <p>
        <a
          href="/admin"
          style={{
            display: 'inline-block',
            background: '#000',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          管理画面を開く →
        </a>
      </p>
    </main>
  );
}
