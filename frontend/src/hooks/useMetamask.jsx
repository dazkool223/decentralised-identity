import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
  } from "react";
  import PropTypes from "prop-types"; // Import PropTypes
  import detectEthereumProvider from "@metamask/detect-provider";
  import { ethers } from "ethers";
  
  const disconnectedState = {
    accounts: [],
    balance: null,
  };
  
  const MetamaskContext = createContext({});
  
  export const MetamaskContextProvider = ({ children }) => {
    const [hasProvider, setHasProvider] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [wallet, setWallet] = useState(disconnectedState);
    const [errorMessage, setErrorMessage] = useState("");
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);

    const clearError = () => setErrorMessage("");

    // const formatBalance = (rawBalance) => {
    //   const balance = ethers.utils.formatEther(rawBalance);
    //   return balance;
    // };

    const _updateWallet = useCallback(async (providedAccounts) => {
      const accounts =
        providedAccounts ||
        (await window.ethereum.request({ method: "eth_accounts" }));
      if (accounts.length === 0) {
        setWallet(disconnectedState);
        return;
      }

      const balance = await window.ethereum.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      });

      setWallet({ accounts, balance });

      const _provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(_provider);
      setSigner(_provider.getSigner());
    }, []);

    const updateWalletAndAccounts = useCallback(
      () => _updateWallet(),
      [_updateWallet]
    );
    const updateWallet = useCallback(
      (accounts) => _updateWallet(accounts),
      [_updateWallet]
    );

    useEffect(() => {
      const getProvider = async () => {
        const _provider = await detectEthereumProvider({ silent: true });
        setHasProvider(Boolean(_provider));

        if (_provider) {
          window.ethereum.on("accountsChanged", updateWallet);
          await _updateWallet();
        }
      };

      getProvider();

      return () => {
        window.ethereum?.removeListener("accountsChanged", updateWallet);
      };
    }, [updateWallet, _updateWallet]);

    const connectMetamask = async () => {
      setIsConnecting(true);
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        clearError();
        await updateWallet(accounts);
      } catch (err) {
        setErrorMessage("Failed to connect Metamask");
        console.log(err);
      } finally {
        setIsConnecting(false);
      }
    };

    return (
      <MetamaskContext.Provider
        value={{
          wallet,
          hasProvider,
          error: !!errorMessage,
          errorMessage,
          isConnecting,
          connectMetamask,
          clearError,
          provider,
          signer,
        }}
      >
        {children}
      </MetamaskContext.Provider>
    );
  };

  // Add prop types for validation
  MetamaskContextProvider.propTypes = {
    children: PropTypes.node,
  };
  
  
  export const useMetaMask = () => {
    const context = useContext(MetamaskContext);
    if (context === undefined) {
      throw new Error("useMetaMask must be used within a MetamaskContextProvider");
    }
    return context;
  };
  