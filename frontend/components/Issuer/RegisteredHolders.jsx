import { useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import { Button } from "@mui/material";

const baseUrl = "http://localhost:8000/";

const columns = [
  {
    id: "name",
    label: "Name of Credential",
    align: "left",
  },
  {
    id: "DID",
    label: "Credential DID",
    align: "right",
    format: (value) => value.toLocaleString("en-US"),
  },
  {
    id: "ipfsLink",
    label: "Show more credentials",
    align: "right",
    format: (value) => value.toLocaleString("en-US"),
  },
];

export default function RegisteredHolders(props) {
  useEffect(() => {
    props.credentials.map((credential) => {
      credential.ipfsLink = `https://ipfs.io/ipfs/${
        credential.DID.split(":")[2]
      }`;
    });
    console.log(props.credentials);
    setCredentials(props.credentials);
  }, []);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [credentials, setCredentials] = useState([]);
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Paper sx={{ width: "100%", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {credentials
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((credential) => {
                return (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={credential.DID}
                  >
                    {columns.map((column) => {
                      const value = credential[column.id];
                      if (column.id === "ipfsLink") {
                        return (
                          <TableCell
                            key={column.id}
                            align={column.align}
                            style={{ textWrap: "no-wrap " }}
                          >
                            <Button href={value} target="_blank">
                              {" "}
                              GO TO IPFS{" "}
                            </Button>
                          </TableCell>
                        );
                      } else {
                        return (
                          <TableCell
                            key={column.id}
                            align={column.align}
                            style={{ textWrap: "no-wrap " }}
                          >
                            {column.format && typeof value === "number"
                              ? column.format(value)
                              : value}
                          </TableCell>
                        );
                      }
                    })}
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={credentials.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
