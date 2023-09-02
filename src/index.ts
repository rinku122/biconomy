/* eslint-disable @typescript-eslint/ban-ts-comment */
import { toBuffer } from "ethereumjs-util";
import abi from "ethereumjs-abi";
// @ts-ignore: Unreachable code error
import { Biconomy } from "@biconomy/mexa";

import contractAbi from "./contractAbi.json";

import Web3 from "web3";
import axios from "axios";

const userAddress: string = "0xeCCBe210fC8968B8D579Aa0F6aD74C7DEaD783F6";
const privateKey = process.env.KEY;

const contractAddress = "0x3a264e32e057bfc275d149e49a93b5ee1dd01450";
const chainId = 80001;
const apiKey = process.env.API_KEY;
const apiId = process.env.APP_ID;
const biconomyUrl = "https://api.biconomy.io/api/v2/meta-tx/native";

const provider: any = new Web3.providers.HttpProvider(`https://rpc-mumbai.maticvigil.com/v1/${process.env.RPC}`);

const biconomy: any = new Biconomy(provider, {
  walletProvider: provider,
  apiKey,
  debug: false,
  contractAddresses: [contractAddress],
});

const web3 = new Web3(biconomy);

class BiconomyClass {
  constructor() {
    biconomy.onEvent;
    biconomy
      .onEvent(biconomy.READY, async () => {
        console.log("biconomy connected!!");
        this.biconomyFunc();
      })
      .onEvent(biconomy.ERROR, (error: any, message: any) => {
        if (error) {
          console.log("error in connection!!");
        } else {
          console.log("message");
          console.log(message);
        }
      });
  }

  public async biconomyFunc() {
    try {
      const contract = new web3.eth.Contract(
        contractAbi as any,
        contractAddress
      );

      let nonce = await contract.methods.getNonce(userAddress).call();
      let nonce1 = await web3.eth.getTransactionCount(userAddress);

      console.log("nonce:", nonce);
      let functionSignature = contract.methods
        .mintNFT(12, 10, "Nitest Token", userAddress)
        .encodeABI();

      let messageToSign = abi.soliditySHA3(
        ["uint256", "address", "uint256", "bytes"],
        [nonce, contractAddress, chainId, toBuffer(functionSignature)]
      );

      const { signature } = web3.eth.accounts.sign(
        "0x" + messageToSign.toString("hex"),
        `0x${privateKey}`
      );

      const { r, s, v } = this.getSignatureParameters(signature); // same helper used in SDK frontend code
      // console.log("sig :", signature);
      // console.log("r :", r);
      // console.log("s :", s);
      // console.log("v :", v);
      // console.log("functionSignature :", functionSignature);

      const response = await axios({
        method: "post",
        url: biconomyUrl,
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        data: {
          to: contractAddress,
          apiId,
          params: [userAddress, functionSignature, r, s, v],
          from: userAddress,
        },
      });

      console.log("response :", response.data);
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
