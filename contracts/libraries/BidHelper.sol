pragma solidity =0.6.6;
//TODOS 
//1.add time function
//2.add time struct
import "./EnumerableMap.sol";
import "hardhat/console.sol";
library BidHelper {
    using EnumerableMap for EnumerableMap.UintToUintMap;

    

    struct BidEntry {
        address bidder;
        uint256 price;
        address quoteTokenAddr;
    }

    struct UserBidEntry {
        uint256 tokenId;
        uint256 price;
        address quoteTokenAddr;
    }

    function getUserBids(
        mapping(address => EnumerableMap.UintToUintMap) storage _userBids,
        mapping(uint256 => address) storage _asksQuoteTokens,
        address user
    ) internal view returns (UserBidEntry[] memory) {
        uint256 len = _userBids[user].length();
        UserBidEntry[] memory bids = new UserBidEntry[](len);
        for (uint256 i = 0; i < len; i++) {
            (uint256 tokenId, uint256 price) = _userBids[user].at(i);
            bids[i] = UserBidEntry({
                tokenId: tokenId,
                price: price,
                quoteTokenAddr: _asksQuoteTokens[tokenId]
            });
        }
        return bids;
    }

    function getBidByTokenIdAndAddress(
        mapping(uint256 => BidEntry[]) storage _tokenBids,
        uint256 _tokenId,
        address _address
    ) internal view returns (BidEntry memory, uint256) {
        // find the index of the bid
        BidEntry[] memory bidEntries = _tokenBids[_tokenId];
        uint256 len = bidEntries.length;
        uint256 _index;
        BidEntry memory bidEntry;
        for (uint256 i = 0; i < len; i++) {
            if (_address == bidEntries[i].bidder) {
                _index = i;
                bidEntry = BidEntry({
                    bidder: bidEntries[i].bidder,
                    price: bidEntries[i].price,
                    quoteTokenAddr: bidEntries[i].quoteTokenAddr
                });
                break;
            }
        }
        return (bidEntry, _index);
    }

    function getBidByTokenId(
        mapping(uint256 => BidEntry[]) storage _tokenBids,
        uint256 _tokenId
        
    ) internal view returns (BidEntry memory) {
        // find the index of the bid
        BidEntry[] memory bidEntries = _tokenBids[_tokenId];
        BidEntry memory bidEntry;
        
        bidEntry = BidEntry({
            bidder: bidEntries[0].bidder,
            price: bidEntries[0].price,
            quoteTokenAddr: bidEntries[0].quoteTokenAddr
        });
        
        return (bidEntry);
    }
}
