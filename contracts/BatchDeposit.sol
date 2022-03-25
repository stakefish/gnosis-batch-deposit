//                                                                           ,,---.
//                                                                         .-^^,_  `.
//                                                                    ;`, / 3 ( o\   }
//         __             __                     ___              __  \  ;   \`, /  ,'
//        /\ \__         /\ \                  /'___\ __         /\ \ ;_/^`.__.-"  ,'
//    ____\ \ ,_\    __  \ \ \/'\      __     /\ \__//\_\    ____\ \ \___     `---'
//   /',__\\ \ \/  /'__`\ \ \ , <    /'__`\   \ \ ,__\/\ \  /',__\\ \  _ `\
//  /\__, `\\ \ \_/\ \L\.\_\ \ \\`\ /\  __/  __\ \ \_/\ \ \/\__, `\\ \ \ \ \
//  \/\____/ \ \__\ \__/.\_\\ \_\ \_\ \____\/\_\\ \_\  \ \_\/\____/ \ \_\ \_\
//   \/___/   \/__/\/__/\/_/ \/_/\/_/\/____/\/_/ \/_/   \/_/\/___/   \/_/\/_/
//
// stakefish Eth2 Batch Deposit contract
//
// ### WARNING ###
// DO NOT USE THIS CONTRACT DIRECTLY. THIS CONTRACT IS ONLY TO BE USED 
// BY STAKING VIA stakefish's WEBSITE LOCATED AT: https://stake.fish
//
// This contract allows deposit of multiple validators in one transaction
// and also collects the validator service fee for stakefish
//
// SPDX-License-Identifier: Apache-2.0

pragma solidity 0.8.11;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IERC677Receiver.sol";
import "./utils/Claimable.sol";
import "./SBCToken.sol";
import "hardhat/console.sol";

contract BatchDeposit is IERC677Receiver, Pausable, Ownable, ReentrancyGuard, Claimable {
    uint256 public fee;
    uint256 public totalValidator;

    address public immutable mGnoWrapper;
    address public immutable gnoToken;

    uint256 constant PUBKEY_LENGTH = 48;
    uint256 constant SIGNATURE_LENGTH = 96;
    uint256 constant CREDENTIALS_LENGTH = 32;
    uint256 constant MAX_VALIDATORS = 100;
    uint256 constant DEPOSIT_AMOUNT = 32 ether;

    event FeeChanged(uint256 previousFee, uint256 newFee);
    event Withdrawn(address indexed payee, uint256 weiAmount);
    event FeeCollected(address indexed payee, uint256 weiAmount);

    constructor(address _gnoToken, address _mGnoWrapper, uint256 _fee) public {
        require(_fee % 1 gwei == 0, "Fee must be a multiple of GWEI");

        gnoToken = _gnoToken;
        mGnoWrapper = _mGnoWrapper;
        fee = _fee;
    }

    function onTokenTransfer(
        address from,
        uint256 value,
        bytes calldata data
    ) external override nonReentrant whenNotPaused returns (bool) {
        address token = _msgSender();
        require(token == gnoToken, "token is not GNO");

        // withdrawal credential (32)
        // privat key (48) + signature (96) + deposit root (32)
        require(data.length % 176 == 32, "Invalid data length");
        uint256 count = data.length / 176;
        require(value == (1 ether + fee) * count, "Value is not aligned with validator count");

        totalValidator += count;
        emit FeeCollected(from, fee * count);

        SBCToken(gnoToken).transferAndCall(mGnoWrapper, 1 ether * count, data);

        return true;
    }

    /**
     * @dev Allows to transfer any locked token from this contract.
     * Only admin can call this method.
     * @param token address of the token, if it is not provided (0x00..00), native coins will be transferred.
     * @param to address that will receive the locked tokens from this contract.
     */
    function claimTokens(address token, address to) external onlyOwner {
        _claimValues(token, to);
    }

    /**
     * @dev Change the validator fee (`newOwner`).
     * Can only be called by the current owner.
     */
    function changeFee(uint256 newFee) public onlyOwner {
        require(newFee != fee, "Fee must be different from current one");
        require(newFee % 1 gwei == 0, "Fee must be a multiple of GWEI");

        emit FeeChanged(fee, newFee);
        fee = newFee;
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * Disable renunce ownership
     */
    function renounceOwnership() public override onlyOwner {
        revert("Ownable: renounceOwnership is disabled");
    }
}
