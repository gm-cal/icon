# SVG内部メタデータ仕様 1.0

## 名前空間

独自要素は次のXML名前空間に属します。

```text
urn:universal-ui-icons:metadata:1.0
```

SVGルートでは `xmlns:uui="urn:universal-ui-icons:metadata:1.0"` として宣言します。一般的なSVG描画系は `<metadata>` 内を描画対象にしないため、メタデータ非対応の環境でも通常どおり表示できます。

## 例

```xml
<metadata id="uui-metadata">
  <uui:icon schemaVersion="1.0" libraryVersion="1.0.0"
            id="UUI-0001" slug="arrow-up" variant="color">
    <uui:name xml:lang="ja">上へ</uui:name>
    <uui:name xml:lang="en">Arrow Up</uui:name>
    <uui:description xml:lang="ja">…</uui:description>
    <uui:description xml:lang="en">…</uui:description>
    <uui:category id="navigation" xml:lang="ja">ナビゲーション</uui:category>
    <uui:category id="navigation" xml:lang="en">Navigation</uui:category>
    <uui:keywords xml:lang="ja">上へ, ナビゲーション</uui:keywords>
    <uui:keywords xml:lang="en">Arrow Up, Navigation</uui:keywords>
    <uui:recommendedSizes unit="px">16 20 24 32 48</uui:recommendedSizes>
    <uui:minimumSize unit="px">16</uui:minimumSize>
    <uui:opticalSize unit="px">24</uui:opticalSize>
    <uui:contexts>button toolbar menu status</uui:contexts>
    <uui:pair variant="monochrome" href="../../monochrome/navigation/arrow-up.svg"/>
    <uui:palette primary="#2563EB" accent="#06B6D4" secondary="#60A5FA"/>
    <uui:geometry viewBox="0 0 24 24" strokeWidth="2" sha256="…"/>
    <uui:source project="Lucide Icons" version="1.8.0" license="ISC" modified="true"/>
  </uui:icon>
</metadata>
```

## フィールド

| フィールド | 必須 | 内容 |
| --- | --- | --- |
| `schemaVersion` | 必須 | メタデータ仕様の版 |
| `libraryVersion` | 必須 | 当該SVGが追加または形状更新された時点のアイコンセットの版 |
| `id` | 必須 | 意味に対して固定される安定ID |
| `slug` | 必須 | ファイル名とスプライト参照に使う英字名 |
| `variant` | 必須 | `color` または `monochrome` |
| `uui:name` | 必須 | 言語別の表示名 |
| `uui:description` | 必須 | 用途説明 |
| `uui:category` | 必須 | 分類IDと表示名 |
| `uui:keywords` | 必須 | 検索用語。カンマ区切り |
| `uui:recommendedSizes` | 必須 | 推奨描画サイズ |
| `uui:minimumSize` | 必須 | 簡略化なしで使う最小サイズ |
| `uui:opticalSize` | 必須 | デザイン基準サイズ |
| `uui:contexts` | 必須 | 想定UI文脈 |
| `uui:pair` | 必須 | 対応する別版への相対パス |
| `uui:palette` | 必須 | 実際に使用した3役の色 |
| `uui:geometry` | 必須 | 形状仕様と正規化形状のSHA-256 |
| `uui:source` | 必須 | 基礎形状の出典、版、ライセンス、改変有無 |

## HTMLアクセシビリティとの関係

SVG自身には日本語の `<title>` と `<desc>` を収録しています。ただし、ボタンやリンクに組み込む場合のアクセシブル名はコントロール側で設定してください。装飾目的の場合は埋め込み先で `aria-hidden="true"` とし、重複読み上げを避けます。

## 形状ハッシュ

`uui:geometry/@sha256` は色属性を含まない基礎形状データのSHA-256です。カラー版とモノクロ版が同じハッシュを持つことで、配色以外の形状が一致することを確認できます。
