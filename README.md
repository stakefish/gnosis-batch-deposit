# Gnosis chain batch deposit 

This repository contains the smart contracts for stake.fish Gnosis chain batch deposit.

## Development environment

* Node v16.8.0

Install dependencies by running:
```
yarn intall
```

## Deployment


## Smart contract workflow
![workflow](https://i.imgur.com/Kkj47ly.png)


## Functional tests

Tests are written using [ethers.js](https://github.com/ethers-io/ethers.js/), [chai](https://www.chaijs.com/) assertion library and smart contract testing library [waffle](https://github.com/EthWorks/Waffle).

You can find tests under `test` folder and run all the tests using `npx hardhat test` command, it will start an instance of Hardhat Network that forks ethereum mainnet to run the tests.

You can configure the Hardhat Network settings in `hardhat.config.js`.

