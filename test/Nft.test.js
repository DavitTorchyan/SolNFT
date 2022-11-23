const { expect } = require("chai");
const { ethers: { getContract, getNamedSigners }, deployments: { fixture }, timeAndMine, ethers } = require("hardhat");
const { BigNumber } = require("ethers");


describe("Nft", function () {
    let nft, deployer, user, Nft;
    beforeEach("", async function () {
        ({ deployer, user } = await getNamedSigners());
        await fixture("Nft");
        nft = await getContract("Nft");
        Nft = await hre.ethers.getContractFactory("Nft");
        await nft.mint(deployer.address, 1);
    })

    describe("Deployment", function () {
        it("Should deploy with correct args.", async function () {
            expect(await nft.name()).to.eq("SolNft");
            expect(await nft.symbol()).to.eq("SNFT");
        });

    });

    describe("Minting", function () {
        it("Should mint correctly.", async () => {
            await nft.connect(deployer).mint(user.address, 2);
            expect(await nft.ownerOf(2)).to.eq(user.address);
            expect(await nft.nftData(2)).to.eql([BigNumber.from(0), BigNumber.from(0)]);
        })

        it("Should revert with message 'Ownable: caller is not the owner'.", async () => {
            await expect(nft.connect(user).mint(user.address, 3)).to.be.revertedWith("Ownable: caller is not the owner");
        })

        it("Should check each assets baseUri.", async () => {
            await nft.connect(deployer).mint(user.address, 2);
            await nft.connect(deployer).mint(user.address, 3);
            expect(await nft.tokenURI(2)).to.eq("ipfs://asdf.com/project/2");
            expect(await nft.tokenURI(3)).to.eq("ipfs://asdf.com/project/3");
        })
    })

    describe("Locking", function () {
        it("Should lock correctly.", async () => {
            await nft.connect(deployer).mint(user.address, 2);
            let day = 2;
            await nft.connect(user).lock(2, day);
            expect(await nft.ownerOf(2)).to.eq(nft.address);
            let blockNumber = await ethers.provider.getBlockNumber();
            let blocksPerDay = await nft.BLOCKS_PER_DAY();
            let endBlock = blockNumber + day * blocksPerDay;
            expect(await nft.userInfo(user.address, 2)).to.eql([BigNumber.from(endBlock), BigNumber.from(day)]);
        })

        it("Should revert with a message 'Already locked!'.", async () => {
            await nft.connect(deployer).mint(user.address, 2);
            await nft.connect(user).lock(2, 2);
            await expect(nft.connect(user).lock(2, 2)).to.be.revertedWith("Already locked!");
        })

        it("Should revert with a message 'Have to lock for some time!'.", async () => {
            await nft.connect(deployer).mint(user.address, 2);
            await expect(nft.connect(user).lock(2, 0)).to.be.revertedWith("Have to lock for some time!");
        })
    })

    describe("Unlocking", function () {
        it("Should unlock correctly.", async () => {
            await nft.connect(deployer).mint(user.address, 2);
            let blockNumber = await ethers.provider.getBlockNumber();
            let day = 2;
            await nft.connect(user).lock(2, day);
            let blocksPerDay = await nft.BLOCKS_PER_DAY();
            let blocks = day * blocksPerDay;
            await timeAndMine.mine(blocks);
            let lockedDays = (await nft.userInfo(user.address, 2)).lockedDays;
            let xpPerDay = await nft.XP_PER_DAY();
            let xp = lockedDays * xpPerDay;
            await nft.connect(user).unlock(2);            
            expect((await nft.nftData(2)).experience).to.eq(xp);
            expect((await nft.userInfo(user.address, 2)).endBlock).to.eq(0);
            expect((await nft.userInfo(user.address, 2)).lockedDays).to.eq(0);
            expect(await nft.ownerOf(2)).to.eq(user.address);
        })

        it("Should revert with a message 'Not locked!'.", async () => {
            await nft.connect(deployer).mint(user.address, 2);
            await expect(nft.connect(user).unlock(2)).to.be.revertedWith("Not locked!");
        })

        it("Should revert with a message 'Not the time to unlock yet!'.", async () => {
            await nft.connect(deployer).mint(user.address, 2);
            await nft.connect(user).lock(2, 2);
            await timeAndMine.mine(5)
            await expect(nft.connect(user).unlock(2)).to.be.revertedWith("Not the time to unlock yet!");
        })
    })

    describe("Killing", function () {
        it("Should kill the asset correctly.", async () => {
            await nft.connect(deployer).mint(user.address, 2);
            await nft.connect(deployer).mint(user.address, 3);
            let blockNumber = await ethers.provider.getBlockNumber();
            let day = 2;
            await nft.connect(user).lock(2, day);
            let blocksPerDay = await nft.BLOCKS_PER_DAY();
            let blocks = day * blocksPerDay;
            await timeAndMine.mine(blocks);
            let lockedDays = (await nft.userInfo(user.address, 2)).lockedDays;
            let xpPerDay = await nft.XP_PER_DAY();
            let xp = lockedDays * xpPerDay;
            await nft.connect(user).unlock(2);
            let newXp = (await nft.nftData(2)).experience * 80 / 100;
            await nft.connect(user).kill(2, 3);
            expect((await nft.nftData(3)).experience).to.eq(newXp);
            expect(await nft.nftData(2)).to.eql([BigNumber.from(0), BigNumber.from(0)]);
        })

        it("Should revert with a message 'Not the owner!'.", async () => {
            await nft.connect(deployer).mint(user.address, 2);
            await expect(nft.connect(deployer).kill(2, 3)).to.be.revertedWith("Not the owner!");
        })

        it("Should revert with a message 'Receiver token does not exist!'.", async () => {
            await nft.connect(deployer).mint(user.address, 2);
            let owner = await nft.ownerOf(2);
            await expect(nft.connect(user).kill(2, 3)).to.be.revertedWith("Receiver token does not exist!");
        })
    }) 

    describe("Ranking Up", function () {
        it("Should rank up correctly.", async () => {
            await nft.connect(deployer).mint(user.address, 2);
            let blockNumber = await ethers.provider.getBlockNumber();
            let day = 10;
            await nft.connect(user).lock(2, day);
            let blocksPerDay = await nft.BLOCKS_PER_DAY();
            let blocks = day * blocksPerDay;
            await timeAndMine.mine(blocks);
            let lockedDays = (await nft.userInfo(user.address, 2)).lockedDays;
            let xpPerDay = await nft.XP_PER_DAY();
            let xp = lockedDays * xpPerDay;
            let xpForRankUp = await nft.XP_FOR_RANKUP();
            let oldRank = (await nft.nftData(2)).rank;
            await nft.connect(user).unlock(2);
            await nft.connect(user).rankUp(2);
            expect((await nft.nftData(2)).rank).to.eq((xp - oldRank * xpForRankUp) / xpForRankUp); // rank is 1 now
        })
    })


});
