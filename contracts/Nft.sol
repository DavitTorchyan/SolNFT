// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Nft is ERC721, Ownable {
    using Strings for uint256;

    string private baseUri;
    struct NftData {
        uint256 experience;
        uint256 rank;
    }

    struct UserInfo {
        uint256 endBlock;
        uint256 lockedDays;
    }
    
    mapping(uint256 => NftData) public nftData;
    mapping(address => mapping(uint256 => UserInfo)) public userInfo;
    uint256 public constant XP_FOR_RANKUP = 50; //50 xp for each rank up
    // TODO fix for mainnet deployment
    uint256 public constant BLOCKS_PER_DAY = 10; //low number of blocks for easy testing
    uint256 public constant XP_PER_DAY = 5;

    constructor(string memory _baseUri) ERC721("SolNft", "SNFT"){
        baseUri = _baseUri;
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        _mint(to, tokenId);
        nftData[tokenId].experience = 0;
        nftData[tokenId].rank = 0;
    }

    function rankUp(uint256 tokenId) public {
        NftData storage data = nftData[tokenId];
        require(ownerOf(tokenId) == msg.sender, "Not your nft!");
        require((data.rank + 1) * XP_FOR_RANKUP <= data.experience, "Insufficient experience!");
        data.rank += (data.experience - data.rank * XP_FOR_RANKUP) / XP_FOR_RANKUP;
    }

    function lock(uint256 tokenId, uint256 day) external {
        require(userInfo[msg.sender][tokenId].endBlock == 0, "Already locked!");
        require(day != 0, "Have to lock for some time!");
        transferFrom(msg.sender, address(this), tokenId);
        userInfo[msg.sender][tokenId].endBlock = block.number + day * BLOCKS_PER_DAY; 
        userInfo[msg.sender][tokenId].lockedDays = day; // * 86400;
    }

    function unlock(uint256 tokenId) external {
        require(userInfo[msg.sender][tokenId].endBlock != 0, "Not locked!");
        require(userInfo[msg.sender][tokenId].endBlock <= block.number, "Not the time to unlock yet!");
        nftData[tokenId].experience = userInfo[msg.sender][tokenId].lockedDays * XP_PER_DAY;
        userInfo[msg.sender][tokenId].endBlock = 0;
        userInfo[msg.sender][tokenId].lockedDays = 0;
        _transfer(address(this), msg.sender, tokenId);
    }

    function kill(uint256 tokenId, uint256 tokenIdTo) external {
        require(ownerOf(tokenId) == msg.sender, "Not the owner!");
        require(_exists(tokenIdTo) == true, "Receiver token does not exist!");
        nftData[tokenIdTo].experience += nftData[tokenId].experience * 80 / 100;
        nftData[tokenId].experience = 0;
        nftData[tokenId].rank = 0;
    }

    function _baseURI() internal view override returns(string memory) {
        return baseUri;
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireMinted(tokenId);

        string memory baseURI = _baseURI();
        return string(abi.encodePacked(baseURI, "/", tokenId.toString()));
    }

}
