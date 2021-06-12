const { default: BigNumber } = require("bignumber.js");
const { expect } = require("chai");
const { description } = require("commander");
const { web3 } = require("hardhat");

const ArtworkNFT = artifacts.require("ArtworkNFT");
const BasicToken = artifacts.require("BasicToken");

describe("ArtworkNFT", function () {
  let owner, dev, minter, bob;
  const TEST_TOKEN_URI = "https://ipfs.io/ipfs/test.json";
  let accounts, basicToken, artworkNFT;

  before(async function () {
    accounts = await web3.eth.getAccounts();
    owner = accounts[0];
    minter = accounts[1];
    dev = accounts[2];
    bob = accounts[3];
    alice = accounts[4];

    basicToken = await BasicToken.new(
      "Basic Token",
      "BSC",
      BigNumber("1000000000000000000000000.0")
    );
    artworkNFT = await ArtworkNFT.new(
      "TestToken",
      "TEST",
      dev,
      BigNumber("2.0"),
      basicToken.address,
      BigNumber("10.0")
    );
  });
  describe("burn", async function () {
    it("shoud not burn", async function () {
      await basicToken.transfer(minter, BigNumber("100.0"));
      let mintTokenFeeAmount = await artworkNFT.mintTokenFeeAmount();
      let tokenId = await artworkNFT.nextTokenId();
      await basicToken.approve(artworkNFT.address, mintTokenFeeAmount, {
        from: minter,
      });
      await artworkNFT.mintWithToken(minter, TEST_TOKEN_URI, {
        from: minter,
      });
      expect(await artworkNFT.ownerOf(tokenId)).to.eq(minter);
      await expect(
        artworkNFT.burn(tokenId, {
          from: bob,
        })
      ).to.be.revertedWith("caller is not owner nor approved");
    });

    it("should burn", async function () {
      await basicToken.transfer(minter, BigNumber("100.0"));
      let mintTokenFeeAmount = await artworkNFT.mintTokenFeeAmount();
      let tokenId = await artworkNFT.nextTokenId();
      await basicToken.approve(artworkNFT.address, mintTokenFeeAmount, {
        from: minter,
      });
      await artworkNFT.mintWithToken(minter, TEST_TOKEN_URI, {
        from: minter,
      });
      expect(await artworkNFT.ownerOf(tokenId)).to.eq(minter);
      await artworkNFT.burn(tokenId, {
        from: minter,
      });
      await expect(artworkNFT.ownerOf(tokenId)).to.be.revertedWith(
        "owner query for nonexistent token"
      );
    });
  });

  describe("mint with token", async function () {
    it("mint with enoungh amount", async function () {
      await basicToken.transfer(minter, BigNumber("100.0"));
      let mintTokenFeeAmount = new BigNumber(
        await artworkNFT.mintTokenFeeAmount()
      );
      let prevDevBalance = new BigNumber(await basicToken.balanceOf(dev));
      let prevMinterBalance = new BigNumber(await basicToken.balanceOf(minter));
      let tokenId = await artworkNFT.nextTokenId();
      await basicToken.approve(artworkNFT.address, mintTokenFeeAmount, {
        from: minter,
      });
      await artworkNFT.mintWithToken(minter, TEST_TOKEN_URI, {
        from: minter,
      });
      expect(await artworkNFT.ownerOf(tokenId)).to.eq(minter);
      expect((await basicToken.balanceOf(minter)).toString()).to.eq(
        prevMinterBalance.minus(mintTokenFeeAmount).toString()
      );
      expect((await basicToken.balanceOf(dev)).toString()).to.eq(
        prevDevBalance.plus(mintTokenFeeAmount).toString()
      );
    });

    it("mint with not enough amount", async function () {
      await basicToken.transfer(bob, BigNumber("1.0"));
      expect((await basicToken.balanceOf(bob)).toString()).to.eq(
        BigNumber("1.0").toString()
      );
      let mintTokenFeeAmount = await artworkNFT.mintTokenFeeAmount();
      await basicToken.approve(artworkNFT.address, mintTokenFeeAmount, {
        from: bob,
      });
      await expect(
        artworkNFT.mintWithToken(bob, TEST_TOKEN_URI, {
          from: bob,
        })
      ).to.be.revertedWith("token amount is too low");
    });
  });

  describe("mint", async function () {
    it("mint exact amount", async function () {
      const prevDevBalance = new BigNumber(await web3.eth.getBalance(dev));
      const prevMinterBalance = new BigNumber(
        await web3.eth.getBalance(minter)
      );
      const mintFeeAmount = new BigNumber(await artworkNFT.mintFeeAmount());
      const tokenId = await artworkNFT.nextTokenId();
      await artworkNFT.mint(minter, TEST_TOKEN_URI, {
        from: minter,
        value: mintFeeAmount,
      });
      expect(await artworkNFT.ownerOf(tokenId)).to.eq(minter);
      const devBalance = new BigNumber(await web3.eth.getBalance(dev));
      expect(devBalance.toString()).to.eq(
        prevDevBalance.plus(mintFeeAmount).toString()
      );
      const minterBalance = new BigNumber(await web3.eth.getBalance(minter));
      expect(minterBalance.toNumber()).to.lte(
        prevMinterBalance.minus(mintFeeAmount).toNumber()
      );
    });

    it("mint over amount", async function () {
      const prevDevBalance = new BigNumber(await web3.eth.getBalance(dev));
      const prevMinterBalance = new BigNumber(
        await web3.eth.getBalance(minter)
      );
      const mintFeeAmount = new BigNumber(await artworkNFT.mintFeeAmount());
      const tokenId = await artworkNFT.nextTokenId();
      await artworkNFT.mint(minter, TEST_TOKEN_URI, {
        from: minter,
        value: mintFeeAmount.plus(3000),
      });
      expect(await artworkNFT.ownerOf(tokenId)).to.eq(minter);
      const devBalance = new BigNumber(await web3.eth.getBalance(dev));
      expect(devBalance.toString()).to.eq(
        prevDevBalance.plus(mintFeeAmount).toString()
      );
      const minterBalance = new BigNumber(await web3.eth.getBalance(minter));
      expect(minterBalance.toNumber()).to.lte(
        prevMinterBalance.minus(mintFeeAmount).toNumber()
      );
    });

    it("mint under amount", async function () {
      const mintFeeAmount = new BigNumber(await artworkNFT.mintFeeAmount());
      await expect(
        artworkNFT.mint(minter, TEST_TOKEN_URI, {
          from: minter,
          value: mintFeeAmount.minus(1),
        })
      ).to.be.revertedWith("msg value too low");
    });
  });
});
