const { default: BigNumber } = require("bignumber.js");
const { expect } = require("chai");
const { web3 } = require("hardhat");

const ArtworkNFT = artifacts.require("ArtworkNFT");
const BidNFT = artifacts.require("BidNFT");
const BasicToken = artifacts.require("BasicToken");
const AskHelper = artifacts.require("AskHelper");
const TradeHelper = artifacts.require("TradeHelper");

describe("BidNFT", function () {
  let deployer, dev, minter, bob, alice, john, marry, robert;
  const TEST_TOKEN_URI = "https://ipfs.io/ipfs/test.json";
  let accounts, artworkNFT, bidNFT;
  let busdToken, usdtToken, daiToken, dopToken;
  let tokenId1 = 0;
  let tokenId2 = 0;
  let tokenId3 = 0;
  before(async function () {
    accounts = await web3.eth.getAccounts();
    deployer = accounts[0];
    dev = accounts[1];
    minter = accounts[2];
    bob = accounts[3];
    alice = accounts[4];
    john = accounts[5];
    marry = accounts[6];
    robert = accounts[7];
    busdToken = await BasicToken.new(
      "BUSD Token",
      "BUSD",
      BigNumber("1000000000000000000000000.0"),
      {
        from: deployer,
      }
    );
    usdtToken = await BasicToken.new(
      "USDT Token",
      "USDT",
      BigNumber("1000000000000000000000000.0"),
      {
        from: deployer,
      }
    );
    daiToken = await BasicToken.new(
      "DAI Token",
      "DAI",
      BigNumber("1000000000000000000000000.0"),
      {
        from: deployer,
      }
    );
    dopToken = await BasicToken.new(
      "Dopple Token",
      "DOP",
      BigNumber("1000000000000000000000000.0"),
      {
        from: deployer,
      }
    );
    artworkNFT = await ArtworkNFT.new(
      "TestToken",
      "TEST",
      dev,
      BigNumber("2.0"),
      dopToken.address,
      BigNumber("10.0"),
      {
        from: deployer,
      }
    );

    const askHelper = await AskHelper.new();
    const tradeHelper = await TradeHelper.new();

    await BidNFT.link(askHelper);
    await BidNFT.link(tradeHelper);

    bidNFT = await BidNFT.new(
      artworkNFT.address,
      [busdToken.address, usdtToken.address, daiToken.address],
      dev,
      BigNumber("2.0"),
      BigNumber("3.0"),
      {
        from: deployer,
      }
    );
    const mintFeeAmount = new BigNumber(await artworkNFT.mintFeeAmount());
    tokenId1 = await artworkNFT.nextTokenId();
    await artworkNFT.mint(minter, TEST_TOKEN_URI, {
      from: minter,
      value: mintFeeAmount,
    });
    tokenId2 = await artworkNFT.nextTokenId();
    await artworkNFT.mint(minter, TEST_TOKEN_URI, {
      from: minter,
      value: mintFeeAmount,
    });
    tokenId3 = await artworkNFT.nextTokenId();
    await artworkNFT.mint(minter, TEST_TOKEN_URI, {
      from: minter,
      value: mintFeeAmount,
    });
    expect(await artworkNFT.ownerOf(tokenId1)).to.eq(minter);
    expect(await artworkNFT.ownerOf(tokenId2)).to.eq(minter);
    expect(await artworkNFT.ownerOf(tokenId3)).to.eq(minter);
  });

  describe("constructor", async function () {
    it("should init properly", async function () {
      const feePercent = new BigNumber(await bidNFT.feePercent());
      const feeToMinterPercent = new BigNumber(
        await bidNFT.feeToMinterPercent()
      );
      expect(await bidNFT.isSupportedQuoteToken(busdToken.address)).to.be.true;
      expect(await bidNFT.isSupportedQuoteToken(usdtToken.address)).to.be.true;
      expect(await bidNFT.isSupportedQuoteToken(daiToken.address)).to.be.true;
      expect(await bidNFT.isSupportedQuoteToken(dopToken.address)).to.be.false;
      expect(await bidNFT.feeAddr()).to.eq(dev);
      expect(feePercent.toString()).to.eq("2");
      expect(feeToMinterPercent.toString()).to.eq("3");
    });
  });
  describe("add supported quote token", async function() {
    it("should add properly", async function() {
      let prevTokens = await bidNFT.getSupportedQuoteTokens();
      await bidNFT.addSupportedQuoteToken(dopToken.address);  
      let tokens = await bidNFT.getSupportedQuoteTokens();
      expect(tokens.length).to.eq(prevTokens.length+1);
      expect(await bidNFT.isSupportedQuoteToken(dopToken.address)).to.be.true;
    });
  });
  describe("remove supported quote token", async function() {
    it("should remove properly", async function() {
      let prevTokens = await bidNFT.getSupportedQuoteTokens();
      await bidNFT.removeSupportedQuoteToken(dopToken.address);  
      let tokens = await bidNFT.getSupportedQuoteTokens();
      expect(tokens.length).to.eq(prevTokens.length-1);
      expect(await bidNFT.isSupportedQuoteToken(dopToken.address)).to.be.false;
    });
  });
  describe("ready to sell token", async function () {
    it("should show in asks listing", async function () {
      await artworkNFT.approve(bidNFT.address, tokenId1, { from: minter });
      await bidNFT.readyToSellTokenTo(
        tokenId1,
        20000000,
        busdToken.address,
        minter,
        {
          from: minter,
        }
      );
      expect((await bidNFT.getAsksLength()).toString()).to.eq("1");
      let asks = await bidNFT.getAsks();
      expect(asks[0].tokenId).to.eq("1");
      expect(asks[0].price).to.eq("20000000");
      expect(asks[0].quoteTokenAddr).to.eq(busdToken.address.toString());
    });
  });
  describe("set current price", async function () {
    it("should change the current price", async function () {
      let newPrice = 40;
      await expect(
        bidNFT.setCurrentPrice(tokenId1, newPrice, busdToken.address)
      ).to.revertedWith("Only Seller can update price");
      await bidNFT.setCurrentPrice(tokenId1, newPrice, busdToken.address, {
        from: minter,
      });
      let asks = await bidNFT.getAsks();
      expect(asks[0].tokenId).to.eq("1");
      expect(asks[0].price).to.eq("40");
      expect(asks[0].quoteTokenAddr).to.eq(busdToken.address.toString());
    });
  });
  describe("cancel sell token", async function () {
    it("should remove from asks list and change owner back to minter", async function () {
      expect(await artworkNFT.ownerOf(tokenId1)).to.eq(
        bidNFT.address.toString()
      );
      expect((await bidNFT.getAsksLength()).toString()).to.eq("1");
      await expect(bidNFT.cancelSellToken(tokenId1)).to.revertedWith(
        "Only Seller can cancel sell token"
      );
      await bidNFT.cancelSellToken(tokenId1, { from: minter });
      expect((await bidNFT.getAsksLength()).toString()).to.eq("0");
      expect(await artworkNFT.ownerOf(tokenId1)).to.eq(minter.toString());
    });
  });
  describe("buy token", async function () {
    it("should be able to buy at asked price", async function () {
      expect((await artworkNFT.balanceOf(alice)).toString()).to.eq("0");
      await busdToken.transfer(alice, BigNumber(20000000));
      let aliceBalance = new BigNumber(await busdToken.balanceOf(alice));
      expect(aliceBalance.toString()).to.eq("20000000");
      let price = new BigNumber("10000000");
      await artworkNFT.approve(bidNFT.address, tokenId1, { from: minter });
      await bidNFT.readyToSellTokenTo(
        tokenId1,
        price,
        busdToken.address,
        minter,
        {
          from: minter,
        }
      );
      let feePercent = new BigNumber(await bidNFT.feePercent());
      await busdToken.approve(bidNFT.address, price, { from: alice });
      await bidNFT.buyToken(tokenId1, { from: alice });
      expect((await artworkNFT.balanceOf(alice)).toString()).to.eq("1");
      expect((await busdToken.balanceOf(alice)).toString()).to.eq(
        aliceBalance.minus(price).toString()
      );
      expect((await busdToken.balanceOf(dev)).toString()).to.eq(
        price.times(feePercent).div(100).toString()
      );
      expect((await busdToken.balanceOf(minter)).toString()).to.eq(
        price.minus(price.times(feePercent).div(100)).toString()
      );
    });
  });
  describe("bid token", async function () {
    it("should transfer bid amount into the contract", async function () {
      await busdToken.transfer(bob, BigNumber(20000000));
      let price = new BigNumber("10000000");
      await artworkNFT.approve(bidNFT.address, tokenId2, { from: minter });
      await bidNFT.readyToSellTokenTo(
        tokenId2,
        price,
        busdToken.address,
        minter,
        {
          from: minter,
        }
      );
      let bidPrice = new BigNumber("500000");
      let contractBalance = new BigNumber(
        await busdToken.balanceOf(bidNFT.address)
      );
      let bobBalance = new BigNumber(await busdToken.balanceOf(bob));
      await busdToken.approve(bidNFT.address, bidPrice, { from: bob });
      await bidNFT.bidToken(tokenId2, bidPrice, { from: bob });
      expect((await busdToken.balanceOf(bob)).toString()).to.eq(
        bobBalance.minus(bidPrice).toString()
      );
      expect((await busdToken.balanceOf(bidNFT.address)).toString()).to.eq(
        contractBalance.plus(bidPrice).toString()
      );
    });
    it("should show in bids list", async function () {
      let bidPrice = new BigNumber("500000");
      let bids = await bidNFT.getBids(tokenId2);
      expect(bids[0].bidder.toString()).to.eq(bob.toString());
      expect(bids[0].price.toString()).to.eq(bidPrice.toString());
      expect(bids[0].quoteTokenAddr.toString()).to.eq(
        busdToken.address.toString()
      );
    });
  });
  describe("update bid price", async function () {
    it("should update bid price", async function () {
      let newBidPrice = new BigNumber("600000");
      await busdToken.approve(bidNFT.address, newBidPrice, { from: bob });
      await bidNFT.updateBidPrice(tokenId2, newBidPrice, { from: bob });
      let bids = await bidNFT.getUserBids(bob);
      expect(bids[0].price.toString()).to.eq(newBidPrice.toString());
    });
  });
  describe("cancel bid token", async function () {
    it("should cancel the bid token and payback bid money", async function () {
      let bids = await bidNFT.getUserBids(bob);
      expect(bids.length).to.eq(1);
      let bidPrice = new BigNumber(bids[0].price);
      let bobBalance = new BigNumber(await busdToken.balanceOf(bob));
      await bidNFT.cancelBidToken(tokenId2, { from: bob });
      bids = await bidNFT.getUserBids(bob);
      expect(bids.length).to.eq(0);
      expect((await busdToken.balanceOf(bob)).toString()).to.eq(
        bobBalance.plus(bidPrice).toString()
      );
    });
  });
  describe("sell token at bid price", async function () {
    let price, marryBidPrice, johnBidPrice;
    let marryBalance, robertBalance, johnBalance, minterBalance, devBalance;
    before(async function () {
      await busdToken.transfer(john, BigNumber(200000000));
      await busdToken.transfer(marry, BigNumber(200000000));

      marryBalance = new BigNumber(await busdToken.balanceOf(marry));
      robertBalance = new BigNumber(await busdToken.balanceOf(robert));
      johnBalance = new BigNumber(await busdToken.balanceOf(john));
      minterBalance = new BigNumber(await busdToken.balanceOf(minter));
      devBalance = new BigNumber(await busdToken.balanceOf(dev));

      price = new BigNumber("10000000");
      await artworkNFT.approve(bidNFT.address, tokenId3, { from: minter });
      await bidNFT.readyToSellTokenTo(
        tokenId3,
        price,
        busdToken.address,
        robert,
        {
          from: minter,
        }
      );
      johnBidPrice = new BigNumber("6000000");
      await busdToken.approve(bidNFT.address, johnBidPrice, { from: john });
      await bidNFT.bidToken(tokenId3, johnBidPrice, { from: john });
      marryBidPrice = new BigNumber("7000000");
      await busdToken.approve(bidNFT.address, marryBidPrice, { from: marry });
      await bidNFT.bidToken(tokenId3, marryBidPrice, { from: marry });
    });
    it("should transfer token to bidder", async function () {
      expect(await artworkNFT.ownerOf(tokenId3)).to.eq(bidNFT.address);
      await bidNFT.sellTokenTo(tokenId3, marry, { from: robert });
      expect(await artworkNFT.ownerOf(tokenId3)).to.eq(marry);
    });
    it("should transfer money and fee properly", async function () {
      let feePercent = new BigNumber(await bidNFT.feePercent());
      let feeToMinterPercent = new BigNumber(await bidNFT.feeToMinterPercent());
      let feeAmount = marryBidPrice.times(feePercent).div(100);
      let feeToMinterAmount = marryBidPrice.times(feeToMinterPercent).div(100);
      expect((await busdToken.balanceOf(marry)).toString()).to.eq(
        marryBalance.minus(marryBidPrice).toString()
      );
      expect((await busdToken.balanceOf(robert)).toString()).to.eq(
        robertBalance
          .plus(marryBidPrice)
          .minus(feeAmount)
          .minus(feeToMinterAmount)
          .toString()
      );
      expect((await busdToken.balanceOf(minter)).toString()).to.eq(
        minterBalance.plus(feeToMinterAmount).toString()
      );
      expect((await busdToken.balanceOf(dev)).toString()).to.eq(
        devBalance.plus(feeAmount).toString()
      );
      await bidNFT.cancelBidToken(tokenId3, { from: john });
      expect((await busdToken.balanceOf(john)).toString()).to.eq(
        johnBalance.toString()
      );
    });
  });
  describe("test fee transfering to minter", async function() {
    it("should transfer fee to minter", async function() { 
      let minterBalance = new BigNumber(await busdToken.balanceOf(minter));
      let price = new BigNumber("30000000");
      await artworkNFT.approve(bidNFT.address, tokenId3, { from: marry });
      await bidNFT.readyToSellTokenTo(
        tokenId3,
        price,
        busdToken.address,
        marry,
        {
          from: marry,
        }
      );
      let feeToMinterPercent = new BigNumber(await bidNFT.feeToMinterPercent());
      let feeToMinterAmount = price.times(feeToMinterPercent).div(100);
      await busdToken.approve(bidNFT.address, price, { from: john });
      await bidNFT.buyToken(tokenId3, { from: john });
      expect(await artworkNFT.ownerOf(tokenId3)).to.eq(john);
      expect((await busdToken.balanceOf(minter)).toString()).to.eq(
        minterBalance.plus(feeToMinterAmount).toString()
      );
    })
  });
});
