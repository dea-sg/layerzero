# Layer Zero base contract

## 免責事項
ソースの内容について、妥当性や正確性について保証しません。
利用者の自己責任にてご利用ください。

## 使い方
```
yarn add @dea-sg/layerzero
もしくは
npm install @dea-sg/layerzero
```
で利用できます

## 使い方
とりあえずERC20をLayerZeroで動かしてみたい場合は
```
import "@dea-sg/contracts/layerzero/OmniERC20Upgradeable.sol";
```
とした上で、OmniERC20Upgradeableを継承したコントラクトを作成してください。
そうすればupgradableでLayerZeroの機能を兼ね揃えたERC20が作成できます。

そのコントラクトをEthereum rinkebyやPolygon mumbaiにデプロイしてください。

## 動かし方
send関数を実行してください。別チェーンにトークンが送信されます。
当たり前ですが、send関数を実行するウォレットに残高は必要です。事前のmintをお願いします。
payableになっているので、例えばeth->polygonの場合は0.1etherとか付与してください。
これは送信先チェーンを動かすガス代です。多かった場合は_refundAddressに戻ってくるので、安心してください。

引数の情報は下記です

_dstChainId：[チェーンのID](https://layerzero.gitbook.io/docs/technical-reference/testnet/testnet-addresses)

_toAddress：送信先のチェーンのアドレス

_amount：送信したいトークン数

_refundAddress：送信先チェーン

_zroPaymentAddress：将来の機能拡張用です。今はnullアドレスを設定してください。

_adapterParams：将来の機能拡張用です。今は0xとしておいてください。
