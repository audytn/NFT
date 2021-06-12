require("@nomiclabs/hardhat-etherscan");
const { default: BigNumber } = require("bignumber.js");
hre.run("verify:verify", {
    address: 0x292813F09A8312c7c88E46A682f7ff7E095f2279,
    constructorArguments: [
    '0x36bb285C4135E6e5b5B5CbA9416FB2E70C6A5a2f',
    ['0x88F7A5c15B7B7C69F5aB5D29A27D117f917BA1cf','0xec7F36AB33682Dae21d2cC843e19409028b7f870'],
    '0xbb0ca2c5e3741cd096bdc797d6405420f654973f',
    new BigNumber("2.0"),
    new BigNumber("3.0")
    ]
  })