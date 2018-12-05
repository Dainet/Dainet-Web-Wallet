# Dainet Wallet

Dainet Wallet is a minimal ERC20 token javascript wallet, based on eth-lightwallet.

[https://wallet.dain.network](https://wallet.dain.network)

## About

Dainet Wallet is a HD wallet that can store your keystore in the browser.
The default BIP32 HD derivation path has is m/0'/0'/0'/i.

<img src="https://raw.githubusercontent.com/Dainet/Dainet-Wallet/master/wallet.png" alt="Dainet Wallet" width="360">

As ERC20 tokens need a small amount of Ether to make transfers, the wallet also presents the amount of Ether available on its account.

## Instructions

1. Clone this repository:

  ```
  git clone https://github.com/Dainet/Dainet-Web-Wallet.git
  ```

2. Go to the `js` directory and copy config_dist.js to config.js

3. Update config.js to your contract information, gas price and limit as well as etherscan api key (for ropsten you can leave it).

```
var walletconfig = {
    token_contract: "0x73e210304d99d900ad2555e930f5e0c53f2c8a0d", // Dainet Token Contract address
    token_decimals: 18,
    token_symbol: 'DAIN',
    token_name: 'Dainet',
    etherscan_api: 'https://api.etherscan.io', // https://api.etherscan.io || https://ropsten.etherscan.io for test
    etherscan_api_key: 'YourApiKey',
    password: '', 
    gas_price: 8,
    gas_limit: 90000
};
```


## Security

Dainet Wallet has not been through a comprehensive security review at this point and is still in experimental mode. 
Do not rely on it to store larger amounts of Ether or tokens yet.


Copyright (c) 2018 Dainet Network
