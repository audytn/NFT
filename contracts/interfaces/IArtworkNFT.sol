pragma solidity =0.6.6;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IArtworkNFT is IERC721 {
    function minterOf(uint256 _tokenId) external view returns (address);
}