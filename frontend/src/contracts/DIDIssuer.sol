// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DIDIssuer is Ownable {
    struct Credential {
        string name;
        string DID;
    }

    mapping(address => Credential[]) public record;

    event Mint(address _to);
    event Burn(address _to);
    event Update(address _to);

    constructor(address _issuerAddress) Ownable(_issuerAddress) {}

    function mint(
        address _to,
        string calldata name,
        string calldata URI
    ) external onlyOwner returns (Credential[] memory) {
        for (uint i = 0; i < record[_to].length; i++) {
            require(
                bytes(record[_to][i].DID).length == 0,
                "Passport Already exists for the given address"
            );
            string memory did = string(
                abi.encodePacked("did", ":", name, ":", URI)
            );
            record[_to][i].DID = did;
            record[_to][i].name = name;
        }
        emit Mint(_to);
        return record[_to];
    }

    function burn(address _to) external onlyOwner {
        delete record[_to];
        emit Burn(_to);
    }

    function update(
        address _to,
        string calldata name,
        string calldata URI
    ) external onlyOwner {
        for (uint i = 0; i < record[_to].length; i++) {
            if (
                keccak256(abi.encodePacked(record[_to][i].name)) ==
                keccak256(abi.encodePacked(name))
            ) {
                string memory did = string(
                    abi.encodePacked("did", ":", name, ":", URI)
                );
                record[_to][i].DID = did;
                record[_to][i].name = name;
                emit Update(_to);
            }
        }
    }
}
