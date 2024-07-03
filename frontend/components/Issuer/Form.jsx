import { Button, styled, TextField } from "@mui/material";
import React, { useState } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { ethers } from "ethers";
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
const contract = new ethers.Contract(DIDIssuerAddress, DIDIssuerABI, signer);
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
    console.log("wallet address : ", address);
    console.log("Name of Credential", credName);
    console.log("IPFS URI", cid);
    const tx = await contractWithSigner.mint(address, credName, cid);
    await tx.wait();
  };

  const getCredentialsFromContract = async (address) => {
    const resp = await contractWithSigner.getCredentials(address);
    let parsedCreds = JSON.parse(JSON.stringify(resp));
    const credentials = parsedCreds.map((item) => ({
      name: item[0],
      DID: item[1],
    }));
    console.log(credentials);

    return credentials;
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

    const tx = await callMint(
      req.userData.walletAddress,
      req.userData.credentialName,
      cid
    );
    const credentials = await getCredentialsFromContract(
      req.userData.walletAddress
    );
    // update holder in db
    const updatedHolder = {
      isIssued: true,
      credentialCidList: credentials,
    };
    console.log(updatedHolder);
    await updateHolder(req.userData.walletAddress, updatedHolder);
    console.log("holder updated successfully");
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
