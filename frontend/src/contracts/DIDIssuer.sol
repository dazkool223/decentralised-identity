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

    function isCredentialExists(
        address _to,
        string memory _name,
        string memory _DID
    ) internal view returns (bool) {
        Credential[] memory userCredentials = record[_to];
        for (uint i = 0; i < userCredentials.length; i++) {
            if (
                compareStrings(userCredentials[i].name, _name) &&
                compareStrings(userCredentials[i].DID, _DID)
            ) {
                return true;
            }
        }
        return false;
    }

    function compareStrings(
        string memory a,
        string memory b
    ) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) ==
            keccak256(abi.encodePacked((b))));
    }

    function mint(
        address _to,
        string calldata _name,
        string calldata _URI
    ) external onlyOwner {
        string memory _DID = string(
            abi.encodePacked("did", ":", _name, ":", _URI)
        );
        require(
            !isCredentialExists(_to, _name, _DID),
            "Credential already exists"
        );
        Credential memory newCredential = Credential(_name, _DID);
        record[_to].push(newCredential);
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

    function getCredentials(
        address _to
    ) public view returns (Credential[] memory) {
        return record[_to];
    }
}
