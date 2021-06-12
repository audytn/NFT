pragma solidity =0.6.6;

pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/Math.sol";
import "./EnumerableMap.sol";
import "./EnumerableSet.sol";

library AskHelper {
    using EnumerableMap for EnumerableMap.UintToUintMap;
    using EnumerableSet for EnumerableSet.UintSet;

    struct AskEntry {
        uint256 tokenId;
        uint256 price;
        address quoteTokenAddr;
    }

    function getAsks(
        EnumerableMap.UintToUintMap storage _asksMap,
        mapping(uint256 => address) storage _asksQuoteTokens
    ) public view returns (AskEntry[] memory) {
        AskEntry[] memory asks = new AskEntry[](_asksMap.length());
        for (uint256 i = 0; i < _asksMap.length(); ++i) {
            (uint256 tokenId, uint256 price) = _asksMap.at(i);
            asks[i] = AskEntry({
                tokenId: tokenId,
                price: price,
                quoteTokenAddr: _asksQuoteTokens[tokenId]
            });
        }
        return asks;
    }

    function getAsksDesc(
        EnumerableMap.UintToUintMap storage _asksMap,
        mapping(uint256 => address) storage _asksQuoteTokens
    ) public view returns (AskEntry[] memory) {
        AskEntry[] memory asks = new AskEntry[](_asksMap.length());
        if (_asksMap.length() > 0) {
            for (uint256 i = _asksMap.length() - 1; i > 0; --i) {
                (uint256 tokenId, uint256 price) = _asksMap.at(i);
                asks[_asksMap.length() - 1 - i] = AskEntry({
                    tokenId: tokenId,
                    price: price,
                    quoteTokenAddr: _asksQuoteTokens[tokenId]
                });
            }
            (uint256 tokenId, uint256 price) = _asksMap.at(0);
            asks[_asksMap.length() - 1] = AskEntry({
                tokenId: tokenId,
                price: price,
                quoteTokenAddr: _asksQuoteTokens[tokenId]
            });
        }
        return asks;
    }

    function getAsksByPage(
        EnumerableMap.UintToUintMap storage _asksMap,
        mapping(uint256 => address) storage _asksQuoteTokens,
        uint256 page,
        uint256 size
    ) public view returns (AskEntry[] memory) {
        if (_asksMap.length() > 0) {
            uint256 from = page == 0 ? 0 : (page - 1) * size;
            uint256 to =
                Math.min((page == 0 ? 1 : page) * size, _asksMap.length());
            AskEntry[] memory asks = new AskEntry[]((to - from));
            for (uint256 i = 0; from < to; ++i) {
                (uint256 tokenId, uint256 price) = _asksMap.at(from);
                asks[i] = AskEntry({
                    tokenId: tokenId,
                    price: price,
                    quoteTokenAddr: _asksQuoteTokens[tokenId]
                });
                ++from;
            }
            return asks;
        } else {
            return new AskEntry[](0);
        }
    }

    function getAsksByPageDesc(
        EnumerableMap.UintToUintMap storage _asksMap,
        mapping(uint256 => address) storage _asksQuoteTokens,
        uint256 page,
        uint256 size
    ) public view returns (AskEntry[] memory) {
        if (_asksMap.length() > 0) {
            uint256 from =
                _asksMap.length() - 1 - (page == 0 ? 0 : (page - 1) * size);
            uint256 to =
                _asksMap.length() -
                    1 -
                    Math.min(
                        (page == 0 ? 1 : page) * size - 1,
                        _asksMap.length() - 1
                    );
            uint256 resultSize = from - to + 1;
            AskEntry[] memory asks = new AskEntry[](resultSize);
            if (to == 0) {
                for (uint256 i = 0; from > to; ++i) {
                    (uint256 tokenId, uint256 price) = _asksMap.at(from);
                    asks[i] = AskEntry({
                        tokenId: tokenId,
                        price: price,
                        quoteTokenAddr: _asksQuoteTokens[tokenId]
                    });
                    --from;
                }
                (uint256 tokenId, uint256 price) = _asksMap.at(0);
                asks[resultSize - 1] = AskEntry({
                    tokenId: tokenId,
                    price: price,
                    quoteTokenAddr: _asksQuoteTokens[tokenId]
                });
            } else {
                for (uint256 i = 0; from >= to; ++i) {
                    (uint256 tokenId, uint256 price) = _asksMap.at(from);
                    asks[i] = AskEntry({
                        tokenId: tokenId,
                        price: price,
                        quoteTokenAddr: _asksQuoteTokens[tokenId]
                    });
                    --from;
                }
            }
            return asks;
        }
        return new AskEntry[](0);
    }

    function getAsksByUser(
        EnumerableMap.UintToUintMap storage _asksMap,
        mapping(uint256 => address) storage _asksQuoteTokens,
        mapping(address => EnumerableSet.UintSet) storage _userSellingTokens,
        address user
    ) public view returns (AskEntry[] memory) {
        AskEntry[] memory asks =
            new AskEntry[](_userSellingTokens[user].length());
        for (uint256 i = 0; i < _userSellingTokens[user].length(); ++i) {
            uint256 tokenId = _userSellingTokens[user].at(i);
            uint256 price = _asksMap.get(tokenId);
            address quoteTokenAddr = _asksQuoteTokens[tokenId];
            asks[i] = AskEntry({
                tokenId: tokenId,
                price: price,
                quoteTokenAddr: quoteTokenAddr
            });
        }
        return asks;
    }

    function getAsksByUserDesc(
        EnumerableMap.UintToUintMap storage _asksMap,
        mapping(uint256 => address) storage _asksQuoteTokens,
        mapping(address => EnumerableSet.UintSet) storage _userSellingTokens,
        address user
    ) public view returns (AskEntry[] memory) {
        AskEntry[] memory asks =
            new AskEntry[](_userSellingTokens[user].length());
        if (_userSellingTokens[user].length() > 0) {
            for (
                uint256 i = _userSellingTokens[user].length() - 1;
                i > 0;
                --i
            ) {
                uint256 tokenId = _userSellingTokens[user].at(i);
                uint256 price = _asksMap.get(tokenId);
                asks[_userSellingTokens[user].length() - 1 - i] = AskEntry({
                    tokenId: tokenId,
                    price: price,
                    quoteTokenAddr: _asksQuoteTokens[tokenId]
                });
            }
            uint256 tokenId = _userSellingTokens[user].at(0);
            uint256 price = _asksMap.get(tokenId);
            asks[_userSellingTokens[user].length() - 1] = AskEntry({
                tokenId: tokenId,
                price: price,
                quoteTokenAddr: _asksQuoteTokens[tokenId]
            });
        }
        return asks;        
    }
}
