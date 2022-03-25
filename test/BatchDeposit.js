const { ethers } = require('hardhat');
const chai = require('chai');
const ChaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const BigNumber = ethers.BigNumber;
const networks = require("../networks");

chai.use(ChaiAsPromised);

const currentNetwork = networks[hre.network.name];

async function impersonate(account) {
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [account],
  });
}

async function resetFork(blockNumber=null) {
 await network.provider.request({
   method: "hardhat_reset",
   params: [
     {
       forking: {
         jsonRpcUrl: hre.network.config.forking.url,
         blockNumber: blockNumber ?? hre.network.config.forking.blockNumber,
       },
     },
   ],
 });   
}

async function setBalance(address, balanceHex) {
  await network.provider.send("hardhat_setBalance", [
    address,
    balanceHex,
  ]);
}

describe('BatchDeposit', () => {
  const {
    GNO_ADDRESS: gnoTokenAddress,
    MGNO_ADDRESS: mGnoWrapperAddress,
    MGNO_DEPOSIT_ADDRESS: mGnoDepositAddress
  } = currentNetwork;
  const fee = ethers.utils.parseEther("0.05");

  let batchDepositContract;
  let gnoTokenContract;
  let mGnoWrapperContract;
  let gnoDepositContract;

  before(async () => {
    gnoTokenContract = await ethers.getContractAt("SBCToken", gnoTokenAddress);
    mGnoWrapperContract = await ethers.getContractAt("SBCWrapper", mGnoWrapperAddress);
    mGnoDepositContract = await ethers.getContractAt("SBCDepositContract", mGnoDepositAddress);
  });

  describe("When create one validator with correct payload", () => {
    beforeEach(async () => {
      await resetFork();

      const BatchDepositFactory = await ethers.getContractFactory("BatchDeposit");
      batchDepositContract = await BatchDepositFactory.deploy(gnoTokenAddress, mGnoWrapperAddress, fee);
      await batchDepositContract.deployed();
    });

    // https://blockscout.com/xdai/mainnet/tx/0x2b2ff8bb9e95def83330dda9823ab25c8f34ee0f535826662a62b57afb8db643
    const data = "0x0100000000000000000000004bc0769c771915c53cd27c2733fc5f7cf17d79df8" +
                 "fc0691560ef89b27236be17a5822642fba82dc232d0e092c36b229ef917533aefe9" +
                 "c2428316a9bae75454eb5f82542899283100880d8cba1ffc9883ab87bc808e2021d" +
                 "5a9ceca7d6959738dd80bc78107ed1be837a1b5c0fcae4731bfaa722b10484977db" +
                 "7b45eeaf9936426be324582e2a16277800d1627531791b962b44f40522e266dd298" +
                 "4cffc67a4a46058fda0525c3004860fc6787e1f7d4102552a6693d84aa1be363dbb" +
                 "c7c771b6e88dafaa";
    const sender = "0x01e863C402F2E901BA264c3B0b2D6b8606eff2BA";


    describe("When fee is correct", () => {
      let tx;
      
      beforeEach(async () => {
        await impersonate(sender);
        const signer = await ethers.getSigner(sender);
        tx = gnoTokenContract.connect(signer).transferAndCall(
          batchDepositContract.address,
          ethers.utils.parseEther("1").add(fee),
          data
        );
      });

      it("Should collect fee and update validator count", async () => {
        await (await tx).wait();
        
        const gnoBalance = await gnoTokenContract.balanceOf(batchDepositContract.address);
        const totalValidator = await batchDepositContract.totalValidator();

        expect(gnoBalance).to.be.equal(fee);
        expect(totalValidator).to.be.equal(BigNumber.from("1"));
      });

      it("Should emit FeeCollected event", async () => {
        await expect(tx)
          .to.emit(batchDepositContract, "FeeCollected")
          .withArgs(sender, fee)
      });

      it("Should emit Swap event", async () => {
        await expect(tx)
          .to.emit(mGnoWrapperContract, "Swap")
          .withArgs(
            gnoTokenAddress,
            mGnoWrapperAddress,
            ethers.utils.parseEther("1"),
            ethers.utils.parseEther("32")
          );
      });

      it("Should emit DepositEvent event", async () => {
        await expect(tx)
          .to.emit(mGnoDepositContract, "DepositEvent")
      });
    });

    describe("When fee is incorrect", () => {
      let tx;
      
      beforeEach(async () => {
        await impersonate(sender);
        const signer = await ethers.getSigner(sender);
        tx = gnoTokenContract.connect(signer).transferAndCall(
          batchDepositContract.address,
          ethers.utils.parseEther("1"),
          data
        );
      });

      it("Should revert", async () => {
        await expect(tx).to.be.reverted;
      });
    });
  });

  describe("When create one validator with incorrect payload", () => {
    // https://blockscout.com/xdai/mainnet/tx/0x2b2ff8bb9e95def83330dda9823ab25c8f34ee0f535826662a62b57afb8db643
    const data = "0x0100000000000000000000004bc0769c771915c53cd27c2733fc5f7cf17d79df8" +
                 "fc0691560ef89b27236be17a5822642fba82dc232d0e092c36b229ef917533aefe9" +
                 "c2428316a9bae75454eb5f82542899283100880d8cba1ffc9883ab87bc808e2021d" +
                 "5a9ceca7d6959738dd80bc78107ed1be837a1b5c0fcae4731bfaa722b10484977db" +
                 "7b45eeaf9936426be324582e2a16277800d1627531791b962b44f40522e266dd298" +
                 "4cffc67a4a46058fda0525c3004860fc6787e1f7d4102552a6693d84aa1be363dbb";
                 // Deliberately comment out this line
                 // "c7c771b6e88dafaa";
    const sender = "0x01e863C402F2E901BA264c3B0b2D6b8606eff2BA";

    beforeEach(async () => {
      await impersonate(sender);
      const signer = await ethers.getSigner(sender);
      tx = gnoTokenContract.connect(signer).transferAndCall(
        batchDepositContract.address,
        ethers.utils.parseEther("1").add(fee),
        data
      );
    });

    it("Should revert", async () => {
      await expect(tx).to.be.reverted;
    });
  });

  describe("When create multiple validators with correct payload", () => {
    // https://blockscout.com/xdai/mainnet/tx/0x39973e700dee58465256a9b57bef302f63cae9edc5481668166e7c5b7f263807
    const data = "0x0100000000000000000000007b13c2f7aaa8c772bd0a13a86b0cf" +
                 "633faf790b0a56f5809403912419622d431f1b5f58a74d17872959c" +
                 "97e9c4f870ca5f5e673f1328197e13430d0cbaabd5714ef180cc896" +
                 "c8503a3ee2c86b49da6538f5529cd5b15cc8eb7902d325084a9b8e9" +
                 "8fff06f0dd3198557862fa8d88d37c14daa5cd172d27c082bea6206" +
                 "2db5a285b9a2041755aca47f104b433af003f93ab21a14041573a8a" +
                 "68980f5c8c3746ed64d7461217d868d79c555c8af374eac545fa714" +
                 "8cf4496178c139d2cf0b885df2c9a2f1a8e0938ae8dcd582a3c484c" +
                 "54c504a9862b2afcb96fc7d1c5d5ee9aae9da94c2c2d1d85b2d890a" +
                 "23a1bdb64929b6cddfcb0dfe93882e2ea192c76bebd3e5708d2e4d9" +
                 "383df47349c988003fcf54e15797fdb99b20a88a52e3c616a710f73" +
                 "0f1690b8c2fae95c4332f2c9e984f76cfe79fe56b2cf9c92a00519e" +
                 "6f0e96d646ae0ad7abf51536aae1ede7fd1c1fcb0e92b2e7d45f482" +
                 "94c36124ef26674ede2d391693a054715ecabf0892ae9c9572369b8";
	  const sender = "0x7b13c2F7AaA8C772Bd0a13A86B0CF633fAf790B0";

    beforeEach(async () => {
      await resetFork(21120489);
      await setBalance(sender, "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");

      const BatchDepositFactory = await ethers.getContractFactory("BatchDeposit");
      batchDepositContract = await BatchDepositFactory.deploy(gnoTokenAddress, mGnoWrapperAddress, fee);
      await batchDepositContract.deployed();
    });

    describe("When fee is correct", () => {
      let tx;
      
      beforeEach(async () => {
        await impersonate(sender);
        const signer = await ethers.getSigner(sender);
        tx = gnoTokenContract.connect(signer).transferAndCall(
          batchDepositContract.address,
          ethers.utils.parseEther("1").add(fee).mul(2),
          data
        );
      });

      it("Should collect fee and update validator count", async () => {
        await (await tx).wait();
        
        const gnoBalance = await gnoTokenContract.balanceOf(batchDepositContract.address);
        const totalValidator = await batchDepositContract.totalValidator();

        expect(gnoBalance).to.be.equal(fee.mul(2));
        expect(totalValidator).to.be.equal(BigNumber.from("2"));
      });

      it("Should emit FeeCollected event", async () => {
        await expect(tx)
          .to.emit(batchDepositContract, "FeeCollected")
          .withArgs(sender, fee.mul(2))
      });

      it("Should emit Swap event", async () => {
        await expect(tx) .to.emit(mGnoWrapperContract, "Swap")
          .withArgs(
            gnoTokenAddress,
            mGnoWrapperAddress,
            ethers.utils.parseEther("2"),
            ethers.utils.parseEther("64")
          );
      });

      it("Should emit DepositEvent event and update deposit count", async () => {
        const receipt = await (await tx).wait();
        let depositEventCount = 0;
        for (let i = 0; i < receipt.events.length; i++) {
          if (
            receipt.events[i].address == mGnoDepositAddress &&
            receipt.events[i].topics[0] == "0x649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c5"
          ) {
            depositEventCount += 1;
          }
        }

        expect(depositEventCount).to.be.equal(2);
      });
    });

    describe("When fee is incorrect", () => {
      let tx;
      
      beforeEach(async () => {
        await impersonate(sender);
        const signer = await ethers.getSigner(sender);
        tx = gnoTokenContract.connect(signer).transferAndCall(
          batchDepositContract.address,
          ethers.utils.parseEther("2"),
          data
        );
      });

      it("Should revert", async () => {
        await expect(tx).to.be.reverted;
      });
    });
  });

  describe("claimTokens", () => {
    const sender = "0x01e863C402F2E901BA264c3B0b2D6b8606eff2BA";
    beforeEach(async () => {
      await resetFork();
      await impersonate(sender);
  
      const BatchDepositFactory = await ethers.getContractFactory("BatchDeposit");
      batchDepositContract = await BatchDepositFactory.deploy(gnoTokenAddress, mGnoWrapperAddress, fee);
      await batchDepositContract.deployed();
    });

    it("Can claim erc20 token by owner", async () => {
      const [owner] = await ethers.getSigners();
      const senderSigner = await ethers.getSigner(sender);
      await gnoTokenContract.connect(senderSigner).transfer(batchDepositContract.address, ethers.utils.parseEther("0.05"));       
      await batchDepositContract.claimTokens(gnoTokenAddress, owner.address);

      const balance = await gnoTokenContract.balanceOf(owner.address);
      expect(balance).to.be.equal(ethers.utils.parseEther("0.05"));
    });

    it("Should revert if sender is not owner", async () => {
      const [, notOwner] = await ethers.getSigners();
      const senderSigner = await ethers.getSigner(sender);
      await gnoTokenContract.connect(senderSigner).transfer(batchDepositContract.address, ethers.utils.parseEther("0.05"));       
      const tx = batchDepositContract.connect(notOwner).claimTokens(gnoTokenAddress, notOwner.address);

      await expect(tx).to.be.reverted;
    });
  });
});
