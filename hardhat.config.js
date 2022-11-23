require("@nomicfoundation/hardhat-toolbox");
require("@typechain/hardhat");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-ethers");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("@atixlabs/hardhat-time-n-mine");
const { removeConsoleLog } = require("hardhat-preprocessor");

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      },
      {
        version: "0.5.16",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  namedAccounts: {
    deployer: {
      default: 0
    },
    user: {
      default: 1
    }
  },
  networks: {
    hardhat: {}
  },
  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: false
  },
  dependencyCompiler: {
    paths: [
    ],
    // keep: HARDHAT_DEPENDENCY_COMPILER_KEEP
  },

};
