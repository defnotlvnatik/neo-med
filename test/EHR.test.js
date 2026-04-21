const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EHR Smart Contract", function () {
  let EHR;
  let ehr;
  let owner;
  let patient;
  let doctor;
  let unauthorizedDoctor;

  beforeEach(async function () {
    [owner, patient, doctor, unauthorizedDoctor] = await ethers.getSigners();
    EHR = await ethers.getContractFactory("EHR");
    ehr = await EHR.deploy();
    await ehr.waitForDeployment();
  });

  describe("Record Management", function () {
    it("Should allow a patient to add a record", async function () {
      const ipfsHash = "QmTestHash12345";
      const recordType = "Blood Test";

      await expect(ehr.connect(patient).addRecord(ipfsHash, recordType))
        .to.emit(ehr, "RecordAdded")
        .withArgs(patient.address, patient.address, ipfsHash);

      const records = await ehr.connect(patient).getPatientRecords(patient.address);
      expect(records.length).to.equal(1);
      expect(records[0].ipfsHash).to.equal(ipfsHash);
      expect(records[0].recordType).to.equal(recordType);
      expect(records[0].uploader).to.equal(patient.address);
    });
  });

  describe("Access Control", function () {
    const ipfsHash = "QmTestHash12345";
    const recordType = "Blood Test";

    beforeEach(async function () {
      await ehr.connect(patient).addRecord(ipfsHash, recordType);
    });

    it("Should allow a doctor to read a record after access is granted", async function () {
      await expect(ehr.connect(patient).grantAccess(doctor.address))
        .to.emit(ehr, "AccessGranted")
        .withArgs(patient.address, doctor.address);

      const records = await ehr.connect(doctor).getPatientRecords(patient.address);
      expect(records.length).to.equal(1);
      expect(records[0].ipfsHash).to.equal(ipfsHash);
    });

    it("Should prevent a doctor from reading a record without access", async function () {
      await expect(
        ehr.connect(unauthorizedDoctor).getPatientRecords(patient.address)
      ).to.be.revertedWith("EHR: Access denied");
    });

    it("Should allow a patient to revoke access and prevent subsequent reads", async function () {
      await ehr.connect(patient).grantAccess(doctor.address);
      
      let records = await ehr.connect(doctor).getPatientRecords(patient.address);
      expect(records.length).to.equal(1);

      await expect(ehr.connect(patient).revokeAccess(doctor.address))
        .to.emit(ehr, "AccessRevoked")
        .withArgs(patient.address, doctor.address);

      await expect(
        ehr.connect(doctor).getPatientRecords(patient.address)
      ).to.be.revertedWith("EHR: Access denied");
    });
  });
});
