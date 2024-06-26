import { Button, createTheme, styled, TextField } from "@mui/material";
import React, { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { useMetaMask } from "../../src/hooks/useMetamask";
import { ethers, QuickNodeProvider } from "ethers";
import { DIDIssuerAddress } from "../../src/contracts/DIDIssuerAddress";
import DIDIssuerABI from "../../src/contracts/DIDIssuerABI.json";
const StyledTextField = styled(TextField)(({ theme }) => ({
  margin: "1rem",
  width: "300px",
}));

const QUICKNODE_ENDPOINT = import.meta.env.VITE_HTTP_PROVIDER_URL;
const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY;
const API_KEY = import.meta.env.VITE_API_KEY;
const provider = new ethers.AlchemyProvider("sepolia", API_KEY);
// const provider = new ethers.BrowserProvider(window.ethereum);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(DIDIssuerAddress, DIDIssuerABI, provider);
const contractWithSigner = contract.connect(signer);

const Form = (props) => {
  const idx = uuidv4();

  const initialForm = {
    credentialName: "",
    name: "",
    birthyear: "",
  };
  const [formData, setFormData] = useState(initialForm);

  const baseUrl = "http://localhost:8000/";

  const postToIPFS = async (req) => {
    const resp = await axios.post(`${baseUrl}api/add-json`, req);
    return resp.data;
  };

  const callMint = async (address, credName, cid) => {
    console.log(address);
    console.log(credName);
    console.log(cid);

    let mint_func = contract.getFunction("mint");
    let tx = await mint_func.call(address, credName, cid);
    // const tx = await contractWithSigner.mint(address, credName, cid);
    await tx.wait();
    console.log(`https://etherscan.io/tx/${tx.hash}`);
    const did = await contractWithSigner.record(address);

    return did;
  };
  const createRequest = () => {
    const req = {
      objectId: idx,
      userData: {
        ...formData,
        walletAddress: props.walletAddress,
      },
    };
    return req;
  };
  const updateHolder = async (address, req) => {
    let resp = await axios.patch(`${baseUrl}holdercollection/${address}`, req);
    return resp;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    props.handleClose();
    let req = createRequest();
    // post data on ipfs
    let resp = await postToIPFS(req);
    let cid = resp.IpfsHash;
    // call smart contract with params

    const credentials = await callMint(
      req.userData.walletAddress,
      req.userData.credentialName,
      cid
    );
    console.log(credentials);
    // update holder in db
    const updatedHolder = {
      ...req.userData,
      isIssued: true,
      credentials: credentials,
    };
    await updateHolder(req.userData.walletAddress, updatedHolder);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "2rem",
      }}
    >
      <h3>Enter Holder Details</h3>
      <h4>{`for holder: ${props.walletAddress}`}</h4>
      <StyledTextField
        label="Name of Credential"
        name="credentialName"
        variant="filled"
        required
        value={formData.credentialName}
        onChange={handleChange}
      />
      <StyledTextField
        label="Name"
        name="name"
        variant="filled"
        required
        value={formData.name}
        onChange={handleChange}
      />
      <StyledTextField
        label="Birth Year"
        name="birthyear"
        type="number"
        variant="filled"
        required
        value={formData.birthyear}
        onChange={handleChange}
      />
      <div>
        <Button
          variant="contained"
          color="primary"
          type="submit"
          sx={{ margin: "2rem" }}
        >
          Issue
        </Button>
      </div>
    </form>
  );
};

export default Form;
