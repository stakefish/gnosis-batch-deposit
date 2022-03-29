# Gnosis chain batch deposit 

This repository contains the smart contracts for stake.fish Gnosis chain batch deposit.

## Development environment

* Node v16.8.0

Install dependencies by running:
```
yarn intall
```

## Deployment

* `BatchDeposit`

To deploy on the gnosis mainnet, first you need to setup environment variables `GNOSIS_RPC_URL` and `GNOSIS_DEPLOYER_PRIVATE_KEY`, and then simply run:

```bash
npx hardhat run scripts/deploy-batch-deposit.js --network gnosis
```

## Smart contract workflow
![workflow](https://i.imgur.com/1iuFyUo.png)


## Functional tests

Tests are written using [ethers.js](https://github.com/ethers-io/ethers.js/), [chai](https://www.chaijs.com/) assertion library and smart contract testing library [waffle](https://github.com/EthWorks/Waffle).

You can find tests under `test` folder and run all the tests using `npx hardhat test` command, it will start an instance of Hardhat Network that forks ethereum mainnet to run the tests.

You can configure the Hardhat Network settings in `hardhat.config.js`.

