const hre = require("hardhat");
const networks = require("../networks");

const ethers = hre.ethers;
const currentNetwork = networks[hre.network.name];

const main = async () => {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const Factory = await ethers.getContractFactory("BatchDeposit");

  const factory = await Factory.deploy(
    currentNetwork.GNO_ADDRESS,
    currentNetwork.MGNO_ADDRESS,
    ethers.utils.parseEther(currentNetwork.STAKING_FEE)
  );

  console.log("BatchDeposit address:", factory.address);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
