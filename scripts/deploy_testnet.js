const { web3 } = require("hardhat");
const { default: BigNumber } = require("bignumber.js");
const ArtworkNFT = artifacts.require("ArtworkNFT");
const BidNFT = artifacts.require("BidNFT");
const AskHelper = artifacts.require("AskHelper");
const TradeHelper = artifacts.require("TradeHelper");
const BasicToken = artifacts.require("BasicToken");

async function main() {
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];
  const feeAccount = accounts[1];

  console.log("Deploying contracts with the account:", deployer);
  let balance = new BigNumber(await web3.eth.getBalance(deployer));
  console.log(
    "Account balance:",
    balance.div(1E18).toString(),
    'BNB'
  );

  // const busdToken = await BasicToken.new(
  //   "BUSD Token",
  //   "BUSD",
  //   new BigNumber("1000000000000000000000000.0"),
  //   {
  //     from: deployer,
  //   }
  // );
  // console.log("BUSD address:", busdToken.address);

  // const usdtToken = await BasicToken.new(
  //   "USDT Token",
  //   "USDT",
  //   new BigNumber("1000000000000000000000000.0"),
  //   {
  //     from: deployer,
  //   }
  // );
  // console.log("USDT address:", usdtToken.address);

  // const artworkNFT = await ArtworkNFT.new(
  //   "Artwork NFT",
  //   "ART",
  //   feeAccount,
  //   web3.utils.toWei("0.0015", 'ether'),
  //   busdToken.address,
  //   web3.utils.toWei("1.0", 'ether').toString(),
  //   {
  //     from: deployer,
  //   }
  // );
  // console.log("ArtworkNFT address:", artworkNFT.address);

  const askHelper = await AskHelper.new({from: deployer});
  console.log("AskHelper address:", askHelper.address);

  const tradeHelper = await TradeHelper.new({from: deployer});
  console.log("TradeHelper address:", tradeHelper.address);

  await BidNFT.link(askHelper);
  await BidNFT.link(tradeHelper);
  

  const bidNFT = await BidNFT.new(
    //artworkNFT.address,
    '0x36bb285C4135E6e5b5B5CbA9416FB2E70C6A5a2f',
    //[busdToken.address, usdtToken.address],
    ['0x88F7A5c15B7B7C69F5aB5D29A27D117f917BA1cf', '0xec7F36AB33682Dae21d2cC843e19409028b7f870'],
    feeAccount,
    new BigNumber("2.0"),
    new BigNumber("3.0"),
    {
      from: deployer,
    }
  );
  console.log("BidNFT address:", bidNFT.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
