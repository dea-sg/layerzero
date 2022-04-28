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

とりあえず ERC20 を LayerZero で動かしてみたい場合は

```
import "@dea-sg/layerzero/contracts/ERC20/OmniERC20Upgradeable.sol";
```

とした上で、OmniERC20Upgradeable を継承したコントラクトを作成してください。
そうすれば upgradable で LayerZero の機能を兼ね揃えた ERC20 が作成できます。

そのコントラクトを Ethereum rinkeby や Polygon mumbai にデプロイしてください。

## 準備

### initialize

デプロイしたあと、各コントラクトの initialize をしてください。
name と symbol は任意のものを、endpoint は[チェーンにあったアドレス](https://layerzero.gitbook.io/docs/technical-reference/testnet/testnet-addresses)を設定してください。
例えば Rinkeby の場合は 0x79a63d6d8BBD5c6dfc774dA79bCcD948EAcb53FA となります。

### setTrustedRemote

setTrustedRemote 関数を実行してください。この関数は信用できる通信相手の設定をするための関数です。
例えば、Ethereum rinkeby や Polygon mumbai にデプロイした場合、rinkeby にデプロイしたコントラクトの setTrustedRemote は mumbai のチェーン ID と mumbai にデプロイしたコントラクトのアドレスを設定します。mumbai にデプロイしたコントラクトの setTrustedRemote には rinkeby のチェーン ID と rinkeby にデプロイしたコントラクトのアドレスを設定します。
rinkeby のチェーン ID は 10001 で、mumbai のチェーン ID は 10009 です。

## 動かし方

send 関数を実行してください。別チェーンにトークンが送信されます。
当たり前ですが、send 関数を実行するウォレットに残高は必要です。事前の mint をお願いします。
payable になっているので、例えば eth->polygon の場合は 0.1ether とか付与してください。
これは送信先チェーンを動かすガス代です。多かった場合は\_refundAddress に戻ってくるので、安心してください。

引数の情報は下記です

\_dstChainId：[チェーンの ID](https://layerzero.gitbook.io/docs/technical-reference/testnet/testnet-addresses)

\_toAddress：送信先のチェーンのアドレス

\_amount：送信したいトークン数

\_refundAddress：送信先チェーン

\_zroPaymentAddress：将来の機能拡張用です。今は null アドレスを設定してください。

\_adapterParams：将来の機能拡張用です。今は 0x としておいてください。
