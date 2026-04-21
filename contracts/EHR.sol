// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/extensions/AccessControlEnumerable.sol";

/**
 * @title Electronic Health Records (EHR) System
 * @dev Secure storage of EHRs using IPFS and role-based access control.
 */
contract EHR is AccessControlEnumerable {
    bytes32 public constant DOCTOR_ROLE = keccak256("DOCTOR_ROLE");
    bytes32 public constant PATIENT_ROLE = keccak256("PATIENT_ROLE");

    // Record Structure
    struct Record {
        string ipfsHash;
        uint256 timestamp;
        address uploader;
        string recordType;
    }

    // Appointment Structure
    struct Appointment {
        uint256 id;
        address patient;
        address doctor;
        uint256 timestamp;      // Unix timestamp of appointment date/time
        string reason;          // Brief reason e.g. "Fever and cough"
        uint8 status;           // 0=Pending, 1=Confirmed, 2=Cancelled, 3=Completed
        uint256 createdAt;
    }

    // Mapping from patient address to their list of records
    mapping(address => Record[]) private patientRecords;

    // Mapping to track patient to doctor authorization: patient => doctor => status
    mapping(address => mapping(address => bool)) public doctorAccess;

    // Appointment Storage
    mapping(uint256 => Appointment) public appointments;
    mapping(address => uint256[]) private patientAppointments;
    mapping(address => uint256[]) private doctorAppointments;
    uint256 public appointmentCount;

    // Events
    event RecordAdded(address indexed patient, address indexed uploader, string ipfsHash);
    event AccessGranted(address indexed patient, address indexed doctor);
    event AccessRevoked(address indexed patient, address indexed doctor);
    event UnauthorizedAccess(address indexed account, bytes32 indexed role);
    event AppointmentBooked(uint256 indexed id, address indexed patient, address indexed doctor, uint256 timestamp);
    event AppointmentStatusChanged(uint256 indexed id, uint8 newStatus);

    // Contract deployer is assigned the DEFAULT_ADMIN_ROLE natively by AccessControl
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Gatekeeper modifier that emits an event on failure before reverting.
     */
    modifier onlyRoleWithLog(bytes32 role) {
        if (!hasRole(role, msg.sender)) {
            emit UnauthorizedAccess(msg.sender, role);
            revert AccessControlUnauthorizedAccount(msg.sender, role);
        }
        _;
    }

    /**
     * @dev Patient uploads a health record (stored on IPFS)
     * Restricted to PATIENT_ROLE only.
     */
    function addRecord(string memory _ipfsHash, string memory _recordType) external onlyRoleWithLog(PATIENT_ROLE) {
        Record memory newRecord = Record({
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            uploader: msg.sender,
            recordType: _recordType
        });

        patientRecords[msg.sender].push(newRecord);
        emit RecordAdded(msg.sender, msg.sender, _ipfsHash);
    }

    /**
     * @dev Patient grants access to a specific doctor
     */
    function grantAccess(address _doctor) external onlyRoleWithLog(PATIENT_ROLE) {
        require(_doctor != address(0), "EHR: Invalid doctor address");
        require(!doctorAccess[msg.sender][_doctor], "EHR: Access already granted");

        doctorAccess[msg.sender][_doctor] = true;
        emit AccessGranted(msg.sender, _doctor);
    }

    /**
     * @dev Patient revokes access from a specific doctor
     */
    function revokeAccess(address _doctor) external onlyRoleWithLog(PATIENT_ROLE) {
        require(_doctor != address(0), "EHR: Invalid doctor address");
        require(doctorAccess[msg.sender][_doctor], "EHR: Access not granted yet");

        doctorAccess[msg.sender][_doctor] = false;
        emit AccessRevoked(msg.sender, _doctor);
    }

    /**
     * @dev View patient's records. Validates patient or authorized doctor caller.
     */
    function getPatientRecords(address _patient) external view returns (Record[] memory) {
        if (msg.sender != _patient) {
            require(hasRole(DOCTOR_ROLE, msg.sender), "EHR: Restricted to DOCTOR_ROLE");
            require(doctorAccess[_patient][msg.sender], "EHR: Access denied by patient");
        }
        return patientRecords[_patient];
    }

    // --- APPOINTMENT FUNCTIONS ---

    /**
     * @dev Book a new appointment with an authorized doctor.
     */
    function bookAppointment(address _doctor, uint256 _timestamp, string calldata _reason) external onlyRoleWithLog(PATIENT_ROLE) {
        require(hasRole(DOCTOR_ROLE, _doctor), "EHR: Selected address is not a registered doctor");
        require(doctorAccess[msg.sender][_doctor], "EHR: You must grant access to this doctor first");
        require(_timestamp > block.timestamp, "EHR: Appointment must be in the future");

        appointmentCount++;
        uint256 id = appointmentCount;

        appointments[id] = Appointment({
            id: id,
            patient: msg.sender,
            doctor: _doctor,
            timestamp: _timestamp,
            reason: _reason,
            status: 0, // Pending
            createdAt: block.timestamp
        });

        patientAppointments[msg.sender].push(id);
        doctorAppointments[_doctor].push(id);

        emit AppointmentBooked(id, msg.sender, _doctor, _timestamp);
    }

    /**
     * @dev Update appointment status. Only callable by the assigned doctor.
     */
    function updateAppointmentStatus(uint256 _id, uint8 _status) external onlyRoleWithLog(DOCTOR_ROLE) {
        Appointment storage app = appointments[_id];
        require(app.doctor == msg.sender, "EHR: Only assigned doctor can update status");
        require(_status == 1 || _status == 2 || _status == 3, "EHR: Invalid status update");

        app.status = _status;
        emit AppointmentStatusChanged(_id, _status);
    }

    /**
     * @dev Cancel appointment. Only callable by the patient.
     */
    function cancelAppointment(uint256 _id) external onlyRoleWithLog(PATIENT_ROLE) {
        Appointment storage app = appointments[_id];
        require(app.patient == msg.sender, "EHR: Only patient can cancel their appointment");
        require(app.status == 0 || app.status == 1, "EHR: Can only cancel pending or confirmed appointments");

        app.status = 2; // Cancelled
        emit AppointmentStatusChanged(_id, 2);
    }

    /**
     * @dev Get all appointments for a patient.
     */
    function getPatientAppointments() external view onlyRole(PATIENT_ROLE) returns (Appointment[] memory) {
        uint256[] storage ids = patientAppointments[msg.sender];
        Appointment[] memory apps = new Appointment[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            apps[i] = appointments[ids[i]];
        }
        return apps;
    }

    /**
     * @dev Get all appointments for a doctor.
     */
    function getDoctorAppointments() external view onlyRole(DOCTOR_ROLE) returns (Appointment[] memory) {
        uint256[] storage ids = doctorAppointments[msg.sender];
        Appointment[] memory apps = new Appointment[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            apps[i] = appointments[ids[i]];
        }
        return apps;
    }

    /**
     * @dev Get list of patients who have granted access to the calling doctor.
     */
    function getAuthorizedPatients() external view onlyRole(DOCTOR_ROLE) returns (address[] memory) {
        uint256 totalPatients = getRoleMemberCount(PATIENT_ROLE);
        uint256 count = 0;
        
        // First pass: count authorized patients
        for (uint256 i = 0; i < totalPatients; i++) {
            address patient = getRoleMember(PATIENT_ROLE, i);
            if (doctorAccess[patient][msg.sender]) {
                count++;
            }
        }

        // Second pass: populate array
        address[] memory authorized = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < totalPatients; i++) {
            address patient = getRoleMember(PATIENT_ROLE, i);
            if (doctorAccess[patient][msg.sender]) {
                authorized[index] = patient;
                index++;
            }
        }
        return authorized;
    }

    /**
     * @dev Get list of doctors the calling patient has granted access to.
     */
    function getAuthorizedDoctors() external view onlyRole(PATIENT_ROLE) returns (address[] memory) {
        uint256 totalDoctors = getRoleMemberCount(DOCTOR_ROLE);
        uint256 count = 0;
        for (uint256 i = 0; i < totalDoctors; i++) {
            address doctor = getRoleMember(DOCTOR_ROLE, i);
            if (doctorAccess[msg.sender][doctor]) {
                count++;
            }
        }

        address[] memory authorized = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < totalDoctors; i++) {
            address doctor = getRoleMember(DOCTOR_ROLE, i);
            if (doctorAccess[msg.sender][doctor]) {
                authorized[index] = doctor;
                index++;
            }
        }
        return authorized;
    }

    // --- ADMIN FUNCTIONS ---

    function registerPatient(address patient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(PATIENT_ROLE, patient);
    }

    function registerDoctor(address doctor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(DOCTOR_ROLE, doctor);
    }

    function removePatient(address patient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(PATIENT_ROLE, patient);
    }

    function removeDoctor(address doctor) external onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(DOCTOR_ROLE, doctor);
    }

    function transferAdmin(address newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newAdmin != address(0), "EHR: Invalid new admin address");
        grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function getRole(address account) external view returns (string memory) {
        if (hasRole(DEFAULT_ADMIN_ROLE, account)) return "Admin";
        if (hasRole(DOCTOR_ROLE, account)) return "Doctor";
        if (hasRole(PATIENT_ROLE, account)) return "Patient";
        return "None";
    }
}
