import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config';

// Role identifiers as per OpenZeppelin / Contract
export const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
export const DOCTOR_ROLE = ethers.id("DOCTOR_ROLE");
export const PATIENT_ROLE = ethers.id("PATIENT_ROLE");

/**
 * Get an instance of the EHR contract
 */
export const getContract = (signerOrProvider) => {
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
};

/**
 * Fetch dashboard statistics
 */
export const fetchStats = async (contract) => {
    try {
        const [patientCount, doctorCount] = await Promise.all([
            contract.getRoleMemberCount(PATIENT_ROLE),
            contract.getRoleMemberCount(DOCTOR_ROLE)
        ]);

        // Get total records by counting RecordAdded events
        const recordEvents = await contract.queryFilter("RecordAdded");
        
        // Get blocked attempts by counting UnauthorizedAccess events
        const blockedEvents = await contract.queryFilter("UnauthorizedAccess");

        return {
            patients: Number(patientCount),
            doctors: Number(doctorCount),
            records: recordEvents.length,
            blocked: blockedEvents.length
        };
    } catch (error) {
        console.error("Error fetching stats:", error);
        throw error;
    }
};

/**
 * Register a new user with a specific role
 */
export const registerUser = async (contract, address, roleType) => {
    try {
        let tx;
        if (roleType === 'doctor') {
            tx = await contract.registerDoctor(address);
        } else {
            tx = await contract.registerPatient(address);
        }
        return tx;
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
};

/**
 * Remove a user's role
 */
export const removeUser = async (contract, address, roleType) => {
    try {
        let tx;
        if (roleType === 'Doctor') {
            tx = await contract.removeDoctor(address);
        } else {
            tx = await contract.removePatient(address);
        }
        return tx;
    } catch (error) {
        console.error("Error removing user:", error);
        throw error;
    }
};

/**
 * Check info for a specific address
 */
export const checkAddressInfo = async (contract, address) => {
    try {
        const role = await contract.getRole(address);
        let recordCount = 0;
        
        if (role === 'Patient') {
            const records = await contract.getPatientRecords(address);
            recordCount = records.length;
        }

        return { role, recordCount };
    } catch (error) {
        console.error("Error checking address:", error);
        throw error;
    }
};

/**
 * Fetch all registered users by iterating through role members
 */
export const fetchRegisteredUsers = async (contract) => {
    try {
        const users = [];
        
        const [pCount, dCount] = await Promise.all([
            contract.getRoleMemberCount(PATIENT_ROLE),
            contract.getRoleMemberCount(DOCTOR_ROLE)
        ]);

        // Fetch Doctors
        for (let i = 0; i < dCount; i++) {
            const address = await contract.getRoleMember(DOCTOR_ROLE, i);
            users.push({ address, role: 'Doctor' });
        }

        // Fetch Patients
        for (let i = 0; i < pCount; i++) {
            const address = await contract.getRoleMember(PATIENT_ROLE, i);
            const records = await contract.getPatientRecords(address);
            users.push({ address, role: 'Patient', records: records.length });
        }

        return users;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
    }
};

/**
 * Fetch recent activity logs (Role changes and Access changes)
 */
export const fetchActivityLogs = async (contract, provider) => {
    try {
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks

        const filters = [
            contract.filters.RoleGranted(),
            contract.filters.RoleRevoked(),
            contract.filters.AccessGranted(),
            contract.filters.AccessRevoked(),
            contract.filters.UnauthorizedAccess()
        ];

        const allEvents = await Promise.all(
            filters.map(filter => contract.queryFilter(filter, fromBlock))
        );

        const flattened = allEvents.flat().sort((a, b) => b.blockNumber - a.blockNumber);
        
        // Take last 20
        const recent = flattened.slice(0, 20);

        // Map to display format
        const logs = await Promise.all(recent.map(async (event) => {
            const block = await event.getBlock();
            let type = event.fragment.name;
            let address = "";
            let color = "gray";

            if (type === "RoleGranted") {
                address = event.args.account;
                color = "green";
            } else if (type === "RoleRevoked") {
                address = event.args.account;
                color = "red";
            } else if (type === "AccessGranted") {
                address = event.args.doctor;
                color = "green";
            } else if (type === "AccessRevoked") {
                address = event.args.doctor;
                color = "amber";
            } else if (type === "UnauthorizedAccess") {
                address = event.args.account;
                color = "red";
                type = "Blocked Attempt";
            }

            return {
                id: `${event.transactionHash}-${event.index}`,
                type,
                address,
                timestamp: block.timestamp * 1000,
                color,
                txHash: event.transactionHash
            };
        }));

        return logs;
    } catch (error) {
        console.error("Error fetching logs:", error);
        throw error;
    }
};

/**
 * Transfer Admin role
 */
export const transferAdminAction = async (contract, newAdmin) => {
    try {
        const tx = await contract.transferAdmin(newAdmin);
        return tx;
    } catch (error) {
        console.error("Error transferring admin:", error);
        throw error;
    }
};
