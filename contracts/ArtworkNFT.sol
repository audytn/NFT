pragma solidity =0.6.6;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./libraries/TransferHelper.sol";

contract ArtworkNFT is ERC721Pausable, AccessControl, Ownable {
    using SafeERC20 for IERC20;

    bytes32 public constant UPDATE_TOKEN_URI_ROLE =
        keccak256("UPDATE_TOKEN_URI_ROLE");
    bytes32 public constant PAUSED_ROLE = keccak256("PAUSED_ROLE");
    uint256 public nextTokenId = 1;
    address public mintFeeAddr;

    uint256 public mintFeeAmount;

    address public mintTokenAddr;
    uint256 public mintTokenFeeAmount;

    mapping(uint256 => address) private _minter;

    event Burn(address indexed sender, uint256 tokenId);
    event MintFeeAddressTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event SetMintFeeAmount(
        address indexed seller,
        uint256 oldMintFeeAmount,
        uint256 newMintFeeAmount
    );

    event SetMintTokenFeeAmount(
        address indexed seller,
        uint256 oldMintTokenFeeAmount,
        uint256 newMintTokenFeeAmount
    );

    event SetMinTokenAddress(
        address indexed seller,
        address oldMinTokenAddress,
        address newMinTokenAddress
    );

    constructor(
        string memory name,
        string memory symbol,
        address _mintFeeAddr,
        uint256 _mintFeeAmount,
        address _mintTokenAddr,
        uint256 _mintTokenFeeAmount
    ) public ERC721(name, symbol) {
        require(_mintTokenAddr != address(0));
        require(_mintFeeAddr != address(0));

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(UPDATE_TOKEN_URI_ROLE, _msgSender());
        _setupRole(PAUSED_ROLE, _msgSender());
        mintFeeAddr = _mintFeeAddr;
        mintFeeAmount = _mintFeeAmount;
        mintTokenAddr = _mintTokenAddr;
        mintTokenFeeAmount = _mintTokenFeeAmount;

        emit MintFeeAddressTransferred(address(0), mintFeeAddr);
        emit SetMintFeeAmount(_msgSender(), 0, mintFeeAmount);

        emit SetMinTokenAddress(_msgSender(), address(0), mintTokenAddr);
        emit SetMintTokenFeeAmount(_msgSender(), 0, mintTokenFeeAmount);
    }

    receive() external payable {}

    function mint(address to, string memory _tokenURI)
        public
        payable
        returns (uint256 tokenId)
    {
        require(msg.value >= mintFeeAmount, "msg value too low");
        TransferHelper.safeTransferETH(mintFeeAddr, mintFeeAmount);
        tokenId = nextTokenId;
        _mint(to, tokenId);
        _minter[tokenId] = to;
        nextTokenId++;
        _setTokenURI(tokenId, _tokenURI);
        if (msg.value > mintFeeAmount) {
            TransferHelper.safeTransferETH(
                msg.sender,
                msg.value - mintFeeAmount
            );
        }

    }

    function mintWithToken(address to, string memory _tokenURI)
        public
        returns (uint256 tokenId)
    {
        require(
            IERC20(mintTokenAddr).balanceOf(_msgSender()) >= mintTokenFeeAmount,
            "token amount is too low"
        );
        IERC20(mintTokenAddr).safeTransferFrom(
            _msgSender(),
            mintFeeAddr,
            mintTokenFeeAmount
        );
        tokenId = nextTokenId;
        _mint(to, tokenId);
        _minter[tokenId] = to;
        nextTokenId++;
        _setTokenURI(tokenId, _tokenURI);
    }

    function burn(uint256 tokenId) external {
        require(
            _isApprovedOrOwner(_msgSender(), tokenId),
            "caller is not owner nor approved"
        );
        _burn(tokenId);
        emit Burn(_msgSender(), tokenId);
    }

    function setBaseURI(string memory baseURI) public {
        require(
            hasRole(UPDATE_TOKEN_URI_ROLE, _msgSender()),
            "Must have update token uri role"
        );
        _setBaseURI(baseURI);
    }

    function setTokenURI(uint256 tokenId, string memory tokenURI) public {
        require(
            hasRole(UPDATE_TOKEN_URI_ROLE, _msgSender()),
            "Must have update token uri role"
        );
        _setTokenURI(tokenId, tokenURI);
    }

    function pause() external whenNotPaused {
        require(hasRole(PAUSED_ROLE, _msgSender()), "Must have pause role");
        _pause();
    }

    function unpause() external whenPaused {
        require(hasRole(PAUSED_ROLE, _msgSender()), "Must have pause role");
        _unpause();
    }

    function transferMintFeeAddress(address _mintFeeAddr) external {
        require(_msgSender() == mintFeeAddr, "FORBIDDEN");
        require(_mintFeeAddr != address(0));
        mintFeeAddr = _mintFeeAddr;
        emit MintFeeAddressTransferred(_msgSender(), mintFeeAddr);
    }

    function setMintFeeAmount(uint256 _mintFeeAmount) external onlyOwner {
        require(mintFeeAmount != _mintFeeAmount, "No need to update");
        emit SetMintFeeAmount(_msgSender(), mintFeeAmount, _mintFeeAmount);
        mintFeeAmount = _mintFeeAmount;
    }

    function setMintTokenFeeAmount(uint256 _mintTokenFeeAmount)
        external
        onlyOwner
    {
        require(mintTokenFeeAmount != _mintTokenFeeAmount, "No need to update");
        emit SetMintTokenFeeAmount(
            _msgSender(),
            mintTokenFeeAmount,
            _mintTokenFeeAmount
        );
        mintTokenFeeAmount = _mintTokenFeeAmount;
    }

    function setMintTokenAddress(address _mintTokenAddr) external onlyOwner {
        require(_mintTokenAddr != address(0));
        require(mintTokenAddr != _mintTokenAddr, "No need to update");
        emit SetMinTokenAddress(_msgSender(), mintTokenAddr, _mintTokenAddr);
        mintTokenAddr = _mintTokenAddr;
    }

    function minterOf(uint256 _tokenId) external view returns (address) {
        return _minter[_tokenId];
    }
}
