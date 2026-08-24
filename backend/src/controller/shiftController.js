import {
    createShift,
    deleteShift,
    findAllShift,
    findShiftById,
    updateShift
} from "../models/shiftModel.js";

export const getAllShift = async (req, res) => {
  try {
    const shift = await findAllShift();
    res.json({
      success: true,
      data: shift
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getShiftById = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await findShiftById(id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "Shift tidak ditemukan"
      });
    }

    res.json({
      success: true,
      data: shift
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const parseTimeToMinutes = (time) => {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const isShiftOverlapping = (newShift, existingShift) => {
  const newStart = parseTimeToMinutes(newShift.jam_mulai);
  const newEnd = parseTimeToMinutes(newShift.jam_selesai);
  const existingStart = parseTimeToMinutes(existingShift.jam_mulai);
  const existingEnd = parseTimeToMinutes(existingShift.jam_selesai);
  return newStart < existingEnd && newEnd > existingStart;
};

export const createNewShift = async (req, res) => {
  try {
    const data = req.body;

    if (!data.nama_shift) {
      return res.status(400).json({
        success: false,
        message: "Nama shift harus diisi"
      });
    }

    if (!data.jam_mulai) {
      return res.status(400).json({
        success: false,
        message: "Jam mulai harus diisi"
      });
    }

    if (!data.jam_selesai) {
      return res.status(400).json({
        success: false,
        message: "Jam selesai harus diisi"
      });
    }

    const startMinutes = parseTimeToMinutes(data.jam_mulai);
    const endMinutes = parseTimeToMinutes(data.jam_selesai);
    if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
      return res.status(400).json({
        success: false,
        message: "Jam mulai harus lebih awal daripada jam selesai"
      });
    }

    const allShifts = await findAllShift();
    const overlap = allShifts.some((shift) => isShiftOverlapping(data, shift));
    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "Shift bertabrakan dengan jadwal yang sudah ada"
      });
    }

    const shift = await createShift(data);
    res.status(201).json({
      success: true,
      message: "Shift berhasil dibuat",
      data: shift
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingShift = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingShift = await findShiftById(id);
    if (!existingShift) {
      return res.status(404).json({
        success: false,
        message: "Shift tidak ditemukan"
      });
    }

    if (!data.nama_shift) {
      return res.status(400).json({
        success: false,
        message: "Nama shift harus diisi"
      });
    }

    if (!data.jam_mulai) {
      return res.status(400).json({
        success: false,
        message: "Jam mulai harus diisi"
      });
    }

    if (!data.jam_selesai) {
      return res.status(400).json({
        success: false,
        message: "Jam selesai harus diisi"
      });
    }

    const startMinutes = parseTimeToMinutes(data.jam_mulai);
    const endMinutes = parseTimeToMinutes(data.jam_selesai);
    if (startMinutes === null || endMinutes === null || startMinutes >= endMinutes) {
      return res.status(400).json({
        success: false,
        message: "Jam mulai harus lebih awal daripada jam selesai"
      });
    }

    const allShifts = await findAllShift();
    const overlap = allShifts.some((shift) => {
      if (shift.id_shift === existingShift.id_shift) return false;
      return isShiftOverlapping(data, shift);
    });

    if (overlap) {
      return res.status(400).json({
        success: false,
        message: "Shift bertabrakan dengan jadwal yang sudah ada"
      });
    }

    const shift = await updateShift(id, data);
    res.json({
      success: true,
      message: "Shift berhasil diupdate",
      data: shift
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteExistingShift = async (req, res) => {
  try {
    const { id } = req.params;

    const existingShift = await findShiftById(id);
    if (!existingShift) {
      return res.status(404).json({
        success: false,
        message: "Shift tidak ditemukan"
      });
    }

    await deleteShift(id);
    res.json({
      success: true,
      message: "Shift berhasil dihapus"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Alias exports for consistency
export { createNewShift as createShift, deleteExistingShift as deleteShift, updateExistingShift as updateShift };