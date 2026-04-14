了解です。フルスタック構成に切り替えます。実装前に全体像を整理します。

---

## 確定要件定義 — Markdown Blog System

### システム構成

```
Browser
 ├── Editor UI  (VSCode レイアウト)
 └── Reader UI  (VSCode レイアウト)
        ↕ REST API
Hono (Cloudflare Workers)
        ↕ D1 Binding
Cloudflare D1 (SQLite)
```

---

### 画面構成（2画面）

#### Editor（記事管理・編集画面）

| ペイン | 内容 |
|--------|------|
| 左サイドバー | フォルダ／記事ツリー、新規作成・削除・リネーム |
| タブバー | 複数記事を同時に開ける |
| 中央 | Markdownテキストエディタ（ツールバー付き、行番号） |
| 右 | リアルタイムプレビュー（KaTeX + シンタックスハイライト） |
| 下部 | ステータスバー（文字数・カーソル位置・保存状態） |

#### Reader（記事閲覧画面）

| ペイン | 内容 |
|--------|------|
| 左サイドバー | フォルダ／記事ツリー（読み取り専用） |
| 中央 | レンダリングされた記事本文（ブログ的タイポグラフィ） |
| 右 | 目次（見出しリンク・スクロール追従） |

両画面共通でライト／ダーク切り替えボタンを上部に配置。

---

### DB設計（D1 / SQLite）

```sql
-- フォルダ
CREATE TABLE folders (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  parent_id INTEGER REFERENCES folders(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 記事
CREATE TABLE articles (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  folder_id  INTEGER REFERENCES folders(id),
  title      TEXT NOT NULL,
  slug       TEXT UNIQUE NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  status     TEXT DEFAULT 'draft',  -- draft | published
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

### API設計（Hono）

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/tree` | フォルダ＋記事ツリー取得 |
| GET | `/api/articles/:id` | 記事1件取得 |
| POST | `/api/articles` | 記事新規作成 |
| PUT | `/api/articles/:id` | 記事更新（自動保存） |
| DELETE | `/api/articles/:id` | 記事削除 |
| POST | `/api/folders` | フォルダ作成 |
| PUT | `/api/folders/:id` | フォルダリネーム |
| DELETE | `/api/folders/:id` | フォルダ削除 |

---

### フロントエンド技術スタック

| 役割 | 選定 |
|------|------|
| Markdown → HTML | marked.js |
| 数式 | KaTeX |
| コードハイライト | highlight.js |
| HTTP通信 | fetch API |
| バンドラー | Vite |
| フレームワーク | React（TSX）|

---

### ディレクトリ構成（成果物）

```
blog-system/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Editor.tsx
│   │   │   ├── Preview.tsx
│   │   │   ├── Reader.tsx
│   │   │   └── TOC.tsx
│   │   ├── pages/
│   │   │   ├── EditorPage.tsx
│   │   │   └── ReaderPage.tsx
│   │   ├── hooks/
│   │   │   └── useArticles.ts
│   │   └── main.tsx
│   └── vite.config.ts
├── backend/
│   ├── src/
│   │   ├── index.ts       ← Hono エントリ
│   │   ├── routes/
│   │   │   ├── articles.ts
│   │   │   └── folders.ts
│   │   └── db/
│   │       └── schema.sql
│   └── wrangler.toml
└── README.md
```

---

### 自動保存仕様

- エディタ入力から **1.5秒 debounce** → `PUT /api/articles/:id` を自動送信
- ステータスバーに「保存中…」→「保存済み」を表示

---

### 初期デモ記事（3本）

| タイトル | 内容 |
|----------|------|
| CPUパフォーマンス入門 | MIPSの数式、表、コードブロック |
| 情報理論とエントロピー | シャノンエントロピーの数式、図説 |
| このエディタの使い方 | 画像挿入・数式・ショートカット一覧 |

---

## TEST

要件定義にTDDを追加します。

---

## TDD実装方針 — 追加要件定義

### Backend（Hono + Cloudflare Workers）

#### テストフレームワーク

| 役割 | 選定 |
|------|------|
| テストランナー | Vitest |
| Workers環境エミュレート | `@cloudflare/vitest-pool-workers` |
| D1モック | Miniflare（Vitest pool内蔵） |
| R2モック | Miniflare（同上） |
| HTTPテスト | Hono の `app.request()` |

#### テスト構成

```
backend/
├── src/
│   ├── routes/
│   │   ├── articles.ts
│   │   └── folders.ts
│   └── index.ts
├── test/
│   ├── routes/
│   │   ├── articles.test.ts
│   │   └── folders.test.ts
│   ├── r2/
│   │   └── upload.test.ts
│   └── setup.ts          ← D1マイグレーション・シード
└── vitest.config.ts
```

#### TDDサイクル例（記事作成API）

```
RED:   POST /api/articles → 201 を期待するテストを書く
GREEN: routeを実装して通す
REFACTOR: バリデーション・エラーハンドリングを整理
```

#### テストカバレッジ対象

| レイヤー | テスト内容 |
|---------|-----------|
| Route | 正常系・異常系（400/404/500）のHTTPレスポンス |
| D1 | CRUD操作・トランザクション・制約違反 |
| R2 | アップロード・URL生成・削除 |
| Middleware | 認証・バリデーション |

---

### Frontend（React + Vite）

#### テストフレームワーク

| 役割 | 選定 |
|------|------|
| テストランナー | Vitest |
| DOMエミュレート | jsdom |
| コンポーネントテスト | React Testing Library |
| APIモック | MSW（Mock Service Worker）|
| E2Eテスト | Playwright |

#### テスト構成

```
frontend/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Editor.tsx
│   │   ├── Preview.tsx
│   │   └── TOC.tsx
│   └── hooks/
│       └── useArticles.ts
├── test/
│   ├── components/
│   │   ├── Sidebar.test.tsx
│   │   ├── Editor.test.tsx
│   │   └── Preview.test.tsx
│   ├── hooks/
│   │   └── useArticles.test.ts
│   ├── e2e/
│   │   ├── editor.spec.ts   ← 記事作成フロー
│   │   └── reader.spec.ts   ← 記事閲覧フロー
│   └── mocks/
│       ├── handlers.ts      ← MSWハンドラ
│       └── server.ts
└── vitest.config.ts
```

#### TDDサイクル例（Editorコンポーネント）

```
RED:   入力→プレビュー同期のテストを書く
GREEN: Editorコンポーネントを実装して通す
REFACTOR: debounce・KaTeXレンダリングを整理
```

#### テストカバレッジ対象

| レイヤー | テスト内容 |
|---------|-----------|
| Component | レンダリング・ユーザー操作・状態変化 |
| Hook | API呼び出し・キャッシュ・エラーハンドリング |
| Integration | MSWでAPIをモックしたエディタ保存フロー |
| E2E | 記事作成→保存→閲覧の一気通貫シナリオ |

---

### 共通方針

| 項目 | 方針 |
|------|------|
| サイクル | Red → Green → Refactor を厳守 |
| カバレッジ目標 | ビジネスロジック100%、UI重要パス80%以上 |
| CI | GitHub Actions でpush時に自動テスト実行 |
| テスト粒度 | Unit → Integration → E2E の順に実装 |
| テストデータ | factoryパターンでフィクスチャ管理 |

---

### 実装順序

```
1. DB schema + マイグレーション
2. Backend Unit Test（RED）→ Route実装（GREEN）
3. Frontend Hook Test（RED）→ useArticles実装（GREEN）
4. Component Test（RED）→ UI実装（GREEN）
5. E2Eテスト（RED）→ 結合調整（GREEN）
6. CI設定
```

---

## UI/UX

## 画面構成 詳細技術仕様

---

### 1. ドラッグ&ドロップ画像挿入

#### UX定義
Notionと同様に「エディタ上の任意の行間にファイルをドロップすると、その位置にMarkdown画像構文が挿入される」体験。

#### 技術実装

**ドロップターゲットの検出**
```
contenteditable または textarea 上で
dragover イベントを監視
→ カーソル位置を document.caretRangeFromPoint(e.clientX, e.clientY) で取得
→ 該当行に挿入マーカー（青い横線UI）を表示
```

**ファイル処理パイプライン**
```
drop イベント
  └─ e.dataTransfer.files[0] 取得
       └─ MIME typeチェック（image/*のみ許可）
            └─ FormData に詰めてPOST /api/r2/upload
                 └─ Workers側でR2.put() → public URLを返却
                      └─ カーソル位置に ![filename](url) を挿入
```

**挿入位置の精度**
- CodeMirror 6 を採用することで `view.posAtCoords({x, y})` により行レベルではなく**文字レベルの精度**でドロップ位置を特定できる
- textareaの生DOM操作より格段に正確

---

### 2. VSCodeライクなサイドバー階層構造

#### UX定義
ジャンル（フォルダ）単位でネストし、クリックでトグル展開・閉じ。深さ制限なし。

#### データ構造
```typescript
// 隣接リスト（adjacency list）モデル
type Folder = {
  id: number
  name: string
  parent_id: number | null  // nullがルート
}

type Article = {
  id: number
  folder_id: number | null
  title: string
  slug: string
}

// フロント側でツリーに変換
type TreeNode = {
  type: 'folder' | 'article'
  id: number
  name: string
  children?: TreeNode[]   // folderのみ
  depth: number
}
```

**フラット→ツリー変換（O(n)）**
```typescript
function buildTree(folders: Folder[], articles: Article[]): TreeNode[] {
  const map = new Map<number, TreeNode>()
  // 1パスでMapを構築、2パスで親子を接続
  // React側はこのTreeNodeを再帰レンダリング
}
```

#### トグル状態の管理
```typescript
// ローカル状態として管理（サーバー不要）
const [openFolders, setOpenFolders] = useState<Set<number>>(new Set())

// 展開状態はlocalStorageに永続化
// → ページリロードしても前回の開閉状態が復元される
useEffect(() => {
  localStorage.setItem('openFolders', JSON.stringify([...openFolders]))
}, [openFolders])
```

#### インデント表現
```
depth 0: padding-left: 8px
depth 1: padding-left: 24px
depth 2: padding-left: 40px
→ 1段ごとに +16px（VSCodeと同値）
```

---

### 3. 画面遷移なし・インライン編集UX

#### UX定義
「ログイン済みであれば、記事URLに直接アクセスするだけで編集可能になる。Reader/Editorという画面分離をユーザーが意識しない」

#### 技術的実現方法

**Single Page Application（SPA）構成**
```
URL構造:
  /                  → サイドバー + 最後に開いた記事
  /articles/:slug    → サイドバー + 該当記事

画面遷移なし = React Router の <Outlet> による
レイアウト共有。サイドバーは一切再マウントされない。
URLだけが変わり、中央ペインのみ差し替わる。
```

**閲覧←→編集のシームレス切り替え**
```typescript
// 認証状態に応じてコンポーネントを切り替えるだけ
// ページ遷移・リロードは発生しない

const ArticlePane = () => {
  const { isAuthenticated } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  return isAuthenticated && isEditing
    ? <Editor onBlur={() => setIsEditing(false)} />
    : <Reader onClick={() => isAuthenticated && setIsEditing(true)} />
}
```

**認証方式（Cloudflare Access）**
```
Cloudflare Access（Zero Trust）を Workers の前段に配置
→ 自分のGoogleアカウントのみ許可するルールを設定
→ JWTがCookieに自動セットされる
→ Workers側で CF-Access-JWT-Assertion ヘッダーを検証

メリット:
- ログインUIを自前実装しない
- パスワード管理が不要
- Workers側は JWT 検証のみでOK
```

**自動保存による「保存ボタン不要」UX**
```typescript
// debounce 1500ms で自動PUT
const debouncedSave = useMemo(
  () => debounce(async (content: string) => {
    setSaveStatus('saving')
    await fetch(`/api/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content })
    })
    setSaveStatus('saved')
  }, 1500),
  [id]
)

// ステータスバーに「保存済み ✓」を表示するのみ
// ユーザーはボタンを押す必要がない
```

---

### 4. 全体アーキテクチャ図

```
Browser (React SPA)
│
├─ URL: /articles/:slug
│   ├─ Sidebar（サイドバー）
│   │   └─ ツリー構造（折りたたみ・展開）
│   ├─ ArticlePane（中央）
│   │   ├─ 未認証: Reader（レンダリング済みHTML）
│   │   └─ 認証済み: Editor（CodeMirror 6）
│   └─ TOC / Preview（右）
│
├─ 認証: Cloudflare Access JWT（Cookie自動付与）
├─ 自動保存: debounce PUT → Hono → D1
└─ 画像: drag&drop → POST → Workers → R2 → URL返却
```

---

### 5. 採用技術の確定まとめ

| 関心事 | 技術選定 | 理由 |
|--------|---------|------|
| エディタ本体 | CodeMirror 6 | ドロップ位置の文字精度・拡張性 |
| ルーティング | React Router v7 | SPA・レイアウト共有 |
| 認証 | Cloudflare Access | 自前実装不要・JWT自動管理 |
| 自動保存 | debounce + PUT | ボタン不要UX |
| サイドバー状態 | useState + localStorage | サーバー不要・高速 |
| 数式 | KaTeX | CodeMirror拡張で統合可能 |
| Markdown変換 | marked.js | 軽量・高速 |

---

この仕様で要件定義を確定します。実装に入ってよいでしょうか。