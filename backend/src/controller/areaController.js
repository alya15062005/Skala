import {
    createArea,
    deleteArea,
    findAllArea,
    findAreaById,
    updateArea
} from "../models/areaModel.js";

export const getAllArea = async (req, res) => {
  try {
    const area = await findAllArea();
    res.json({
      success: true,
      data: area
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const getAreaById = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await findAreaById(id);

    if (!area) {
      return res.status(404).json({
        success: false,
        message: "Area tidak ditemukan"
      });
    }

    res.json({
      success: true,
      data: area
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const createNewArea = async (req, res) => {
  try {
    const data = req.body;
    const validStatuses = ["aktif", "nonaktif", "non-aktif"];

    if (!data.nama) {
      return res.status(400).json({
        success: false,
        message: "Nama area harus diisi"
      });
    }

    if (data.status !== undefined && !validStatuses.includes(String(data.status).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Status area tidak valid"
      });
    }

    const area = await createArea(data);
    res.status(201).json({
      success: true,
      message: "Area berhasil dibuat",
      data: area
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const updateExistingArea = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const validStatuses = ["aktif", "nonaktif", "non-aktif"];

    if (data.status !== undefined && !validStatuses.includes(String(data.status).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Status area tidak valid"
      });
    }

    const existingArea = await findAreaById(id);
    if (!existingArea) {
      return res.status(404).json({
        success: false,
        message: "Area tidak ditemukan"
      });
    }

    const area = await updateArea(id, data);
    res.json({
      success: true,
      message: "Area berhasil diupdate",
      data: area
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

export const deleteExistingArea = async (req, res) => {
  try {
    const { id } = req.params;

    const existingArea = await findAreaById(id);
    if (!existingArea) {
      return res.status(404).json({
        success: false,
        message: "Area tidak ditemukan"
      });
    }

    await deleteArea(id);
    res.json({
      success: true,
      message: "Area berhasil dihapus"
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
export { createNewArea as createArea, deleteExistingArea as deleteArea, updateExistingArea as updateArea };
