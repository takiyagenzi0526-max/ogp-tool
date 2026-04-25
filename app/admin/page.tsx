'use client';

import { useEffect, useState } from 'react';

type LinkData = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  targetUrl: string;
  createdAt: string;
};

export default function AdminPage() {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [origin, setOrigin] = useState('');

  // form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
    fetchLinks();
  }, []);

  async function fetchLinks() {
    setLoading(true);
    try {
      const res = await fetch('/api/links');
      const data = await res.json();
      setLinks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUrl('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !targetUrl || (!imageUrl && !imageFile)) {
      alert('タイトル・リンク先URL・OGP画像は必須です');
      return;
    }
    setSubmitting(true);
    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        setUploading(true);
        const form = new FormData();
        form.append('file', imageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: form });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || 'アップロードに失敗しました');
        }
        const { url } = await uploadRes.json();
        finalImageUrl = url;
        setUploading(false);
      }

      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, imageUrl: finalImageUrl, targetUrl }),
      });
      if (!res.ok) throw new Error('作成に失敗しました');
      setTitle('');
      setDescription('');
      setImageUrl('');
      setImageFile(null);
      setImagePreview('');
      setTargetUrl('');
      await fetchLinks();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('このリンクを削除しますか？')) return;
    try {
      const res = await fetch(`/api/links/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('削除に失敗しました');
      await fetchLinks();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('コピーしました: ' + text);
  }

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 24 }}>OGPリンク管理</h1>

      <section style={card()}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>新規作成</h2>
        <form onSubmit={handleSubmit}>
          <Field label="タイトル *">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ツイートに表示されるタイトル"
              style={input()}
              required
            />
          </Field>

          <Field label="ディスクリプション">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ツイートに表示される説明文(任意)"
              rows={3}
              style={{ ...input(), resize: 'vertical' }}
            />
          </Field>

          <Field label="リンク先URL * (実際に飛ばしたい先)">
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://keikeiaa.my.canva.site/"
              style={input()}
              required
            />
          </Field>

          <Field label="OGP画像 * (JPEG / PNG / GIF / WebP, 5MB以内, 1200x630推奨)">
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              style={{ display: 'block', marginBottom: 8 }}
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="preview"
                style={{
                  marginTop: 8,
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 8,
                  border: '1px solid #ddd',
                }}
              />
            )}
          </Field>

          <button
            type="submit"
            disabled={submitting || uploading}
            style={{
              background: '#000',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              opacity: submitting || uploading ? 0.5 : 1,
            }}
          >
            {uploading ? '画像アップロード中...' : submitting ? '作成中...' : '短縮URLを作成'}
          </button>
        </form>
      </section>

      <section style={{ ...card(), marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>
          作成済みリンク ({links.length})
        </h2>
        {loading ? (
          <p style={{ color: '#999' }}>読み込み中...</p>
        ) : links.length === 0 ? (
          <p style={{ color: '#999' }}>まだリンクがありません</p>
        ) : (
          <ul style={{ listStyle: 'none' }}>
            {links.map((link) => {
              const shortUrl = `${origin}/l/${link.id}`;
              return (
                <li
                  key={link.id}
                  style={{
                    padding: 16,
                    border: '1px solid #eee',
                    borderRadius: 8,
                    marginBottom: 12,
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <img
                    src={link.imageUrl}
                    alt=""
                    style={{
                      width: 96,
                      height: 50,
                      objectFit: 'cover',
                      borderRadius: 4,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {link.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#666',
                        marginBottom: 6,
                        wordBreak: 'break-all',
                      }}
                    >
                      → {link.targetUrl}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <code
                        style={{
                          background: '#f5f5f5',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          wordBreak: 'break-all',
                        }}
                      >
                        {shortUrl}
                      </code>
                      <button
                        onClick={() => copyToClipboard(shortUrl)}
                        style={btn()}
                      >
                        コピー
                      </button>
                      <a
                        href={shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={btn()}
                      >
                        確認
                      </a>
                      <button
                        onClick={() => handleDelete(link.id)}
                        style={{ ...btn(), color: '#d00' }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: 'block',
          marginBottom: 6,
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function input(): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: 6,
    fontSize: 14,
  };
}

function card(): React.CSSProperties {
  return {
    background: '#fff',
    padding: 24,
    borderRadius: 12,
    border: '1px solid #eee',
  };
}

function btn(): React.CSSProperties {
  return {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: 4,
    padding: '4px 10px',
    fontSize: 12,
    cursor: 'pointer',
    color: '#333',
    textDecoration: 'none',
    display: 'inline-block',
  };
}
