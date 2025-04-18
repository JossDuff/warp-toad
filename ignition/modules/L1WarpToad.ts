// @NOTICE will be changed to deploy the full WarpToad 


import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
//import { proxy, PoseidonT3 } from 'poseidon-solidity'

export default buildModule("L1WarpToad", (m) => {
  // TODO use nix method so we reused the same contract
  // https://github.com/chancehudson/poseidon-solidity?tab=readme-ov-file#deploy
  const PoseidonT3Lib = m.library("PoseidonT3");
  const LazyIMTLib = m.library("LazyIMT",{
    libraries: {
      PoseidonT3: PoseidonT3Lib,
    },

  });
  const maxTreeDepth = m.getParameter("maxTreeDepth");
  const gigaBridge = m.getParameter("gigaBridge");
  const nativeToken = m.getParameter("nativeToken");
  const name = m.getParameter("name");
  const symbol = m.getParameter("symbol");



  const L1WarpToad = m.contract("L1WarpToad", [maxTreeDepth,gigaBridge,nativeToken,name,symbol], {
    value: 0n,
    libraries: {
      LazyIMT: LazyIMTLib,
      PoseidonT3: PoseidonT3Lib
    },
  });

  return { L1WarpToad };
});
