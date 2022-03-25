require('@nomiclabs/hardhat-waffle');

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
  },
  mocha: {
    timeout: 100000,
  }
};
