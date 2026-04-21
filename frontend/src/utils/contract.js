import { ethers } from 'ethers';

/**
 * Patient: Book a new appointment
 */
export const bookAppointment = async (contract, doctorAddress, timestamp, reason) => {
    try {
        const tx = await contract.bookAppointment(doctorAddress, timestamp, reason);
        return tx;
    } catch (error) {
        console.error("Error booking appointment:", error);
        throw error;
    }
};

/**
 * Doctor: Update appointment status (Confirm = 1, Cancel = 2, Complete = 3)
 */
export const updateAppointmentStatus = async (contract, appointmentId, status) => {
    try {
        const tx = await contract.updateAppointmentStatus(appointmentId, status);
        return tx;
    } catch (error) {
        console.error("Error updating appointment status:", error);
        throw error;
    }
};

/**
 * Patient: Cancel appointment
 */
export const cancelAppointment = async (contract, appointmentId) => {
    try {
        const tx = await contract.cancelAppointment(appointmentId);
        return tx;
    } catch (error) {
        console.error("Error cancelling appointment:", error);
        throw error;
    }
};

/**
 * Patient: Fetch all my appointments
 */
export const getPatientAppointments = async (contract) => {
    try {
        const appointments = await contract.getPatientAppointments();
        return appointments;
    } catch (error) {
        console.error("Error fetching patient appointments:", error);
        throw error;
    }
};

/**
 * Doctor: Fetch all appointments for me
 */
export const getDoctorAppointments = async (contract) => {
    try {
        const appointments = await contract.getDoctorAppointments();
        return appointments;
    } catch (error) {
        console.error("Error fetching doctor appointments:", error);
        throw error;
    }
};

/**
 * Doctor: Fetch list of patients who granted me access
 */
export const getAuthorizedPatients = async (contract) => {
    try {
        const patients = await contract.getAuthorizedPatients();
        return patients;
    } catch (error) {
        console.error("Error fetching authorized patients:", error);
        throw error;
    }
};

/**
 * Patient: Fetch list of doctors I have granted access to
 */
export const getAuthorizedDoctors = async (contract) => {
    try {
        const doctors = await contract.getAuthorizedDoctors();
        return doctors;
    } catch (error) {
        console.error("Error fetching authorized doctors:", error);
        throw error;
    }
};

/**
 * General: Fetch patient records (used in AssignedPatients list)
 */
export const getPatientRecords = async (contract, patientAddress) => {
    try {
        const records = await contract.getPatientRecords(patientAddress);
        return records;
    } catch (error) {
        console.error("Error fetching patient records:", error);
        throw error;
    }
};
