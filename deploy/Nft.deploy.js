module.exports = async ({deployments: { deploy }, ethers: { getNamedSigners, getContract }}) => {
  const { deployer } = await getNamedSigners();

  await deploy("Nft", {
    from: deployer.address,
    contract: "Nft",
    args: ["ipfs://asdf.com/project"],
    log: true,
  });

  const nft = await getContract("Nft");
  return nft;
};

module.exports.tags = ["Nft"];