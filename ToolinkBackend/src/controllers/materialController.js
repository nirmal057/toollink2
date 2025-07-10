const Material = require('../models/Material');
const Supplier = require('../models/Supplier');

class MaterialController {
  // Create new material
  static async create(req, res) {
    try {
      const materialData = req.body;
      
      // Validate required fields
      const requiredFields = ['name', 'sku', 'category', 'unit', 'pricing'];
      for (const field of requiredFields) {
        if (!materialData[field]) {
          return res.status(400).json({
            success: false,
            error: `${field} is required`
          });
        }
      }

      // Validate pricing
      if (!materialData.pricing.costPrice || !materialData.pricing.sellingPrice) {
        return res.status(400).json({
          success: false,
          error: 'Cost price and selling price are required'
        });
      }

      // Check if SKU already exists
      const existingMaterial = await Material.findOne({ sku: materialData.sku });
      if (existingMaterial) {
        return res.status(400).json({
          success: false,
          error: 'SKU already exists'
        });
      }

      // Create material
      const material = new Material({
        ...materialData,
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
      });

      await material.save();

      const populatedMaterial = await Material.findById(material._id)
        .populate('suppliers', 'name contact');

      res.status(201).json({
        success: true,
        message: 'Material created successfully',
        data: populatedMaterial
      });

    } catch (error) {
      console.error('Create material error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create material'
      });
    }
  }

  // Get all materials
  static async list(req, res) {
    try {
      const {
        page = 1,
        limit = 50,
        category,
        search,
        inStock,
        lowStock
      } = req.query;

      const query = {};

      // Category filter
      if (category && category !== 'all') {
        query.category = category;
      }

      // Search filter
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const materials = await Material.find(query)
        .populate('suppliers', 'name contact')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Material.countDocuments(query);

      res.json({
        success: true,
        data: materials,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      });

    } catch (error) {
      console.error('List materials error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch materials'
      });
    }
  }

  // Get material by ID
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const material = await Material.findById(id)
        .populate('suppliers', 'name contact address');

      if (!material) {
        return res.status(404).json({
          success: false,
          error: 'Material not found'
        });
      }

      res.json({
        success: true,
        data: material
      });

    } catch (error) {
      console.error('Get material error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch material'
      });
    }
  }

  // Update material
  static async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if material exists
      const existingMaterial = await Material.findById(id);
      if (!existingMaterial) {
        return res.status(404).json({
          success: false,
          error: 'Material not found'
        });
      }

      // Check SKU uniqueness if SKU is being updated
      if (updateData.sku && updateData.sku !== existingMaterial.sku) {
        const duplicateSku = await Material.findOne({ 
          sku: updateData.sku, 
          _id: { $ne: id } 
        });
        if (duplicateSku) {
          return res.status(400).json({
            success: false,
            error: 'SKU already exists'
          });
        }
      }

      // Update material
      updateData.lastModifiedBy = req.user._id;
      updateData.lastModifiedAt = new Date();

      const material = await Material.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).populate('suppliers', 'name contact');

      res.json({
        success: true,
        message: 'Material updated successfully',
        data: material
      });

    } catch (error) {
      console.error('Update material error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update material'
      });
    }
  }

  // Delete material
  static async delete(req, res) {
    try {
      const { id } = req.params;

      const material = await Material.findById(id);
      if (!material) {
        return res.status(404).json({
          success: false,
          error: 'Material not found'
        });
      }

      await Material.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Material deleted successfully'
      });

    } catch (error) {
      console.error('Delete material error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete material'
      });
    }
  }

  // Get material categories
  static async getCategories(req, res) {
    try {
      const categories = [
        'Building Materials',
        'Roofing Materials', 
        'Steel & Metal',
        'Tiles & Ceramics',
        'Plumbing Supplies',
        'Electrical Items',
        'Paint & Chemicals',
        'Tools & Equipment',
        'Hardware & Fasteners',
        'Safety Equipment'
      ];

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch categories'
      });
    }
  }
}

module.exports = MaterialController;
