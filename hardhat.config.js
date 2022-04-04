require('@nomiclabs/hardhat-waffle');
require('dotenv').config({ path: require('find-config')('.env') })

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.11",
  networks: {
    hardhat: {
      forking: {
        url: "https://poa-xdai-archival.gateway.pokt.network/v1/lb/623c4d5d6297a1003ae1293b",
        blockNumber: 21259919,
      },
    },
    gnosis: {
      url: process.env.GNOSIS_RPC_URL,
      accounts: [process.env.GNOSIS_DEPLOYER_PRIVATE_KEY],
      gas: "auto",
      gasPrice: "auto"
    }
  },
  mocha: {
    timeout: 100000,
  }
};
