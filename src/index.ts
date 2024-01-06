/* eslint-disable @typescript-eslint/ban-ts-comment */
import { toBuffer } from "ethereumjs-util";
import abi from "ethereumjs-abi";

import contractAbi from "./contractAbi.json";

import Web3 from "web3";
import axios from "axios";
const apiKey = process.env.API_KEY;
const biconomyUrl = "https://api.biconomy.io/api/v2/meta-tx/native";
const apiId = process.env.APP_ID;

const userAddress: string = "";
const userPrivateKey: string = "";

const relayerAddress: string = "";
const relayerAddressPrivateKey = "";

const contractAddress = "0x2d31c561be749d452913722DDf1e0bc095B025b4";
const chainId = 11155111;

const web3 = new Web3(
  "https://eth-sepolia.g.alchemy.com/v2/YQ8xEKDUXKLQqV4u7dAd9QuMKIzFEvbn"
);

class BiconomyClass {
  constructor() {
    this.biconomyFunc();
  }
  public async biconomyFunc() {
    try {
      //If we want to do ourself

      const contract = new web3.eth.Contract(
        contractAbi as any,
        contractAddress
      );

      let nonce = await contract.methods.getNonce(userAddress).call();
      const res = await contract.methods.getQuote().call();
      console.log("Prev:", res);
      let functionSignature = contract.methods
        .setQuote("Second Metatransaction.")
        .encodeABI();

      let messageToSign = abi.soliditySHA3(
        ["uint256", "address", "uint256", "bytes"],
        [nonce, contractAddress, chainId, toBuffer(functionSignature)]
      );

      const { signature } = web3.eth.accounts.sign(
        "0x" + messageToSign.toString("hex"),
        `0x${userPrivateKey}`
      );

      const { r, s, v } = this.getSignatureParameters(signature);
      // console.log("sig :", signature);
      // console.log("r :", r);
      // console.log("s :", s);
      // console.log("v :", v);
      // console.log("functionSignature :", functionSignature);

      web3.eth.accounts.wallet.add(relayerAddressPrivateKey);

      const tx = contract.methods.executeMetaTransaction(
        userAddress,
        functionSignature,
        r,
        s,
        v
      );

      const gas = await tx.estimateGas({ from: relayerAddress, value: 0 });

      const gasPrice = await web3.eth.getGasPrice();

      const data = tx.encodeABI();

      let nonceRelayer = await contract.methods.getNonce(relayerAddress).call();

      const Txdata = {
        from: relayerAddress,
        to: contractAddress,
        value: 0,
        data,
        gas,
        gasPrice,
        nounce: nonceRelayer,
      };

      console.log(Txdata);

      const receipt = await web3.eth.sendTransaction(Txdata);

      console.log("TransactionHasH", receipt.transactionHash);

      const newres = await contract.methods.getQuote().call();
      console.log("Prev:", newres);

      //If we want to use biconomy api

      // const response = await axios({
      //   method: "post",
      //   url: biconomyUrl,
      //   headers: {
      //     "Content-Type": "application/json",
      //     "x-api-key": apiKey,
      //   },
      //   data: {
      //     to: contractAddress,
      //     apiId,
      //     params: [userAddress, functionSignature, r, s, v],
      //     from: userAddress,
      //   },
      // });
    } catch (err: any) {
      console.log(err);
    }
  }

  public getSignatureParameters(signature: any) {
    if (!web3.utils.isHexStrict(signature)) {
      throw new Error(
        'Given value "'.concat(signature, '" is not a valid hex string.')
      );
    }
    var r = signature.slice(0, 66);
    var s = "0x".concat(signature.slice(66, 130));
    let v: any = "0x".concat(signature.slice(130, 132));
    v = web3.utils.hexToNumber(v);
    if (![27, 28].includes(Number(v))) v += 27;
    return {
      r: r,
      s: s,
      v: v,
    };
  }
}

export default new BiconomyClass();
