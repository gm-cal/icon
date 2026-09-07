# Universal UI Icons

アプリケーションUI向けの汎用SVGアイコン集です。1,028種類の各アイコンについてカラー版とモノクロ版を1点ずつ、合計2,056 SVGを収録しています。

## 特徴

- 43分類、合計1,028種類
- v2.0.0ではプログラム開発系175種、業務UI系222種、フォーム・表示・運用系100種を重点追加
- v3.0.0ではカテゴリコード付きIDへ移行し、チェックボックス、ラジオボタン、プルダウンなどUI部品25種を追加
- v3.1.0ではファイル操作カテゴリを追加し、文字差し替え可能な変換・分割・統合テンプレート3種を追加
- 同じ意味・同じ輪郭を共有するカラー版とモノクロ版
- `24 × 24` の共通 `viewBox`、線幅2、丸い線端と角
- SVG内部に日本語名、英語名、分類、推奨サイズ、対応版、ライセンス、形状ハッシュを保持
- `<title>` と `<desc>` による基本的なアクセシビリティ情報
- カラー版は分類色を基本に、成功・失敗・警告など一部の状態色を優先
- モノクロ版は `currentColor` 対応。単色でも用途を判別できる輪郭設計
- JSON／CSVカタログ、SVGスプライト、検索可能なHTMLプレビュー付き

Lucide Icons 1.8.0の形状を基礎に、分類、配色、メタデータ、命名、ペア構造を本セット向けに構成しています。命名規則3種、UI部品25種、ファイル操作3種は独自形状です。第三者由来部分の利用条件は `THIRD_PARTY_NOTICES.md` と `licenses/LUCIDE-LICENSE.txt` を参照してください。

## 収録構成

```text
universal-ui-icons/
├─ color/                 カラー版（1,028 SVG）
├─ monochrome/            モノクロ版（1,028 SVG）
├─ catalog/
│  ├─ catalog-v1.json     機械処理向けカタログ
│  ├─ catalog-v1.csv      Excel等で確認できる一覧
│  └─ id-migration-v2-to-v3.csv 旧IDから新IDへの移行表
├─ sprites/
│  ├─ color.svg           カラー版SVGスプライト
│  └─ monochrome.svg      モノクロ版SVGスプライト
├─ preview/
│  ├─ index.html          自己完結型の検索・分類・版切替プレビュー
│  └─ categories/         分類別5×5プレビュー
├─ pages/
│  └─ index.html          GitHub Pages向けモバイル優先プレビュー
├─ schema/                カタログJSON Schema
├─ docs/                  設計・メタデータ・カテゴリコード仕様
├─ tools/validate.mjs     無依存の整合性検査
└─ SHA256SUMS             配布ファイルのハッシュ一覧
```

## Webプレビュー

GitHub Pagesでは `pages/index.html` を入口として、`catalog/catalog-v1.json`、`color/`、`monochrome/` を公開用アーティファクトへ組み立てます。`main` 更新時に `.github/workflows/pages-preview.yml` が検証・ビルド・デプロイを実行します。

想定URL:

```text
https://gm-cal.github.io/icon/
```

初回のみ、リポジトリの **Settings > Pages > Build and deployment > Source** を **GitHub Actions** に設定してください。Pagesの公開範囲はGitHubの契約プランおよびリポジトリ／Organization設定に従います。

モバイル向けプレビューは次を提供します。

- スマートフォンでは2列を基本とするレスポンシブ一覧
- 日本語名・英語名・ID・slug・キーワード検索
- 分類による絞り込み
- カラー／モノクロ切替
- タップによる詳細表示とSVGパス／IDコピー
- `loading="lazy"` と段階描画による大量アイコン向け遅延読み込み
- OSのライト／ダークテーマ追従

既存の `preview/index.html` はローカルで単体表示できる自己完結型プレビューとして維持します。

## 使い方

通常のUIでは `color/<分類>/<slug>.svg` を使用します。単色表示、無効状態、OSテーマへの追従が必要な箇所では `monochrome/<分類>/<slug>.svg` を使用します。

HTMLで個別SVGを使う例:

```html
<img src="color/actions/save.svg" width="24" height="24" alt="保存">
```

モノクロ版をインラインSVGとして使う場合、`color` をCSSで上書きできます。ボタンの意味は画像内の情報だけに依存させず、ボタン本体にも `aria-label` などを設定してください。

スプライトを使う例:

```html
<svg width="24" height="24" aria-label="保存" role="img">
  <use href="sprites/monochrome.svg#uui-save"></use>
</svg>
```

外部スプライトの参照可否は実行環境のCSPやSVG実装に依存します。非対応環境では個別SVGを利用してください。

## サイズ

- 最小: 16px
- 推奨: 16 / 20 / 24 / 32 / 48px
- 基準: 24px

16px未満では細部が潰れる可能性があります。12px以下が必要な場合は縮小ではなく、専用の簡略形状を用意してください。

## 検証

Node.js 18以降で、展開したルートから次を実行します。外部パッケージは不要です。

```sh
node tools/validate.mjs
```

検査対象は件数、カテゴリコード付きID、旧ID対応、ファイル対応、メタデータ、推奨サイズ、形状ハッシュ、カラー／モノクロの対です。

## ID体系

IDは `UUI-{カテゴリコード}-{カテゴリ内4桁連番}` です。カテゴリごとに連番を `0001` から開始します。

- 例: `UUI-NAV-0001` — ナビゲーションカテゴリの1番
- 例: `UUI-UIC-0001` — UI部品カテゴリの1番
- v2.0.0以前の `UUI-0001` ～ `UUI-1000` は、カタログの `legacyId` とSVG内部の `legacyId` 属性に保持
- カテゴリコード一覧は `docs/CATEGORY-CODES.md` を参照

## バージョン

- アイコンセット: 3.1.0
- メタデータスキーマ: 1.1
- 公開日: 2026-09-04
- 最終更新: 2026-09-08

### 1.1.0で追加されたアイコン

- `UUI-0501`: `snake_case` — 蛇とアンダースコア
- `UUI-0502`: `UpperCamel` — ラクダと大文字A
- `UUI-0503`: `lowerCamel` — ラクダと小文字a

### 2.0.0で追加されたアイコン

- `UUI-0504` ～ `UUI-1000` の497種
- プログラム開発: コード編集、ソース管理、API、DB・分析、クラウド基盤、テスト、開発セキュリティ
- 業務UI: プロジェクト、ワークフロー、オフィス文書、財務、営業、顧客対応、人事、物流、法務
- 共通UI: フォーム入力、並び替え・表示、通知・状態、入出力・同期

### 3.1.0での変更

- `FOP` / `file-operations`（ファイル操作）カテゴリを追加
- `UUI-FOP-0001` `file-convert`、`UUI-FOP-0002` `file-split`、`UUI-FOP-0003` `file-merge` を追加
- source / target の文字ラベルを差し替えてPDF→CSV、XLSX→JSON等を派生生成できるテンプレート構造を採用
- 派生SVGをカタログへ量産せず、`tools/render-file-operation.mjs` で必要時に生成する方針を追加

### 3.0.0での変更

- 全IDをカテゴリコード＋カテゴリ内連番へ再編
- 旧IDを `legacyId` として保持
- `UUI-UIC-0001` ～ `UUI-UIC-0025` のUI部品25種を追加
- チェックボックス、ラジオボタン、トグル、プルダウン、コンボボックス、各種入力欄、ピッカー、スライダー、タブ、アコーディオン、データグリッドを収録
