import React, { useEffect, useState } from "react";
import axios from "axios";

const baseUrl = "http://localhost:8000/";

import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Button from "@mui/material/Button";
import Form from "./Form";
import { Dialog } from "@mui/material";
import RegisteredHolders from "./RegisteredHolders";

const Issuer = () => {
  const [registeredHolders, setRegisteredHolders] = useState([]);

  useEffect(() => {
    document.title = "Issuer";
    axios
      .get(`${baseUrl}holdercollection/registered`)
      .then((response) => {
        setRegisteredHolders(response.data);
      })
      .catch((error) => {
        console.log("Could not get holder details", error);
      });
  }, []);

  const [open, setOpen] = useState(false);
  const handleOpen = async () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  return (
    <>
      <h1>Issuer Webpage</h1>
      {/* <VerticalTabs
        issuedHolders={issuedHolders}
        setIssuedHolders={setIssuedHolders}
        unissuedHolders={unissuedHolders}
        setUnissuedHolders={setUnissuedHolders}
      ></VerticalTabs> */}
      {registeredHolders.map((user) => {
        return (
          <Accordion key={user.walletAddress}>
            <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
              {user.walletAddress}
            </AccordionSummary>
            <AccordionDetails>
              <Button
                style={{ backgroundColor: "#213547", color: "white" }}
                onClick={handleOpen}
              >
                issue more credentials
              </Button>
              <Dialog open={open} onClose={handleClose}>
                <Form
                  handleClose={handleClose}
                  walletAddress={user.walletAddress}
                ></Form>
              </Dialog>
              <RegisteredHolders credentials={user.credentialCidList} />
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};

export default Issuer;
