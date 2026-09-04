# Universal UI Icons 500

アプリケーションUI向けの汎用SVGアイコン集です。500種類の各アイコンについて、カラー版とモノクロ版を1点ずつ、合計1,000 SVG収録しています。

## 特徴

- 20分類×25種、合計500種類
- 同じ意味・同じ輪郭を共有するカラー版とモノクロ版
- `24 × 24` の共通 `viewBox`、線幅2、丸い線端と角
- SVG内部に日本語名、英語名、分類、推奨サイズ、対応版、ライセンス、形状ハッシュを保持
- `<title>` と `<desc>` による基本的なアクセシビリティ情報
- カラー版は分類色を基本に、成功・失敗・警告など一部の状態色を優先
- モノクロ版は `currentColor` 対応。単色でも用途を判別できる輪郭設計
- JSON／CSVカタログ、SVGスプライト、検索可能なHTMLプレビュー付き

形状はLucide Icons 1.8.0を基礎に、分類、配色、メタデータ、命名、ペア構造を本セット向けに構成しています。利用条件は `THIRD_PARTY_NOTICES.md` と `licenses/LUCIDE-LICENSE.txt` を参照してください。

## 収録構成

```text
universal-ui-icons-500/
├─ color/                 カラー版（500 SVG）
├─ monochrome/            モノクロ版（500 SVG）
├─ catalog/
│  ├─ catalog-v1.json     機械処理向けカタログ
│  └─ catalog-v1.csv      Excel等で確認できる一覧
├─ sprites/
│  ├─ color.svg           カラー版SVGスプライト
│  └─ monochrome.svg      モノクロ版SVGスプライト
├─ preview/
│  ├─ index.html          検索・分類・版切替プレビュー
│  └─ categories/         分類別5×5プレビュー
├─ schema/                カタログJSON Schema
├─ docs/                  設計・メタデータ仕様
├─ tools/validate.mjs     無依存の整合性検査
└─ SHA256SUMS             配布ファイルのハッシュ一覧
```

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

検査対象は件数、ID、ファイル対応、メタデータ、推奨サイズ、形状ハッシュ、カラー／モノクロの対です。

## バージョン

- アイコンセット: 1.0.0
- メタデータスキーマ: 1.0
- 公開日: 2026-09-04
