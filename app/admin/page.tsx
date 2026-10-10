'use client';

import { useEffect, useState } from 'react';

// クリック数の自動更新間隔（画面を見ている間だけ動く）
const STATS_INTERVAL_MS = 10_000;

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
  const [customId, setCustomId] = useState('');
  // 編集中のリンクid（nullなら新規作成モード）
  const [editingId, setEditingId] = useState<string | null>(null);
  // クリック数
  const [stats, setStats] = useState<{ total: Record<string, number>; today: Record<string, number> }>({ total: {}, today: {} });
  const [dailyId, setDailyId] = useState<string | null>(null);
  const [daily, setDaily] = useState<Record<string, number>>({});

  useEffect(() => {
    setOrigin(window.location.origin);
    fetchLinks();
  }, []);

  // タブが表示されている間だけ定期更新（非表示の間はRedisを叩かない＝無料枠を消費しない）
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const refresh = () => {
      fetchStats();
      if (dailyId) fetchDaily(dailyId);
    };
    const start = () => {
      if (timer) return;
      refresh();
      timer = setInterval(refresh, STATS_INTERVAL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [dailyId]);

  async function fetchStats() {
    try {
      const res = await fetch('/api/stats', { cache: 'no-store' });
      if (res.ok) setStats(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchDaily(id: string) {
    try {
      const res = await fetch(`/api/stats/${id}`, { cache: 'no-store' });
      if (res.ok) setDaily(await res.json());
    } catch (e) {
      console.error(e);
    }
  }

  function toggleDaily(id: string) {
    if (dailyId === id) {
      setDailyId(null);
    } else {
      setDaily({});
      setDailyId(id);
    }
  }

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

  function resetForm() {
    setTitle('');
    setDescription('');
    setImageUrl('');
    setImageFile(null);
    setImagePreview('');
    setTargetUrl('');
    setCustomId('');
    setEditingId(null);
  }

  function startEdit(link: LinkData) {
    setEditingId(link.id);
    setTitle(link.title);
    setDescription(link.description);
    setTargetUrl(link.targetUrl);
    setCustomId(link.id);
    setImageUrl(link.imageUrl);
    setImageFile(null);
    setImagePreview(link.imageUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      const res = editingId
        ? await fetch(`/api/links/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, imageUrl: finalImageUrl, targetUrl }),
          })
        : await fetch('/api/links', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description, imageUrl: finalImageUrl, targetUrl, customId: customId.trim() }),
          });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || (editingId ? '更新に失敗しました' : '作成に失敗しました'));
      }
      if (editingId) alert('更新しました');
      resetForm();
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
      if (editingId === id) resetForm();
      if (dailyId === id) setDailyId(null);
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
        <h2 style={{ fontSize: 18, marginBottom: 16 }}>
          {editingId ? `リンクを編集（/l/${editingId}）` : '新規作成'}
        </h2>
        {editingId && (
          <p style={{ fontSize: 12, color: '#666', marginBottom: 16 }}>
            短縮URLはそのままで、中身だけ差し替わります。画像を変えない場合はファイル選択不要です。
          </p>
        )}
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

          <Field label={editingId ? 'カスタムURL (編集では変更できません)' : 'カスタムURL (任意・空欄ならランダムな文字を自動生成)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#666', whiteSpace: 'nowrap' }}>
                {origin}/l/
              </span>
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="line（空欄ならランダム）"
                disabled={!!editingId}
                style={{ ...input(), flex: 1, minWidth: 140, ...(editingId ? { background: '#f5f5f5', color: '#999' } : {}) }}
              />
            </div>
            <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              半角英小文字・数字・ハイフンのみ。例: line, campaign-01（他と重複する文字は使えません）
            </p>
          </Field>

          <Field label={editingId ? 'OGP画像 (変更する場合のみ選択)' : 'OGP画像 * (JPEG / PNG / GIF / WebP, 5MB以内, 1200x630推奨)'}>
            <input
              key={editingId ?? 'new'}
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

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
            {uploading
              ? '画像アップロード中...'
              : submitting
                ? editingId ? '更新中...' : '作成中...'
                : editingId ? '変更を保存' : '短縮URLを作成'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting || uploading}
              style={{
                background: '#fff',
                color: '#333',
                border: '1px solid #ddd',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 14,
              }}
            >
              キャンセル
            </button>
          )}
          </div>
        </form>
      </section>

      <section style={{ ...card(), marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginBottom: 4 }}>
          作成済みリンク ({links.length})
        </h2>
        <p style={{ fontSize: 11, color: '#999', marginBottom: 16 }}>
          クリック数は{STATS_INTERVAL_MS / 1000}秒ごとに自動更新（日本時間で日付を区切ります）
        </p>
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
                  }}
                >
                  <div style={{ display: 'flex', gap: 12 }}>
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
                    <div style={{ fontSize: 13, marginBottom: 8 }}>
                      今日 <b>{stats.today[link.id] ?? 0}</b>
                      <span style={{ color: '#ccc', margin: '0 8px' }}>|</span>
                      累計 <b>{stats.total[link.id] ?? 0}</b> クリック
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
                        onClick={() => toggleDaily(link.id)}
                        style={{ ...btn(), ...(dailyId === link.id ? { background: '#000', color: '#fff', borderColor: '#000' } : {}) }}
                      >
                        日別
                      </button>
                      <button
                        onClick={() => startEdit(link)}
                        style={btn()}
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDelete(link.id)}
                        style={{ ...btn(), color: '#d00' }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  </div>
                  {dailyId === link.id && <DailyTable daily={daily} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}

// 日別クリック数（直近30日＋それ以前に記録がある日、新しい順）
function DailyTable({ daily }: { daily: Record<string, number> }) {
  const days = new Set(Object.keys(daily));
  const now = Date.now() + 9 * 60 * 60 * 1000;
  for (let i = 0; i < 30; i++) {
    days.add(new Date(now - i * 86400000).toISOString().slice(0, 10));
  }
  const rows = Array.from(days).sort().reverse();
  const max = Math.max(1, ...rows.map((d) => daily[d] ?? 0));
  const sum = rows.reduce((a, d) => a + (daily[d] ?? 0), 0);

  return (
    <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
      <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
        日別クリック数（表示期間の合計 {sum}）
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            {rows.map((d) => {
              const n = daily[d] ?? 0;
              return (
                <tr key={d} style={{ borderBottom: '1px solid #f3f3f3' }}>
                  <td style={{ padding: '4px 8px 4px 0', whiteSpace: 'nowrap', color: '#666', width: 90 }}>{d}</td>
                  <td style={{ padding: '4px 8px', textAlign: 'right', width: 48, fontWeight: n ? 600 : 400, color: n ? '#333' : '#bbb' }}>{n}</td>
                  <td style={{ padding: '4px 0' }}>
                    <div style={{ height: 8, width: `${(n / max) * 100}%`, background: '#000', borderRadius: 2, minWidth: n ? 2 : 0 }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
