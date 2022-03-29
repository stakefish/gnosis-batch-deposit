// SPDX-License-Identifier: CC0-1.0

pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Claimable
 * @dev Implementation of the claiming utils that can be useful for withdrawing tokens and ether.
 */
contract Claimable {
    /**
     * @dev Withdraws the erc20 tokens or native coins from this contract.
     * @param _token address of the claimed token or address(0) for native coins.
     * @param _to address of the tokens/coins receiver.
     */
    function _claimValues(address _token, address _to) internal returns (uint256) {
        if (_token == address(0)) {
            return _claimNativeCoins(_to);
        } else {
            return _claimERC20Tokens(_token, _to);
        }
    }

    /**
     * @dev Internal function for withdrawing all native coins from the contract.
     * @param _to address of the coins receiver.
     */
    function _claimNativeCoins(address _to) internal returns (uint256) {
        uint256 balance = address(this).balance;
        payable(_to).transfer(balance);
        return balance;
    }

    /**
     * @dev Internal function for withdrawing all tokens of some particular ERC20 contract from this contract.
     * @param _token address of the claimed ERC20 token.
     * @param _to address of the tokens receiver.
     */
    function _claimERC20Tokens(address _token, address _to) internal returns (uint256) {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(_to, balance);
        return balance;
    }
}
