import { useEffect, useState } from "react";
import axios from "axios";
import { useMetaMask } from "../../src/hooks/useMetamask.jsx";
import { Button } from "@mui/material";
import "../../src/styles/Holder.module.css"; // Import your CSS file

const initialHolderState = {
  name: null,
  age: null,
  isRegistered: true,
  isIssued: false,
};

const Holder = () => {
  const { wallet, hasProvider, isConnecting, connectMetamask } = useMetaMask();
  const [holder, setHolder] = useState(initialHolderState);
  const [credentials, setCredentials] = useState([]);
  const [credentialCidList, setCredentialCidList] = useState([]);
  const [activeComponent, setActiveComponent] = useState('notRegister');
  const [message, setMessage] = useState(null);

  const baseUrl = "http://localhost:8000/";

  useEffect(() => {
    const updateHolder = async () => {
      if (wallet.accounts.length > 0) {
        const walletAddress = wallet.accounts[0];
        setHolder(prevHolder => ({ ...prevHolder, walletAddress }));
        localStorage.setItem("walletAddress", walletAddress);
        await getHolderInfo(walletAddress);
      }
    };

    updateHolder();
  }, [wallet.accounts]);

  const createRequest = () => ({
    walletAddress: localStorage.getItem("walletAddress"),
    isRegistered: true,
    isIssued: false,
    credentialCidList: [],
  });

  const registerToDB = async () => {
    try {
      let req = createRequest();
      console.log(req);
      let res = await axios.post(`${baseUrl}holdercollection`, req);
      console.log("Register user in db", res);
      setActiveComponent('registerNotIssued');
    } catch (error) {
      console.log("error while registering holder", error);
    }
  };

  const getHolderInfo = async (walletAddress) => {
    try {
      const response = await axios.get(`${baseUrl}holdercollection/holder/${walletAddress}`);
      console.log("data from DB:", response);
      if (response.data.isRegistered && response.data.isIssued) {
        setActiveComponent('Issued');
        setCredentialCidList(response.data.credentialCidList);
      } else if (response.data.isRegistered) {
        setActiveComponent('registerNotIssued');
      } else {
        setActiveComponent('notRegister');
      }
      setHolder(response.data);
    } catch (error) {
      console.log("Error fetching holder info:", error);
      setHolder(prevHolder => ({ ...prevHolder, isRegistered: false }));
    }
  };

  const handleConnect = async () => {
    await connectMetamask();
    if (wallet.accounts.length > 0) {
      await getHolderInfo(wallet.accounts[0]);
      setActiveComponent('notRegister');
    }
  };

  const fetchCredential = async () => {
    try {
      const fetchedCredentials = await Promise.all(
        credentialCidList.map(async (item) => {
          const result = await axios.get(`https://ipfs.io/ipfs/${item}`);
          return result.data;
        })
      );
      setCredentials(fetchedCredentials);
      setActiveComponent('credential');
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const checkIssuedStatus = () => {
    if (holder.isIssued) {
      setActiveComponent('Issued');
    } else {
      setMessage('Waiting for issuer to issue credential...!');
      setActiveComponent('registerNotIssued');
    }
  };

  let componentToRender;

  switch (activeComponent) {
    case 'notRegister':
      componentToRender = (
        <>
          <p>User not Registered yet...!</p>
          <Button onClick={registerToDB}>Register User</Button>
        </>
      );
      break;
    case 'registerNotIssued':
      componentToRender = (
        <>
          <div>
            <h3>User Registered</h3>
            <p>{message}</p>
            <Button onClick={checkIssuedStatus}>Check credential status</Button>
          </div>
        </>
      );
      break;
    case 'Issued':
      componentToRender = (
        <>
          <div>
            <h3>Credential issued</h3>
            <Button onClick={fetchCredential}>Fetch Credential</Button>
          </div>
        </>
      );
      break;
    case 'credential':
      componentToRender = (
        <>
          {credentials.map((item, idx) => (
            <div key={idx} style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '16px',
              margin: '16px',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              backgroundImage: 'linear-gradient(to bottom right, rgb(6 228 146), rgb(208 96 253))',
              color: 'black'
            }}>
              <p style={{ margin: '8px 0' }}>{item}</p>
            </div>
          ))}
        </>
      );
      break;
    default:
      componentToRender = null;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h1>Holder Side</h1>
      <header className="App-header">
        {!hasProvider && (
          <a href="https://metamask.io" target="_blank" rel="noreferrer">
            Install MetaMask
          </a>
        )}
        {window.ethereum?.isMetaMask && wallet.accounts.length < 1 && (
          <Button disabled={isConnecting} onClick={handleConnect}>
            Connect MetaMask
          </Button>
        )}
      </header>
      {hasProvider && wallet.accounts.length > 0 && (
        <>
          <div>
            Current Wallet Address:{" "}
            <a
              className="text_link tooltip-bottom"
              href={`https://etherscan.io/address/${wallet.accounts[0]}`}
              target="_blank"
              data-tooltip="Open in Block Explorer"
              rel="noreferrer"
            >
              {wallet.accounts[0]}
            </a>
          </div>
          <p>Wallet Balance: {wallet.balance} ETH</p>
          {componentToRender}
        </>
      )}
    </div>
  );
};

export default Holder;
